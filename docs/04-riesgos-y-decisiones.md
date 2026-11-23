# 04 · Riesgos y decisiones abiertas

> Estado: **pendiente de tu respuesta** · 2026-11-23
> Para cada punto propongo una opción por defecto (**★**). Si no dices nada, se aplica esa.

## A. Lo que necesito de ti para empezar la fase 1

| # | Qué | Por qué |
|---|---|---|
| A1 | **Acceso al canvas del prototipo** (enlace de Figma o exportación de las páginas «Prototipo con look and feel», «Tests happy path», «Key-visuals», «Marca · Tandems») | Es la fuente de verdad visual; sin él no puedo completar la lista de pantallas de `PROGRESO.md` ni comparar capturas. Tengo acceso a Figma desde aquí: con el enlace basta. |
| A2 | **Herramientas locales**: en este equipo no hay Docker ni pnpm. ¿Puedes instalar software (¿tienes permisos de administrador?) | ★ Instalar pnpm (`npm i -g pnpm`) y **OrbStack o Docker Desktop**. Alternativa sin admin: Atlas M0 + Redis gratuito en la nube para desarrollo. |
| A3 | Nombre del dominio (¿`tandems.app`?) | Universal Links, email, API. Conviene comprarlo pronto. |
| A4 | Cuenta de GitHub para el repositorio remoto (privado) | CI y despliegue en Render. |

## B. Decisiones abiertas del encargo (§13)

| # | Decisión | ★ Propuesta por defecto | Afecta a |
|---|---|---|---|
| 1 | Contraseña o solo proveedores + enlace mágico | ★ **Sin contraseña**: enlace mágico + Apple + Google. Menos fricción (TDAH: olvidar contraseñas es fricción real), menos superficie de ataque. Si la añadimos: mínimo 10 caracteres, comprobación contra contraseñas filtradas, sin reglas de símbolos. | Fase 1 |
| 2 | Minutos de aviso antes de una sesión | ★ **10 min** (push) y la home entra en SesionPorEmpezar a los 10 min. Configurable más adelante (5/10/15). | Fases 3–4 |
| 3 | Nombre de «¡hurra!» y responder con un gracias | ★ Mantener **«¡hurra!»** (se entiende sin explicación; «togedah!» no se lee bien con lector de pantalla en castellano). Sí a responder con **«Gracias»** de un toque, sin texto libre. | Fase 5 |
| 4 | Onboarding propio para la invitada | ★ **Sí, corto**: 2 pantallas (qué es acompañar + permiso de notificaciones) y BienvenidaInvitado con la tarea compartida. | Fase 2 |
| 5 | Meet por enlace o videollamada integrada | ★ **Meet (Opción A)** + SesionActiva en la app; enlace manual mientras Google verifica. LiveKit tras el MVP si las pruebas con usuarios lo piden. Ver doc 01 §7. | Fase 4 |
| 6 | Reciprocidad por defecto | ★ La **relación de contacto** es siempre mutua; **acompañar** no: cada tarea se acepta una a una. No se activa nada «por defecto» sin que la otra persona acepte. | Fase 2 |
| 7 | Ventana de deshacer y duración del apoyo | ★ Deshacer: **8 s**. Petición de apoyo: caduca a los **15 min** sin respuesta. Envío de apoyo en vivo: hasta que se suelta o **5 min** como máximo por envío. | Fases 2 y 5 |

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
| Sin Docker / sin permisos de admin en el equipo | Media | Medio | mongodb-memory-server para tests; servicios en la nube para dev (ver A2). |
| Revisión de App Store (cuentas, borrado, Sign in with Apple, declaración de datos) | Media | Medio | Borrado de cuenta en la app desde fase 2; fichas de privacidad preparadas en fase 6. |
| Push en iOS con `time-sensitive` requiere *entitlement* | Baja | Bajo | Activarlo en el perfil de aprovisionamiento con EAS; si no, prioridad normal. |
| Change streams y WebSocket con varias instancias | Media | Medio | Cada instancia emite solo a sus sockets locales; resume token en Redis; test con 2 instancias. |
| Datos sensibles en el contenido de tareas | — | Alto | Nada de contenido en logs, analítica ni push (las notificaciones dicen «Marta te pide apoyo», no el título de la tarea, salvo que la persona lo active). |
| Alcance: una sola persona y muchas pantallas | Alta | Alto | Fases cortas con entregables instalables; lo no esencial (cambiar color de contacto, Live Activity, exportación) al final de su fase o post-MVP. |
| Node 26 local frente a Node 24 en Render | Baja | Bajo | `.nvmrc` = 24; CI con 24. |

## E. Costes recurrentes estimados (orientativo, a confirmar)

Render (Web Service + Worker + Key Value + Static + Cron) en planes iniciales ~30–60 $/mes por entorno; Atlas M10 (réplica 3 nodos, UE) ~60 $/mes en producción (M0 gratis en dev/staging); Apple Developer 99 $/año; Google Play 25 $ una vez; Resend/Postmark plan gratuito al principio; dominio ~15–60 €/año; EAS gratis con cola o ~19 $/mes.
