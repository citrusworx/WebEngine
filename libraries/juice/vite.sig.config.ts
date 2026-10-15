import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';

/**
 * Separate library build so the Sig subpath can import `@citrusworx/sigjs`
 * and the Juice main entry as real dependencies.
 *
 * The main `vite build` keeps bundling Sig into `dist/index.js` for the
 * existing Accordion factory. This entry must use the installed Sig package
 * so `bind` shares that package's cleanup scope. It imports `../index.js`
 * so both entry points share one set of runtime controllers.
 */
function externalizeSigEntry(): Plugin {
  return {
    name: 'externalize-juice-sig-entry',
    resolveId(source) {
      if (source === '../index.js') {
        return { id: '../index.js', external: true };
      }
      if (
        source === '@citrusworx/sigjs' ||
        source.startsWith('@citrusworx/sigjs/')
      ) {
        return { id: source, external: true };
      }
      return null;
    },
    renderChunk(code) {
      // The chunk lives at dist/sig/index.js. Keep the Juice entry at
      // dist/index.js (`../index.js`) even if Rollup rewrites the relative id.
      const next = code.replace(
        /from\s+(['"])(?:\.\.\/)+index\.js\1/g,
        "from '../index.js'"
      );
      if (next === code) return null;
      return { code: next, map: null };
    },
  };
}

export default defineConfig({
  plugins: [externalizeSigEntry()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/sig/index.ts'),
      formats: ['es'],
      fileName: () => 'sig/index.js',
    },
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      external: ['@citrusworx/sigjs', /^\.\.\/index\.js$/],
    },
  },
});
