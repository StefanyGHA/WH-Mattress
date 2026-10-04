import { categoryTitle, type ReportPhoto } from './report-photos';
const chunks = (photos: ReportPhoto[], size: number) => Array.from({ length: Math.ceil(photos.length / size) }, (_, index) => photos.slice(index * size, (index + 1) * size));
export function buildPhotoReportHtml(photos: ReportPhoto[], date: string) {
  const panel = (photo: ReportPhoto) => `<figure><figcaption>${categoryTitle(photo.category)} · FOTO ${photo.number}</figcaption><img src="data:image/jpeg;base64,${photo.base64}" /></figure>`;
  const labels = photos.filter(photo => photo.category === 'box' || photo.category === 'mattress');
  const appearance = chunks(photos.filter(photo => photo.category === 'appearance'), 3);
  const measures = chunks(photos.filter(photo => photo.category === 'measures'), 6);
  const pages: { title: string; body: string }[] = chunks(labels, 2).map(group => ({ title: 'ETIQUETAS DEL MODELO', body: `<div class="labels">${group.map(panel).join('')}</div>` }));
  for (let i = 0; i < Math.max(appearance.length, measures.length); i++) {
    pages.push({ title: 'APARIENCIA GENERAL Y MEDIDAS', body: `<div class="columns"><div class="column"><h2>OVERALL APPEARANCE</h2><div class="appearance">${(appearance[i] ?? []).map(panel).join('')}</div></div><div class="column"><h2>MEASURES</h2><div class="measures">${(measures[i] ?? []).map(panel).join('')}</div></div></div>` });
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
  @page { size: letter landscape; margin: 0; } * { box-sizing: border-box; } body { margin: 0; font-family: Arial, sans-serif; color: #202124; }
  .page { width: 792px; height: 612px; padding: 24px; page-break-after: always; position: relative; } .page:last-child { page-break-after: auto; }
  header { display: flex; gap: 20px; align-items: center; height: 65px; } .logo { border: 2px solid #315E78; padding: 15px; color: #315E78; } h1 { font-size: 20px; font-weight: 500; margin: 0; } .subtitle { text-align: center; color: #315E78; font-size: 11px; margin-top: 8px; } .date { text-align: center; margin: 12px; font-size: 16px; }
  h2 { color: #315E78; font-size: 12px; margin: 0 0 6px; } figure { margin: 0; border: 1px solid #8AA1AE; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; min-width: 0; } figcaption { background: #315E78; color: white; font-size: 9px; padding: 7px; text-align: center; } img { width: 100%; flex: 1; min-height: 0; object-fit: contain; padding: 6px; }
  .labels { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 410px; } .columns { display: flex; gap: 18px; height: 420px; } .column { flex: 1; min-width: 0; } .appearance, .measures { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 395px; } .appearance { grid-template-rows: 1fr 1fr; } .appearance figure:nth-child(3) { grid-column: span 2; } .measures { grid-template-rows: repeat(3, 1fr); } footer { position: absolute; bottom: 16px; left: 24px; right: 24px; border-top: 1px solid #CCD6DD; padding-top: 6px; text-align: right; font-size: 9px; color: #6B7280; }
  </style></head><body>${pages.map((page, index) => `<section class="page"><header><div class="logo">WH</div><div><h1>PRODUCTION REPORT WH MATTRESS PANAMA</h1><div class="subtitle">${page.title}</div></div></header><div class="date">${date}</div>${page.body}<footer>Página ${index + 1} de ${pages.length}</footer></section>`).join('')}</body></html>`;
}
