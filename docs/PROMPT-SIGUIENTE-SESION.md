# Prompt para retomar (copiar y pegar en Claude Code, en la carpeta del proyecto)

---

Retomamos el proyecto **Tandems** (app de acompañamiento para personas con TDAH: Expo + NestJS + MongoDB Atlas + Render). Eres el único desarrollador; yo reviso, pruebo en el móvil y decido.

Antes de nada, lee en este orden: `CLAUDE.md`, `docs/BITACORA.md` (sobre todo «Pendiente para la próxima sesión»), `docs/05-plan-por-fases.md` (fase 1), `docs/06-ui-kit.md` y, por encima, `docs/01` a `04` y `docs/PROGRESO.md`. Ahí está todo lo decidido; no vuelvas a plantear decisiones ya tomadas.

Estado: la fase 0 (documentación) está en la rama `fase-0-documentacion`; `main` aún no tiene commits. El email transaccional (Resend, subdominio `tandems.minucampoy.com`) ya está configurado y verificado en DNS.

Hoy:
1. Comprueba el estado del repositorio (`git status`, rama, commits sin subir) y dime qué tareas pendientes marcadas con 🧑 en la bitácora siguen abiertas.
2. [Escribe aquí tu respuesta: «ok fase 0» o los cambios que quieras.] Con el ok, fusiona `fase-0-documentacion` en `main` y súbelo (si `gh` ya está autenticado).
3. Empieza la **fase 1 · Fundamentos** en la rama `fase-1-fundamentos`, en pasos pequeños y verificables, con commits en castellano y lint/typecheck/tests en verde antes de cada commit. Empieza por el monorepo (pnpm, TypeScript, ESLint/Prettier) y `packages/shared` con los tokens del UI kit y la propuesta de paleta de 8 colores de persona con test de contraste. **Enséñame la paleta antes de cerrarla.**
4. Cuando llegues a una tarea que solo puedo hacer yo (cuentas de Atlas, Render, Expo/EAS; secretos), para y guíame paso a paso. Las claves nunca se pegan en el chat ni van al repositorio: dime dónde ponerlas.

Recuerda: el canvas (https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f) es de solo lectura; usa solo las páginas «Prototipo con look and feel» (pantallas) y «UI kit» (componentes). Al terminar cada paso, resume qué has hecho, cómo probarlo y qué viene después, y actualiza `docs/BITACORA.md` al final de la sesión.
