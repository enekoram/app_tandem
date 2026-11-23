# 03 · Máquina de estados de la home («Contigo *ahora*»)

> Estado: **propuesta, pendiente de visto bueno** · 2026-11-23 · Implementación: XState v5 en `apps/mobile/src/features/home/homeMachine.ts`

## Idea principal

La tabla del encargo mezcla dos cosas que **pueden ocurrir a la vez**: una situación de fondo (tengo una sesión en curso) y acontecimientos momentáneos (me están enviando apoyo, alguien pensó en mí). Por eso la máquina tiene **regiones paralelas**, y una función pura decide qué ve la persona.

```
home (parallel)
├── base            ← se deriva de la instantánea del servidor (GET /me/home)
│   ├── loading
│   ├── empty                  VacioHoy           forma sola, «Empieza aquí»
│   ├── contactsNoTasks        VacioHoyContactos  formas separadas en reposo
│   ├── nextTask               forma tú+acompañante unidas (o tú sola si no hay acompañante)
│   ├── sessionSoon            SesionPorEmpezar   pulso suave, CTA «Unirse a la sesión»
│   └── sessionLive            formas fusionadas, punto «En vivo»
├── incoming        ← eventos de otras personas que esperan respuesta
│   ├── idle
│   └── requested              «Te piden»: Aceptar · Rechazar · Elegir   (cola si hay varias)
├── support         ← apoyo que recibo en tiempo real
│   ├── idle
│   └── receiving              corazón latiendo dentro de la forma del acompañante
├── toasts          ← efímeros, se autodescartan
│   ├── idle
│   └── showing                «Juan pensó en ti» (cola FIFO, 4 s cada uno)
└── celebration
    ├── idle
    └── hurra                  ¡hurra! breve (sin confeti en estímulo mínimo)
```

## Región `base`: derivada, no acumulada

`base` no se «mueve» por eventos sueltos: cada vez que llega una instantánea o un evento que la cambia, se recalcula con una función pura y testeable:

```ts
deriveBase(snapshot, now): BaseState
  if (!snapshot.loaded)                                   → loading
  if (session.status === 'live')                          → sessionLive
  if (session próxima y scheduled_at - now ≤ SOON_WINDOW) → sessionSoon   // SOON_WINDOW = 10 min (decisión abierta 2)
  if (hay tarea abierta)                                  → nextTask (la de due_at más cercana; si no, la más reciente)
  if (contactos aceptados > 0)                            → contactsNoTasks
  else                                                    → empty
```

Un temporizador (`after`) reevalúa al cruzar el umbral de `SOON_WINDOW` y la hora de inicio. Esto evita estados imposibles y hace trivial la **reconciliación al volver a primer plano**: llega la instantánea, se recalcula y la forma anima hacia el nuevo estado.

## Eventos

| Evento | Origen | Efecto |
|---|---|---|
| `SNAPSHOT` | `GET /me/home` (arranque, reconexión, primer plano) | recalcula `base`; sincroniza `incoming` y `support` |
| `TASK_CHANGED`, `SESSION_CHANGED` | WebSocket | parche + recalcula `base` |
| `SUPPORT_REQUESTED` | WebSocket / push | `incoming → requested` (encola) |
| `REQUEST_RESOLVED` | acción local o WebSocket | saca de la cola; si vacía → `idle` |
| `SUPPORT_STARTED` / `SUPPORT_HEARTBEAT` / `SUPPORT_ENDED` | WebSocket (presencia) | `support → receiving`; sale si no hay latido en 6 s |
| `THOUGHT_OF_YOU` | WebSocket / push | encola toast |
| `HURRA` / `TASK_DONE` (local) | WebSocket / acción | `celebration → hurra` 2,5 s |
| `APP_BACKGROUND` / `APP_FOREGROUND` | AppState | pausa animaciones / pide `SNAPSHOT` |
| `STIMULUS_CHANGED`, `REDUCE_MOTION_CHANGED` | ajustes / sistema | cambia el perfil de movimiento |

## De estado a lo que se ve

Una segunda función pura, `describeScene(state, prefs)`, devuelve **la escena** que dibuja Skia y lo que lee VoiceOver:

```ts
type Scene = {
  people: Array<{ id: 'me' | ContactId; color; letter; italic: boolean }>;
  layout: 'alone' | 'apart' | 'joined' | 'fused';
  approach?: ContactId;        // la forma que «se acerca» (te piden)
  heart?: ContactId;           // corazón latiendo dentro de su forma
  pulse?: 'soft';              // sesión por empezar
  liveDot: boolean;
  cards: Card[];               // carrusel: «Te piden» primero, luego «Tu siguiente tarea»
  a11yLabel: string;           // «Tú y Marta, unidas. Marta te está enviando apoyo»
};
```

Prioridad visual cuando coinciden regiones: `celebration` > `support.receiving` (añade corazón) > `incoming.requested` (añade acercamiento y tarjeta primera) > `base`. Los toasts flotan encima y no alteran la escena.

## Animación interrumpible

- La escena se traduce a **valores objetivo** (posición, radio, mezcla de color de cada forma) guardados en `SharedValue`s de Reanimated. Al cambiar la escena se lanza `withSpring` **desde el valor actual**, nunca desde el inicio de la transición anterior: si llega apoyo a mitad de una fusión, la forma simplemente cambia de destino sin saltos.
- La forma se dibuja con un shader SkSL de metaballs que recibe esos valores como `uniforms` (hasta 4 centros); la letra se pinta encima con Skia `Text` (EB Garamond, cursiva para el acompañante).
- La «respiración» (±4 %, 6 s) es una oscilación que se **suma** al valor objetivo, no un estado.

## Perfiles de movimiento

| | Completo | Suave | Mínimo / Reducir movimiento |
|---|---|---|---|
| Respiración | sí | amplitud ×0,5 | no |
| Fusión / separación | muelle | muelle amortiguado | fundido de opacidad 200 ms |
| Latido | escala 1→1,12 | 1→1,05 | opacidad 0,7↔1 |
| ¡hurra! | estallido de formas | brillo breve | texto + háptica (sin confeti) |
| Hápticos | sí | sí | solo en acciones del usuario |

Reducir movimiento del sistema fuerza el perfil mínimo aunque la persona haya elegido otro.

## Carrusel

- Lista horizontal con paginación (`FlatList pagingEnabled` + indicador de puntos).
- Accesibilidad: el carrusel es un `adjustable` para VoiceOver (deslizar arriba/abajo cambia de tarjeta) y tiene botones «Anterior»/«Siguiente» visibles al usar teclado o lector de pantalla.

## Tests

- `deriveBase` y `describeScene`: tablas de casos (unitarios).
- Máquina: test de modelo con `@xstate/graph` (todas las rutas desde `loading`) + caso «llega `SUPPORT_STARTED` durante la transición `nextTask → sessionLive`».
- Visual: captura de cada escena del canvas (VacioHoy, VacioHoyContactos, siguiente tarea, SesionPorEmpezar, en vivo, te piden, recibiendo apoyo, ¡hurra!) comparada con el diseño.
