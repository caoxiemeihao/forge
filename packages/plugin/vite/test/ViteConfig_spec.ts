import { expect } from 'chai';

import { VitePluginConfig } from '../src/Config';
import ViteConfigGenerator from '../src/ViteConfig';

const mockProjectDir = process.platform === 'win32' ? 'C:\\path' : '/path';

describe('ViteConfigGenerator', () => {
  describe('getDefines', () => {
    it('throws an error if renderer.entryPoints does not exist', () => {
      const config = {
        renderer: {},
      } as VitePluginConfig;
      const generator = new ViteConfigGenerator(config, '/', false, 5173);
      expect(() => generator.getDefines()).to.throw(/renderer.entryPoints.* has not been defined/);
    });

    it('throws an error if renderer.entryPoints is not an array', () => {
      const config = {
        renderer: {
          entryPoints: {},
        },
      } as VitePluginConfig;
      const generator = new ViteConfigGenerator(config, '/', false, 5173);
      expect(() => generator.getDefines()).to.throw(/renderer.entryPoints.* has not been defined/);
    });

    it('sets the renderer entry point to a HTML file in development', () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'hello',
            },
          ],
        },
      } as VitePluginConfig;
      const generator = new ViteConfigGenerator(config, '/', false, 5173);
      const defines = generator.getDefines();

      expect(defines.HELLO_VITE_ENTRY).to.equal("'http://localhost:5173/hello'");
    });

    it('sets the renderer entry point to a HTML file in production', () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'hello',
            },
          ],
        },
      } as VitePluginConfig;
      const generator = new ViteConfigGenerator(config, '/', true, 5173);
      const defines = generator.getDefines(false);

      expect(defines.HELLO_VITE_ENTRY).to.equal("`file://${require('path').resolve(__dirname, '..', '.', 'hello', 'index.html')}`");
    });

    it('sets the renderer entry point to an HTML file if both an HTML & JS file are specified', () => {
      const config = {
        renderer: {
          entryPoints: [
            {
              name: 'hello',
              // TODO: Support multiple html entries.
              // html: 'foo.html',
            },
          ],
        },
      } as VitePluginConfig;
      const generator = new ViteConfigGenerator(config, '/', false, 5173);
      const defines = generator.getDefines();

      expect(defines.HELLO_VITE_ENTRY).to.equal("'http://localhost:5173/hello'");
    });

    describe('PRELOAD_VITE_ENTRY', () => {
      const config = {
        main: {},
        renderer: {
          config: {},
          entryPoints: [
            {
              name: 'window',
              preload: {
                js: 'preload.js',
              },
            },
          ],
        },
      } as VitePluginConfig;

      it('should assign absolute preload script path in development', () => {
        const generator = new ViteConfigGenerator(config, mockProjectDir, false, 5173);
        const defines = generator.getDefines();

        if (process.platform === 'win32') {
          expect(defines.WINDOW_PRELOAD_VITE_ENTRY).to.equal(String.raw`'C:\\path\\.vite\\renderer\\window\\preload.js'`);
        } else {
          expect(defines.WINDOW_PRELOAD_VITE_ENTRY).to.equal(`'${mockProjectDir}/.vite/renderer/window/preload.js'`);
        }
      });

      it('should assign an expression to resolve the preload script in production', () => {
        const generator = new ViteConfigGenerator(config, mockProjectDir, true, 5173);
        const defines = generator.getDefines();
        expect(defines.WINDOW_PRELOAD_VITE_ENTRY).to.equal("require('path').resolve(__dirname, '../renderer', 'window', 'preload.js')");
      });
    });
  });
});
