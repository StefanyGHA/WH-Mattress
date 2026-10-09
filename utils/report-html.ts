import { REPORT_LOGO } from './report-logo';
import type { MattressModel, ProductionReport, ReportPhoto } from './report-photos';

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
};

/** Divide cada categoría según la capacidad de la plantilla original de Python. */
function chunks<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
}

/** Construye el orden de páginas sin mezclar lotes ni perder las fotos adicionales. */
export function buildReportPages(report: ProductionReport): ReportPage[] {
  const pages: ReportPage[] = chunks(report.models, 9).map((models, index) => ({
    kind: 'summary', title: index ? 'RESUMEN GENERAL - CONTINUACIÓN' : 'RESUMEN GENERAL', models, offset: index * 9,
  }));
  for (const model of report.models) {
    const box = model.photos.filter(photo => photo.category === 'box');
    const mattress = model.photos.filter(photo => photo.category === 'mattress');
    // Una etiqueta de caja y una de colchón comparten página, incluso después de editar.
    for (let index = 0; index < Math.max(1, box.length, mattress.length); index++) {
      pages.push({ kind: 'labels', title: index ? 'ETIQUETAS DEL MODELO - CONTINUACIÓN' : 'ETIQUETAS DEL MODELO', model, box: box[index], mattress: mattress[index] });
    }
    const appearance = chunks(model.photos.filter(photo => photo.category === 'appearance'), 3);
    const measures = chunks(model.photos.filter(photo => photo.category === 'measures'), 6);
    // La primera página tiene los 3 + 6 espacios originales; los sobrantes van después.
    for (let index = 0; index < Math.max(1, appearance.length, measures.length); index++) {
      pages.push({ kind: 'photos', title: index ? 'APARIENCIA GENERAL Y MEDIDAS - CONTINUACIÓN' : 'APARIENCIA GENERAL Y MEDIDAS', model, appearance: appearance[index] ?? [], measures: measures[index] ?? [], appearanceOffset: index * 3, measuresOffset: index * 6 });
    }
  }
  return pages;
}

/** Escapa los datos escritos por el usuario para que no se interpreten como HTML. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

/** Genera HTML con dimensiones en puntos, iguales a landscape(letter) en ReportLab. */
export function buildPhotoReportHtml(report: ProductionReport) {
  const pages = buildReportPages(report);
  // El posicionamiento absoluto conserva las coordenadas de los paneles del PDF de referencia.
  const positioned = (x: number, y: number, width: number, height: number) => `left:${x}pt;top:${y}pt;width:${width}pt;height:${height}pt`;
  // El título visible indica la categoría; el número original queda solo en los metadatos de la imagen.
  const panel = (photo: ReportPhoto | undefined, title: string, x: number, y: number, width: number, height: number) => `<figure style="${positioned(x, y, width, height)}"><figcaption>${escapeHtml(title)}</figcaption>${photo?.base64 ? `<img loading="eager" decoding="sync" class="photo" alt="Foto ${photo.number}" data-photo-id="${escapeHtml(photo.id)}" src="data:image/jpeg;base64,${photo.base64}" />` : '<div class="missing">Imagen no ingresada</div>'}</figure>`;
  // Modelo, fecha y lote aparecen en todas las páginas de detalle como en Python.
  const metadata = (model: MattressModel, labels: boolean) => `<div class="metadata ${labels ? 'label-meta' : ''}"><div class="model"><strong>${escapeHtml(model.name)}</strong><small>${labels ? 'MODELO DEL COLCHÓN' : 'MODELO'}</small></div><div class="date"><strong>${escapeHtml(report.date)}</strong><small>FECHA</small></div><div class="lot"><strong>${escapeHtml(model.lot)}</strong><small>LOTE</small></div></div>`;

  /** Compone cada página de resumen, etiquetas o la cuadrícula de nueve fotos. */
  const body = (page: ReportPage) => {
    if (page.kind === 'summary') {
      return `<div class="summary-date">${escapeHtml(report.date)}<small>FECHA DEL REPORTE</small></div><div class="summary-lot">${escapeHtml(report.principalLot)}<small>LOTE PRINCIPAL</small></div><table><colgroup><col style="width:45pt"/><col style="width:215pt"/><col/></colgroup><thead><tr><th>#</th><th>MODELO</th><th>LOTE</th></tr></thead><tbody>${page.models!.map((model, index) => `<tr><td>${page.offset! + index + 1}</td><td>${escapeHtml(model.name)}</td><td>${escapeHtml(model.lot)}</td></tr>`).join('')}</tbody></table><div class="total">Total de modelos registrados: ${report.models.length}</div>`;
    }
    if (page.kind === 'labels') {
      return metadata(page.model!, true) + panel(page.box, 'FOTO DE LA ETIQUETA DE LA CAJA', 42, 180, 340, 360) + panel(page.mattress, 'FOTO DE LA ETIQUETA DEL COLCHÓN', 410, 180, 340, 360);
    }
    // Izquierda: dos apariencias arriba y una ancha abajo. Derecha: seis medidas en 2×3.
    const appearance = page.appearance!;
    const measures = page.measures!;
    // En las páginas adicionales la numeración continúa desde la página anterior.
    const appearanceOffset = page.appearanceOffset ?? 0;
    // En una continuación se dibujan solo las fotos existentes, sin casillas ficticias.
    const appearancePanel = (index: number, x: number, y: number, width: number, height: number) =>
      appearanceOffset && !appearance[index] ? '' : panel(appearance[index], `APARIENCIA ${appearanceOffset + index + 1}`, x, y, width, height);
    const measuresOffset = page.measuresOffset ?? 0;
    let html = metadata(page.model!, false) + '<h2 style="left:24pt">OVERALL APPEARANCE</h2><h2 style="left:436.32pt">MEASURES</h2>';
    html += appearancePanel(0, 24, 155, 192.16, 207.48);
    html += appearancePanel(1, 226.16, 155, 192.16, 207.48);
    html += appearancePanel(2, 24, 372.48, 394.32, 191.52);
    for (let index = 0; index < 6; index++) {
      if (measuresOffset && !measures[index]) continue;
      html += panel(measures[index], `MEDIDA ${measuresOffset + index + 1}`, 436.32 + (index % 2) * 170.84, 155 + Math.floor(index / 2) * (389 / 3 + 10), 160.84, 389 / 3);
    }
    return html;
  };

  // Las unidades pt y los márgenes cero evitan que la impresión reduzca la plantilla.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(report.code)}</title><style>
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
    figcaption { height: 24pt; display: flex; align-items: center; justify-content: center; background: #315E78; color: white; font-size: 9pt; font-weight: bold; }
    .photo, .missing { position: absolute; top: 32pt; left: 8pt; width: calc(100% - 16pt); height: calc(100% - 40pt); object-fit: contain; }
    .missing { background: #F3F6F8; border: 1pt dashed #B8C5CC; display: flex; justify-content: center; align-items: center; color: #56666F; font-size: 10pt; }
    .summary-date { position: absolute; top: 106pt; width: 100%; text-align: center; font-size: 25pt; font-weight: bold; } .summary-date small { font-size: 11pt; margin-top: 6pt; }
    .summary-lot { position: absolute; top: 166pt; width: 100%; text-align: center; font-size: 17pt; font-weight: bold; } .summary-lot small { font-size: 10pt; margin-top: 6pt; }
    table { position: absolute; left: 145pt; top: 245pt; width: 502pt; border-collapse: collapse; table-layout: fixed; font-size: 10pt; } th,td { height: 30pt; border: 1pt solid #8799A3; padding: 5pt 10pt; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: left; } th { background: #315E78; color: white; } td:first-child,th:first-child { text-align: center; } tbody tr:nth-child(even) { background: #F1F5F7; }
    .total { position: absolute; bottom: 40pt; width: 100%; text-align: center; font-size: 9pt; color: #52616A; }
    footer { position: absolute; bottom: 8pt; height: 17pt; left: 27pt; right: 27pt; border-top: 0.5pt solid #B8C5CC; padding-top: 5pt; display: flex; justify-content: space-between; color: #52616A; font-size: 8pt; }
  </style></head><body>${pages.map((page, index) => `<section class="page"><img loading="eager" decoding="sync" class="logo" alt="WH Mattress" src="${REPORT_LOGO}"/><h1>PRODUCTION REPORT WH MATTRESS PANAMA</h1><div class="subtitle">${page.title}</div>${body(page)}<footer><span>Reporte: ${escapeHtml(report.code)}</span><span>Página ${index + 1}</span></footer></section>`).join('')}</body></html>`;
}
