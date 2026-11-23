# Progreso

Canvas del prototipo: https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f (versión leída el 2026-11-23, actualizado por diseño el 18/11/2026).
Páginas del canvas: **UI kit** (Mini UI kit, CTA, Notificaciones, HoyKit) · **Key-visuals** (Apoyo D, Mis tareas, vacío, Nueva tarea) · **Prototipo con look and feel** (112 pantallas, abajo) · **Marca · Tandems** (Logo A1 · Rotunda, nombre). No existe una página «Tests happy path»: los happy paths E2E se sacan de los flujos del prototipo.

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
| [Onboarding1KV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-Onboarding1KV) | Onboarding 1 de 4 · LF | 1 | pendiente |
| [Onboarding2KV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-Onboarding2KV) | Onboarding 2 de 4 · LF | 1 | pendiente |
| [Onboarding3KV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-Onboarding3KV) | Onboarding 3 de 4 · LF | 1 | pendiente |
| [Onboarding4KV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-Onboarding4KV) | Onboarding 4 de 4 · LF | 1 | pendiente |

### Acceso

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [LoginKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-LoginKV) | Iniciar sesión · LF | 1 | pendiente |
| [RegistroKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RegistroKV) | Crear cuenta · LF | 1 | pendiente |
| [RecuperarPassKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RecuperarPassKV) | Recuperar contraseña · LF | 1 | pendiente |
| [RecuperarEnviadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RecuperarEnviadoKV) | Revisa tu email · LF | 1 | pendiente |
| [NuevaPassKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-NuevaPassKV) | Crear contraseña nueva · LF | 1 | pendiente |
| [InvitacionAppKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-InvitacionAppKV) | Invitación a la app · LF | 2 | pendiente |
| [RegistroInvitadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RegistroInvitadoKV) | Crear cuenta con invitación · LF | 2 | pendiente |
| [PermisoNotificacionesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PermisoNotificacionesKV) | Activar notificaciones · nuevo | 5 | pendiente |
| [BienvenidaInvitadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-BienvenidaInvitadoKV) | Bienvenida persona invitada · nuevo | 2 | pendiente |

### Acceso · errores

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [ErrLoginKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrLoginKV) | Iniciar sesión: datos incorrectos · LF | 1 | pendiente |
| [ErrRegistroKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrRegistroKV) | Crear cuenta: errores · LF | 1 | pendiente |

### Hoy y Mis tareas

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [HoyKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-HoyKV) | Hoy · LF | 3 | pendiente |
| [TareasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasKV) | Mis tareas · LF | 2 | pendiente |
| [TareasVacioKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasVacioKV) | Mis tareas (vacío) · LF | 2 | pendiente |
| [CrearTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CrearTareaKV) | Nueva tarea · LF | 2 | pendiente |
| [TareaCreadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaCreadaKV) | Tarea creada · LF | 2 | pendiente |
| [LimiteTareasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-LimiteTareasKV) | Aviso de límite · LF | 2 | pendiente |
| [EditarTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EditarTareaKV) | Editar tarea · LF | 2 | pendiente |
| [BorrarTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-BorrarTareaKV) | Borrar tarea · LF | 2 | pendiente |
| [TareaBorradaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaBorradaKV) | Tarea borrada · LF | 2 | pendiente |
| [PedirApoyoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PedirApoyoKV) | Pedir apoyo · LF | 5 | pendiente |
| [TareaTerminadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaTerminadaKV) | Tarea terminada · LF | 2 | pendiente |
| [TareasTerminadasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasTerminadasKV) | Tareas terminadas · LF | 2 | pendiente |
| [TareasLimiteKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasLimiteKV) | Mis tareas (5 de 5) · LF | 2 | pendiente |
| [ApoyoPedidoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ApoyoPedidoKV) | Apoyo pedido · LF | 5 | pendiente |
| [ApoyoRecibidoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ApoyoRecibidoKV) | Apoyo recibido · LF | 5 | pendiente |
| [HurraRecibidoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-HurraRecibidoKV) | ¡Hurra! recibido · nuevo | 5 | pendiente |
| [CambiosGuardadosKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CambiosGuardadosKV) | Cambios guardados · nuevo | 2 | pendiente |
| [EditarGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EditarGymKV) | Editar tarea · gym · nuevo | 2 | pendiente |
| [BorrarGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-BorrarGymKV) | Borrar tarea · gym · nuevo | 2 | pendiente |
| [TareaBorradaGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaBorradaGymKV) | Tarea borrada · gym · nuevo | 2 | pendiente |
| [EditarPortfolioKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EditarPortfolioKV) | Editar tarea · acompañante pendiente · nuevo | 2 | pendiente |
| [BorrarPortfolioKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-BorrarPortfolioKV) | Borrar tarea · acompañante pendiente · nuevo | 2 | pendiente |
| [TareaBorradaPortKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaBorradaPortKV) | Tarea borrada · portfolio · nuevo | 2 | pendiente |
| [PedirApoyoGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PedirApoyoGymKV) | Pedir apoyo · Juan · nuevo | 5 | pendiente |
| [ApoyoPedidoGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ApoyoPedidoGymKV) | Apoyo pedido · Juan · nuevo | 5 | pendiente |
| [ApoyoRecibidoGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ApoyoRecibidoGymKV) | Apoyo recibido · Juan · nuevo | 5 | pendiente |
| [TareaTerminadaGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaTerminadaGymKV) | Tarea terminada · Juan · nuevo | 2 | pendiente |
| [TareasTerminadasGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasTerminadasGymKV) | Terminadas · tras el gym · nuevo | 2 | pendiente |
| [TareaTerminadaSoloKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaTerminadaSoloKV) | Tarea terminada · sin acompañante · nuevo | 2 | pendiente |
| [TareasTerminadasSoloKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasTerminadasSoloKV) | Terminadas · tras el portfolio · nuevo | 2 | pendiente |
| [TareasTerminadasAntesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareasTerminadasAntesKV) | Terminadas · antes de hoy · nuevo | 2 | pendiente |

### Hoy y Mis tareas · vacíos y variantes

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [VacioHoyKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioHoyKV) | Hoy (vacío, sin contactos) · LF | 3 | pendiente |
| [VacioHoyContactosKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioHoyContactosKV) | Hoy (vacío, con contactos) · LF | 3 | pendiente |
| [ErrCrearTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrCrearTareaKV) | Crear tarea: campos sin rellenar · LF | 2 | pendiente |
| [TareaRechazadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaRechazadaKV) | Acompañante no acepta la tarea · LF | 2 | pendiente |
| [CambiarAcompananteKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CambiarAcompananteKV) | Cambiar acompañante · LF | 2 | pendiente |
| [VacioTerminadasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioTerminadasKV) | Tareas terminadas (vacío) · LF | 2 | pendiente |
| [CambiarAcompGymKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CambiarAcompGymKV) | Cambiar acompañante (gym) · nuevo | 2 | pendiente |
| [AcompananteCambiadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompananteCambiadoKV) | Acompañante cambiado · nuevo | 2 | pendiente |
| [AcompGymCambiadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompGymCambiadoKV) | Acompañante cambiado · gym · nuevo | 2 | pendiente |
| [CrearPrimeraTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CrearPrimeraTareaKV) | Primera tarea · sin contactos · nuevo | 2 | pendiente |
| [InvitarDesdeTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-InvitarDesdeTareaKV) | Primera tarea · invitar · nuevo | 2 | pendiente |
| [PrimeraTareaListaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PrimeraTareaListaKV) | Primera tarea · lista · nuevo | 2 | pendiente |
| [PrimeraTareaCreadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PrimeraTareaCreadaKV) | Primera tarea · creada · nuevo | 2 | pendiente |

### Acompaño

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [AcompanamientoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompanamientoKV) | Acompaño · LF | 2 | pendiente |
| [AcompTareasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompTareasKV) | Tareas que acompaño · LF | 2 | pendiente |
| [AcompTerminadasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AcompTerminadasKV) | Terminadas (acompaño) · LF | 2 | pendiente |
| [RechazarTareaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RechazarTareaKV) | Rechazar tarea compartida · LF | 2 | pendiente |
| [DejarAcompanarKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DejarAcompanarKV) | Dejar de acompañar · LF | 2 | pendiente |
| [TareaAbandonadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaAbandonadaKV) | Acompañante deja la tarea · LF | 2 | pendiente |
| [TareaAceptadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaAceptadaKV) | Tarea compartida aceptada · nuevo | 2 | pendiente |
| [DejasteAcompanarKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DejasteAcompanarKV) | Ya no acompañas · nuevo | 2 | pendiente |
| [TareaCompRechazadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-TareaCompRechazadaKV) | Tarea compartida rechazada · nuevo | 2 | pendiente |

### Acompaño · vacíos

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [VacioAcompanamientoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioAcompanamientoKV) | Acompaño (vacío) · LF | 2 | pendiente |
| [VacioAcompTareasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioAcompTareasKV) | Tareas que acompaño (vacío) · LF | 2 | pendiente |
| [VacioAcompTerminadasKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioAcompTerminadasKV) | Terminadas, acompaño (vacío) · LF | 2 | pendiente |

### Sesiones

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [SesionesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionesKV) | Mis sesiones · LF | 4 | pendiente |
| [ProgramarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ProgramarSesionKV) | Programar sesión · LF | 4 | pendiente |
| [SesionEnviadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionEnviadaKV) | Invitación enviada · LF | 4 | pendiente |
| [ConfirmarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ConfirmarSesionKV) | Confirmar sesión · LF | 4 | pendiente |
| [SesionAceptadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionAceptadaKV) | Sesión aceptada · LF | 4 | pendiente |
| [ReprogramarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ReprogramarSesionKV) | Reprogramar sesión · LF | 4 | pendiente |
| [SesionReprogramadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionReprogramadaKV) | Reprogramada · LF | 4 | pendiente |
| [SesionActivaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionActivaKV) | Unirse a la sesión · LF | 4 | pendiente |
| [RechazarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-RechazarSesionKV) | Rechazar invitación · LF | 4 | pendiente |
| [CancelarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CancelarSesionKV) | Cancelar sesión · LF | 4 | pendiente |
| [SesionPorEmpezarKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionPorEmpezarKV) | Recordatorio de sesión · nuevo | 4 | pendiente |
| [ProponerHoraKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ProponerHoraKV) | Proponer otra hora · nuevo | 4 | pendiente |
| [HoraPropuestaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-HoraPropuestaKV) | Hora propuesta · nuevo | 4 | pendiente |
| [SesionCanceladaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionCanceladaKV) | Sesión cancelada · nuevo | 4 | pendiente |
| [InvitacionRechazadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-InvitacionRechazadaKV) | Invitación rechazada · nuevo | 4 | pendiente |

### Sesiones · vacíos y errores

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [VacioSesionesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioSesionesKV) | Mis sesiones (vacío) · LF | 4 | pendiente |
| [ErrProgramarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrProgramarSesionKV) | Programar sesión: hora pasada · LF | 4 | pendiente |
| [SesionRechazadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-SesionRechazadaKV) | Invitación a sesión rechazada · LF | 4 | pendiente |

### Perfil, contactos y configuración

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [PerfilKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-PerfilKV) | Mi perfil · LF | 2 | pendiente |
| [NotificacionesKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-NotificacionesKV) | Configurar notificaciones · LF | 5 | pendiente |
| [ContactosKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ContactosKV) | Mis contactos · LF | 2 | pendiente |
| [AnadirContactoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-AnadirContactoKV) | Añadir contacto · LF | 2 | pendiente |
| [DetalleContactoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DetalleContactoKV) | Detalle de contacto · LF | 2 | pendiente |
| [EliminarContactoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EliminarContactoKV) | Eliminar contacto · LF | 2 | pendiente |
| [EditarPerfilKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EditarPerfilKV) | Editar perfil · LF | 2 | pendiente |
| [EliminarCuentaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EliminarCuentaKV) | Eliminar cuenta · LF | 2 | pendiente |
| [DetalleContactoPendienteKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DetalleContactoPendienteKV) | Contacto pendiente · nuevo | 2 | pendiente |
| [DetalleJuanKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-DetalleJuanKV) | Detalle de contacto: Juan · nuevo | 2 | pendiente |
| [CerrarSesionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CerrarSesionKV) | Cerrar sesión · nuevo | 2 | pendiente |
| [EliminarJuanKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-EliminarJuanKV) | Eliminar contacto: Juan · nuevo | 2 | pendiente |
| [CancelarInvitacionKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CancelarInvitacionKV) | Cancelar invitación · nuevo | 2 | pendiente |
| [ContactoEliminadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ContactoEliminadoKV) | Contacto eliminado · nuevo | 2 | pendiente |
| [ContactoEliminadoJuanKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ContactoEliminadoJuanKV) | Contacto eliminado · Juan · nuevo | 2 | pendiente |
| [InvitacionCanceladaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-InvitacionCanceladaKV) | Invitación cancelada · nuevo | 2 | pendiente |
| [ContactoInvitadoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ContactoInvitadoKV) | Contacto invitado · nuevo | 2 | pendiente |
| [CuentaEliminadaKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-CuentaEliminadaKV) | Cuenta eliminada · nuevo | 2 | pendiente |

### Contactos · vacíos y errores

| Pantalla | Título en el canvas | Fase | Estado |
|---|---|---|---|
| [VacioContactosKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-VacioContactosKV) | Mis contactos (vacío) · LF | 2 | pendiente |
| [ErrAnadirContactoKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrAnadirContactoKV) | Añadir contacto: email no válido · LF | 2 | pendiente |
| [ErrContactoExisteKV](https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f#artboard-ErrContactoExisteKV) | Añadir contacto: ya es contacto · LF | 2 | pendiente |

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
| 2026-11-23 | Decisiones abiertas delegadas: se aplican las propuestas de docs/04 §B (con ajustes tras leer el canvas). |
