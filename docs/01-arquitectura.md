# 01 · Arquitectura y justificación

> Estado: **propuesta, pendiente de visto bueno** · 2026-11-23
> Componentes y tokens: ver `06-ui-kit.md`.

## 1. Vista general

```
┌──────────────────────────┐        HTTPS (REST + OpenAPI)        ┌────────────────────────────────────┐
│  App móvil (Expo / RN)   │ ───────────────────────────────────▶ │  API NestJS  (Render Web Service)   │
│  iOS + Android           │ ◀──────── WebSocket (Socket.IO) ──── │  · REST  · gateway realtime         │
│  TanStack Query · XState │                                      │  · change streams → salas user:<id> │
│  Skia · Reanimated       │                                      └───────┬───────────────┬────────────┘
└──────┬───────────────────┘                                              │ Mongoose      │ BullMQ (encola)
       │ push (APNs/FCM vía Expo)                                        ▼               ▼
       │                                                  ┌────────────────────┐  ┌──────────────────────┐
       │                                                  │ MongoDB Atlas (UE) │  │ Render Key Value     │
       │                                                  │ réplica 3 nodos    │  │ (Redis): colas,      │
       │                                                  └─────────▲──────────┘  │ adaptador Socket.IO, │
       │                                                            │             │ presencia, rate-limit│
       │                                                  ┌─────────┴──────────┐  └──────────▲───────────┘
       └──────────────────────────────────────────────── │ Background Worker  │─────────────┘
                     Expo Push API ◀───────────────────── │ (procesadores      │──▶ Resend/Postmark (email)
                                                          │  BullMQ)           │──▶ Google Calendar / Meet
                                                          └────────────────────┘──▶ S3 UE (fotos)
   Cron Jobs de Render ──(encolan trabajos)──▶ Redis        Static Site: aterrizaje + AASA + assetlinks.json
```

Regla de oro: **la app solo habla con la API**. Nunca con MongoDB, Redis ni S3 directamente (las fotos se suben con URL prefirmada que emite la API).

## 2. Monorepo

```
/
├─ apps/
│  ├─ mobile/        Expo (TypeScript estricto, expo-router)
│  ├─ api/           NestJS (REST + WebSocket); el worker es otro entrypoint del mismo proyecto
│  └─ web/           Static Site: aterrizaje de invitaciones, AASA, assetlinks.json (HTML mínimo)
├─ packages/
│  ├─ shared/        esquemas Zod (fuente de verdad de DTOs), tipos, enums de estados, reglas puras
│  │                 (límite de tareas, asignación de color), tokens de diseño y paleta de personas
│  └─ api-client/    cliente generado desde OpenAPI (orval) con hooks de TanStack Query
├─ docs/
├─ render.yaml
└─ CLAUDE.md
```

- **pnpm 12 workspaces** con la instalación **aislada** (la de por defecto), que Expo admite desde el SDK 54; la configuración de pnpm va en `pnpm-workspace.yaml` (pnpm 12 ya no lee `.npmrc`). Si Metro diera problemas con algún módulo nativo, la alternativa es `nodeLinker: hoisted`. *(Corregido el 2026-11-24: antes decía `node-linker=hoisted` en `.npmrc`.)*
- **Node 24 LTS** fijado en `.nvmrc` y en Render. En el equipo de desarrollo se usa con `fnm` (instalado en la carpeta de usuario, sin administrador) y pnpm llega por corepack.
- `packages/shared` **no se compila**: la app lo empaqueta con Metro y la API lo importa como TypeScript, que Node 24 ejecuta directamente (eliminación de tipos). Requisitos: imports relativos con `.ts` y solo sintaxis borrable (`erasableSyntaxOnly`). *(Decidido el 2026-11-24.)*
- Worker y API son **el mismo proyecto NestJS con dos `main`** (`main.ts` y `worker.ts`): comparten módulos, esquemas y configuración, y se despliegan como dos servicios en Render.

## 3. App móvil

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | Expo, último SDK estable (se fija en fase 1), New Architecture | Una base para iOS/Android, EAS Build sin Mac, OTA updates |
| Navegación | **expo-router** (rutas por archivo) | Deep links y Universal Links casi gratis: cada ruta ya es una URL |
| Animación | **Reanimated 4** + react-native-worklets + Gesture Handler | El encargo dice v3, pero v4 es la versión vigente con la New Architecture y la que soportan los SDK actuales de Expo. Misma API de worklets. **Señalado como cambio.** |
| Forma unida | **@shopify/react-native-skia** (shader SkSL de metaballs, ver doc 03) | Corre en GPU, idéntico en iOS y Android |
| Datos remotos | TanStack Query + cliente generado | Caché, reintentos, invalidación desde eventos de WebSocket |
| Estado local complejo | **XState v5** (home y sesiones) | Estados paralelos, transiciones interrumpibles, inspector visual |
| Tiempo real | socket.io-client, solo transporte `websocket` | Evita sticky sessions en Render |
| Textos | `src/strings/es.ts` único + `Intl` (fechas, plurales con `Intl.PluralRules`) | Correcciones fáciles sin montar i18n completo |
| Fuentes | `expo-font` con EB Garamond y Plus Jakarta Sans embebidas | Sin descarga en tiempo de ejecución |
| Tests | Jest + React Native Testing Library; **Maestro** para E2E; capturas con Storybook RN + comparación de imágenes | Maestro es más sencillo que Detox y corre en EAS |

## 4. API (NestJS)

- Módulos: `auth`, `users`, `contacts`, `invitations`, `tasks`, `sessions`, `support`, `notifications`, `calendar`, `mail`, `realtime`, `health`.
- **Validación con Zod** (esquemas en `packages/shared`, `nestjs-zod` para generar OpenAPI). Así app y API comparten exactamente las mismas reglas de entrada. Mongoose para el acceso a datos + **validadores JSON Schema en la propia colección** (generados desde los mismos esquemas en una migración).
- Guard global de autenticación + guards por recurso (`TaskOwnerGuard`, `TaskCompanionGuard`, `AcceptedContactGuard`). Toda consulta de repositorio recibe el `userId` autenticado: no hay método «buscar por id» sin dueño.
- Reglas de negocio en servicios; transacciones para operaciones multi-documento.
- pino (logs JSON, sin contenido de tareas), Helmet, CORS cerrado (la app nativa no lo necesita; solo la web de aterrizaje), `@nestjs/throttler` sobre Redis, `/health` (Mongo + Redis).
- Migraciones con `migrate-mongo` (índices, validadores, TTL).

### Tiempo real

1. Cada instancia de la API abre **un** change stream sobre `tasks`, `sessions`, `support_events`, `contacts`, `invitations` (con resume token guardado en Redis).
2. Por cada cambio calcula a qué usuarios afecta (dueño, acompañante) y emite **solo a sus sockets locales** (`server.local.to('user:<id>')`): cada instancia recibe todos los cambios, así que no se duplica.
3. El adaptador de Redis queda para lo que no pasa por Mongo: **presencia** («Marta está enviando apoyo», heartbeats con TTL en Redis) y latidos del corazón, que serían demasiado frecuentes para escribirlos en la base de datos.
4. Al reconectar o volver a primer plano, la app pide `GET /me/home` (instantánea completa) y la máquina de estados se reconcilia.

### Trabajos

BullMQ con colas `push`, `mail`, `calendar`, `purge`, `reminders`. Trabajos idempotentes (`jobId` determinista, p. ej. `reminder:<sessionId>:<scheduledAt>`), reintentos con backoff. Los recordatorios de sesión se programan como **trabajos retrasados** al aceptar la sesión (y se reemplazan al reprogramar); los Cron Jobs de Render quedan para barridos (invitaciones caducadas, purga, red de seguridad de recordatorios).

## 5. Autenticación — recomendación: Better Auth

| Opción | A favor | En contra |
|---|---|---|
| **Better Auth** (recomendada) | Datos de usuario en nuestro Atlas UE (RGPD sencillo); email+contraseña, enlace mágico, Apple, Google; adaptador MongoDB y plugin de Expo; sin coste por usuario | La mantenemos nosotros; librería relativamente joven; integración con NestJS a mano (es un handler HTTP montable) |
| Clerk | Lo más rápido de montar, UI lista | Datos en EE. UU., coste por MAU, menos control del flujo de invitada |
| Firebase Auth | Gratis, maduro | Otro proveedor de Google, encaja peor con el registro bloqueado al email invitado |
| Auth0 | Muy completo | Caro y pesado para un MVP |

Better Auth corre **dentro** de la API (mismo dominio, mismas colecciones), y el guard de NestJS valida la sesión/JWT en cada petición. Sign in with Apple es obligatorio en iOS si ofrecemos Google.

## 6. Invitaciones sin «deferred deep link» de pago

Firebase Dynamic Links ya no existe y Branch es caro. Propuesta propia:

1. La invitación está ligada a un **email**. Si la invitada instala la app desde la tienda y se registra con ese email, el servidor le **asocia automáticamente** las invitaciones pendientes. No hace falta conservar el token.
2. Android: además, el enlace de Play Store lleva `referrer=<token>` y se lee con Install Referrer.
3. iOS: la web de aterrizaje ofrece «Copiar código» y la app lo detecta en el portapapeles tras instalar **solo si la persona pulsa «Tengo un código»** (sin leer el portapapeles a escondidas).
4. Si se registra con otro email: pantalla «¿Tienes una invitación?» para pegar el enlace o el código.

## 7. Videollamada — recomendación para el MVP: Opción A (Meet)

- Meet por **Google Calendar API** (`conferenceData.createRequest` con `hangoutsMeet`), que funciona con cuentas personales de Gmail. Solo la persona organizadora conecta Google (ámbito `calendar.events`, sensible → verificación de Google: hay que empezar el trámite en fase 1).
- Mientras la verificación no llegue: **enlace de Meet pegado a mano** (mismo campo `meet_url`).
- Dentro de Tandems, la pantalla **SesionActiva** sigue mostrando «En vivo», el corazón y los gestos; al volver de Meet se ven. Live Activity de iOS como mejora en fase 6 (necesita extensión nativa en Swift; con config plugin de Expo).
- **Opción B (LiveKit)** queda documentada como evolución post-MVP: es la única forma de ver la forma unida *sobre* el vídeo, pero añade coste por minuto, un servidor de medios y bastante más trabajo de UI. Estimación aproximada: A ≈ 1,5 semanas; B ≈ 4–5 semanas.

## 8. Infraestructura (Render, región Frankfurt)

| Servicio | Tipo | Notas |
|---|---|---|
| `tandems-api` | Web Service (Starter o superior) | REST + WebSocket, `/health` |
| `tandems-worker` | Background Worker | Procesadores BullMQ |
| `tandems-kv` | Key Value | `maxmemory-policy noeviction` (obligatorio para BullMQ) |
| `tandems-cron-*` | Cron Jobs | Barridos; solo encolan trabajos |
| `tandems-web` | Static Site | Aterrizaje, AASA, assetlinks.json |

- Dos entornos (`staging`, `production`) con Environment Groups distintos; Preview Environments para PR de la API.
- Atlas: proyecto en UE (Fráncfort), lista de IPs = IPs de salida de Render. En desarrollo, M0 gratuito (tiene réplica y change streams).
- CI: GitHub Actions (lint, typecheck, test, build) → Render despliega `main` cuando CI pasa. EAS Build para la app, EAS Update para cambios solo JS.

## 9. Alternativa considerada: SwiftUI nativo

Ganaría Live Activities, PiP y widgets sin puentes, y la forma unida en Metal. Perdería Android (habría que hacer otra app en Compose: el doble de trabajo para una sola persona) y la reutilización de tipos con la API. **Descartado** para el MVP; Skia da el mismo resultado visual en las dos plataformas.

## 10. Desarrollo (decidido: Atlas + Render, sin Docker)

- **Base de datos de desarrollo:** Atlas M0 en la UE (base `tandems_dev`); staging usa otra base (`tandems_staging`) en el mismo clúster hasta que haya M10 de producción. En desarrollo la lista de IPs de Atlas incluye la IP del equipo.
- **Redis de desarrollo:** el Key Value de staging en Render, con acceso externo limitado a la IP del equipo y prefijo de claves `dev:` para no mezclar colas.
- **Tests:** `mongodb-memory-server` en modo réplica (transacciones y change streams sin Docker). Los procesadores de BullMQ se prueban con `redis-memory-server`; si no compila en este equipo, contra el Key Value con prefijo `test:`.
- `pnpm dev`: lanza API (watch), worker y Metro en segundo plano con logs en `.logs/` y PIDs en `.pids/`; `pnpm stop` los para.
- **Dominio:** el de Render (`tandems-api.onrender.com`, `tandems-web.onrender.com`). Limitaciones en doc 04 §A.
