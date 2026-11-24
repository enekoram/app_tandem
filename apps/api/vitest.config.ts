import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC en lugar de esbuild: Nest necesita los metadatos de los decoradores para inyectar dependencias.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
