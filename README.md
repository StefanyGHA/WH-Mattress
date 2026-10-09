# WH Mattress Panamá

Aplicación móvil en React Native y Expo para crear reportes de producción de colchones. Permite registrar lotes y modelos, tomar o seleccionar fotografías, organizarlas y generar un PDF con el logo de la empresa.

## Requisitos

- **Git** para clonar el repositorio.
- **Node.js 22.x, desde 22.13.0**, con npm. También es compatible con Node.js 24.x desde 24.3.0, según los requisitos de React Native instalado.
- **Expo Go compatible con Expo SDK 57** para probar la aplicación en un celular, o una compilación de desarrollo propia.
- Para usar un emulador Android o compilar Android localmente: Android Studio y su SDK configurados.
- Para usar el simulador o compilar iOS localmente: una Mac con Xcode configurado.

Puedes comprobar Git, Node.js y npm con:

```bash
git --version
node --version
npm --version
```

No necesitas instalar Expo CLI globalmente: los comandos usan `npx` y la versión del proyecto. Tampoco necesitas Python ni las dependencias del script original para ejecutar esta aplicación.

## Instalación desde cero

Abre una terminal en la carpeta donde quieras guardar el proyecto y ejecuta:

```bash
git clone https://github.com/StefanyGHA/WH-Mattress.git
cd WH-Mattress
npm ci
```

`npm ci` instala todas las dependencias con las versiones registradas en `package-lock.json`. No es necesario instalarlas una por una. Si todavía no tienes un archivo de bloqueo o estás modificando dependencias, usa `npm install` en lugar de `npm ci`.

## Ejecutar la aplicación

Dentro de la carpeta `WH-Mattress`, inicia Expo:

```bash
npx expo start -c
```

La opción `-c` limpia la caché de Metro. Para los siguientes inicios puedes usar:

```bash
npm start
```

### En un celular con Expo Go

1. Instala una versión de Expo Go compatible con el SDK del proyecto.
2. Conecta el celular y la computadora a la misma red Wi-Fi.
3. Ejecuta `npx expo start -c` en la computadora.
4. En Android, escanea el QR desde Expo Go. En iPhone, escanéalo con la cámara y abre el enlace en Expo Go.
5. Autoriza el uso de la cámara cuando la aplicación lo solicite.

### En un emulador o simulador

Abre primero el emulador Android o el simulador iOS y ejecuta el comando correspondiente:

```bash
npm run android
```

```bash
npm run ios
```

Estos comandos inician Expo y abren la aplicación en el dispositivo disponible; no generan un APK ni una compilación nativa nueva.

### En el navegador

```bash
npm run web
```

En web, el botón del PDF abre la impresión del navegador. Selecciona **Guardar como PDF** para descargar el informe. La cámara y el diálogo para compartir archivos deben verificarse también en un celular real.

### Con una compilación nativa propia

Para compilar e instalar localmente, con las herramientas de Android o iOS ya configuradas:

```bash
npx expo run:android
```

```bash
npx expo run:ios
```

Si agregas o actualizas una dependencia nativa, reconstruye esa compilación; reiniciar Metro no incorpora módulos nativos nuevos. El uso de Expo Go requiere que los módulos estén incluidos en su versión compatible.

## Dependencias del proyecto

El proyecto utiliza **Expo SDK 57**, **React 19.2** y **React Native 0.86**. Las versiones completas y sus rangos están en `package.json`; `package-lock.json` registra la instalación reproducible.

| Dependencia | Uso |
| --- | --- |
| `expo`, `react`, `react-native` | Base de la aplicación móvil. |
| `expo-router`, `@react-navigation/*` | Navegación entre creación, vista previa y edición. |
| `expo-image-picker` | Tomar fotografías o seleccionarlas de la galería. |
| `expo-image-manipulator` | Preparar las imágenes como JPEG y limitar su tamaño para la impresión. |
| `expo-print` | Generar el PDF en dispositivos móviles. |
| `expo-sharing` | Compartir el archivo generado. |
| `expo-image`, `expo-font`, `@expo/vector-icons`, `expo-symbols` | Imágenes, fuentes e iconos. |
| `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets` | Soporte de gestos y animaciones del proyecto. |
| `react-native-safe-area-context`, `react-native-screens` | Integración de pantallas y áreas seguras. |
| `react-dom`, `react-native-web` | Ejecución en navegador. |
| Otros módulos `expo-*` de `package.json` | Configuración, enlaces, pantalla de inicio y funciones auxiliares. |
| `typescript`, `@types/react`, `eslint`, `eslint-config-expo` | Tipado y revisión del código durante el desarrollo. |

### Instalar las dependencias de fotografías y PDF por separado

Ya están declaradas en el repositorio y se instalan con `npm ci`. Si necesitas agregarlas manualmente a una copia que no las tenga, ejecuta:

```bash
npx expo install expo-image-picker expo-image-manipulator expo-print expo-sharing --npm
```

La dependencia incorporada para preparar las fotos del PDF es **`expo-image-manipulator ~57.0.21`**. Para agregar únicamente esa dependencia:

```bash
npx expo install expo-image-manipulator --npm
```

Después reinicia Expo:

```bash
npx expo start -c
```

## Actualizar una copia existente

Guarda o confirma tus cambios locales antes de traer los cambios del repositorio. Después, dentro de `WH-Mattress`, ejecuta:

```bash
git pull
npm ci
npx expo start -c
```

Si utilizas una compilación nativa propia y los cambios incluyen módulos nativos, vuelve a compilarla con `npx expo run:android` o `npx expo run:ios`, según la plataforma.

## Cómo crear un reporte

1. La fecha se toma del dispositivo al crear el reporte; no se solicita al usuario.
2. Ingresa el lote principal y el modelo del colchón. El primer modelo pertenece al lote principal.
3. Toma o selecciona una foto de la etiqueta de la caja y después una de la etiqueta del colchón.
4. Registra las fotografías de **Overall Appearance** y **Measures**. Por defecto son 3 de apariencia y 6 de medidas; puedes aumentar la cantidad por categoría.
5. Indica si deseas agregar otro lote. Si aceptas, se repite el registro de lote, modelo y fotografías.
6. Revisa el informe y usa **Editar informe** para cambiar los datos o mover fotografías entre categorías, arrastrándolas o usando **Mover a**.
7. Guarda los cambios y pulsa **Generar y compartir PDF**.

El reporte y las fotografías se mantienen en memoria durante la sesión. Actualmente no hay almacenamiento persistente: cerrar o recargar la aplicación puede perder el reporte en curso.

## Formato del PDF

- Resumen general con fecha, lote principal y tabla de modelos.
- Una página con las dos etiquetas de cada modelo.
- Una página con 3 fotos de apariencia y 6 de medidas por modelo.
- Páginas adicionales para las fotos que excedan esos espacios, conservando su categoría y lote.
- Logo de la empresa en cada página.
- Títulos como **APARIENCIA 1** y **MEDIDA 1**, sin añadir “FOTO 1”, “FOTO 2”, etc. Los títulos de las etiquetas conservan su descripción completa.

Las fotografías se preparan una por una para limitar el uso de memoria al imprimir. Se convierten a JPEG y se limita el lado mayor a 1600 px, o 1000 px en medidas, conservando sus proporciones y las imágenes originales del reporte. Si una foto no puede prepararse, la exportación se detiene e indica su número, modelo y lote.

En web se espera a que las imágenes estén decodificadas antes de imprimir el documento completo.

## Logo de la empresa

El archivo original está en:

```text
assets/images/wh-m.jpg
```

El PDF utiliza una copia Base64 de ese logo para funcionar sin depender de rutas locales. Si reemplazas la imagen, actualiza la copia con:

```bash
node scripts/generate-report-logo.cjs
```

## Verificación del código

```bash
npm test
npx tsc --noEmit
npm run lint
```

Las pruebas comprueban la fecha local, la separación de lotes y modelos, la distribución de las fotos, las páginas adicionales, la preparación secuencial de las imágenes y los títulos del PDF.

Para comprobar que la aplicación se empaqueta para cada plataforma:

```bash
npx expo export --platform android
npx expo export --platform web
```

Estas exportaciones generan los recursos de la aplicación; no producen un APK instalable. La captura, el uso de permisos y la impresión nativa deben probarse en un dispositivo real.
