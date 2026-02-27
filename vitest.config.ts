import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/**/*.test.ts',
      'frontend/tests/**/*.test.ts',
      'frontend/src/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'frontend/src/config/**',
        'frontend/src/services/**',
      ],
    },
  },
});
