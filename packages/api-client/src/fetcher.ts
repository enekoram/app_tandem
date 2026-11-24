/**
 * Cliente HTTP que usan todas las funciones generadas por orval.
 * La app lo configura una vez al arrancar con `configureApiClient` (URL base y token de sesión).
 */

export interface ApiClientConfig {
  baseUrl: string;
  /** Devuelve el token de sesión actual, o null si no hay sesión. */
  getToken?: () => string | null | Promise<string | null>;
}

let config: ApiClientConfig | null = null;

export function configureApiClient(next: ApiClientConfig): void {
  config = { ...next, baseUrl: next.baseUrl.replace(/\/+$/, '') };
}

/** Error con el código HTTP y el cuerpo de la respuesta, para decidir qué mostrar en la app. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`La API respondió ${status}`);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  if (!config) throw new Error('Falta llamar a configureApiClient() al arrancar la app');

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  const token = await config.getToken?.();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${config.baseUrl}${url}`, { ...options, headers });
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) throw new ApiError(res.status, data);
  // orval (httpClient: fetch) espera { data, status, headers }
  return { data, status: res.status, headers: res.headers } as T;
}
