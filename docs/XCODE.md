# Ver Tandems en el simulador de Xcode

La carpeta `apps/mobile/ios` se genera con `expo prebuild` y **no va a git** (se rehace cuando
cambia `app.json` o se añade un módulo nativo). Identificador de la app: `com.minucampoy.tandems`.

## Una sola vez (lo haces tú: pide Apple ID y contraseña de administrador)
1. **Xcode** desde la App Store (≈ 15 GB; tarda). Ábrelo una vez, acepta la licencia y, en
   *Settings › Components*, instala la plataforma **iOS** (incluye el simulador).
2. En Terminal: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
3. **Homebrew** (https://brew.sh, una línea en Terminal) y después `brew install cocoapods`.
   (Con el Ruby del sistema `gem install cocoapods` suele fallar.)

## Cada vez
```sh
cd ~/Documents/proyectos/app_tandem
pnpm dev api                         # la API en el puerto 3000
cd apps/mobile
npx expo prebuild --platform ios     # solo si no existe ios/ o cambió app.json
npx expo run:ios                     # instala los pods, compila, abre el simulador y Metro
```
La primera compilación tarda varios minutos. Para hacerlo desde Xcode: abre
`apps/mobile/ios/Tandems.xcworkspace` (no el `.xcodeproj`), elige un iPhone en la barra de
arriba y pulsa ▶ (con Metro arrancado: `npx expo start --dev-client`).

## Notas
- En el simulador la app habla con la API en `localhost:3000`; no hace falta wifi.
- Los avisos push no llegan al simulador; la cámara tampoco existe.
- Este build (development build) es también lo que permitiría los deep links y Maestro,
  aplazados hasta ahora. Para un iPhone físico desde Xcode hace falta firmar con tu Apple ID
  (*Signing & Capabilities › Team*).
