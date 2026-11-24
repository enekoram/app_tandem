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

---

## 2026-11-24 · Sesión 2 — Fase 1 (fundamentos)

### Hecho
**Repositorio y entorno**
- Fase 0 aprobada: `main` creada desde `fase-0-documentacion` y subida. Trabajo en `fase-1-fundamentos` (subida).
- Entorno sin administrador: Node 24 con **fnm** en `~/.local/share/fnm`, pnpm 12.18.0 por corepack. Sin Homebrew ni `gh`: los `push` se hacen con el token guardado fuera del repo.
- Secretos de desarrollo en `apps/api/.env` (ignorado): Atlas (usuario `tandems_dev`), secreto de Better Auth generado y clave de Resend. Ninguno ha pasado por el chat.

**Fase 1** (detalle y estado por paso en docs/05)
- Monorepo pnpm 12 + TypeScript 6 (la 7 aún no la admite typescript-eslint) + ESLint/Prettier + Husky/lint-staged/commitlint.
- `packages/shared`: tokens del UI kit y **paleta de 8 personas aprobada** (soft/base/deep/text, tests de contraste AA y ΔE00).
- `apps/api` (NestJS 12, ESM): Zod para el entorno, Mongoose, pino sin credenciales, Helmet, throttler, `/health`, Swagger, **Better Auth** (email + contraseña, HIBP, sesión de 60 días, recuperar contraseña con email de marca vía Resend), `GET /me` con el perfil en `users`.
- `packages/api-client` generado con orval; `pnpm generate:api`.
- `apps/mobile` (Expo SDK 58): pestañas con estados vacíos del canvas, Perfil (nombre, email, cerrar sesión), **onboarding 1–4 con ilustraciones animadas en Skia** (forma fundida, deriva de 6 s, latido; quietas con Reducir movimiento) y todas las pantallas de acceso. Probado en iPhone con Expo Go.
- `pnpm dev` / `pnpm stop`; CI en GitHub Actions; `render.yaml` para la API; logo en SVG + icono, splash y favicon (`pnpm brand:assets`).
- Tests: 122 en shared y 19 en la API (incluido un e2e completo de registro, inicio de sesión y recuperar contraseña).

**Hallazgos**
- pnpm 12 ignora `.npmrc`: se usa la instalación aislada (Expo la admite desde el SDK 54). Corregido docs/01.
- Better Auth **desactiva la comprobación de origen en tests**; se fuerza siempre para que los tests cubran lo mismo que producción (test: no se aceptan redirecciones ajenas en recuperar contraseña).
- El registro de Better Auth corre en una transacción que puede reintentarse (manda una cookie por intento): el perfil se crea en `GET /me` y no en un hook, para no dejar perfiles huérfanos.
- **Hermes (iOS) no trae `Intl.PluralRules`**: «Crear cuenta» con campos vacíos rompía la pantalla. Plurales con `pluralEs` (regla en CLAUDE.md).
- Con wifi débil se prueba con el **punto de acceso del iPhone** (Mac conectado por cable). En desarrollo, el enlace del email usa el host con el que llamó el móvil (la IP del Mac cambia con la red).
- El enlace del email ya no va directo a Better Auth (que redirige a la app y en un ordenador deja la página en blanco): lleva a **/enlace/contrasena**, una página de la marca con «Abrir Tandems» y la indicación de abrirlo en el móvil. Los logs nunca guardan la query (tokens).

### Pendiente para la próxima sesión
1. 🧑 **Conectar Render**: New → Blueprint con este repo (rama `main` tras fusionar la fase 1). En el panel, rellenar `MONGODB_URI` (otro usuario de Atlas para staging, p. ej. `tandems_staging`, y base `tandems_staging`) y `RESEND_API_KEY`. En Atlas → Network Access hay que permitir `0.0.0.0/0` (Render gratuito no tiene IP fija; la protección es el usuario y la contraseña).
2. 🧑 **Probar «Recuperar contraseña» hasta el final** desde el iPhone (el email llega; falta comprobar página intermedia → Expo Go → «Crear contraseña nueva» → entrar).
3. 🧑 Revisar las pantallas de acceso en el iPhone y pasar a «revisada» en PROGRESO las que estén bien.
4. 🧑 Crear cuenta en **expo.dev** (para EAS más adelante) y decidir si se pide Apple Developer (¿programa educativo del centro?).
5. 🧑 Sacar `docs/pwd_*.rtf` (Resend, GitHub, Atlas) de la carpeta del proyecto a un gestor de contraseñas; añadir a `~/.zshrc` las líneas de fnm si aún no están.
6. 🧑 Visto bueno a la fase 1 → fusionar `fase-1-fundamentos` en `main`.
7. Fase 2 (tareas y contactos) tras el visto bueno; empezar por `Sheet` y los modelos `contacts`/`tasks` con el límite de 5.

### Cosas a tener en cuenta
- En Expo Go no se ven el icono ni el splash propios (solo en un development build).
- La API en Render gratuito se duerme tras 15 min sin uso: la primera petición tarda ~1 min.
- La wifi del centro puede bloquear el acceso del iPhone al Mac; alternativa: punto de acceso del iPhone.
