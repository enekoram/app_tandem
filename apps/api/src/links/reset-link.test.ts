import { describe, expect, it } from 'vitest';
import { appLinkFor, isValidToken, landingUrlFrom, publicOrigin } from './reset-link.js';

const BA =
  'http://10.199.25.210:3000/api/auth/reset-password/abcDEF123_-x?callbackURL=tandems%3A%2F%2Freset-password';

describe('enlaces de «Crear contraseña nueva»', () => {
  it('en desarrollo usa el host de la petición; en producción, BETTER_AUTH_URL', () => {
    expect(publicOrigin('http://localhost:3000', true, '172.20.10.2:3000')).toBe(
      'http://172.20.10.2:3000',
    );
    expect(publicOrigin('https://api.onrender.com', false, '172.20.10.2:3000')).toBe(
      'https://api.onrender.com',
    );
    expect(publicOrigin('http://localhost:3000', true, 'evil.com/@x')).toBe(
      'http://localhost:3000',
    );
  });

  it('convierte la URL de Better Auth en la de nuestra página intermedia', () => {
    const landing = new URL(landingUrlFrom(BA, 'http://172.20.10.2:3000'));
    expect(landing.origin).toBe('http://172.20.10.2:3000');
    expect(landing.pathname).toBe('/enlace/contrasena');
    expect(landing.searchParams.get('token')).toBe('abcDEF123_-x');
    expect(landing.searchParams.get('callbackURL')).toBe('tandems://reset-password');
  });

  it('el botón vuelve al endpoint de Better Auth con el mismo token y callback', () => {
    expect(appLinkFor('http://h:3000', 'abcDEF123_-x', 'tandems://reset-password')).toBe(
      'http://h:3000/api/auth/reset-password/abcDEF123_-x?callbackURL=tandems%3A%2F%2Freset-password',
    );
  });

  it('solo acepta tokens con forma de token', () => {
    expect(isValidToken('abcDEF123_-x')).toBe(true);
    expect(isValidToken('"><script>')).toBe(false);
    expect(isValidToken(undefined)).toBe(false);
  });
});
