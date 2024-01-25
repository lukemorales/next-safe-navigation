import { defineConfig } from 'tsup';

export default defineConfig({
  name: 'save next navigation',
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
});
