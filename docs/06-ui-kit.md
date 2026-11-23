# 06 · UI kit → librería de componentes

> Fuente: página **«UI kit»** del canvas (tableros *Mini UI kit · light v0.1*, *CTA · catálogo*, *Notificaciones · catálogo* y *Hoy · cards kit*). Leído el 2026-11-23.
> Regla (decisión del 2026-11-23): **pantallas** = página «Prototipo con look and feel»; **componentes y tokens** = página «UI kit». El resto de páginas del canvas no se usan.

## Tokens que define el kit (se copian tal cual a `packages/shared/theme`)

| Token | Valor | | Token | Valor |
|---|---|---|---|---|
| color.bg.ground | #FAF5E8 | | color.text.primary | #211E1B |
| color.bg.surface | #FFFDF8 | | color.text.caption | #3A3530 |
| color.bg.bubble | #EBE7D7 | | color.text.secondary | #6B6259 |
| color.border.subtle | #EDE3D4 | | color.text.inactive | #8A8076 |
| color.bg.muted | #E4DCCD | | color.icon.muted | #9A9086 |
| color.action.primary | #211E1B | | color.action.on-primary | #F5EFE4 |
| color.status.live | #7FCFA3 | | color.text.accent | #211E1B |
| gradient.energy | #F3B58E → #F2DFA6 → #E9CFC4 → #A98BC2 | | person.self.fill | #F3C4A0 |

Tipografía: Display EB Garamond 500 + cursiva 52/52 −1 % · Título 30/33 · Sección 24 · H4 Plus Jakarta 600 20/24 +10 % mayúsculas · H5 600 17/21 +10 % mayúsculas · Cuerpo fuerte 600 16 · Cuerpo 500 14 · Etiqueta 600 13 · Caption 600 11 +12 % mayúsculas · Nav 600 11.
Radios: 14 burbuja · 18 botón · 20 tarjeta · 24 bloque/hoja · 36 nav flotante · 50 % avatar. Espaciado: 4 · 6 · 8 · 14 · 16 · 18 · 24.
Layout de pantalla: status bar 47 · título fijo 126 (padding 18/24/16) · el contenido empieza en 173 · home indicator 34. (En la app real, status bar y home indicator los da el sistema: se respetan con *safe areas*, no se dibujan.)

## Componentes (`apps/mobile/src/ui/`)

| Componente | Especificación del kit | Variantes / estados |
|---|---|---|
| `Button` | h 52, radio 18, 16/600 | principal · principal disabled · secundario · secundario negativo · ghost · ghost disabled · icono circular · link subrayado («Deshacer») |
| `IconButton` / `ProfileButton` | círculo 48 y 40 | perfil en icono suave |
| `Avatar` (vía `PersonToken`) | 52, inicial serif 24 | aceptado (relleno) · pendiente (borde discontinuo gris) · tú |
| `LiveBadge` | punto `color.status.live` con pulso | «En vivo · 12:40» |
| `UnitedShape` | `gradient.energy` · efecto goo | ver doc 03 (animación de referencia: la del onboarding) |
| `TaskCard` | radio 20, borde 1, filo izquierdo del color de la persona | sesión aceptada · sesión por confirmar hora · acompañante pendiente · sin sesión · apoyo recibido · apoyo enviado |
| `RequestCard` | avatar · título · día/hora · CTA ghost | «te pide acompañarla» |
| `SessionInviteCard` | CTA ghost Aceptar / Rechazar / Elegir | idle · ok · no · resch · join (cada uno con «Deshacer») |
| `SupportRequestCard` | | notSent · sent (anima degradado + pulso) |
| `FloatingNotice` | cae desde arriba, ciclo 8 s, se retira sola | «Lucía pensó en ti» |
| `CarouselControls` | flechas 40×44, puntos 18×44 | flecha deshabilitada #B5AA9C en los extremos |
| `ConfirmSheet` | hoja, radio 24, fondo atenuado | «¿La das por *hecha*?» |
| `EmptyStateCard` | ilustración + CTA principal + ghost | |
| `ModalSheet` | cabecera fija 68: Cancelar / título / acción | |
| `TextField` / `TextArea` | input 52 · textarea 104 | normal · error |
| `DateTimePill` | h 40, toca para avanzar la opción | |
| `PersonPicker` | radio + avatar, fila 60 | |
| `TabBar` | flotante 72, radio 36 | Hoy · Tareas · Sesiones · Acompaño; `aria-current` → `accessibilityState.selected` |
| `Toast` | clase base = info (gris cálido) · ok · err; **nunca el negro del CTA** | con acción («Deshacer», «Reintentar») |
| `ScreenTitle` | titular redonda + cursiva | pestaña 52 · interior 30 |

## Diferencias entre el kit y el encargo (cómo las resuelvo)

| Tema | Encargo | Kit | Decisión |
|---|---|---|---|
| Radio de controles | 14 | botón 18, burbuja 14 | **Kit** (es la librería elegida). |
| Título de pantalla interior | 32 | 30/33 | **Kit**. |
| Verde «en vivo» | #2F7A52 | punto #7FCFA3 | Punto #7FCFA3 (decorativo); texto «En vivo» en #2F7A52 para cumplir contraste AA. |
| Degradado | #F09A6A → … → #8FC19A «logo e iconos» | gradient.energy (4 paradas) para la forma | Los dos: el del encargo para logo e icono de app; `gradient.energy` para la forma unida. |
| Colores de personas | paleta cerrada de 8, sin género | 4 de ejemplo (lila #A98BC2, azul gris #AAC0C8, rosado #E9CFC4, amarillo #F2DFA6); el prototipo habla de Marta lila, Juan salvia, Lucía ocre | Paleta de 8 que **incluye** los del kit y el salvia/ocre del prototipo; los 3 restantes se proponen en fase 1 con test de contraste y te los enseño antes de cerrarlos. |
| Nombres de ejemplo | Marta, Juan, Lucía | Javier, Ramón | Irrelevante: los nombres salen de los datos. |
