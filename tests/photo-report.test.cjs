// Ejecuta las pruebas con las dependencias TypeScript existentes, sin instalar un runner.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const Module = require('node:module');

/** Carga las utilidades puras TypeScript para probarlas con node:assert. */
function load(name, dependencies = {}) {
  const file = path.resolve(__dirname, '../utils', name + '.ts');
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = new Module(file);
  module.require = name => dependencies[name] ?? require(name);
  module._compile(compiled, file);
  return module.exports;
}
const photoUtils = load('report-photos');
const logo = load('report-logo');
const { buildPhotoReportHtml, buildReportPages } = load('report-html', { './report-logo': logo, './report-photos': photoUtils });

/** Crea fotos de prueba con los números estables de un modelo. */
function photos(appearance = 3, measures = 6, prefix = 'first') {
  return ['box', 'mattress', ...Array(appearance).fill('appearance'), ...Array(measures).fill('measures')].map((category, index) => ({
    id: `${prefix}-${index + 1}`, uri: 'test', number: index + 1, category, base64: 'test',
  }));
}

// La fecha utiliza los getters locales aun cuando la fecha UTC corresponde al día siguiente.
const localClock = { getFullYear: () => 2026, getMonth: () => 9, getDate: () => 6, getHours: () => 23, getMinutes: () => 59, getSeconds: () => 58 };
const report = photoUtils.createReport(' lote 1 ', localClock);
assert.equal(report.date, '2026-10-06');
assert.equal(report.code, 'WH-20261006-235958');
assert.equal(report.principalLot, 'LOTE 1');
report.models = [{ id: 'first', name: 'MODELO 1', lot: report.principalLot, photos: photos() }];

// Un modelo normal produce resumen, dos etiquetas juntas y las nueve fotos juntas.
let pages = buildReportPages(report);
assert.deepEqual(pages.map(page => page.kind), ['summary', 'labels', 'photos']);
assert.equal(pages[1].box.category, 'box');
assert.equal(pages[1].mattress.category, 'mattress');
assert.equal(pages[2].appearance.length, 3);
assert.equal(pages[2].measures.length, 6);

// Los extras de cualquiera de las categorías se separan, sin alterar la primera página.
for (const [appearance, measures] of [[4, 6], [3, 7], [5, 10], [7, 13]]) {
  const additional = { ...report, models: [{ ...report.models[0], photos: photos(appearance, measures) }] };
  const photoPages = buildReportPages(additional).filter(page => page.kind === 'photos');
  assert.equal(photoPages[0].appearance.length, 3);
  assert.equal(photoPages[0].measures.length, 6);
  assert.equal(photoPages.flatMap(page => page.appearance).length, appearance);
  assert.equal(photoPages.flatMap(page => page.measures).length, measures);
  assert(photoPages.every(page => page.appearance.length <= 3 && page.measures.length <= 6));
}

// Cada nuevo lote mantiene su propio modelo y sus páginas; el principal no se reemplaza.
const second = { id: 'second', name: 'MODELO 2', lot: 'LOTE 10', photos: photos(4, 7, 'second') };
const multi = { ...report, models: [...report.models, second] };
pages = buildReportPages(multi);
assert.equal(pages.length, 6);
assert.equal(pages[0].models.length, 2);
assert.deepEqual(pages.filter(page => page.model).map(page => page.model.lot), ['LOTE 1', 'LOTE 1', 'LOTE 10', 'LOTE 10', 'LOTE 10']);

// Mover, borrar y guardar fotos solo modifica el modelo seleccionado.
const movedPhotos = photoUtils.movePhoto(multi.models[0].photos, 'first-7', 'appearance');
const updated = photoUtils.updateModelPhotos(multi, 'first', movedPhotos.filter(photo => photo.id !== 'first-3'));
assert.equal(updated.models[0].photos.find(photo => photo.id === 'first-7').number, 7);
assert.equal(updated.models[0].photos.find(photo => photo.id === 'first-7').category, 'appearance');
assert.strictEqual(updated.models[1], second);
assert.equal(multi.models[0].photos.find(photo => photo.id === 'first-7').category, 'measures');

// El logo incrustado debe seguir siendo exactamente el archivo wh-m.jpg solicitado.
assert.equal(logo.REPORT_LOGO, 'data:image/jpeg;base64,' + fs.readFileSync(path.resolve(__dirname, '../assets/images/wh-m.jpg')).toString('base64'));
const html = buildPhotoReportHtml(multi);
assert.equal((html.match(/class="logo"/g) ?? []).length, 6);
assert.equal((html.match(/class="photo"/g) ?? []).length, 24);
assert.equal((html.match(/class="page"/g) ?? []).length, 6);
assert(html.includes('GENERAL SUMMARY'));
// El lote se imprime solo en el primer resumen, no en los detalles del modelo.
assert(!html.includes('LOTE 10'));
assert.equal(html.split('LOTE 1').length - 1, 1);
assert(html.includes('MODELO 2'));
const escaped = buildPhotoReportHtml({ ...report, models: [{ ...report.models[0], name: '<script>bad</script>' }] });
assert(!escaped.includes('<script>bad</script>'));
assert(escaped.includes('&lt;script&gt;bad&lt;/script&gt;'));

// Ocho filas por resumen dejan espacio para el total general.
const manyModels = { ...report, models: Array.from({ length: 10 }, (_, index) => ({ ...report.models[0], id: String(index) })) };
assert.equal(buildReportPages(manyModels).filter(page => page.kind === 'summary').length, 2);
console.log('PASS: fecha local, lotes y modelos, 2 etiquetas, 3+6 fotos, extras, edición aislada, logo, escape HTML y resumen paginado.');

// Cada foto se identifica en el HTML exactamente una vez, incluso con dos lotes y extras.
const regression = { ...report, models: [{ ...report.models[0], photos: photos(5, 10) }, { ...second, photos: photos(3, 6, 'second') }] };
const regressionHtml = buildPhotoReportHtml(regression);
for (const model of regression.models) {
  for (const photo of model.photos) {
    assert.equal(regressionHtml.split(`data-photo-id="${photo.id}"`).length - 1, 1);
  }
}
const continuation = regressionHtml.split('<section class="page">').find(page => page.includes('OVERALL APPEARANCE AND MEASURES - CONTINUED'));
assert(!continuation.includes('Image not provided'));
// Ninguna foto, incluidas las etiquetas y los extras, lleva nombres visibles.
assert(!regressionHtml.includes('<figcaption>'));
assert(!/alt="(?:Foto|Photo) /.test(regressionHtml));
// Los textos de la plantilla están en inglés; los datos escritos por el usuario se conservan.
for (const text of ['GENERAL SUMMARY', 'MATTRESS MODELS', 'MODELS · SAMPLE 1', 'REPORT DATE', 'MAIN LOT', 'GRAND TOTAL', 'Total models registered:', 'Report:', 'Page 1']) {
  assert(regressionHtml.includes(text), text);
}
assert(!/RESUMEN|CONTINUACIÓN|ETIQUETAS|MUESTRA|FECHA|APARIENCIA|MEDIDA|Reporte:|Página|MODELO DEL/.test(regressionHtml));
// Las tres apariencias son horizontales y las seis medidas verticales, alineadas en tres filas.
const gridHtml = buildPhotoReportHtml(report, [buildReportPages(report)[2]]);
const frames = [...gridHtml.matchAll(/<figure style="left:([\d.]+)pt;top:([\d.]+)pt;width:([\d.]+)pt;height:([\d.]+)pt">/g)].map(match => match.slice(1).map(Number));
assert.equal(frames.length, 9);
for (const [index, [x, y, width, height]] of frames.entries()) {
  assert(Math.abs(width / height - (index < 3 ? 900 / 506 : 506 / 900)) < 0.0001);
  assert(x >= 0 && x + width <= 792 && y >= 155 && y + height <= 564.001);
  if (index < 3) assert.equal(x, frames[0][0]);
  else assert(x > frames[0][0] + frames[0][2]);
}
assert.deepEqual(frames.slice(3).map(frame => frame[1]), frames.slice(0, 3).flatMap(frame => [frame[1], frame[1]]));

/** Verifica que la preparación es secuencial y nunca omite una foto ilegible. */
async function checkPreparation() {
  const { prepareReportForPrint } = load('prepare-report');
  let active = 0;
  let peak = 0;
  const progress = [];
  const prepared = await prepareReportForPrint(regression, async photo => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    active--;
    return `prepared-${photo.id}`;
  }, (completed, total) => progress.push([completed, total]));
  assert.equal(peak, 1);
  assert.equal(progress.length, 28);
  assert.deepEqual(progress.at(-1), [28, 28]);
  assert.equal(prepared.models[0].photos.length, 17);
  assert.equal(prepared.models[1].photos.length, 11);
  assert.equal(regression.models[0].photos[0].base64, 'test');
  await assert.rejects(prepareReportForPrint(regression, async photo => {
    if (photo.number === 16) throw new Error('decode failed');
    return 'valid-image';
  }), /foto 16 de MODELO 1.*LOTE 1/);
  await assert.rejects(prepareReportForPrint(regression, async () => ''), /foto 1/);
  console.log('PASS: preparación secuencial de 28 fotos, originales intactos y errores sin exportación parcial.');
}
checkPreparation().catch(error => { console.error(error); process.exitCode = 1; });

// La muestra se calcula por fila: 100 unidades → 5 colchones → 45 fotos, más etiquetas.
assert.equal(photoUtils.sampleCount(100), 5);
assert.equal(photoUtils.sampleCount(267), 14);
assert.equal(photoUtils.sampleCount(1), 1);
assert.equal(photoUtils.sampleCount(0), 0);
assert.equal(photoUtils.sampleCount(2.5), 0);
assert.equal(photoUtils.sampleCount(-1), 0);
const sampledPhotos = photos().slice(0, 2);
for (let sample = 1; sample <= 5; sample++) {
  sampledPhotos.push(...photos(3, 6, `sample-${sample}`).slice(2).map(photo => ({ ...photo, sampleNumber: sample })));
}
const sampled = { ...report, models: [{ ...report.models[0], quantity: 100, photos: sampledPhotos }] };
assert.equal(photoUtils.missingReportPhotos(sampled), null);
const sampledPages = buildReportPages(sampled);
assert.equal(sampledPages.length, 7);
assert.deepEqual(sampledPages.filter(page => page.kind === 'photos').map(page => [page.sampleNumber, page.appearance.length, page.measures.length]), [[1,3,6],[2,3,6],[3,3,6],[4,3,6],[5,3,6]]);
const sampledHtml = buildPhotoReportHtml(sampled);
assert.equal((sampledHtml.match(/class="photo"/g) ?? []).length, 47);
assert(sampledHtml.includes('<th>MODELS</th><th>QUANTITIES</th>'));
assert(sampledHtml.includes('<th>GRAND TOTAL</th><th>100</th>'));
assert.equal(sampledHtml.split('LOTE 1').length - 1, 1);
assert.equal(photoUtils.validateReportTable(sampled), null);
assert(photoUtils.validateReportTable({ ...sampled, models: [] }));
assert(photoUtils.validateReportTable({ ...sampled, models: [{ ...sampled.models[0], quantity: 0 }] }));
assert(photoUtils.missingReportPhotos({ ...sampled, models: [{ ...sampled.models[0], photos: sampledPhotos.filter(photo => photo.sampleNumber !== 5) }] }).includes('muestra 5'));
// La imagen guardada sigue siendo visible aunque desaparezca el archivo temporal.
assert.equal(photoUtils.photoSourceUri({ uri: 'file:///missing.jpg', base64: '/9j/backup' }), 'data:image/jpeg;base64,/9j/backup');
assert.equal(photoUtils.photoSourceUri({ uri: 'file:///missing.png', base64: 'iVBORbackup' }), 'data:image/png;base64,iVBORbackup');
const flow = load('capture-flow', { './report-photos': photoUtils });
const steps = [
  { modelId: 'first', sample: 1, category: 'box' },
  { modelId: 'first', sample: 1, category: 'mattress' },
  ...Array.from({ length: 5 }, (_, index) => ['appearance', 'measures'].map(category => ({ modelId: 'first', sample: index + 1, category }))).flat(),
];
assert.equal(photoUtils.movePhoto(sampledPhotos, sampledPhotos[0].id, 'appearance', 3)[0].sampleNumber, 3);
assert.equal(steps.length, 12);
for (let i = 1; i < steps.length; i++) assert.deepEqual(flow.adjacentCaptureStep(sampled, steps[i], -1), steps[i-1]);
assert.equal(flow.adjacentCaptureStep(sampled, steps[0], -1), null);
assert.equal(flow.adjacentCaptureStep(sampled, steps.at(-1), 1), null);
// El retroceso también cruza modelos conservando la última muestra del anterior.
const twoSampled = { ...sampled, models: [...sampled.models, { ...second, quantity: 20 }] };
assert.deepEqual(flow.adjacentCaptureStep(twoSampled, { modelId: second.id, sample: 1, category: 'box' }, -1), steps.at(-1));
console.log('PASS: muestra 5 %, 47 fotos, 7 páginas, tabla y total, lote único, copia recuperable y retroceso en todos los pasos.');

/** Comprueba la exportación por páginas con unión real de PDF y limpieza de temporales. */
async function checkPageExport() {
  const { PDFDocument } = require('pdf-lib');
  const files = new Map();
  const printed = [];
  let extraPage = false;
  class MemoryFile {
    constructor(...parts) { this.uri = parts.join('/'); }
    get exists() { return files.has(this.uri); }
    create() { files.set(this.uri, new Uint8Array()); }
    // Emula la escritura asíncrona de expo-file-system en SDK 58.
    async write(bytes) { await new Promise(resolve => setTimeout(resolve, 5)); files.set(this.uri, bytes); }
    async bytes() { return files.get(this.uri); }
    delete() { files.delete(this.uri); }
  }
  const print = {
    async printToFileAsync({ html }) {
      printed.push(html);
      const pdf = await PDFDocument.create();
      pdf.addPage([792, 612]);
      if (extraPage) pdf.addPage([792, 612]);
      const uri = `temporary-${printed.length}`;
      files.set(uri, await pdf.save());
      return { uri };
    },
  };
  const { exportReportPdf } = load('export-report', {
    'expo-print': print,
    'expo-file-system': { File: MemoryFile, Paths: { cache: 'cache' } },
    './report-html': { buildReportPages, buildPhotoReportHtml },
  });
  const result = await exportReportPdf(sampled);
  const final = await PDFDocument.load(files.get(result.uri));
  assert.equal(final.getPageCount(), 7);
  assert.equal(files.size, 1);
  assert.deepEqual(printed.map(html => (html.match(/class="photo"/g) ?? []).length), [0,2,9,9,9,9,9]);
  printed.forEach((html, index) => {
    assert.equal((html.match(/class="page"/g) ?? []).length, 1);
    assert(html.includes(`Page ${index + 1}</span>`));
  });
  files.clear();
  extraPage = true;
  await assert.rejects(exportReportPdf(sampled), /página 1/);
  assert.equal(files.size, 0);
  console.log('PASS: unión de 7 páginas, numeración continua, 47 fotos planificadas y rechazo de exportaciones parciales.');
}
checkPageExport().catch(error => { console.error(error); process.exitCode = 1; });

// La opción de vista previa genera solo HTML de prueba para verificar visualmente la plantilla.
if (process.argv[2]) {
  const fixture = { ...multi, models: multi.models.map(model => ({ ...model, photos: model.photos.map(photo => ({ ...photo, base64: logo.REPORT_LOGO.split(',')[1] })) })) };
  fs.writeFileSync(process.argv[2], buildPhotoReportHtml(fixture));
}
