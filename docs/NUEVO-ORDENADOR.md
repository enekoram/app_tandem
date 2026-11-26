# Seguir en otro ordenador

Todo el código y la documentación están en GitHub (github.com/enekoram/app_tandem). Lo único que
**no** está (a propósito) son los secretos: hay que llevarlos a mano.

## 1. Lo que hay que llevar a mano (nunca por git ni por el chat)
Desde el Mac de clase, por un medio privado (gestor de contraseñas, USB, AirDrop a ti):
- `apps/api/.env` → la misma ruta en el ordenador nuevo. Tiene la conexión a Atlas, el secreto de
  Better Auth y la clave de Resend. Sin él la API no arranca.
- `docs/pwd_usuarios_prueba.txt` → contraseñas de Marta, Juan, Lucía, Javier y Ramón.
- (Opcional) `docs/pwd_*.rtf`: mejor guardarlos en un gestor de contraseñas y no copiarlos.

Si pierdes el `.env`: copia `apps/api/.env.example` y rellénalo (Atlas › Connect para
`MONGODB_URI`; `openssl rand -base64 48` para `BETTER_AUTH_SECRET`; Resend › API Keys).
Ojo: un `BETTER_AUTH_SECRET` nuevo cierra las sesiones abiertas (hay que volver a entrar).

## 2. Instalar (una vez)
macOS: abre Terminal.
```sh
xcode-select --install                     # git y herramientas básicas
curl -fsSL https://fnm.vercel.app/install | bash   # fnm (versiones de Node)
# cierra y abre Terminal
git clone https://github.com/enekoram/app_tandem.git ~/Documents/proyectos/app_tandem
cd ~/Documents/proyectos/app_tandem
git checkout fix-pruebas-2                 # rama de trabajo actual (ver docs/BITACORA.md)
fnm install && fnm use                     # Node 24 según .nvmrc
corepack enable                            # pnpm en la versión del package.json
pnpm install
```
En Windows: usa WSL (Ubuntu) y los mismos pasos; Expo Go necesita que el móvil vea la IP del
ordenador (en WSL suele hacer falta `pnpm dev` con `--tunnel` o redirigir puertos: pregúntale a
Claude Code).

Atlas: si la API no conecta, en Atlas › Network Access añade la IP del ordenador nuevo (o
`0.0.0.0/0` solo para desarrollo).

## 3. Arrancar y probar
```sh
pnpm dev            # API + Metro; enseña el QR para Expo Go
pnpm --filter @tandems/api seed:demo   # vuelve a proponer la sesión de prueba si ya pasó
pnpm stop
```
- Expo Go y la línea de comandos con **la misma cuenta de Expo** (`npx expo login` → eneko.ram).
- Móvil y ordenador en la misma wifi (si no, punto de acceso del iPhone).
- Pruebas por hacer: `docs/PRUEBAS-PENDIENTES.txt`.

## 4. Claude Code
Abre Claude Code en la carpeta del proyecto y pega el prompt de `docs/PROMPT-SIGUIENTE-SESION.md`.
La «memoria» de Claude Code es de cada ordenador; lo importante ya está en `CLAUDE.md` y en
`docs/`.

## 5. GitHub
La primera vez que hagas `git push` te pedirá usuario (`enekoram`) y contraseña = un token
*fine-grained* solo para este repositorio con *Contents: Read and write*
(GitHub › Settings › Developer settings › Personal access tokens).
