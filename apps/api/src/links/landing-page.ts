/**
 * Página intermedia de los enlaces de email. HTML estático, sin JavaScript, con los colores
 * de la marca. Textos de la web (no de la app): por eso viven aquí y no en strings/es.ts.
 */

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const css = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: #FAF5E8; color: #211E1B;
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif; display: flex; justify-content: center; }
  main { width: 100%; max-width: 440px; padding: 56px 24px 40px; display: flex; flex-direction: column; gap: 18px; }
  .brand { font-family: Georgia, "Times New Roman", serif; font-size: 34px; letter-spacing: -.02em; margin: 0 0 12px; }
  .cap { font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #3A3530; margin: 0; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; font-size: 32px; line-height: 1.1; margin: 0; }
  p { font-size: 16px; line-height: 1.5; color: #3A3530; margin: 0; }
  .btn { display: flex; align-items: center; justify-content: center; min-height: 52px; border-radius: 18px;
    background: #211E1B; color: #F5EFE4; font-weight: 600; font-size: 16px; text-decoration: none; margin-top: 8px; }
  .btn:focus-visible { outline: 3px solid #211E1B; outline-offset: 3px; }
  .note { border: 1px dashed #A69B8E; border-radius: 20px; padding: 14px 16px; font-size: 14px; color: #6B6259; }
  .note b { color: #3A3530; }
  .err { background: #F6E3DE; border: 1px solid #E7C2B8; color: #7A2A1F; border-radius: 20px; padding: 14px 16px; }
`;

function page(body: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Tandems</title>
<style>${css}</style>
</head>
<body><main>
<p class="brand">Tan<i>dems</i></p>
${body}
</main></body>
</html>`;
}

export function resetLandingPage(appLink: string): string {
  return page(`
<p class="cap">Último paso</p>
<h1>Crea una contraseña <i>nueva</i></h1>
<p>Pulsa el botón desde el móvil donde tienes Tandems: se abrirá la app para que escribas la contraseña nueva.</p>
<a class="btn" href="${escapeHtml(appLink)}">Abrir Tandems</a>
<p class="note"><b>¿Estás en el ordenador?</b> Abre este mismo email en tu móvil. El enlace caduca en 1 hora y solo sirve una vez.</p>`);
}

export function invalidLinkPage(): string {
  return page(`
<p class="cap">Enlace no válido</p>
<h1>Este enlace <i>no funciona</i></h1>
<p class="err">Puede que esté incompleto o que ya se haya usado. Pide uno nuevo desde la app: Iniciar sesión → ¿Has olvidado tu contraseña?</p>`);
}

export function invitationLandingPage(inviterName: string, appLink: string): string {
  const name = escapeHtml(inviterName);
  return page(`
<p class="cap">Invitación</p>
<h1>${name} te invita a su <i>red de apoyo</i></h1>
<p>En Tandems podrás acompañar sus tareas, uniros en sesiones en vivo y enviarle apoyo cuando lo necesite.</p>
<a class="btn" href="${escapeHtml(appLink)}">Abrir en Tandems</a>
<p class="note"><b>¿Aún no tienes Tandems?</b> Instálala en tu móvil y vuelve a abrir este enlace desde allí. Si estás en el ordenador, abre este mismo mensaje en el móvil. La invitación caduca en 14 días.</p>`);
}

export function invalidInvitationPage(): string {
  return page(`
<p class="cap">Invitación no disponible</p>
<h1>Esta invitación <i>no funciona</i></h1>
<p class="err">Puede que haya caducado, que ya se haya aceptado o que la hayan cancelado. Pide a la persona que te invitó que te envíe otra.</p>`);
}
