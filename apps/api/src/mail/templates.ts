import type { EmailMessage } from './mailer.js';

/** Escapa texto para HTML (el nombre lo escribe la persona). */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Colores de marca para emails (los clientes de correo no leen el tema de la app). */
const brand = {
  ground: '#FAF5E8',
  surface: '#FFFDF8',
  ink: '#211E1B',
  secondary: '#6B6259',
  onInk: '#F5EFE4',
};

export function resetPasswordEmail(to: string, name: string, url: string): EmailMessage {
  const safeName = escapeHtml(name);
  return {
    to,
    subject: 'Crea una contraseña nueva para Tandems',
    text: [
      `Hola, ${name}:`,
      '',
      'Has pedido crear una contraseña nueva. Abre este enlace desde el móvil donde tienes Tandems:',
      url,
      '',
      'El enlace caduca en 1 hora. Si no lo has pedido tú, ignora este email: tu contraseña no cambia.',
    ].join('\n'),
    html: `<!doctype html><html lang="es"><body style="margin:0;background:${brand.ground};font-family:-apple-system,Segoe UI,sans-serif;color:${brand.ink}">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
<p style="font-family:Georgia,serif;font-size:28px;margin:0 0 16px">Hola, <i>${safeName}</i></p>
<p style="font-size:16px;line-height:1.5;margin:0 0 24px">Has pedido crear una contraseña nueva. Abre este enlace desde el móvil donde tienes Tandems:</p>
<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:${brand.ink};color:${brand.onInk};text-decoration:none;font-weight:600;padding:16px 24px;border-radius:18px">Crear contraseña nueva</a></p>
<p style="font-size:14px;line-height:1.5;color:${brand.secondary};margin:0">El enlace caduca en 1 hora. Si no lo has pedido tú, ignora este email: tu contraseña no cambia.</p>
</div></body></html>`,
  };
}
