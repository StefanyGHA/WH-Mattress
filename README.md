# WH Mattress Panamá

Aplicación móvil en React Native y Expo para crear reportes de producción de colchones. Permite registrar lotes y modelos, tomar o seleccionar fotografías, organizarlas y generar un PDF con el logo de la empresa.

## Requisitos

- **Git** para clonar el repositorio.
- **Node.js 22.x, desde 22.13.0**, con npm. También es compatible con Node.js 24.x desde 24.3.0, según los requisitos de React Native instalado.
- **Expo Go compatible con Expo SDK 58** para probar la aplicación en un celular, o una compilación de desarrollo propia.
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

El proyecto utiliza **Expo SDK 58**, **React 19.3** y **React Native 0.88**. Las versiones completas y sus rangos están en `package.json`; `package-lock.json` registra la instalación reproducible.

| Dependencia | Uso |
| --- | --- |
| `expo`, `react`, `react-native` | Base de la aplicación móvil. |
| `expo-router`, `@react-navigation/*` | Navegación entre creación, vista previa y edición. |
| `expo-image-picker` | Tomar fotografías o seleccionarlas de la galería. |
| `expo-document-picker` | Importar imágenes desde Documentos y otros proveedores de archivos. |
| `expo-image-manipulator` | Preparar las imágenes como JPEG y limitar su tamaño para la impresión. |
| `expo-print` | Generar cada página del PDF en dispositivos móviles. |
| `pdf-lib`, `expo-file-system` | Unir las páginas en un único archivo y manejar los temporales de exportación. |
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
npx expo install expo-image-picker expo-image-manipulator expo-document-picker expo-file-system expo-print expo-sharing --npm
npm pkg set "overrides.pdf-lib.tslib=2.8.1"
npm install pdf-lib
```

Para preparar las fotos del PDF se utiliza **`expo-image-manipulator ~58.0.16`**. Para agregar únicamente esa dependencia:

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

1. La fecha se obtiene automáticamente del dispositivo.
2. Escribe el único lote del reporte en el formulario inicial.
3. Completa el cuadro **MODELS / QUANTITIES** con el nombre de cada modelo y su cantidad de unidades. Usa **Agregar fila** o la × de una fila para eliminarla. Si tiene fotos, se solicita confirmación antes de borrar.
4. La aplicación calcula el 5 % por modelo, redondeando hacia arriba y con mínimo un colchón para cantidades positivas. Por ejemplo: 100 unidades → 5 colchones de muestra → 45 fotos de apariencia/medidas; 267 unidades → 14 colchones. El cuadro también muestra el total general de unidades.
5. Pulsa **Continuar**. Se piden las dos etiquetas una vez por modelo: primero la de la caja y después la del colchón.
6. Para cada colchón de muestra se solicitan 3 fotografías de **Overall Appearance** y 6 de **Measures**. Se puede tomar la foto, elegirla de la galería o importarla con **Archivos**. También se pueden agregar fotos adicionales antes de continuar.
7. La flecha del encabezado y **Retroceder** vuelven al paso anterior conservando las fotografías. **Editar cuadro inicial** permite regresar a la tabla para corregir modelos o cantidades.
8. Al terminar el último modelo se abre el informe. En **Editar informe** puedes corregir el cuadro, elegir el modelo y la muestra, arrastrar fotos entre categorías, agregar fotos faltantes o usar **Reemplazar** si una imagen es incorrecta o ilegible.
9. Guarda los cambios y pulsa **Generar y compartir PDF**. Si faltan etiquetas o no se alcanzan las nueve fotos de una muestra, se indica qué debes completar.

El editor respeta la reclasificación manual: exige nueve fotografías de apariencia/medidas por muestra en total; la distribución guiada inicial es 3 + 6. Los cambios de cantidad o de categoría no borran automáticamente fotografías existentes. Las filas eliminadas con fotos sí requieren confirmación.

**Cancelar informe** funciona en web y en celular mediante un diálogo propio. Al confirmar se limpia el reporte y se vuelve al cuadro inicial. El reporte se mantiene en memoria durante la sesión: cerrar o recargar la aplicación puede perder los datos; todavía no hay almacenamiento persistente.

## Formato del PDF

- Resumen inicial con fecha, lote, tabla **MODELS / QUANTITIES** y **GRAND TOTAL**.
- El lote se muestra una sola vez al principio del PDF.
- Dos etiquetas juntas en una página por modelo.
- Una página con 3 fotos horizontales de **Overall Appearance**, una debajo de otra a la izquierda, y 6 fotos verticales de **Measures** en dos columnas a la derecha por cada colchón de la muestra. Un modelo con 100 unidades produce cinco páginas de fotos (45 imágenes), además de su página de etiquetas.
- Cada página de fotos identifica el modelo y el número de muestra.
- Las imágenes adicionales de una categoría pasan a páginas de continuación de la misma muestra.
- Logo en cada página. Todas las fotografías, incluidas las etiquetas, se imprimen sin nombres ni números individuales.
- Los textos de la plantilla del PDF están en inglés y el campo del modelo dice **MODELS**. Los nombres y lotes escritos por el usuario se conservan tal como se ingresaron.
- Marcos con proporción aproximada de 900 × 506 px para apariencia y 506 × 900 px para medidas. Se muestra la imagen completa, sin deformarla ni recortarla.

Las imágenes se leen y se guardan como JPEG en memoria al importarlas; esta copia se utiliza en la vista previa y al exportar, para que una ruta temporal eliminada no deje la fotografía en blanco. Se conserva la proporción y se limita el lado mayor a 1600 px (1000 px en medidas). Un JPEG ya preparado se reutiliza al exportar.

En celulares se imprime una página a la vez y se unen todas mediante `pdf-lib`. Se comprueba la cantidad de páginas y se eliminan los archivos temporales creados por esa exportación. Esto limita el número de imágenes cargadas simultáneamente en el motor de impresión. La previsualización también usa filas virtualizadas para cargar solo las imágenes cercanas a la pantalla. En web se imprime el documento completo después de decodificar las imágenes.

Si una imagen no puede prepararse, se muestra el número y el modelo. Usa **Editar o reemplazar fotografías** para corregirla y volver a exportar.

## Dependencias añadidas para los cambios del cliente

Después de actualizar el repositorio basta con ejecutar:

```bash
npm ci
npx expo start -c
```

Si estás aplicando los cambios manualmente a una copia anterior:

```bash
npx expo install expo-document-picker expo-file-system --npm
npm pkg set "overrides.pdf-lib.tslib=2.8.1"
npm install pdf-lib
npx expo start -c
```

El archivo `package.json` incluye un ajuste de compatibilidad de `tslib` para `pdf-lib`; conserva ese ajuste al instalar con npm.

La preparación de imágenes continúa usando `expo-image-manipulator`, ya incluido en el proyecto. Si utilizas una compilación nativa propia, reconstruye la aplicación después de incorporar los módulos nativos nuevos.

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

Las pruebas comprueban la fecha local, el muestreo del 5 %, la tabla y el total, el lote único, las fotografías por muestra, el retroceso, la copia de imágenes en memoria, la preparación secuencial y la unión paginada del PDF. También verifican la limpieza de temporales y que no se comparta un documento parcial.

Para comprobar que la aplicación se empaqueta para cada plataforma:

```bash
npx expo export --platform android
npx expo export --platform web
```

Estas exportaciones generan los recursos de la aplicación; no producen un APK instalable. La captura, el uso de permisos y la impresión nativa deben probarse en un dispositivo real.

## Compatibilidad con Expo Go y SDK 58

Este proyecto utiliza SDK 58 para abrirse con Expo Go compatible con esa versión. Después de recibir los archivos actualizados del proyecto, reinstala las dependencias desde el archivo de bloqueo y reinicia Metro:

```bash
npm ci
npx expo start -c
```

### Dependencias actualizadas durante la migración a SDK 58

Para esta migración **se actualizaron dependencias existentes; no se añadieron paquetes nuevos como dependencias directas**. npm también actualizó sus dependencias internas en `package-lock.json`. Las dependencias de fotografías y PDF ya estaban incorporadas antes de esta migración.

Esta es la lista de versiones declaradas que cambiaron:

| Paquete | Antes (SDK 57) | Ahora (SDK 58) |
| --- | --- | --- |
| `expo` | `~57.0.27` | `~58.0.21` |
| `expo-constants` | `~57.0.20` | `~58.0.14` |
| `expo-document-picker` | `~57.0.3` | `~58.0.4` |
| `expo-file-system` | `~57.0.7` | `~58.0.13` |
| `expo-font` | `~57.0.4` | `~58.0.11` |
| `expo-haptics` | `~57.0.3` | `~58.0.7` |
| `expo-image` | `~57.0.5` | `~58.0.18` |
| `expo-image-manipulator` | `~57.0.21` | `~58.0.16` |
| `expo-image-picker` | `~57.0.20` | `~58.0.10` |
| `expo-linking` | `~57.0.12` | `~58.0.15` |
| `expo-print` | `~57.0.2` | `~58.0.8` |
| `expo-router` | `~57.0.25` | `~58.0.28` |
| `expo-sharing` | `~57.0.22` | `~58.0.21` |
| `expo-splash-screen` | `~57.0.9` | `~58.0.12` |
| `expo-status-bar` | `~57.0.1` | `~58.0.4` |
| `expo-symbols` | `~57.0.3` | `~58.0.4` |
| `expo-system-ui` | `~57.0.4` | `~58.0.7` |
| `expo-web-browser` | `~57.0.3` | `~58.0.7` |
| `react` | `19.2.3` | `19.3.0` |
| `react-dom` | `19.2.3` | `19.3.0` |
| `react-native` | `0.86.3` | `0.88.0` |
| `react-native-gesture-handler` | `~2.32.0` | `~3.3.0` |
| `react-native-reanimated` | `4.5.1` | `4.7.1` |
| `react-native-safe-area-context` | `~5.7.0` | `~5.10.1` |
| `react-native-screens` | `~4.26.0` | `~4.30.0` |
| `react-native-web` | `~0.21.0` | `^0.21.4` |
| `react-native-worklets` | `0.10.1` | `0.13.0` |
| `@types/react` | `~19.2.4` | `~19.3.0` |
| `eslint-config-expo` | `~57.0.2` | `~58.0.4` |

Para instalar estas versiones en otra computadora, comparte tanto `package.json` como `package-lock.json` actualizados, o trae los cambios del repositorio, y ejecuta dentro del proyecto:

```bash
npm ci
npx expo install --check
npx expo start -c
```

No hace falta instalar cada paquete por separado ni usar `--force` o `--legacy-peer-deps`. `npm ci` reinstala las dependencias del proyecto según el archivo de bloqueo. No se instalaron herramientas globales para esta migración.

Comprueba que las dependencias estén alineadas con el SDK:

```bash
npx expo install --check
```

Usa Node.js 22.x desde 22.13.0, 24.x desde 24.3.0 o una versión compatible desde 26. Una compilación nativa anterior debe reconstruirse después de cambiar de SDK.

La migración adapta los tipos de referencias de React Native y espera la escritura asíncrona de `expo-file-system` antes de compartir el PDF. La configuración de Expo Router mantiene la salida web estática y la carga conjunta de rutas.
