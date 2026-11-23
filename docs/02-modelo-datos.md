# 02 · Modelo de datos

> Estado: **propuesta, pendiente de visto bueno** · 2026-11-23
> Convenciones: `_id` ObjectId; fechas en UTC (`Date`); nombres de campos en `snake_case` en Mongo y `camelCase` en la API. Cada colección tiene validador `$jsonSchema` generado desde los esquemas Zod de `packages/shared`.

## Cambios respecto a la propuesta del encargo (§5)

1. **Estado de la tarea y del acompañamiento separados.** En lugar de un único `estado` que mezcla «la tarea» y «la relación con el acompañante» (`pending_companion`, `rejected`, `abandoned`…), propongo dos ejes:
   - `tasks.status`: `open` · `done` · `deleted`
   - `tasks.companion.status`: `none` · `pending` · `accepted` · `rejected` · `left`

   Así «tarea abierta sin acompañante», «abierta, rechazada» o «abierta, el acompañante se fue» son combinaciones claras, y el límite de 5 es simplemente `status = open`. Las pantallas TareaAbandonada y CambiarAcompanante salen de `companion.status = left|rejected`.
2. **Contador de tareas abiertas en `users`.** Una transacción de MongoDB **no basta** para el límite de 5: dos transacciones que cuentan 4 a la vez e insertan documentos distintos no entran en conflicto (*write skew*). La garantía viene de un `$inc` condicional sobre un único documento (ver §Reglas).
3. **`companion.user_id` desnormalizado en la tarea** (solo el id, ningún dato personal) para poder indexar «tareas que acompaño» y autorizar en una sola consulta.
4. **Datos de autenticación** en las colecciones de Better Auth (`auth_user`, `auth_session`, `auth_account`, `auth_verification`), enlazadas 1:1 con `users`.

## Colecciones

### users
| Campo | Tipo | Notas |
|---|---|---|
| _id | ObjectId | |
| auth_user_id | string | único |
| display_name | string 1–40 | «¿Cómo quieres que te llamemos?» |
| email | string | único, normalizado a minúsculas |
| timezone | string IANA | p. ej. `Europe/Madrid` |
| photo_key | string? | clave en S3, nunca URL pública |
| prefs | `{ stimulus: 'full'\|'soft'\|'minimal', notifications: {<tipo>: bool}, quiet_hours?: {from:'22:00', to:'08:00'} }` | |
| open_task_count | int 0–5 | contador para el límite (ver reglas) |
| google | `{ connected: bool, refresh_token_enc?: Binary, scopes: [] }` | token cifrado AES-256-GCM en la app |
| created_at, deleted_at | Date | `deleted_at` → purga diferida |

### contacts  (relación dirigida: «X es contacto de owner»)
| Campo | Tipo | Notas |
|---|---|---|
| owner_id | ObjectId → users | |
| contact_user_id | ObjectId? | null mientras no tenga cuenta |
| invited_email | string | normalizado |
| status | `pending` · `accepted` · `cancelled` | |
| color_index | int 0–7 | paleta de personas; **único por owner entre contactos no cancelados** salvo agotamiento |
| initials | string | calculadas al aceptar (1–2 letras o emoji), recalculadas al cambiar nombres |
| created_at, accepted_at | Date | |

Al aceptar una invitación se crean (en transacción) **los dos lados** de la relación, cada uno con el color que le toca en su propia cuenta. Que la reciprocidad de *acompañar* sea automática o no es la decisión abierta nº 6; la relación de contacto sí es siempre bidireccional.

### invitations
| Campo | Tipo | Notas |
|---|---|---|
| inviter_id | ObjectId | |
| contact_id | ObjectId → contacts | el contacto `pending` que se crea al invitar |
| email | string | |
| token_hash | string | SHA-256 de un token aleatorio de 32 bytes (alta entropía → no hace falta bcrypt). **Índice único** |
| status | `sent` · `opened` · `accepted` · `expired` · `cancelled` | |
| expires_at | Date | +14 días |
| resend_count, last_sent_at | int, Date | máx. 3 reenvíos, 1 cada 10 min |
| task_id | ObjectId? | tarea compartida en la invitación |

### tasks
| Campo | Tipo | Notas |
|---|---|---|
| owner_id | ObjectId | |
| title | string 1–80 | |
| description | string? ≤ 500 | |
| due_at | Date? | fecha/hora opcionales |
| status | `open` · `done` · `deleted` | |
| companion | `{ contact_id, user_id?, status: none\|pending\|accepted\|rejected\|left, changed_at }` | |
| done_at, deleted_at | Date? | `deleted_at` → ventana de deshacer + purga |

### sessions
| Campo | Tipo | Notas |
|---|---|---|
| task_id | ObjectId | |
| owner_id, companion_user_id | ObjectId | desnormalizados para autorizar |
| scheduled_at | Date (UTC) | > ahora + 1 min al crear |
| duration_min | int | 15/25/45/60 |
| mode | `video` · `presence` | «ayuda sin videollamada» |
| status | `proposed` · `accepted` · `rejected` · `cancelled` · `live` · `ended` | `rescheduled` no es estado: es una nueva propuesta (`proposed` con `previous_scheduled_at`) |
| proposed_by | ObjectId | |
| counter_proposal | `{ scheduled_at, by }`? | «otra hora propuesta» |
| meet_url | string? | |
| calendar_event_id | string? | |
| joined | `[{ user_id, at }]` | primera entrada → `live` |

### support_events
| Campo | Tipo | Notas |
|---|---|---|
| from_user, to_user | ObjectId | |
| task_id | ObjectId? | |
| type | `request` · `sending` · `thinking_of_you` · `hurra` | |
| status | `open` · `accepted` · `declined` · `expired` · `ended` | solo para `request`/`sending` |
| started_at, ended_at, expires_at | Date | |

Los latidos de «te están enviando apoyo» **no** se guardan uno a uno: el inicio y el fin van a Mongo; la presencia continua va por Redis.

### notifications
Bandeja/registro: `user_id`, `type`, `payload` (solo ids), `dedupe_key` (único), `sent_at`, `read_at`, `push_ticket_id`. TTL 90 días.

### device_tokens
`user_id`, `expo_push_token` (único), `platform`, `last_seen_at`. Se borran al recibir `DeviceNotRegistered`.

## Índices

| Colección | Índice | Para |
|---|---|---|
| users | `{auth_user_id:1}` único, `{email:1}` único | |
| contacts | `{owner_id:1, status:1}`, `{owner_id:1, invited_email:1}` único parcial (status ≠ cancelled) | ErrContactoExiste |
| contacts | `{contact_user_id:1}` | borrar cuenta |
| invitations | `{token_hash:1}` único, `{email:1, status:1}`, TTL `expires_at` + 30 días | asociación por email al registrarse |
| tasks | `{owner_id:1, status:1}`, `{'companion.user_id':1, status:1}` | |
| sessions | `{task_id:1, scheduled_at:1}`, `{companion_user_id:1, scheduled_at:1}`, `{owner_id:1, scheduled_at:1}` | home y agenda |
| support_events | `{to_user:1, started_at:-1}`, TTL `started_at` 30 días | |
| notifications | `{dedupe_key:1}` único, TTL | idempotencia |

## Reglas de negocio (en el servidor)

**Límite de 5 tareas abiertas**
```js
// dentro de una transacción
users.updateOne({ _id: me, open_task_count: { $lt: 5 } }, { $inc: { open_task_count: 1 } })
// matchedCount === 0 → 409 TASK_LIMIT (pantalla LimiteTareas)
tasks.insertOne({...})
```
Terminar o borrar: `$inc: -1` en la misma transacción. Deshacer un borrado vuelve a pasar por el `$inc` condicional (si mientras tanto se llegó a 5, no se puede deshacer y se avisa). Test de concurrencia: 10 peticiones simultáneas con 4 abiertas → exactamente 1 éxito.

**Acompañante:** una tarea tiene como mucho un acompañante; asignarlo crea `companion.status = pending` y notifica. Solo se puede asignar un contacto `accepted` (o `pending` si la tarea viaja con la invitación).

**Dejar de acompañar / borrar contacto:** `companion.status = left`, la tarea sigue `open`, se notifica al dueño. Sesiones futuras de esa tarea → `cancelled` (y se borra el evento de calendario).

**Deshacer:** ventana de N s (decisión abierta 7, por defecto 8 s). Implementado como borrado lógico + trabajo `purge` retrasado; el cliente muestra el toast y llama a `POST /…/restore` si se pulsa.

**Eliminar cuenta (RGPD):** en transacción: marcar `users.deleted_at`, cancelar contactos en ambos sentidos, tareas propias → `deleted`, tareas que acompaño → `companion.status = left` (con aviso al dueño), sesiones futuras canceladas, revocar token de Google, borrar device_tokens. Después, trabajo `purge` que borra físicamente documentos, foto en S3 y cuentas de auth, y anonimiza `support_events` ajenos. Exportar datos: trabajo que genera un JSON y lo envía por email con enlace firmado.

## Autorización (resumen, con test por fila)

| Recurso | Puede leer | Puede escribir |
|---|---|---|
| Tarea | dueño; acompañante con `companion.status ∈ {pending, accepted}` | dueño (todo); acompañante (aceptar/rechazar/dejar, pedir sesión, enviar apoyo) |
| Sesión | dueño y acompañante de la tarea | ambos (proponer, aceptar, reprogramar, cancelar) |
| Contacto | solo su `owner_id` | solo su `owner_id` |
| Invitación | inviter; la invitada solo vía token o email verificado | inviter (reenviar, cancelar) |
| Support event | from/to | from crea; to responde |

Cada fila de esta tabla tendrá un test e2e «la persona C (ajena) recibe 404».
