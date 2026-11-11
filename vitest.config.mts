import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // test/ holds the legacy Nightmare UI suite (npm test), so unit tests live next to the code
        include: ['src/**/*.test.{ts,tsx}']
    }
});
