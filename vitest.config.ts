import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    root: 'src',
    exclude: [
      ...configDefaults.exclude,
      '**/node_modules/**',
      '**/dist/**',
      '**/index.ts',
      '**/*.types.ts',
      '**/*.bak.ts',
      '**/test-utils.ts',
      '**/playground.ts',
      '**/vitest-setup.ts',
    ],
    coverage: {
      exclude: [
        ...configDefaults.exclude,
        '**/index.ts',
        'vitest-setup.ts',
        '**/types.ts',
        '**/**/*.bak.ts',
        '**/test-utils.ts',
        '**/*.spec.ts',
        '**/*.types.ts',
      ],
    },
    // setupFiles: ['vitest-setup.ts'],
  },
});
