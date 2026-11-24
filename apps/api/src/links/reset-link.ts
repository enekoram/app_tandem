/**
 * Enlaces de «Crear contraseña nueva».
 *
 * El email no lleva directamente al endpoint de Better Auth (que redirige a `tandems://…` y
 * en un ordenador deja una página en blanco), sino a una página nuestra, /enlace/contrasena,
 * que explica qué hacer y tiene el botón «Abrir Tandems» hacia ese endpoint.
 */

export const RESET_LANDING_PATH = '/enlace/contrasena';
const TOKEN_RE = /^[A-Za-z0-9_-]{8,200}$/;
const HOST_RE = /^[\w.-]+(:\d+)?$/;

/**
 * Origen público de la API para los enlaces. En desarrollo la IP del Mac cambia con la red
 * (wifi, punto de acceso del iPhone…): se usa el host con el que acaba de llegar la petición,
 * que sabemos que el móvil alcanza. En producción, siempre BETTER_AUTH_URL.
 */
export function publicOrigin(baseURL: string, isDev: boolean, host?: string | null): string {
  if (isDev && host && HOST_RE.test(host)) return `${new URL(baseURL).protocol}//${host}`;
  return new URL(baseURL).origin;
}

export function isValidToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_RE.test(token);
}

/** De la URL que genera Better Auth (…/reset-password/<token>?callbackURL=…) a nuestra página. */
export function landingUrlFrom(betterAuthUrl: string, origin: string): string {
  const source = new URL(betterAuthUrl);
  const token = source.pathname.split('/').at(-1) ?? '';
  const landing = new URL(RESET_LANDING_PATH, origin);
  landing.searchParams.set('token', token);
  const callback = source.searchParams.get('callbackURL');
  if (callback) landing.searchParams.set('callbackURL', callback);
  return landing.toString();
}

/** Endpoint de Better Auth que valida el token y abre la app (botón «Abrir Tandems»). */
export function appLinkFor(origin: string, token: string, callbackURL?: string): string {
  const link = new URL(`/api/auth/reset-password/${encodeURIComponent(token)}`, origin);
  if (callbackURL) link.searchParams.set('callbackURL', callbackURL);
  return link.toString();
}
