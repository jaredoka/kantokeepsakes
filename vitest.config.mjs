import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node environment, not jsdom: only the cart maths and the order message are
    // tested, and neither needs a DOM. That keeps the dependency list at one.
    include: ['tests/**/*.test.mjs'],
  },
});
