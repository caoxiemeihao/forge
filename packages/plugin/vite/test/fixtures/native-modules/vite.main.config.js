/* eslint-disable */
import { defineConfig } from 'vite';
import { natives } from '../../../src/config/plugins';
import { external } from '../../../src/config/vite.base.config';

export default defineConfig({
  root: __dirname,
  build: {
    lib: {
      entry: 'main.js',
      formats: ['cjs'],
      fileName: () => '[name].js',
    },
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      external,
    },
  },
  plugins: [natives()],
});
