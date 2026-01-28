import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CardplayCore',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src'
      }
    },
    sourcemap: true,
    minify: false
  }
});
