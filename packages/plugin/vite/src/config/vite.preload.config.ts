// eslint-disable-next-line node/no-unpublished-import
import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { natives } from './plugins';
import { external, getBuildConfig, pluginHotRestart } from './vite.base.config';

export function getConfig(forgeEnv: ConfigEnv<'build'>): UserConfig {
  const { forgeConfigSelf } = forgeEnv;
  const config: UserConfig = {
    build: {
      rollupOptions: {
        external,
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: forgeConfigSelf.entry!,
        output: {
          format: 'cjs',
          // It should not be split chunks.
          inlineDynamicImports: true,
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },
    plugins: [natives(), pluginHotRestart('reload')],
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
}
