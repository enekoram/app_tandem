# Progreso

Canvas del prototipo: https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f (versión leída el 2026-11-23, actualizado por diseño el 18/11/2026).
Se usan **solo dos páginas** del canvas (decisión del 2026-11-23): «Prototipo con look and feel» para las pantallas (112, abajo) y «UI kit» para componentes y tokens (ver `docs/06-ui-kit.md`). El resto de páginas se ignoran.

Estados: `pendiente` · `hecha` · `revisada`

## Notas del canvas que afectan a la implementación
- Datos de ejemplo: son las 9:15; «Hacer la renta» (sesión 9:30) por empezar, «Estudiar inglés» en curso; contactos Marta (lila), Juan (salvia), Lucía (ocre, pendiente).
- Círculo discontinuo gris = aún no ha aceptado. Filo lateral = color de la persona. Rojo teja solo para destructivo y errores.
- **«La animación está mal, tiene que estar igual que el onboarding»** en ApoyoRecibido y ApoyoRecibidoGym → la animación de referencia de la forma es la del onboarding.
- Supuestos por validar: (1) si el acompañante no acepta, la tarea queda «Pendiente: elige a otra persona»; (2) si rechaza una sesión, se puede proponer otra hora o elegir otra persona, y eso cambia también el acompañante de la tarea. **Se implementan así.**
- Por definir en el canvas: sin conexión (qué se ve / qué se guarda), refuerzo al terminar, método de invitación → resueltos en docs/04.

## Pantallas del prototipo

### Onboarding

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [Onboarding1KV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-Onboarding1KV) | Onboarding 1 de 4 · LF | 1 | hecha |
| [Onboarding2KV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-Onboarding2KV) | Onboarding 2 de 4 · LF | 1 | hecha |
| [Onboarding3KV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-Onboarding3KV) | Onboarding 3 de 4 · LF | 1 | hecha |
| [Onboarding4KV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-Onboarding4KV) | Onboarding 4 de 4 · LF | 1 | hecha |

### Acceso

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [LoginKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-LoginKV) | Iniciar sesión · LF | 1 | hecha |
| [RegistroKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RegistroKV) | Crear cuenta · LF | 1 | hecha |
| [RecuperarPassKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RecuperarPassKV) | Recuperar contraseña · LF | 1 | hecha |
| [RecuperarEnviadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RecuperarEnviadoKV) | Revisa tu email · LF | 1 | hecha |
| [NuevaPassKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-NuevaPassKV) | Crear contraseña nueva · LF | 1 | hecha |
| [InvitacionAppKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-InvitacionAppKV) | Invitación a la app · LF | 2 | hecha |
| [RegistroInvitadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RegistroInvitadoKV) | Crear cuenta con invitación · LF | 2 | hecha |
| [PermisoNotificacionesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PermisoNotificacionesKV) | Activar notificaciones · nuevo | 5 | pendiente |
| [BienvenidaInvitadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-BienvenidaInvitadoKV) | Bienvenida persona invitada · nuevo | 2 | hecha |

### Acceso · errores

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [ErrLoginKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrLoginKV) | Iniciar sesión: datos incorrectos · LF | 1 | hecha |
| [ErrRegistroKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrRegistroKV) | Crear cuenta: errores · LF | 1 | hecha |

### Hoy y Mis tareas

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [HoyKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-HoyKV) | Hoy · LF | 3 | hecha |
| [TareasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasKV) | Mis tareas · LF | 2 | hecha |
| [TareasVacioKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasVacioKV) | Mis tareas (vacío) · LF | 2 | hecha |
| [CrearTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CrearTareaKV) | Nueva tarea · LF | 2 | hecha |
| [TareaCreadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaCreadaKV) | Tarea creada · LF | 2 | hecha |
| [LimiteTareasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-LimiteTareasKV) | Aviso de límite · LF | 2 | hecha |
| [EditarTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EditarTareaKV) | Editar tarea · LF | 2 | hecha |
| [BorrarTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-BorrarTareaKV) | Borrar tarea · LF | 2 | hecha |
| [TareaBorradaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaBorradaKV) | Tarea borrada · LF | 2 | hecha |
| [PedirApoyoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PedirApoyoKV) | Pedir apoyo · LF | 5 | pendiente |
| [TareaTerminadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaTerminadaKV) | Tarea terminada · LF | 2 | hecha |
| [TareasTerminadasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasTerminadasKV) | Tareas terminadas · LF | 2 | hecha |
| [TareasLimiteKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasLimiteKV) | Mis tareas (5 de 5) · LF | 2 | hecha |
| [ApoyoPedidoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ApoyoPedidoKV) | Apoyo pedido · LF | 5 | pendiente |
| [ApoyoRecibidoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ApoyoRecibidoKV) | Apoyo recibido · LF | 5 | pendiente |
| [HurraRecibidoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-HurraRecibidoKV) | ¡Hurra! recibido · nuevo | 5 | pendiente |
| [CambiosGuardadosKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CambiosGuardadosKV) | Cambios guardados · nuevo | 2 | hecha |
| [EditarGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EditarGymKV) | Editar tarea · gym · nuevo | 2 | hecha |
| [BorrarGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-BorrarGymKV) | Borrar tarea · gym · nuevo | 2 | hecha |
| [TareaBorradaGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaBorradaGymKV) | Tarea borrada · gym · nuevo | 2 | hecha |
| [EditarPortfolioKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EditarPortfolioKV) | Editar tarea · acompañante pendiente · nuevo | 2 | hecha |
| [BorrarPortfolioKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-BorrarPortfolioKV) | Borrar tarea · acompañante pendiente · nuevo | 2 | hecha |
| [TareaBorradaPortKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaBorradaPortKV) | Tarea borrada · portfolio · nuevo | 2 | hecha |
| [PedirApoyoGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PedirApoyoGymKV) | Pedir apoyo · Juan · nuevo | 5 | pendiente |
| [ApoyoPedidoGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ApoyoPedidoGymKV) | Apoyo pedido · Juan · nuevo | 5 | pendiente |
| [ApoyoRecibidoGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ApoyoRecibidoGymKV) | Apoyo recibido · Juan · nuevo | 5 | pendiente |
| [TareaTerminadaGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaTerminadaGymKV) | Tarea terminada · Juan · nuevo | 2 | hecha |
| [TareasTerminadasGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasTerminadasGymKV) | Terminadas · tras el gym · nuevo | 2 | hecha |
| [TareaTerminadaSoloKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaTerminadaSoloKV) | Tarea terminada · sin acompañante · nuevo | 2 | hecha |
| [TareasTerminadasSoloKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasTerminadasSoloKV) | Terminadas · tras el portfolio · nuevo | 2 | hecha |
| [TareasTerminadasAntesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasTerminadasAntesKV) | Terminadas · antes de hoy · nuevo | 2 | hecha |

### Hoy y Mis tareas · vacíos y variantes

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [VacioHoyKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioHoyKV) | Hoy (vacío, sin contactos) · LF | 3 | hecha |
| [VacioHoyContactosKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioHoyContactosKV) | Hoy (vacío, con contactos) · LF | 3 | hecha |
| [ErrCrearTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrCrearTareaKV) | Crear tarea: campos sin rellenar · LF | 2 | hecha |
| [TareaRechazadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaRechazadaKV) | Acompañante no acepta la tarea · LF | 2 | hecha |
| [CambiarAcompananteKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CambiarAcompananteKV) | Cambiar acompañante · LF | 2 | hecha |
| [VacioTerminadasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioTerminadasKV) | Tareas terminadas (vacío) · LF | 2 | hecha |
| [CambiarAcompGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CambiarAcompGymKV) | Cambiar acompañante (gym) · nuevo | 2 | hecha |
| [AcompananteCambiadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompananteCambiadoKV) | Acompañante cambiado · nuevo | 2 | hecha |
| [AcompGymCambiadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompGymCambiadoKV) | Acompañante cambiado · gym · nuevo | 2 | hecha |
| [CrearPrimeraTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CrearPrimeraTareaKV) | Primera tarea · sin contactos · nuevo | 2 | hecha |
| [InvitarDesdeTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-InvitarDesdeTareaKV) | Primera tarea · invitar · nuevo | 2 | hecha |
| [PrimeraTareaListaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PrimeraTareaListaKV) | Primera tarea · lista · nuevo | 2 | hecha |
| [PrimeraTareaCreadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PrimeraTareaCreadaKV) | Primera tarea · creada · nuevo | 2 | hecha |

### Acompaño

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [AcompanamientoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompanamientoKV) | Acompaño · LF | 2 | hecha |
| [AcompTareasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompTareasKV) | Tareas que acompaño · LF | 2 | hecha |
| [AcompTerminadasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompTerminadasKV) | Terminadas (acompaño) · LF | 2 | hecha |
| [RechazarTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RechazarTareaKV) | Rechazar tarea compartida · LF | 2 | hecha |
| [DejarAcompanarKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DejarAcompanarKV) | Dejar de acompañar · LF | 2 | hecha |
| [TareaAbandonadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaAbandonadaKV) | Acompañante deja la tarea · LF | 2 | hecha |
| [TareaAceptadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaAceptadaKV) | Tarea compartida aceptada · nuevo | 2 | hecha |
| [DejasteAcompanarKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DejasteAcompanarKV) | Ya no acompañas · nuevo | 2 | hecha |
| [TareaCompRechazadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaCompRechazadaKV) | Tarea compartida rechazada · nuevo | 2 | hecha |

### Acompaño · vacíos

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [VacioAcompanamientoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioAcompanamientoKV) | Acompaño (vacío) · LF | 2 | hecha |
| [VacioAcompTareasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioAcompTareasKV) | Tareas que acompaño (vacío) · LF | 2 | hecha |
| [VacioAcompTerminadasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioAcompTerminadasKV) | Terminadas, acompaño (vacío) · LF | 2 | hecha |

### Sesiones

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [SesionesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionesKV) | Mis sesiones · LF | 4 | hecha |
| [ProgramarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ProgramarSesionKV) | Programar sesión · LF | 4 | hecha |
| [SesionEnviadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionEnviadaKV) | Invitación enviada · LF | 4 | hecha |
| [ConfirmarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ConfirmarSesionKV) | Confirmar sesión · LF | 4 | hecha |
| [SesionAceptadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionAceptadaKV) | Sesión aceptada · LF | 4 | hecha |
| [ReprogramarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ReprogramarSesionKV) | Reprogramar sesión · LF | 4 | hecha |
| [SesionReprogramadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionReprogramadaKV) | Reprogramada · LF | 4 | hecha |
| [SesionActivaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionActivaKV) | Unirse a la sesión · LF | 4 | hecha |
| [RechazarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RechazarSesionKV) | Rechazar invitación · LF | 4 | hecha |
| [CancelarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CancelarSesionKV) | Cancelar sesión · LF | 4 | hecha |
| [SesionPorEmpezarKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionPorEmpezarKV) | Recordatorio de sesión · nuevo | 4 | hecha |
| [ProponerHoraKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ProponerHoraKV) | Proponer otra hora · nuevo | 4 | hecha |
| [HoraPropuestaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-HoraPropuestaKV) | Hora propuesta · nuevo | 4 | hecha |
| [SesionCanceladaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionCanceladaKV) | Sesión cancelada · nuevo | 4 | hecha |
| [InvitacionRechazadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-InvitacionRechazadaKV) | Invitación rechazada · nuevo | 4 | hecha |

### Sesiones · vacíos y errores

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [VacioSesionesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioSesionesKV) | Mis sesiones (vacío) · LF | 4 | hecha |
| [ErrProgramarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrProgramarSesionKV) | Programar sesión: hora pasada · LF | 4 | hecha |
| [SesionRechazadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionRechazadaKV) | Invitación a sesión rechazada · LF | 4 | hecha |

### Perfil, contactos y configuración

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [PerfilKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PerfilKV) | Mi perfil · LF | 2 | hecha |
| [NotificacionesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-NotificacionesKV) | Configurar notificaciones · LF | 5 | pendiente |
| [ContactosKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ContactosKV) | Mis contactos · LF | 2 | hecha |
| [AnadirContactoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AnadirContactoKV) | Añadir contacto · LF | 2 | hecha |
| [DetalleContactoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DetalleContactoKV) | Detalle de contacto · LF | 2 | hecha |
| [EliminarContactoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EliminarContactoKV) | Eliminar contacto · LF | 2 | hecha |
| [EditarPerfilKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EditarPerfilKV) | Editar perfil · LF | 2 | hecha |
| [EliminarCuentaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EliminarCuentaKV) | Eliminar cuenta · LF | 2 | hecha |
| [DetalleContactoPendienteKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DetalleContactoPendienteKV) | Contacto pendiente · nuevo | 2 | hecha |
| [DetalleJuanKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DetalleJuanKV) | Detalle de contacto: Juan · nuevo | 2 | hecha |
| [CerrarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CerrarSesionKV) | Cerrar sesión · nuevo | 2 | hecha |
| [EliminarJuanKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EliminarJuanKV) | Eliminar contacto: Juan · nuevo | 2 | hecha |
| [CancelarInvitacionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CancelarInvitacionKV) | Cancelar invitación · nuevo | 2 | hecha |
| [ContactoEliminadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ContactoEliminadoKV) | Contacto eliminado · nuevo | 2 | hecha |
| [ContactoEliminadoJuanKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ContactoEliminadoJuanKV) | Contacto eliminado · Juan · nuevo | 2 | hecha |
| [InvitacionCanceladaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-InvitacionCanceladaKV) | Invitación cancelada · nuevo | 2 | hecha |
| [ContactoInvitadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ContactoInvitadoKV) | Contacto invitado · nuevo | 2 | hecha |
| [CuentaEliminadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CuentaEliminadaKV) | Cuenta eliminada · nuevo | 2 | hecha |

### Contactos · vacíos y errores

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [VacioContactosKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioContactosKV) | Mis contactos (vacío) · LF | 2 | hecha |
| [ErrAnadirContactoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrAnadirContactoKV) | Añadir contacto: email no válido · LF | 2 | hecha |
| [ErrContactoExisteKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrContactoExisteKV) | Añadir contacto: ya es contacto · LF | 2 | hecha |

### Generales: errores y estados

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [SinConexionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SinConexionKV) | Sin conexión · LF | 6 | pendiente |
| [ErrGuardarKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrGuardarKV) | Error al guardar · LF | 6 | pendiente |

## Decisiones

| Fecha | Decisión |
|---|---|
| 2026-11-23 | Desarrollo contra MongoDB Atlas y API en Render (sin Docker local). |
| 2026-11-23 | Dominio: el de Render (`*.onrender.com`) por ahora. Consecuencias en docs/04 §A. |
| 2026-11-23 | Repositorio remoto: github.com/enekoram/app_tandem. |
| 2026-11-23 | Canvas: pantallas solo de «Prototipo con look and feel»; componentes de «UI kit»; resto de páginas ignoradas. |
| 2026-11-23 | Soluciones a las dudas del canvas aprobadas (docs/04). |
| 2026-11-23 | Email transaccional: **Resend** (plan gratuito, región UE) sobre un subdominio de un dominio existente en OVHcloud. La web y el correo del dominio principal no se tocan. Proyecto académico: se priorizan planes gratuitos. |
| 2026-11-23 | Decisiones abiertas delegadas: se aplican las propuestas de docs/04 §B (con ajustes tras leer el canvas). |
| 2026-11-24 | Paleta de 8 personas aprobada (docs/06). Nombres escritos en el tono `text` de cada persona (≥ 4,5:1), no en el base del kit. |
| 2026-11-24 | Pruebas en iPhone con **Expo Go** (sin Apple Developer por ahora); el development build con EAS queda aplazado. |
| 2026-11-24 | Acceso (fase 1), diferencias con el canvas: «Abrir el enlace del email» → **«Abrir el email»** (abre Mail; no aparece en Android); casilla de condiciones **sin enlaces** hasta tener los textos legales (fase 7); requisitos de contraseña = «Mínimo 8 caracteres.»; sin selector de idioma. |
| 2026-11-24 | Recuperar contraseña: el email lleva un enlace a la API que redirige a la app (`tandems://reset-password`); solo se aceptan redirecciones a la app. «Guardar y entrar» entra directamente si el móvil recuerda el email; si no, lleva a Iniciar sesión. |
| 2026-11-24 | Fase 1 aprobada y fusionada en `main`. «Recuperar contraseña» queda para pulir; para probar hay 5 cuentas en desarrollo (`seed:users`). |
| 2026-11-25 | Editar perfil: **foto aplazada** hasta tener almacenamiento (círculo con la inicial); **email de solo lectura** hasta que haya verificación de email; «Cambiar contraseña» = hoja con contraseña actual + nueva (no está en el canvas; cierra las demás sesiones). Sin selector de idioma ni Notificaciones en Perfil (fase 5). |
| 2026-11-25 | Eliminar cuenta: borrado **inmediato** (aún no hay cola `purge`): perfil, tareas, contactos e invitaciones, y la cuenta de Better Auth. Los contactos de otras personas se cancelan y sus tareas conmigo quedan «se fue». El email queda libre. |
| 2026-11-25 | Persona invitada: «Crear cuenta y aceptar» lleva a RegistroInvitado (nombre rellenado con el que puso quien invita, email de la invitación de solo lectura); al entrar la invitación se acepta sola y se abre Acompaño con «Ya formas parte de la red de apoyo de…» (BienvenidaInvitado). Sin onboarding aparte para la persona invitada. |
| 2026-11-25 | Deep links (AASA/assetlinks, Install Referrer) y E2E con Maestro **aplazados** hasta tener development build con EAS. La fase 2 queda lista para probar en el iPhone y dar el visto bueno. |
| 2026-11-25 | Fase 2 aprobada y fusionada en `main` sin probar en el iPhone. Probar desde un navegador (Expo web) se descarta: la app no tiene soporte web (SecureStore, Skia, cookies entre orígenes) y no se comportaría igual. |
| 2026-11-25 | Home viva: la forma unida usa la técnica goo del onboarding (desenfoque + umbral de alfa con máscara) en lugar de un shader SkSL: ya está probada en el iPhone y el canvas pide que sea «igual que el onboarding». `homeMachine`, `deriveBase`, `describeScene` y la geometría viven en `packages/shared/src/home` (no en la app) para probarlas con vitest. |
| 2026-11-25 | Tiempo real: Socket.IO solo websocket; los avisos no llevan contenido (la app vuelve a pedir `/me/home`). Presencia **en memoria** mientras haya una instancia (Render gratuito); Redis cuando haga falta. Sin resume token: al reconectar se refresca todo. |
| 2026-11-25 | Orden de tareas abiertas (API y Home): con fecha por cercanía y después sin fecha, la más reciente. |
| 2026-11-25 | Sesiones: una sola sesión viva por tarea; solo vale mientras la tarea siga abierta y con el mismo acompañante aceptado; «terminada» se decide al leer (hora de fin), sin worker. Enlace de Meet pegado a mano (opcional) o «Crear videollamada en Meet» (meet.google.com/new). Google OAuth, Calendar y recordatorios en cola, aplazados (Google sin verificar, sin Redis). |
| 2026-11-25 | Fase 4 empezada sobre `fase-3-home` sin fusionar la fase 3 (la fase 3 espera la prueba en el móvil). |
