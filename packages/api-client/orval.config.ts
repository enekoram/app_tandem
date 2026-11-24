import { defineConfig } from 'orval';

// Generado desde apps/api/openapi.json. No editar src/generated a mano: `pnpm generate:api`.
export default defineConfig({
  tandems: {
    input: '../../apps/api/openapi.json',
    output: {
      target: 'src/generated/endpoints.ts',
      schemas: 'src/generated/model',
      mode: 'tags-split',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: { path: 'src/fetcher.ts', name: 'apiFetch' },
      },
    },
  },
});
