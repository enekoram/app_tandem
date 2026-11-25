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
2. ⏸ **«Recuperar contraseña» queda para pulir más adelante** (decisión del 2026-11-24): el email llega y la página intermedia está hecha, pero el recorrido completo en el iPhone no se ha comprobado. Para probar la app hay **5 cuentas de prueba** en `tandems_dev` (Marta, Juan, Lucía, Javier, Ramón; `@example.com`), con las contraseñas en `docs/pwd_usuarios_prueba.txt` (ignorado por git). Se recrean con `pnpm --filter @tandems/api seed:users`.
3. 🧑 Revisar las pantallas de acceso en el iPhone y pasar a «revisada» en PROGRESO las que estén bien.
4. 🧑 Crear cuenta en **expo.dev** (para EAS más adelante) y decidir si se pide Apple Developer (¿programa educativo del centro?).
5. 🧑 Sacar `docs/pwd_*.rtf` (Resend, GitHub, Atlas) de la carpeta del proyecto a un gestor de contraseñas; añadir a `~/.zshrc` las líneas de fnm si aún no están.
6. ✅ Fase 1 aprobada («ok fase 1») y fusionada en `main` el 2026-11-24.
7. Fase 2 (tareas y contactos) tras el visto bueno; empezar por `Sheet` y los modelos `contacts`/`tasks` con el límite de 5.

### Cosas a tener en cuenta
- En Expo Go no se ven el icono ni el splash propios (solo en un development build).
- La API en Render gratuito se duerme tras 15 min sin uso: la primera petición tarda ~1 min.
- La wifi del centro puede bloquear el acceso del iPhone al Mac; alternativa: punto de acceso del iPhone.

---

## 2026-11-24 · Sesión 2 (tarde) — Fase 2 (tareas y contactos), primera parte

> Entrada escrita el 2026-11-25 a partir de los commits: la sesión terminó sin actualizar la bitácora.

### Hecho (rama `fase-2-tareas`, subida)
- `packages/shared` se ejecuta como TypeScript en Node 24 (imports con `.ts`, `erasableSyntaxOnly`); reglas de color e iniciales de contactos y esquemas Zod de contactos y tareas.
- **API · contactos e invitaciones**: token de un solo uso (solo se guarda el hash), email y enlace para compartir, ErrContactoExiste (409, índice único, también en concurrencia), reenviar con límite (3 cada 10 min), aceptar en transacción, cancelar / eliminar en los dos sentidos, página `/enlace/invitacion`.
- **API · tareas**: límite de 5 con `$inc` condicional en transacción (test: 10 creaciones simultáneas con 4 abiertas → 1), editar, cambiar acompañante, terminar, borrar y deshacer (8 s), aceptar/rechazar/dejar de acompañar, «Acompaño», `POST /tasks/:id/hurra`. «Persona ajena → 404» en todas las acciones.
- **App**: Perfil, Mis contactos, Añadir contacto, detalle (aceptado y pendiente), cancelar invitación / eliminar contacto con «Deshacer», pantalla de invitación (`tandems://invitacion`); Mis tareas, Nueva/Editar tarea, terminadas, borrar, límite, cambiar acompañante; Acompaño (te comparten, lo que acompaño, terminadas, ¡hurra!); Hoy provisional con la siguiente tarea (la Home viva es la fase 3).
- Componentes: ConfirmSheet (el `Sheet` pendiente de la fase 1), ModalHeader, ListCard, ListRow, TaskCard, CardAction, PersonPicker, DateTimePill.
- Arreglos: sin caché HTTP en la API (los 304 dejaban listas viejas), no se envían emails a dominios de prueba (`example.com`, `.test`), `InteractionManager` ya no existe en RN 0.88; el pre-commit también comprueba tipos.
- Tests: 139 en shared y 55 en la API, en verde (comprobado el 2026-11-25).

### Decisiones
- La invitación se acepta **solo con el enlace**; la asociación automática por email espera a que haya verificación de email.
- Los textos dicen «lo verá en su lista» en vez de «recibirá un aviso» hasta que lleguen los push (fase 5).

### Pendiente de la fase 2
1. Editar perfil (nombre, foto con URL prefirmada, preferencias), confirmación de Cerrar sesión, Eliminar cuenta y Cuenta eliminada.
2. Crear cuenta con invitación y Bienvenida de la persona invitada (onboarding de invitada).
3. Deep links: AASA + assetlinks.json + web de aterrizaje (`apps/web`); Install Referrer en Android.
4. E2E con Maestro (crear tarea e invitar; aceptar invitación).
5. 🧑 Conectar el Blueprint de Render (sigue abierto desde la fase 1) y probar en el iPhone lo hecho.

---

## 2026-11-25 · Sesión 3 — Fase 2: perfil, cuenta y persona invitada

### Hecho (rama `fase-2-tareas`; **sin subir**: el `push` da 403, ver pendientes)
- Bitácora y PROGRESO puestos al día con lo hecho el 24 por la tarde; prompt de retomar corregido.
- **API**: `PATCH /me` (nombre, también en Better Auth) y `DELETE /me` (borrado inmediato: perfil, tareas, contactos, invitaciones y cuenta de Better Auth; los contactos ajenos se cancelan y sus tareas conmigo quedan «se fue»; el email queda libre). La vista previa de la invitación trae `invitedName` y `email`. `DISPLAY_NAME_MAX` y `updateProfileSchema` en `packages/shared`.
- **App**: Perfil con «Editar perfil» y hoja «¿Cerrar sesión?»; Editar perfil (nombre; email de solo lectura; foto aplazada); Cambiar contraseña (actual + nueva, cierra las otras sesiones); Eliminar cuenta + «Hasta pronto»; RegistroInvitado (email de la invitación fijo, nombre rellenado) y BienvenidaInvitado (la invitación se acepta sola al entrar y se abre Acompaño con el aviso).
- Tests: 140 en shared y 64 en la API, en verde. **Nada de esto se ha probado aún en el iPhone.**

### Decisiones (detalle en PROGRESO → Decisiones)
- Foto de perfil aplazada; email de solo lectura; «Cambiar contraseña» con hoja propia.
- Eliminar cuenta borra al momento (aún no hay cola `purge`).
- Sin onboarding aparte para la persona invitada.

### Hallazgos
- Los tipos de rutas de expo-router (`apps/mobile/.expo/types/router.d.ts`, ignorado) solo se regeneran al arrancar Metro: tras añadir pantallas, `pnpm dev mobile` (o `expo start` un momento) antes de `pnpm typecheck`. En la CI no existen y las rutas no se comprueban.
- En este equipo no hay Xcode completo, simulador, Java ni Android: Maestro no se puede ejecutar aquí.

### Pendiente
1. 🧑 **Arreglar el `push`**: GitHub responde 403 con la credencial del llavero. Crear un token *fine-grained* solo para `enekoram/app_tandem` con *Contents: Read and write*, borrar el antiguo del llavero (Acceso a Llaveros → buscar «github.com» → eliminar) y hacer `git push` desde Terminal (usuario `enekoram`, contraseña = token).
2. 🧑 Probar en el iPhone: editar perfil, cambiar contraseña, cerrar sesión, eliminar cuenta, y el recorrido de invitación con una cuenta nueva.
3. Deep links (AASA/assetlinks, Install Referrer) y E2E con Maestro: **aplazados** hasta el development build (decisión de hoy). Con eso, la fase 2 está completa a falta de tu prueba y visto bueno («ok fase 2» → fusionar en `main`).
4. 🧑 Conectar el Blueprint de Render.

### Sesión 3 (continuación) — fase 2 fusionada y fase 3 empezada
- **Fase 2 aprobada sin probar en el iPhone** y fusionada en `main` (local; el `push` de `main` y de `fase-3-home` está pendiente, ver abajo). Proyecto académico: **no se publica en App Store**; probar desde Chrome (Expo web) descartado.
- **Fase 3** en `fase-3-home`:
  - `packages/shared/src/home`: `deriveBase`, `describeScene`, `msUntilBaseChanges`, `sortOpenTasks`/`pickNextTask`, `homeMachine` (XState, regiones paralelas) y `toHomeSnapshot`. La máquina vive en shared (no en `apps/mobile/src/features/home` como decía el doc 03) para poder probarla con vitest.
  - `GET /me/home` (tareas abiertas, contactos aceptados, tareas compartidas pendientes) y `TaskViews` compartido.
  - Las tareas abiertas se ordenan igual en la API y en la Home: con fecha por cercanía y después sin fecha, la más reciente (Mongo ponía primero las sin fecha).
  - Tests: 182 en shared y 66 en la API. El test de modelo encontró dos fallos de la escena (quien pide apartaba a tu acompañante; «Te piden» no salía mientras cargaba), corregidos.
- **Push**: con el token del archivo funcionó para `fase-2-tareas`, pero los permisos de Claude Code bloquean volver a usarlo. Hay que subir `main` y `fase-3-home` a mano (ver respuesta de la sesión).
- Después: tiempo real (gateway Socket.IO, change streams de `tasks` y `contacts`, presencia en memoria; un fallo encontrado por el test: `contact_user_id` no convierte cadenas a ObjectId), hooks `useCompleteTask`/`useRespondShared`, `sceneGeometry`, `HomeScene` (Skia, goo), carrusel «Para hoy» y la pantalla Hoy nueva. La app **empaqueta para iOS con Metro sin errores** (`expo export`), pero nada visual se ha visto en un móvil.
- Tests: 188 en shared y 70 en la API.

### Pendiente
1. 🧑 **Subir**: `git push origin main && git push -u origin fase-3-home` desde Terminal (el llavero ya no tiene la credencial vieja; la primera vez pide usuario `enekoram` y el token).
2. 🧑 **Probar la Home en el móvil con Expo Go** (lista de casos en la respuesta de la sesión) y ajustar posiciones, tamaños y muelles.
3. Con el visto bueno de la fase 3: fusionar y seguir con la fase 4 (sesiones).

### Sesión 3 (continuación) — fase 4 (sesiones)
- `docs/PRUEBAS-PENDIENTES.txt`: todo lo que falta probar en el móvil (fases 1–4), para ir punto por punto.
- Rama `fase-4-sesiones` (sale de `fase-3-home`). API de sesiones con tests (programar, aceptar/rechazar, proponer otra hora/reprogramar, cancelar, unirse; persona ajena → 404), sesiones en `/me/home` y en tiempo real. App: Mis sesiones, Programar, ConfirmarSesion, hojas de rechazar/cancelar, Proponer/Reprogramar, SesionActiva y tarjetas en la Home. La app empaqueta para iOS sin errores.
- Aplazado de la fase 4: Google OAuth, Calendar y recordatorios en cola (ver docs/05).
- Tests: 192 en shared y 82 en la API.
