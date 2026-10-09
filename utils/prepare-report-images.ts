import { Image } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ReportPhoto } from './report-photos';

/** Recodifica cada original como JPEG legible y limita su memoria al imprimir. */
export async function preparePrintPhoto(photo: ReportPhoto): Promise<string> {
  // Los reportes anteriores no guardaban dimensiones; se consultan desde su URI original.
  const dimensions = photo.width && photo.height
    ? { width: photo.width, height: photo.height }
    : await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(photo.uri, (width, height) => resolve({ width, height }), reject));
  const longest = photo.category === 'measures' ? 1000 : 1600;
  const scale = Math.min(1, longest / Math.max(dimensions.width, dimensions.height));
  const context = ImageManipulator.manipulate(photo.uri);
  try {
    // Se conserva la proporción y nunca se amplían imágenes pequeñas.
    context.resize({ width: Math.max(1, Math.round(dimensions.width * scale)), height: Math.max(1, Math.round(dimensions.height * scale)) });
    const image = await context.renderAsync();
    try {
      const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });
      if (!result.base64) throw new Error('Image encoding failed');
      return result.base64;
    } finally {
      // Libera la imagen decodificada antes de procesar la siguiente fotografía.
      image.release();
    }
  } finally { context.release(); }
}
