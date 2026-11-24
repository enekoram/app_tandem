import { z } from 'zod';

/**
 * Variables de entorno de la API. Se validan al arrancar: si falta algo, la API no arranca
 * y el error dice qué variable falla (sin mostrar su valor).
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  MONGODB_URI: z
    .string()
    .min(1, 'falta la cadena de conexión de MongoDB')
    .regex(/^mongodb(\+srv)?:\/\//, 'debe empezar por mongodb:// o mongodb+srv://'),
  /** Firma cookies y tokens de Better Auth. Mínimo 32 caracteres aleatorios. */
  BETTER_AUTH_SECRET: z.string().min(32, 'debe tener al menos 32 caracteres'),
  /** URL pública de esta API (se usa en los enlaces de los emails). */
  BETTER_AUTH_URL: z.url('debe ser una URL').default('http://localhost:3000'),
  /** Sin clave, los emails no se envían (se avisa en el log). */
  RESEND_API_KEY: z.string().startsWith('re_', 'debe empezar por re_').optional(),
  EMAIL_FROM: z.string().default('Tandems <avisos@tandems.minucampoy.com>'),
});

export type Env = z.infer<typeof envSchema>;

/** Para `ConfigModule.forRoot({ validate })`. */
export function validateEnv(raw: Record<string, unknown>): Env {
  // Variables vacías en .env cuentan como no definidas
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== ''));
  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuración no válida:\n${detail}`);
  }
  return result.data;
}
