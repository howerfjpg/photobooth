# Photobooth Kiosk para Linux

Aplicación de kiosco web con backend Node.js/Express, preparada para Debian ARM64 con GNOME o una sesión gráfica compatible. La webcam se usa mediante Chromium y las impresoras se administran desde Linux/CUPS.

## Requisitos

- Debian o Ubuntu ARM64 de 64 bits
- Node.js 20 o superior y npm
- Chromium y una sesión de escritorio GNOME/Wayland o X11
- CUPS y un controlador compatible con la impresora, si se imprimirá

En Debian instala las herramientas del sistema:

```sh
sudo apt update
sudo apt install -y chromium curl cups
```

Instala Node.js 20 o superior si la versión del repositorio de Debian no cumple el requisito. Desde la raíz del proyecto:

```sh
npm run install:linux
npm run kiosk
```

`install:linux` instala exactamente lo descrito en `package-lock.json` y compila `dist/`. `kiosk` inicia el backend de producción y abre Chromium en `http://127.0.0.1:3000` a pantalla completa. Al cerrar Chromium, el launcher detiene el servidor. Para iniciar solo el backend, ejecuta `npm start`; para desarrollo, `npm run dev`.

## Periféricos

Conecta una webcam USB y concede acceso a cámara en Chromium. La impresión del sistema utiliza la impresora predeterminada configurada en GNOME/CUPS. El controlador, formato y conexión de una Canon Selphy u otra impresora fotográfica deben verificarse en el modelo concreto. El uso del servicio es voluntario; quien lo desee puede dejar una donación en efectivo en la caja dispuesta para ello.
