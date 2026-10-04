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

## Flujo de fotografías

- Elige Cámara o Galería y la cantidad de fotografías (9 por defecto).
- La distribución inicial es: foto 1 etiqueta de caja, foto 2 etiqueta del colchón, fotos 3–5 `OVERALL APPEARANCE`, fotos 6 en adelante `MEASURES`.
- En Cámara, la app muestra el número y la categoría antes de abrir la cámara para cada captura. Al regresar, presenta la siguiente foto. En Galería, selecciona las imágenes en ese orden.
- En Editar informe, arrastra desde el control **Arrastrar** hasta uno de los cuatro destinos fijos de arriba. El destino se resalta antes de soltar. También puedes usar **Mover a**. Guarda los cambios para actualizar el informe.
- Los números originales se conservan al mover o eliminar fotos. El PDF usa las categorías guardadas y añade páginas para incluir todas las fotografías.
- Las fotos del informe se conservan en memoria durante la sesión de la app.

Esta mejora no agrega dependencias npm. Usa las dependencias existentes de React Native, `expo-image-picker`, `expo-print` y `expo-sharing`, de acuerdo con la documentación de Expo SDK 54: https://docs.expo.dev/versions/v54.0.0/.

Verificación: `npm test`, `npx tsc --noEmit` y `npm run lint`. Las pruebas comprueban clasificación, movimientos entre categorías, números estables, eliminación y paginación del informe.
