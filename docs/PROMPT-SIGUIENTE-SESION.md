# Prompt para retomar (copiar y pegar en Claude Code, en la carpeta del proyecto)

---

Retomamos el proyecto **Tandems** (app de acompañamiento para personas con TDAH: Expo + NestJS + MongoDB Atlas). Es un **proyecto de aprendizaje**: la meta es que la app funcione entera en **Expo Go** contra la API local (`pnpm dev`). Nada de App Store, Render, Xcode obligatorio ni textos legales. Eres el único desarrollador; yo pruebo en el iPhone y decido.

Antes de nada, lee: `CLAUDE.md`, `docs/BITACORA.md` (la última sesión, la 4, y su «Pendiente»), `docs/PRUEBAS-PENDIENTES.txt` y, por encima, `docs/PROGRESO.md` (tabla de decisiones al final). No vuelvas a plantear decisiones ya tomadas.

Estado: todo en `main` (fases 0–7 y los arreglos de las sesiones 3 y 4, probados en el iPhone). Si estoy en un ordenador nuevo, sigue `docs/NUEVO-ORDENADOR.md`.

Hoy:
1. Comprueba el repositorio (rama, commits sin subir) y que `pnpm dev` arranca. Si falta `apps/api/.env`, para y guíame (nunca pegues claves en el chat).
2. Te digo qué he visto al probar y lo arreglas en una rama `fix-pruebas-3` sobre `main` (fusión con mi ok).
3. Tareas que solo puedo hacer yo (cuentas, secretos, `npx eas-cli init` para los push): para y dime el comando.

El canvas (https://claude.ai/code/artifact/c23a6b19-90d6-458f-9b71-db2da5cc796f) es de solo lectura; usa solo «Prototipo con look and feel» y «UI kit». Si te pido algo distinto del canvas, mando yo: apúntalo en las decisiones de `docs/PROGRESO.md`. Al terminar cada paso, resume qué has hecho y cómo probarlo, y antes de cerrar la sesión actualiza `docs/BITACORA.md`, `docs/PROGRESO.md` y este prompt, y sube todo a GitHub.
