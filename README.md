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

Para preparar las fotos del PDF se utiliza **`expo-image-manipulator ~57.0.21`**. Para agregar únicamente esa dependencia:

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

- Resumen inicial con fecha, lote, tabla **MODELS / QUANTITIES** y **TOTAL GENERAL**.
- El lote se muestra una sola vez al principio del PDF.
- Dos etiquetas juntas en una página por modelo.
- Una página con 3 apariencias y 6 medidas por cada colchón de la muestra. Un modelo con 100 unidades produce cinco páginas de fotos (45 imágenes), además de su página de etiquetas.
- Cada página de fotos identifica el modelo y el número de muestra.
- Las imágenes adicionales de una categoría pasan a páginas de continuación de la misma muestra.
- Logo en cada página y títulos como **APARIENCIA 1** o **MEDIDA 1**, sin numeración adicional “FOTO …”.

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
