# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Flujo de creación del reporte

1. La fecha se obtiene del dispositivo y queda fijada al crear el reporte; no se solicita ni se modifica al exportar.
2. Se solicita el lote principal del reporte y el modelo del colchón. El primer modelo pertenece al lote principal.
3. Se pide primero una foto de la etiqueta de la caja y después una de la etiqueta del colchón. Ambas comparten una página del PDF.
4. Se solicitan 3 fotos de `OVERALL APPEARANCE` y 6 de `MEASURES`. Se pueden agregar fotos por categoría antes de capturarlas.
5. Las 3 apariencias y 6 medidas comparten una página, con la distribución del script Python. Las fotos sobrantes se incluyen en páginas adicionales del mismo modelo.
6. Al finalizar se pregunta si se desea agregar otro lote. Si se acepta, se solicita el lote y se repite el registro del modelo y las fotos. El lote principal del reporte se conserva.
7. El PDF comienza con el resumen general de modelos y utiliza el logo `assets/images/wh-m.jpg` en todas las páginas.

El editor conserva el arrastre y **Mover a**. Selecciona el modelo que deseas editar para modificar sus datos o fotografías; los otros lotes se conservan. Los cambios se aplican al pulsar **Guardar cambios**. La fecha se mantiene automáticamente. Los estilos compartidos y el encabezado existentes no se modifican.

El reporte y sus imágenes se conservan en memoria durante la sesión de la aplicación. Esta modificación no agrega dependencias npm y conserva la versión de Expo instalada en el proyecto.

Para usar el logo en PDF sin depender de rutas locales de iOS se incluye una copia Base64 generada desde el archivo original. Si reemplazas `assets/images/wh-m.jpg`, ejecuta `node scripts/generate-report-logo.cjs`. Las pruebas verifican que esa copia sea idéntica al archivo original.

Verificación: `npm test`, `npx tsc --noEmit` y `npm run lint`. Las pruebas comprueban fecha local, lotes y modelos independientes, etiquetas, distribución 3+6, fotos adicionales, edición, logo, datos HTML y resumen paginado.
