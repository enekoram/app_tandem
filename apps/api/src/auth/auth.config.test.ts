import { describe, expect, it } from 'vitest';
import { sameHostAsRequest } from './auth.config.js';

const URL_ = 'http://10.199.25.210:3000/api/auth/reset-password/abc?callbackURL=exp%3A%2F%2Fx';

describe('sameHostAsRequest (enlaces de email en desarrollo)', () => {
  it('usa el host con el que llegó la petición y conserva ruta y query', () => {
    const req = new Request('http://172.20.10.2:3000/api/auth/request-password-reset', {
      headers: { host: '172.20.10.2:3000' },
    });
    expect(sameHostAsRequest(URL_, req)).toBe(
      'http://172.20.10.2:3000/api/auth/reset-password/abc?callbackURL=exp%3A%2F%2Fx',
    );
  });

  it('sin petición o con un host raro deja el enlace igual', () => {
    expect(sameHostAsRequest(URL_)).toBe(URL_);
    const req = new Request('http://x/', { headers: { host: 'evil.com/@x' } });
    expect(sameHostAsRequest(URL_, req)).toBe(URL_);
  });
});
