import { createTranslator, LocalizedError, type Translate } from './i18n';
import type { ProductionReport, ReportPhoto } from './report-photos';

/** Prepara todas las imágenes en serie y conserva intacto el reporte que ve el usuario. */
export async function prepareReportForPrint(
  report: ProductionReport,
  preparePhoto: (photo: ReportPhoto) => Promise<string>,
  onProgress?: (completed: number, total: number) => void,
  // Solo los mensajes de la app se traducen; el contenido del reporte no cambia.
  t: Translate = createTranslator('es'),
): Promise<ProductionReport> {
  const total = report.models.reduce((sum, model) => sum + model.photos.length, 0);
  let completed = 0;
  const models: ProductionReport['models'] = [];
  for (const model of report.models) {
    const photos: ReportPhoto[] = [];
    for (const photo of model.photos) {
      // No se generan archivos incompletos: una imagen ilegible detiene la exportación.
      let base64: string;
      try {
        base64 = await preparePhoto(photo);
        if (!base64) throw new Error('Empty image');
      } catch {
        throw new LocalizedError('No se pudo preparar la foto {n} de {name} ({lot}). Vuelve a cargar esa fotografía e intenta nuevamente.', { n: photo.number, name: model.name, lot: model.lot }, t);
      }
      photos.push({ ...photo, base64 });
      onProgress?.(++completed, total);
    }
    models.push({ ...model, photos });
  }
  return { ...report, models };
}
