import path from 'node:path';

import debug from 'debug';
import glob from 'fast-glob';
import libEsm from 'lib-esm';
import { type Configuration, webpack } from 'webpack';

// eslint-disable-next-line node/no-unpublished-import
import type { Plugin, ResolvedConfig } from 'vite';

const d = debug('electron-forge:plugin:vite:plugins');
const bareImportRE = /^(?![a-zA-Z]:)[\w@](?!.*:\/\/)/;
const nativesBase = '.natives';
// `nativesMap` is placed in the global scope and can be effective for multiple builds.
const nativesMap = new Map<
  string,
  {
    filename: string;
    interopSnippet: string;
  }
>();
const idPrefix = '\0forge-vite:';

// The `.node` file is essentially a cjs module and can only be loaded by the `require()` function at runtime.
// Vite(Rollup) is built based on the esm module syntax, which causes C/C++ native modules to not be built correctly in Vite(Rollup).
// The way Webpack bundles modules fully complies with the cjs specification, and Webpack has a strong ecosystem advantage for building C/C++ native.
// We can use Webpack to build the native module into an esm module so that it can work well in Vite.

export function natives(): Plugin {
  let config: ResolvedConfig;

  return {
    name: '@electron-forge/plugin-vite:natives',
    // Make sure plugin are run before `vite:resolve`.
    enforce: 'pre',
    configResolved(_config) {
      config = _config;
    },
    async resolveId(moduleName, importer) {
      if (!importer) {
        return;
      }
      if (!bareImportRE.test(moduleName)) {
        return;
      }
      if (nativesMap.get(moduleName)) {
        return;
      }

      let modulePath: string | undefined;
      try {
        const modulePackageJson = require.resolve(`${moduleName}/package.json`, {
          paths: [importer],
        });
        modulePath = path.dirname(modulePackageJson);
      } catch {} // eslint-disable-line no-empty

      if (!modulePath) {
        return;
      }

      const nodeFiles = await glob('**/*.node', { cwd: modulePath });

      if (nodeFiles.length) {
        d('Found native module:', moduleName);

        const output = path.posix.join(config.root, config.build.outDir, nativesBase);
        const filename = path.posix.join(output, `${moduleName}.cjs`);

        try {
          await webpackBuild(moduleName, output, !!config.build.minify);

          const interopSnippet = getInteropSnippet(moduleName, `./${nativesBase}/${moduleName}.cjs`);

          nativesMap.set(moduleName, { filename, interopSnippet });

          d(`Native module "${moduleName}" build success:\n`, filename);

          return idPrefix + moduleName;
        } catch (error) {
          d(`Native module "${moduleName}" build failed:\n`, error);
        }
      }
    },
    load(id) {
      if (id.startsWith(idPrefix)) {
        const moduleName = id.replace(idPrefix, '');
        const nativeModule = nativesMap.get(moduleName);

        return nativeModule?.interopSnippet;
      }
    },
  };
}

async function webpackBuild(name: string, output: string, minify?: boolean) {
  return new Promise<null>((resolve, reject) => {
    const options: Configuration = {
      mode: minify ? 'production' : 'none',
      target: 'node14',
      entry: { [name]: name },
      output: {
        library: {
          type: 'commonjs2',
        },
        path: output,
        filename: '[name].cjs',
      },
      module: {
        rules: [
          {
            test: /native_modules[/\\].+\.node$/,
            use: 'node-loader',
          },
          {
            test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
            parser: { amd: false },
            use: {
              loader: '@vercel/webpack-asset-relocator-loader',
              options: {
                outputAssetBase: 'native_modules',
              },
            },
          },
        ],
      },
    };

    webpack(options).run((error, stats) => {
      if (error) {
        reject(error);
        return;
      }

      if (stats?.hasErrors()) {
        const errorMsg = stats
          .toJson()
          .errors?.map((msg) => msg.message)
          .join('\n');

        if (errorMsg) {
          reject(errorMsg);
          return;
        }
      }

      resolve(null);
    });
  });
}

function getInteropSnippet(name: string, buildAfterId: string) {
  const snippet = libEsm({
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    exports: Object.getOwnPropertyNames(require(name)),
  });

  // `cjsRequire` can be avoid `@rollup/plugin-commonjs`
  return `
import { createRequire } from "module";
const cjsRequire = createRequire(import.meta.url);
const _M_ = cjsRequire("${buildAfterId}");
${snippet.exports}
`;
}
