import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        'service-worker': 'service-worker.js'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep service-worker.js at the root without hash
          if (chunkInfo.name === 'service-worker') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        }
      }
    }
  }
});
