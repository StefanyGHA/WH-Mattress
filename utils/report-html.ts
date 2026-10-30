import { REPORT_LOGO } from './report-logo';
import { modelSampleCount, type MattressModel, type ProductionReport, type ReportPhoto } from './report-photos';

/** Una página pertenece a un modelo o al resumen inicial del reporte completo. */
export type ReportPage = {
  kind: 'summary' | 'labels' | 'photos';
  title: string;
  model?: MattressModel;
  models?: MattressModel[];
  offset?: number;
  box?: ReportPhoto;
  mattress?: ReportPhoto;
  appearance?: ReportPhoto[];
  measures?: ReportPhoto[];
  appearanceOffset?: number;
  measuresOffset?: number;
  sampleNumber?: number;
};

/** Divide cada categoría según la capacidad de la plantilla original de Python. */
function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
}

/** Construye el orden de páginas sin mezclar lotes ni perder las fotos adicionales. */
export function buildReportPages(report: ProductionReport): ReportPage[] {
  const pages: ReportPage[] = chunks(report.models, 8).map((models, index) => ({
    kind: 'summary', title: index ? 'GENERAL SUMMARY - CONTINUED' : 'GENERAL SUMMARY', models, offset: index * 8,
  }));
  for (const model of report.models) {
    const box = model.photos.filter(photo => photo.category === 'box');
    const mattress = model.photos.filter(photo => photo.category === 'mattress');
    // Una etiqueta de caja y una de colchón comparten página, incluso después de editar.
    for (let index = 0; index < Math.max(1, box.length, mattress.length); index++) {
      pages.push({ kind: 'labels', title: index ? 'MODELS - LABELS - CONTINUED' : 'MODELS - LABELS', model, box: box[index], mattress: mattress[index] });
    }
    // Cada unidad del 5 % conserva sus propias tres apariencias y seis medidas.
    const maxSample = Math.max(modelSampleCount(model), ...model.photos.map(photo => photo.sampleNumber ?? 1), 1);
    for (let sample = 1; sample <= maxSample; sample++) {
      const appearance = chunks(model.photos.filter(photo => photo.category === 'appearance' && (photo.sampleNumber ?? 1) === sample), 3);
      const measures = chunks(model.photos.filter(photo => photo.category === 'measures' && (photo.sampleNumber ?? 1) === sample), 6);
      for (let index = 0; index < Math.max(1, appearance.length, measures.length); index++) {
        pages.push({ kind: 'photos', title: index ? 'OVERALL APPEARANCE AND MEASURES - CONTINUED' : 'OVERALL APPEARANCE AND MEASURES', model, sampleNumber: sample, appearance: appearance[index] ?? [], measures: measures[index] ?? [], appearanceOffset: index * 3, measuresOffset: index * 6 });
      }
    }
  }
  return pages;
}

/** Escapa los datos escritos por el usuario para que no se interpreten como HTML. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

/** Genera HTML con dimensiones en puntos, iguales a landscape(letter) en ReportLab. */
export function buildPhotoReportHtml(report: ProductionReport, selectedPages?: ReportPage[], firstPage = 0) {
  // La exportación móvil solicita una sola página cada vez para limitar imágenes decodificadas.
  const pages = selectedPages ?? buildReportPages(report);
  // El posicionamiento absoluto conserva las coordenadas de los paneles del PDF de referencia.
  const positioned = (x: number, y: number, width: number, height: number) => `left:${x}pt;top:${y}pt;width:${width}pt;height:${height}pt`;
  // Las fotos no llevan nombres ni numeración visible; el identificador permite verificar que ninguna se omita.
  const panel = (photo: ReportPhoto | undefined, x: number, y: number, width: number, height: number) => `<figure style="${positioned(x, y, width, height)}">${photo?.base64 ? `<img loading="eager" decoding="sync" class="photo" alt="" data-photo-id="${escapeHtml(photo.id)}" src="data:image/jpeg;base64,${photo.base64}" />` : '<div class="missing">Image not provided</div>'}</figure>`;
  // El lote aparece solo en el resumen inicial; los detalles identifican modelo y muestra.
  const metadata = (model: MattressModel, labels: boolean, sample = 1) => `<div class="metadata ${labels ? 'label-meta' : ''}"><div class="model"><strong>${escapeHtml(model.name)}</strong><small>${labels ? 'MATTRESS MODELS' : `MODELS · SAMPLE ${sample}`}</small></div><div class="date"><strong>${escapeHtml(report.date)}</strong><small>DATE</small></div></div>`;

  /** Compone cada página de resumen, etiquetas o la cuadrícula de nueve fotos. */
  const body = (page: ReportPage) => {
    if (page.kind === 'summary') {
      const total = report.models.reduce((sum, model) => sum + (model.quantity ?? 0), 0);
      return `<div class="summary-date">${escapeHtml(report.date)}<small>REPORT DATE</small></div>${page.offset === 0 ? `<div class="summary-lot">${escapeHtml(report.principalLot)}<small>MAIN LOT</small></div>` : ''}<table><colgroup><col style="width:320pt"/><col/></colgroup><thead><tr><th>MODELS</th><th>QUANTITIES</th></tr></thead><tbody>${page.models!.map(model => `<tr><td>${escapeHtml(model.name)}</td><td>${model.quantity ?? 0}</td></tr>`).join('')}</tbody><tfoot><tr><th>GRAND TOTAL</th><th>${total}</th></tr></tfoot></table><div class="total">Total models registered: ${report.models.length}</div>`;

    }
    if (page.kind === 'labels') {
      return metadata(page.model!, true) + panel(page.box, 42, 180, 340, 360) + panel(page.mattress, 410, 180, 340, 360);
    }
    // Tres filas: apariencia horizontal a la izquierda y dos medidas verticales a la derecha.
    // La proporción 900×506 se invierte para medidas, sin recortar ni deformar los originales.
    const appearance = page.appearance!;
    const measures = page.measures!;
    const rowHeight = (409 - 20) / 3;
    const landscapeWidth = rowHeight * 900 / 506;
    const portraitWidth = rowHeight * 506 / 900;
    const left = (792 - landscapeWidth - 36 - portraitWidth * 2 - 12) / 2;
    const right = left + landscapeWidth + 36;
    let html = metadata(page.model!, false, page.sampleNumber) + `<h2 style="left:${left}pt">OVERALL APPEARANCE</h2><h2 style="left:${right}pt">MEASURES</h2>`;
    // También en continuaciones se dibujan únicamente las imágenes existentes.
    appearance.forEach((photo, index) => { html += panel(photo, left, 155 + index * (rowHeight + 10), landscapeWidth, rowHeight); });
    measures.forEach((photo, index) => { html += panel(photo, right + (index % 2) * (portraitWidth + 12), 155 + Math.floor(index / 2) * (rowHeight + 10), portraitWidth, rowHeight); });
    return html;
  };

  // Las unidades pt y los márgenes cero evitan que la impresión reduzca la plantilla.
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(report.code)}</title><style>
    @page { size: 792pt 612pt; margin: 0; } * { box-sizing: border-box; }
    body { margin: 0; font-family: Helvetica, Arial, sans-serif; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 792pt; height: 612pt; position: relative; overflow: hidden; break-after: page; page-break-after: always; }
    .page:last-child { break-after: auto; page-break-after: auto; }
    .logo { position: absolute; left: 27pt; top: 27pt; width: 56pt; height: 56pt; object-fit: contain; }
    h1 { position: absolute; top: 31pt; left: 90pt; right: 90pt; margin: 0; font-size: 21pt; font-weight: bold; text-align: center; }
    .subtitle { position: absolute; top: 61pt; left: 0; right: 0; text-align: center; font-size: 11pt; color: #315E78; }
    .metadata { position: absolute; top: 97pt; left: 30pt; right: 30pt; height: 40pt; display: flex; align-items: start; }
    .metadata>div { position: absolute; } .metadata strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .model { left: 0; width: 280pt; } .model strong { font-size: 24pt; } .date { left: 280pt; width: 172pt; text-align: center; } .date strong { font-size: 18pt; } .lot { right: 0; width: 200pt; text-align: right; } .lot strong { font-size: 12pt; }
    small { display: block; font-size: 9pt; font-weight: normal; margin-top: 3pt; } .label-meta { top: 103pt; left: 35pt; right: 35pt; } .label-meta .model strong { font-size: 27pt; } .label-meta .date { left: 275pt; } .label-meta .date strong { font-size: 20pt; } .label-meta .lot strong { font-size: 13pt; }
    h2 { position: absolute; top: 140pt; margin: 0; font-size: 11pt; color: #315E78; }
    figure { position: absolute; margin: 0; border: 1pt solid #8799A3; border-radius: 6pt; overflow: hidden; }
    .photo, .missing { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
    .missing { background: #F3F6F8; border: 1pt dashed #B8C5CC; display: flex; justify-content: center; align-items: center; color: #56666F; font-size: 10pt; }
    .summary-date { position: absolute; top: 106pt; width: 100%; text-align: center; font-size: 25pt; font-weight: bold; } .summary-date small { font-size: 11pt; margin-top: 6pt; }
    .summary-lot { position: absolute; top: 102pt; right: 30pt; width: 220pt; text-align: right; font-size: 13pt; font-weight: bold; } .summary-lot small { font-size: 10pt; margin-top: 6pt; }
    table { position: absolute; left: 145pt; top: 245pt; width: 502pt; border-collapse: collapse; table-layout: fixed; font-size: 10pt; } th,td { height: 30pt; border: 1pt solid #8799A3; padding: 5pt 10pt; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: left; } th { background: #315E78; color: white; } td:last-child,th:last-child { text-align: right; } tbody tr:nth-child(even) { background: #F1F5F7; }
    .total { position: absolute; bottom: 40pt; width: 100%; text-align: center; font-size: 9pt; color: #52616A; }
    footer { position: absolute; bottom: 8pt; height: 17pt; left: 27pt; right: 27pt; border-top: 0.5pt solid #B8C5CC; padding-top: 5pt; display: flex; justify-content: space-between; color: #52616A; font-size: 8pt; }
  </style></head><body>${pages.map((page, index) => `<section class="page"><img loading="eager" decoding="sync" class="logo" alt="WH Mattress" src="${REPORT_LOGO}"/><h1>PRODUCTION REPORT WH MATTRESS PANAMA</h1><div class="subtitle">${page.title}</div>${body(page)}<footer><span>Report: ${escapeHtml(report.code)}</span><span>Page ${firstPage + index + 1}</span></footer></section>`).join('')}</body></html>`;
}
