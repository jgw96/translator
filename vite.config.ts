import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  esbuild: {
    target: 'es2024',
  },
  plugins: [visualizer()],
  build: {
    target: 'es2024',
    rollupOptions: {
      input: {
        main: 'index.html',
        'service-worker': 'service-worker.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep service-worker.js at the root without hash
          if (chunkInfo.name === 'service-worker') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
