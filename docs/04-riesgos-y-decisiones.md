# 04 · Riesgos y decisiones abiertas

> Estado: **decidido** el 2026-11-23 (la persona que encarga delegó las decisiones abiertas; se aplican las ★). Se puede revisar cualquier punto más adelante.

## A. Respuestas recibidas (2026-11-23)

| # | Qué | Respuesta y consecuencias |
|---|---|---|
| A1 | Canvas | Recibido (artifact de diseño, 4 páginas, 112 pantallas en el prototipo). Lista completa en `PROGRESO.md`. |
| A2 | Entorno de desarrollo | **Sin Docker local.** Base de datos de desarrollo en **Atlas M0** (UE) y API en **Render** (staging). Para desarrollo diario la API también corre en local (`pnpm dev`) contra Atlas. Redis: **Render Key Value** de staging (acepta conexiones externas con lista de IPs) para desarrollo; los tests usan `mongodb-memory-server` y un Redis de tests (ver doc 01 §10). |
| A3 | Dominio | **El de Render** (`*.onrender.com`) por ahora. Ver limitaciones abajo. |
| A4 | GitHub | `github.com/enekoram/app_tandem` |

### Limitaciones de usar el dominio de Render (sin dominio propio)

| Qué | ¿Funciona con `*.onrender.com`? | Plan |
|---|---|---|
| API y WebSocket con TLS | ✅ Sí | `tandems-api.onrender.com` |
| Universal Links / App Links | ✅ Sí (controlamos ese subdominio) | AASA y `assetlinks.json` en el Static Site `tandems-web.onrender.com/.well-known/` con `Content-Type: application/json` |
| Web de aterrizaje, política de privacidad, condiciones | ✅ Sí | Static Site |
| **Email transaccional** (invitaciones, recuperar contraseña) | ❌ No a destinatarios reales: Resend/Postmark exigen verificar un dominio propio (SPF/DKIM) | En desarrollo, el modo de pruebas de Resend envía solo a tu propio email. **Antes de la beta con usuarios hace falta un dominio** (~10–15 €/año); cambiarlo luego es solo DNS y variables de entorno. Mientras tanto, la invitación se comparte sobre todo con la **hoja de compartir** (WhatsApp, Telegram…), que no necesita email. |
| **Verificación de Google OAuth** (Calendar/Meet automático) | ❌ No: Google exige un dominio autorizado verificado en Search Console | Fase 4 arranca con **enlace de Meet pegado a mano**; el modo automático se activa cuando haya dominio. |
| Fichas de App Store / Play | ✅ Sí (URL de privacidad en onrender.com) | — |

**Resuelto (2026-11-23):** el email sale de un **subdominio** de un dominio que ya existe (DNS en OVHcloud), con **Resend** en su plan gratuito y región UE. Solo se añaden registros DKIM/SPF/MX/DMARC del subdominio; la web y el correo del dominio principal no se tocan. La app, la API y los Universal Links siguen en `*.onrender.com`.

## B. Decisiones abiertas del encargo (§13) — aplicadas

| # | Decisión | ★ Decisión tomada | Afecta a |
|---|---|---|---|
| 1 | Contraseña o solo proveedores + enlace mágico | ★ **Email + contraseña**, porque el canvas ya diseña ese flujo (Iniciar sesión, Crear cuenta, Recuperar contraseña, Crear contraseña nueva). Requisitos: **mínimo 8 caracteres, sin reglas de símbolos**, comprobación contra contraseñas filtradas (Have I Been Pwned por k-anonimato: solo se envían 5 caracteres del hash), botón para mostrar la contraseña. **Sign in with Apple y Google** se añaden en fase 2 (ayudan a la invitada a registrarse rápido). | Fases 1–2 |
| 2 | Minutos de aviso antes de una sesión | ★ **10 min** (push) y la home entra en SesionPorEmpezar a los 10 min. Configurable más adelante (5/10/15). | Fases 3–4 |
| 3 | Nombre de «¡hurra!» y responder con un gracias | ★ Mantener **«¡hurra!»** (se entiende sin explicación; «togedah!» no se lee bien con lector de pantalla en castellano). Sí a responder con **«Gracias»** de un toque, sin texto libre. | Fase 5 |
| 4 | Onboarding propio para la invitada | ★ **Sí, corto**: 2 pantallas (qué es acompañar + permiso de notificaciones) y BienvenidaInvitado con la tarea compartida. | Fase 2 |
| 5 | Meet por enlace o videollamada integrada | ★ **Meet (Opción A)** + SesionActiva en la app; enlace manual mientras Google verifica. LiveKit tras el MVP si las pruebas con usuarios lo piden. Ver doc 01 §7. | Fase 4 |
| 6 | Reciprocidad por defecto | ★ La **relación de contacto** es siempre mutua; **acompañar** no: cada tarea se acepta una a una. No se activa nada «por defecto» sin que la otra persona acepte. | Fase 2 |
| 7 | Ventana de deshacer y duración del apoyo | ★ Deshacer: **8 s**. Petición de apoyo: caduca a los **15 min** sin respuesta. Envío de apoyo en vivo: hasta que se suelta o **5 min** como máximo por envío. Vibración del corazón: háptica suave en cada latido solo en estímulo «completo». | Fases 2 y 5 |

### Otras dudas que plantea el canvas (decididas)

| Tema | Lo que muestra el canvas | ★ Decisión |
|---|---|---|
| Idioma | «Crear cuenta» tiene un selector de idioma (Català, Español, English) | El encargo dice **solo castellano**: el selector **no se implementa**. Los textos quedan en `strings/es.ts`, así que añadir idiomas después es posible. |
| Método de invitación (email, enlace o teléfono) | Por definir | **Email + enlace compartible** (hoja de compartir). Sin teléfono/SMS en el MVP. |
| Sin conexión | Por definir qué se ve y qué se guarda | Se ve la última copia en caché (TanStack Query persistido) en modo lectura, con el aviso SinConexion; **las acciones no se encolan** (crear, aceptar, pedir apoyo necesitan conexión) para evitar sorpresas con el límite y con el tiempo real. |
| Refuerzo positivo al terminar | Por definir | Pantalla TareaTerminada + ¡hurra! enviado automáticamente al acompañante (si lo hay), respetando el nivel de estímulo. |
| Animación de la forma en ApoyoRecibido | Nota: «está mal, tiene que estar igual que el onboarding» | La animación del onboarding es la referencia para la forma en todas las pantallas. |
| Rechazo de tarea o sesión | Supuestos por validar | Se implementan tal cual: la tarea queda «Pendiente: elige a otra persona»; al rechazar una sesión se puede proponer otra hora o elegir otra persona (lo que cambia también el acompañante de la tarea). |

## C. Cambios que propongo sobre el encargo

| Cambio | Motivo |
|---|---|
| Reanimated **4** en vez de 3 | Es la versión vigente para la New Architecture que usan los SDK actuales de Expo. |
| Estados de la tarea en **dos ejes** (`status` + `companion.status`) | Evita estados combinados ambiguos. Ver doc 02. |
| Límite de 5 con **contador condicional**, no solo transacción | Una transacción sola no evita el *write skew*. Ver doc 02. |
| **Better Auth** como autenticación | Datos en la UE, sin coste por usuario, enlace mágico/Apple/Google. Ver doc 01 §5. |
| Deferred deep link **propio** (asociación por email + Install Referrer) | Firebase Dynamic Links ha cerrado; Branch es caro. |
| Cifrado de tokens de Google **en la aplicación** (AES-256-GCM) en lugar de Queryable Encryption de Atlas | Queryable Encryption necesita una librería nativa (`crypt_shared`) en Render y complica el despliegue para un solo campo. |
| `apps/web` para la web de aterrizaje | El encargo la pide; la sirvo como Static Site en Render. |

## D. Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| **Verificación de Google** para `calendar.events` tarda semanas | Alta | Medio | Empezar en fase 1 (pantalla de consentimiento, política de privacidad, dominio verificado, vídeo de demostración). Enlace manual como plan B. |
| **Rendimiento de la forma unida** en Android de gama baja | Media | Alto | Shader SkSL (una sola pasada en GPU) en lugar de blur + matriz de color; medir en un Android modesto en fase 3; degradar a perfil «suave» si baja de 50 fps. |
| Sin Docker en el equipo | — | Medio | Decidido: Atlas M0 + Render Key Value para dev; mongodb-memory-server para tests (ver A2). |
| Sin dominio propio | Alta | Medio | Email a destinatarios reales y verificación de Google bloqueados hasta comprarlo (ver A3). |
| Revisión de App Store (cuentas, borrado, Sign in with Apple, declaración de datos) | Media | Medio | Borrado de cuenta en la app desde fase 2; fichas de privacidad preparadas en fase 6. |
| Push en iOS con `time-sensitive` requiere *entitlement* | Baja | Bajo | Activarlo en el perfil de aprovisionamiento con EAS; si no, prioridad normal. |
| Change streams y WebSocket con varias instancias | Media | Medio | Cada instancia emite solo a sus sockets locales; resume token en Redis; test con 2 instancias. |
| Datos sensibles en el contenido de tareas | — | Alto | Nada de contenido en logs, analítica ni push (las notificaciones dicen «Marta te pide apoyo», no el título de la tarea, salvo que la persona lo active). |
| Alcance: una sola persona y muchas pantallas | Alta | Alto | Fases cortas con entregables instalables; lo no esencial (cambiar color de contacto, Live Activity, exportación) al final de su fase o post-MVP. |
| Node 26 local frente a Node 24 en Render | Baja | Bajo | `.nvmrc` = 24; CI con 24. |

## E. Costes recurrentes estimados (orientativo, a confirmar)

Render (Web Service + Worker + Key Value + Static + Cron) en planes iniciales ~30–60 $/mes por entorno; Atlas M10 (réplica 3 nodos, UE) ~60 $/mes en producción (M0 gratis en dev/staging); Apple Developer 99 $/año; Google Play 25 $ una vez; Resend/Postmark plan gratuito al principio; dominio ~15–60 €/año; EAS gratis con cola o ~19 $/mes.
