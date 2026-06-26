import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['tests/unit/aggregation-engine.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'jsdom',
          include: ['tests/unit/image-processor.test.ts'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
