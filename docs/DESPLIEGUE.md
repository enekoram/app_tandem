# Despliegue (staging en Render)

> Comprobado el 2026-11-25: la API compilada (`pnpm --filter @tandems/api build` y `node apps/api/dist/main.js`) arranca en modo producción, responde a `/health`, registra, valida la sesión y oculta `/docs`.

## 1. Base de datos (Atlas)
1. En el proyecto de Atlas (UE), crea un usuario solo para staging (p. ej. `tandems_staging`) con permiso sobre la base `tandems_staging`.
2. **Network Access** → añade `0.0.0.0/0` (Render gratuito no tiene IP fija; la protección es el usuario y la contraseña).
3. Copia la cadena `mongodb+srv://tandems_staging:<contraseña>@…/tandems_staging`.

## 2. API (Render)
1. **New → Blueprint** → este repositorio, rama `main`. Lee `render.yaml`.
2. En el panel, rellena (nunca en el repositorio):
   - `MONGODB_URI`: la cadena del paso 1.
   - `RESEND_API_KEY`: la clave de envío de Resend (sin ella no salen los emails; la API avisa en el log).
   - `BETTER_AUTH_SECRET` se genera solo; `BETTER_AUTH_URL` sale de la URL de Render.
3. Cuando termine: `https://<servicio>.onrender.com/health` → `{"status":"ok"…}`.

## 3. App apuntando a staging
En `apps/mobile/.env` (ignorado por git): `EXPO_PUBLIC_API_URL=https://<servicio>.onrender.com` y `pnpm dev mobile`. Así se puede probar con varios móviles sin el Mac encendido como servidor.

## 4. Avisos push (opcional)
En `apps/mobile`: `npx eas login` y `npx eas init` (añade el `projectId` a `app.json`). En Expo Go, solo iPhone.

## Limitaciones del plan gratuito de Render
- **Se duerme a los 15 min sin peticiones**: la primera tarda ~1 min. Mientras duerme no salen los **recordatorios de sesión** (se comprueban cada minuto dentro de la API) ni hay tiempo real.
- **Presencia en memoria**: se pierde al reiniciar (se recupera sola cuando la gente vuelve a abrir la app).
- Una sola instancia: si algún día hay varias, la presencia y los límites de peticiones tienen que pasar a Redis (doc 01).
