// eslint-disable-next-line node/no-unpublished-import
import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { natives } from './plugins';
import { external, getBuildConfig, getBuildDefine, pluginHotRestart } from './vite.base.config';

export function getConfig(forgeEnv: ConfigEnv<'build'>): UserConfig {
  const { forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  const config: UserConfig = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry!,
        fileName: () => '[name].js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
      },
    },
    plugins: [natives(), pluginHotRestart('restart')],
    define,
    resolve: {
      // Load the Node.js entry.
      conditions: ['node'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
}
