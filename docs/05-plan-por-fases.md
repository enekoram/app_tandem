# 05 · Plan por fases

> Estado: **propuesta, pendiente de visto bueno** · 2026-11-23
> Cada fase en su rama (`fase-N-nombre`), commits pequeños, y al cerrar: tests en verde, `PROGRESO.md` actualizado, capturas comparadas y build instalable si toca la app. 🧑 = tarea que solo puedes hacer tú (paro y te explico paso a paso).

## Fase 0 · Documentación (esta rama: `fase-0-documentacion`)
- [x] Repositorio, `.gitignore`, `CLAUDE.md`
- [x] Docs 01–05 y `PROGRESO.md`
- [x] Respuestas a doc 04 §A y §B (2026-11-23)
- [x] Lista de pantallas completa desde el canvas (112)
- [ ] 🧑 Visto bueno final → fusionar en `main`

## Fase 1 · Fundamentos (`fase-1-fundamentos`)
> **Aprobada y fusionada en `main` el 2026-11-24.** ✅ hecho · ⏳ pendiente · ⏸ aplazado. Lo pendiente (conectar Render, `Sheet`, cuenta de Expo) pasa al inicio de la fase 2. Detalle en `BITACORA.md`.

1. ✅ Monorepo pnpm 12 (workspaces, ajustes en `pnpm-workspace.yaml`), TypeScript 6, ESLint + Prettier, Husky + lint-staged + commitlint.
2. ✅ `packages/shared`: tokens (`theme/`: colores, tipografía, radios, espacios, motion tokens), paleta de 8 personas **aprobada** + test de contraste AA.
3. ✅ `apps/api`: NestJS 12, `@nestjs/config` con validación Zod, Mongoose, pino, Helmet, throttler, `/health`, Swagger.
4. ✅ Tests de la API con mongodb-memory-server en réplica; e2e de `/health` y de autenticación.
5. ✅ Cliente (`packages/api-client`) desde OpenAPI con orval (`pnpm generate:api`).
6. ✅ `apps/mobile`: Expo SDK 58 + expo-router, fuentes, `strings/es.ts`, componentes base (Button, Card con filo, Text/EmphasisText, Toast, TabBar flotante, TextField, Checkbox…), 4 pestañas + Perfil. ⏳ `Sheet`: cuando la necesite la primera pantalla (fase 2).
7. ✅ Autenticación: Better Auth con email + contraseña; pantallas Onboarding 1–4, Iniciar sesión, Crear cuenta, Recuperar contraseña, Revisa tu email, Crear contraseña nueva, ErrLogin, ErrRegistro. (Apple y Google en fase 2.)
8. ✅ Scripts `pnpm dev` / `pnpm stop` con logs en `.logs/` y QR para Expo Go.
9. ✅ CI en GitHub Actions; `render.yaml` con la API (worker, Key Value, cron y web estática se añaden en sus fases). ⏳ 🧑 Conectar el Blueprint en Render.
10. Cuentas: ✅ Atlas, ✅ Resend, ✅ Render (falta conectar), ⏳ Expo, ⏸ Apple Developer y Google Play (de momento se prueba con Expo Go).
11. ✅ Logo A1 · Rotunda como SVG + icono de app, splash y favicon (`pnpm brand:assets`).
12. ⏸ Development build con EAS: aplazado hasta decidir la cuenta de Apple Developer; mientras, Expo Go.

**Entregable:** app instalable con login, pestañas vacías con el look de la marca; API en staging respondiendo.

## Fase 2 · Tareas y contactos (`fase-2-tareas`)
1. `users`: perfil, preferencias, foto (URL prefirmada S3).
2. `contacts` + asignación de color e iniciales (`usePersonStyle` / `PersonToken`), con tests de colisión de iniciales y emojis.
3. `invitations`: crear, email (plantilla de marca + texto plano), hoja de compartir nativa, reenviar, cancelar, caducidad; asociación por email al registrarse.
4. Deep links: AASA + assetlinks.json + web de aterrizaje; Install Referrer en Android.
5. `tasks`: CRUD con límite de 5 (contador condicional + test de concurrencia), acompañante, aceptar/rechazar/dejar, deshacer.
6. Pantallas: Mis tareas, formulario, detalle, Contactos, DetalleContactoPendiente, CancelarInvitacion, ErrContactoExiste, LimiteTareas, TareaAbandonada, CambiarAcompanante, InvitacionApp, BienvenidaInvitado, onboarding de invitada.
7. Eliminar cuenta (en la app) y tests de autorización por recurso.
8. E2E Maestro: happy path «crear tarea e invitar a alguien» y «aceptar invitación».

## Fase 3 · Home viva (`fase-3-home`)
1. Shader SkSL de metaballs + componente `UnitedShape` (Storybook con todas las escenas).
2. Perfiles de movimiento (completo/suave/mínimo + Reducir movimiento).
3. `homeMachine` (XState) + `deriveBase` + `describeScene` con tests.
4. Gateway realtime (Socket.IO, auth en el handshake, salas por usuario), change streams, presencia en Redis.
5. `GET /me/home` y reconciliación al volver a primer plano.
6. Carrusel accesible.
7. Medición de fps en un Android modesto. Build → 🧑 probar.

## Fase 4 · Sesiones (`fase-4-sesiones`)
1. Proponer, aceptar, rechazar, contraproponer, reprogramar, cancelar; zonas horarias; ErrProgramarSesion.
2. Conectar Google (OAuth en la app, refresh token cifrado en la API).
3. Cola `calendar`: crear/actualizar/borrar evento con Meet; enlace manual como alternativa.
4. Recordatorios como trabajos retrasados + cron de seguridad.
5. SesionPorEmpezar, SesionActiva, modo «presencia sin vídeo», estado `live`.

## Fase 5 · Apoyo y notificaciones (`fase-5-apoyo`)
1. Pedir apoyo (ApoyoPedido), responder (aceptar / ahora no), caducidad.
2. Enviar apoyo (mantener pulsado) con presencia y corazón en tiempo real (ApoyoRecibido).
3. «Pensé en ti», ¡hurra! y «Gracias».
4. Push: PermisoNotificaciones, tokens, catálogo completo, categorías/acciones rápidas, agrupación, horario de silencio, idempotencia y límite de frecuencia; NotificacionesKV en Perfil.
5. Fallback por email para invitaciones y avisos críticos.

## Fase 6 · Pulido (`fase-6-pulido`)
Motion fino en todos los componentes, auditoría de accesibilidad (VoiceOver, TalkBack, teclado externo, Dynamic Type máximo), todos los estados vacíos y de error del canvas, Sentry, analítica sin contenido, Live Activity (si hay tiempo), exportar datos, pruebas en dispositivos reales.

## Fase 7 · Lanzamiento (`fase-7-lanzamiento`)
🧑 Verificación de Google completada, políticas de privacidad y condiciones, fichas de tienda y declaración de datos, TestFlight y pruebas internas en Play, entorno de producción en Render y Atlas M10, pruebas con usuarios reales.
