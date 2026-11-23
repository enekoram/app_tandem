# Bitácora

## 2026-11-23 · Sesión 1 — Fase 0 (documentación) y email

### Hecho
**Repositorio**
- `git init`; rama de trabajo `fase-0-documentacion` (`main` aún no tiene commits: se crea al fusionar la fase 0).
- `.gitignore` (dependencias, builds, `.env*` salvo `.env.example`, credenciales, `.logs/`, notas locales `pwd_*` y `*.rtf`), `.nvmrc` = 24, `CLAUDE.md`.
- Remoto: `github.com/enekoram/app_tandem`. Rama subida hasta `084cc95`; **quedan commits locales sin subir** (ver Pendiente).

**Documentación (`docs/`)**
- `01-arquitectura.md`: monorepo pnpm (`apps/mobile` Expo, `apps/api` NestJS + worker, `apps/web` estático, `packages/shared`, `packages/api-client`), tiempo real (change streams → Socket.IO por usuario, presencia en Redis), BullMQ, Better Auth, deep links propios, Meet (opción A), Render Frankfurt, desarrollo con Atlas + Render sin Docker.
- `02-modelo-datos.md`: colecciones, índices, reglas y autorización. Cambios sobre el encargo: estado de tarea en dos ejes (`status` + `companion.status`) y límite de 5 con `$inc` condicional sobre `users.open_task_count` (una transacción sola no evita el *write skew*).
- `03-maquina-estados-home.md`: XState con regiones paralelas (`base` derivada + `incoming`, `support`, `toasts`, `celebration`), `deriveBase` y `describeScene` puras, animación interrumpible, perfiles de movimiento.
- `04-riesgos-y-decisiones.md`: decisiones abiertas resueltas (ver abajo), limitaciones del dominio de Render, riesgos, costes.
- `05-plan-por-fases.md`: fases 0–7 con tareas pequeñas.
- `06-ui-kit.md`: tokens y ~20 componentes sacados de la página «UI kit» del canvas, y cómo se resuelven las diferencias con el encargo.
- `PROGRESO.md`: las 112 pantallas de «Prototipo con look and feel» con enlace al canvas, fase y estado (todas `pendiente`), notas del canvas y registro de decisiones.

**Canvas** (https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f, solo lectura)
- Solo se usan dos páginas: «Prototipo con look and feel» (pantallas) y «UI kit» (componentes y tokens). El resto se ignora.

**Decisiones tomadas** (detalle en docs/04 y PROGRESO)
- Entorno: **sin Docker**. Dev contra **Atlas M0** y **Render** (Key Value de staging con prefijo `dev:`); tests con mongodb-memory-server.
- App y API en el dominio de **Render** (`*.onrender.com`), también los Universal Links.
- Acceso con **email + contraseña** (mín. 8 caracteres, comprobación de contraseñas filtradas); Apple y Google en fase 2.
- Solo castellano: **no** se implementa el selector de idioma que aparece en «Crear cuenta».
- Invitación por email + enlace compartible; sin conexión = solo lectura; rechazos de tarea/sesión como dice el canvas.
- Decisiones abiertas del encargo (§13): aviso de sesión 10 min; «¡hurra!» + «Gracias»; onboarding corto para la invitada; Meet por enlace (manual hasta tener verificación de Google); reciprocidad tarea a tarea; deshacer 8 s, petición de apoyo 15 min, envío de apoyo máx. 5 min.
- Tokens: donde el UI kit y el encargo difieren, manda el **UI kit** (botón radio 18, título interior 30…).
- Es un **proyecto académico**: se priorizan planes gratuitos.

**Email transaccional (configurado y verificado)**
- Proveedor: **Resend**, plan gratuito, región **EU (Ireland)**.
- Remitente sobre el subdominio **`tandems.minucampoy.com`** (DNS en OVHcloud). La web y el correo del dominio principal no se han tocado (comprobado: A `@`/`www` → 92.222.139.190, MX de OVH intactos, la web responde 200).
- Registros añadidos en OVH y comprobados en DNS público: TXT `resend._domainkey.tandems` (DKIM), CNAME `rsend.tandems` y `send.tandems` (SPF), TXT `_dmarc.tandems` = `v=DMARC1; p=none;`. Recepción desactivada.
- Clave de API: `tandems-api-dev` con *Sending access* (la Full access se ha cambiado). **No está en el repositorio ni se ha compartido en el chat.**

### Pendiente para la próxima sesión
1. 🧑 **Visto bueno a la fase 0** («ok fase 0») → fusionar `fase-0-documentacion` en `main`.
2. 🧑 **Autenticar GitHub** con `! brew install gh` y `! gh auth login`, para subir los commits pendientes. **Revocar el token de GitHub** que se pegó en el chat.
3. 🧑 **Sacar `docs/pwd_resend_token.rtf` del repositorio** (está ignorado por git, pero los secretos van en un gestor de contraseñas, no en la carpeta del proyecto).
4. 🧑 Confirmar en Resend que el dominio sale *Verified* y que solo queda la clave de envío.
5. Empezar la **fase 1** en `fase-1-fundamentos` (ver docs/05): monorepo y pnpm, tokens y paleta de 8 personas con test de contraste (enseñarla antes de cerrarla), API NestJS con `/health`, app Expo con componentes base y pantallas de acceso, Better Auth, `pnpm dev`/`pnpm stop`, CI y `render.yaml`.
6. 🧑 Crear cuentas (gratuitas): **MongoDB Atlas** (clúster M0 en la UE), **Render** y **Expo/EAS**, con guía paso a paso.

### Cosas a tener en cuenta
- En este equipo hay Node 26 (no es LTS y no trae corepack); el proyecto fija Node 24. pnpm no está instalado.
- No hay `gh` ni Docker.
- Verificación de Google OAuth (Meet automático): requeriría un dominio verificado. Se puede hacer más adelante con un subdominio de `minucampoy.com` si se quiere; de momento, enlace de Meet manual.
