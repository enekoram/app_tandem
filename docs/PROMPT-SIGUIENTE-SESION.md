# Prompt para retomar (copiar y pegar en Claude Code, en la carpeta del proyecto)

---

Retomamos el proyecto **Tandems** (app de acompañamiento para personas con TDAH: Expo + NestJS + MongoDB Atlas + Render). Eres el único desarrollador; yo reviso, pruebo en el iPhone (Expo Go) y decido.

Antes de nada, lee en este orden: `CLAUDE.md`, `docs/BITACORA.md` (sobre todo «Pendiente para la próxima sesión» de la última sesión), `docs/05-plan-por-fases.md` (estado de la fase 1 y fase 2), `docs/06-ui-kit.md` y, por encima, `docs/01` a `04` y `docs/PROGRESO.md`. Ahí está todo lo decidido; no vuelvas a plantear decisiones ya tomadas.

Estado: fase 0 en `main`; fase 1 casi terminada en `fase-1-fundamentos` (falta conectar Render y mi visto bueno). Entorno: Node 24 con fnm en `~/.local/share/fnm`, pnpm 12 por corepack, secretos de desarrollo en `apps/api/.env`.

Hoy:
1. Comprueba el repositorio (`git status`, rama, commits sin subir, estado de la CI) y dime qué tareas 🧑 de la bitácora siguen abiertas.
2. [Escribe aquí: «ok fase 1» o los cambios que quieras.] Si falta, guíame paso a paso para conectar el Blueprint de Render y comprobar `/health` en staging. Con el ok, fusiona `fase-1-fundamentos` en `main` y súbelo.
3. Empieza la **fase 2 · Tareas y contactos** en `fase-2-tareas`, en pasos pequeños y verificables, con commits en castellano y lint/typecheck/tests en verde antes de cada commit. Cada recurso nuevo con su test «persona ajena → 404» y el límite de 5 tareas en el servidor (contador condicional + test de concurrencia).
4. Cuando llegues a una tarea que solo puedo hacer yo (cuentas, secretos), para y guíame. Las claves nunca se pegan en el chat ni van al repositorio: dime dónde ponerlas.

Recuerda: el canvas (https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f) es de solo lectura; usa solo las páginas «Prototipo con look and feel» (pantallas) y «UI kit» (componentes). Al terminar cada paso, resume qué has hecho, cómo probarlo y qué viene después, y actualiza `docs/BITACORA.md` y `docs/PROGRESO.md` al final de la sesión.
