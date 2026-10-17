import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

/** Decodifica y vuelve a codificar las imágenes importadas como JPEG para el PDF. */
export async function normalizeImage(uri: string) {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [], { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG });
    const base64 = await FileSystem.readAsStringAsync(result.uri, { encoding: FileSystem.EncodingType.Base64 });
    if (!base64) throw new Error('Imagen vacía');
    return { uri: result.uri, base64 };
  } catch (error) {
    throw new Error(`No se pudo convertir la imagen ${uri.split('/').pop() ?? ''}: ${String(error)}`);
  }
}
