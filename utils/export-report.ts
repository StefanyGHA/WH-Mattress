import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';
import { buildPhotoReportHtml, buildReportPages } from './report-html';
import type { ProductionReport } from './report-photos';

/** Genera y une páginas en serie para no cargar todo el muestreo en una sola WebView. */
export async function exportReportPdf(report: ProductionReport, onProgress?: (page: number, total: number) => void): Promise<{ uri: string }> {
  const pages = buildReportPages(report);
  const merged = await PDFDocument.create();
  merged.setTitle(`Production Report - ${report.principalLot}`);
  merged.setAuthor('WH Mattress Panama');
  for (const [index, page] of pages.entries()) {
    onProgress?.(index + 1, pages.length);
    const result = await Print.printToFileAsync({ html: buildPhotoReportHtml(report, [page], index), width: 792, height: 612, margins: { top: 0, right: 0, bottom: 0, left: 0 } });
    const temporary = new File(result.uri);
    try {
      const document = await PDFDocument.load(await temporary.bytes());
      // Evita compartir un archivo recortado o con páginas inesperadas del motor de impresión.
      if (document.getPageCount() !== 1) throw new Error(`No se pudo generar correctamente la página ${index + 1}. Intenta nuevamente.`);
      const [copied] = await merged.copyPages(document, [0]);
      merged.addPage(copied);
    } finally {
      // Solo se elimina la página temporal recién creada por esta operación.
      try { if (temporary.exists) temporary.delete(); } catch { /* El sistema puede limpiar la caché antes de esta llamada. */ }
    }
  }
  if (merged.getPageCount() !== pages.length) throw new Error('El PDF quedó incompleto. Intenta nuevamente.');
  const output = new File(Paths.cache, `WH-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  output.create();
  // SDK 58 escribe de forma asíncrona: espera el archivo completo antes de compartirlo.
  await output.write(await merged.save());
  return { uri: output.uri };
}
