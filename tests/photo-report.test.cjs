// Ejecuta las pruebas con las dependencias TypeScript existentes, sin instalar un runner.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const Module = require('node:module');

/** Carga las utilidades puras TypeScript para probarlas con node:assert. */
function load(name, dependencies = {}) {
  const file = path.resolve(__dirname, '../utils', name + '.ts');
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = new Module(file);
  module.require = name => dependencies[name] ?? (name.startsWith('./') ? load(name.slice(2)) : require(name));
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

// Retomar conserva la identidad y no modifica las fotos vecinas ni la categoría original.
const originalPhoto = { ...multi.models[0].photos[6], sampleNumber: 3 };
const retakeGroup = [multi.models[0].photos[0], originalPhoto];
const retaken = photoUtils.replaceCapturedPhoto(retakeGroup, originalPhoto.id, { id: 'new-camera-id', uri: 'camera.jpg', base64: 'new-jpeg', number: 1, category: 'box', sampleNumber: 1 });
assert.strictEqual(retaken[0], retakeGroup[0]);
assert.deepEqual(retaken[1], { id: originalPhoto.id, uri: 'camera.jpg', base64: 'new-jpeg', number: originalPhoto.number, category: originalPhoto.category, sampleNumber: 3 });
assert.strictEqual(retakeGroup[1], originalPhoto);
assert.equal(originalPhoto.uri, 'test');
assert.deepEqual(photoUtils.replaceCapturedPhoto(retakeGroup, 'deleted-photo', retaken[1]), retakeGroup);

// Los iconos se generan desde los archivos locales, manteniendo la papelera roja.
const actionIcons = load('photo-icons');
for (const [name, file, color] of [['trashcanIcon', 'trashcan_icon.svg', '#ff0c0c'], ['reloadIcon', 'reload_icon.svg', '#315E78']]) {
  const svg = fs.readFileSync(path.resolve(__dirname, '../assets/icons', file), 'utf8').replace(/width="1em"/g, 'width="24"').replace(/height="1em"/g, 'height="24"').replace(/currentColor/g, color);
  assert.equal(actionIcons[name].uri, 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
}

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
// La referencia coloca dos apariencias arriba y una centrada abajo, con medidas en 3×2.
const gridHtml = buildPhotoReportHtml(report, [buildReportPages(report)[2]]);
const frames = [...gridHtml.matchAll(/<figure style="left:([\d.]+)pt;top:([\d.]+)pt;width:([\d.]+)pt;height:([\d.]+)pt">/g)].map(match => match.slice(1).map(Number));
assert.equal(frames.length, 9);
for (const [index, [x, y, width, height]] of frames.entries()) {
  assert(Math.abs(width / height - (index < 3 ? 900 / 506 : 506 / 900)) < 0.0001);
  assert(x >= 0 && x + width <= 792 && y >= 155 && y + height <= 564.001);
  if (index >= 3) assert(x > frames[1][0] + frames[1][2]);
}
assert.equal(frames[0][1], frames[1][1]);
assert(frames[2][1] > frames[0][1] + frames[0][3]);
assert.equal(frames[2][0] + frames[2][2] / 2, (frames[0][0] + frames[1][0] + frames[1][2]) / 2);
assert.deepEqual(frames.slice(3).map(frame => frame[1]), [frames[3][1], frames[3][1], frames[3][1], frames[6][1], frames[6][1], frames[6][1]]);
assert(frames[6][1] > frames[3][1] + frames[3][3]);
assert.equal(frames[3][0], frames[6][0]);
assert.equal(frames[4][0], frames[7][0]);
assert.equal(frames[5][0], frames[8][0]);

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
  { modelId: 'first', sample: 1, stage: 'labels' },
  ...Array.from({ length: 5 }, (_, index) => ({ modelId: 'first', sample: index + 1, stage: 'photos' })),
];
assert.equal(photoUtils.movePhoto(sampledPhotos, sampledPhotos[0].id, 'appearance', 3)[0].sampleNumber, 3);
assert.equal(steps.length, 6);
for (let i = 1; i < steps.length; i++) assert.deepEqual(flow.adjacentCaptureStep(sampled, steps[i], -1), steps[i-1]);
assert.equal(flow.adjacentCaptureStep(sampled, steps[0], -1), null);
assert.equal(flow.adjacentCaptureStep(sampled, steps.at(-1), 1), null);
// El retroceso también cruza modelos conservando la última muestra del anterior.
const twoSampled = { ...sampled, models: [...sampled.models, { ...second, quantity: 20 }] };
assert.deepEqual(flow.adjacentCaptureStep(twoSampled, { modelId: second.id, sample: 1, stage: 'labels' }, -1), steps.at(-1));
// Importación conjunta o parcial: siempre dos etiquetas y después tres apariencias y seis medidas.
const labelStep = { modelId: 'first', sample: 1, stage: 'labels' };
const photoStep = { ...labelStep, stage: 'photos' };
const incoming = photos().map(photo => ({ ...photo, category: 'box' }));
const labelsBatch = flow.appendCaptureBatch([], incoming.slice(0, 2), labelStep);
assert.deepEqual(labelsBatch.map(photo => photo.category), ['box', 'mattress']);
const fullBatch = flow.appendCaptureBatch(labelsBatch, incoming.slice(2), photoStep);
assert.deepEqual(fullBatch.map(photo => photo.category), ['box', 'mattress', ...Array(3).fill('appearance'), ...Array(6).fill('measures')]);
assert.deepEqual(fullBatch.map(photo => photo.number), Array.from({ length: 11 }, (_, index) => index + 1));
let partial = flow.appendCaptureBatch(labelsBatch, incoming.slice(2, 4), photoStep);
partial = flow.appendCaptureBatch(partial, incoming.slice(4), photoStep);
assert.deepEqual(partial, fullBatch);
const nextSample = flow.appendCaptureBatch(fullBatch, incoming.slice(2).map(photo => ({ ...photo, id: 'next-' + photo.id })), { ...photoStep, sample: 2 });
assert.equal(flow.captureGroup(nextSample, photoStep).length, 9);
assert.equal(flow.captureGroup(nextSample, { ...photoStep, sample: 2 }).length, 9);
const refilled = flow.appendCaptureBatch(fullBatch.filter(photo => photo.number !== 3), [{ ...incoming[2], id: 'refill' }], photoStep);
assert.equal(refilled.at(-1).category, 'appearance');
assert.equal(refilled.filter(photo => photo.category === 'mattress').length, 1);
const replacementGroup = photoUtils.replaceCapturedPhoto(fullBatch, fullBatch[4].id, incoming[10]);
assert.equal(replacementGroup[4].id, fullBatch[4].id);
assert.equal(replacementGroup[4].number, 5);
assert.equal(replacementGroup[4].category, 'appearance');
assert.deepEqual(replacementGroup.slice(5), fullBatch.slice(5));
// Numeración del cuadro: solo una permutación completa se guarda en sus espacios originales.
const orderInput = fullBatch.map((photo, index) => ({ ...photo, base64: 'image-' + index, uri: 'uri-' + index }));
const labelOrder = flow.reorderCapturePhotos(orderInput, [orderInput[1].id, orderInput[0].id], labelStep);
assert.equal(labelOrder[0].base64, 'image-1');
assert.equal(labelOrder[0].category, 'box');
assert.equal(labelOrder[1].base64, 'image-0');
const gridOrderIds = orderInput.slice(2).map(photo => photo.id).reverse();
const gridOrder = flow.reorderCapturePhotos(orderInput, gridOrderIds, photoStep);
assert.equal(gridOrder[2].base64, 'image-10');
assert.equal(gridOrder[2].category, 'appearance');
assert.equal(gridOrder[10].base64, 'image-2');
assert.equal(gridOrder[10].category, 'measures');
assert.deepEqual(gridOrder.map(photo => photo.id), orderInput.map(photo => photo.id));
assert.deepEqual(gridOrder.map(photo => photo.number), orderInput.map(photo => photo.number));
assert.equal(orderInput[2].base64, 'image-2');
for (const invalid of [[], gridOrderIds.slice(1), Array(9).fill(gridOrderIds[0]), [...gridOrderIds.slice(1), orderInput[0].id]]) assert.strictEqual(flow.reorderCapturePhotos(orderInput, invalid, photoStep), orderInput);
const orderedPages = buildReportPages({ ...report, models: [{ ...report.models[0], photos: gridOrder }] });
assert.equal(orderedPages[2].appearance[0].base64, 'image-10');
assert.equal(orderedPages[2].measures[5].base64, 'image-2');
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

/** Inserta metadatos TIFF válidos en un JPEG de prueba para ejecutar el lector real. */
function jpegWithCaptureTags(values) {
  const tags = Object.entries(values).map(([tag, value]) => [Number(tag), Buffer.from(value + '\0', 'ascii')]);
  const exifOffset = 26;
  const dataOffset = exifOffset + 2 + 12 * tags.length + 4;
  const tiff = Buffer.alloc(dataOffset + tags.reduce((size, [, data]) => size + (data.length > 4 ? data.length : 0), 0));
  tiff.write('II', 0);
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x8769, 10);
  tiff.writeUInt16LE(4, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt32LE(exifOffset, 18);
  tiff.writeUInt16LE(tags.length, exifOffset);
  let cursor = dataOffset;
  for (const [index, [tag, data]] of tags.entries()) {
    const entry = exifOffset + 2 + index * 12;
    tiff.writeUInt16LE(tag, entry);
    tiff.writeUInt16LE(2, entry + 2);
    tiff.writeUInt32LE(data.length, entry + 4);
    if (data.length <= 4) data.copy(tiff, entry + 8);
    else { tiff.writeUInt32LE(cursor, entry + 8); data.copy(tiff, cursor); cursor += data.length; }
  }
  const jpeg = fs.readFileSync(path.resolve(__dirname, '../assets/images/wh-m.jpg'));
  const header = Buffer.from([0xff, 0xe1, 0, 0]);
  header.writeUInt16BE(tiff.length + 8, 2);
  return Buffer.concat([jpeg.subarray(0, 2), header, Buffer.from('Exif\0\0'), tiff, jpeg.subarray(2)]);
}

// Carga la misma entrada que Expo en un proceso aislado con el navigator mínimo de React Native.
execFileSync(process.execPath, ['-e', `
  const assert = require('node:assert/strict');
  const bytes = new Uint8Array(require('node:fs').readFileSync(0));
  Object.defineProperty(globalThis, 'navigator', { value: { product: 'ReactNative' } });
  globalThis.Buffer = undefined;
  const { load } = require(${JSON.stringify(require.resolve('exifreader/src/exif-reader'))});
  const { exif } = load(bytes, { expanded: true, includeTags: { exif: ['DateTimeOriginal'] } });
  assert.equal(exif.DateTimeOriginal.description, '2026:11:10 08:00:01');
`], { input: jpegWithCaptureTags({ 0x9003: '2026:11:10 08:00:01' }) });

/** Las dos etiquetas y las nueve fotos se clasifican con la fecha de captura antes de prepararlas. */
async function checkDirectFiles() {
  const files = new Map();
  const makeAsset = (uri, tags, name = uri + '.jpg') => {
    files.set(uri, jpegWithCaptureTags(tags));
    return { uri, name };
  };
  let assets = [9, 2, 7, 1, 8, 3, 6, 4, 5].map(n => makeAsset(`file-${n}`, { 0x9003: `2026:11:10 08:03:0${n}` }));
  const metadata = load('photo-capture-time', {
    'expo-file-system': { File: class { constructor(uri) { this.uri = uri; } async bytes() { return new Uint8Array(files.get(this.uri)); } } },
  });
  let options;
  let canceled = false;
  let notices = 0;
  const { acquirePhotos } = load('acquire-photos', {
    'expo-document-picker': { getDocumentAsync: async value => { options = value; return canceled ? { canceled: true } : { canceled: false, assets }; } },
    'expo-image-picker': { launchImageLibraryAsync: async () => ({ canceled: false, assets }) },
    './photo-capture-time': metadata,
    './prepare-report-images': { preparePrintPhoto: async photo => 'jpeg-' + photo.uri },
  });
  const fromFiles = (count, category) => acquirePhotos('files', count, category, undefined, () => { notices++; });
  const result = await fromFiles(9, 'appearance');
  assert.deepEqual(options, { type: 'image/*', multiple: true, copyToCacheDirectory: true });
  assert.deepEqual(result.map(photo => photo.uri), Array.from({ length: 9 }, (_, index) => `file-${index + 1}`));
  const classified = flow.appendCaptureBatch([], result, photoStep);
  assert.deepEqual(classified.map(photo => photo.category), [...Array(3).fill('appearance'), ...Array(6).fill('measures')]);
  assert.deepEqual((await acquirePhotos('gallery', 9, 'appearance')).map(photo => photo.uri), assets.map(asset => asset.uri));
  assert.equal(notices, 0);

  // Las fotos de la muestra pueden llegar revueltas y con el EXIF ausente o igual en todo el lote.
  const times = ['47-22', '47-32', '47-41', '47-54', '48-11', '48-25', '48-47', '52-33', '52-42'];
  const named = times.map((time, index) => makeAsset(`named-${index + 1}`, index === 4 ? {} : { 0x9003: '2026:10:31 10:00:00' }, `6LC0181_SE16K_2026-10-31_09-${time}.jpg`));
  assets = [6, 4, 0, 7, 1, 5, 3, 2, 8].map(index => named[index]);
  const orderedSample = flow.appendCaptureBatch([], await fromFiles(9, 'appearance'), photoStep);
  const reportWithSample = { ...report, models: [{ ...report.models[0], photos: orderedSample }] };
  const samplePage = buildReportPages(reportWithSample).find(page => page.kind === 'photos');
  assert.deepEqual(samplePage.appearance.map(photo => photo.uri), named.slice(0, 3).map(asset => asset.uri));
  assert.deepEqual(samplePage.measures.map(photo => photo.uri), named.slice(3).map(asset => asset.uri));
  assert.equal(notices, 0);

  // Las fechas del documento original son otra opción cuando los nombres no contienen la hora.
  const oldFile = { ...makeAsset('old-file', {}), lastModified: 1_700_000_000_000 };
  const newFile = { ...makeAsset('new-file', {}), lastModified: oldFile.lastModified + 15_000 };
  assets = [newFile, oldFile];
  const datedLabels = flow.appendCaptureBatch([], await fromFiles(2, 'box'), labelStep);
  assert.deepEqual(datedLabels.map(photo => [photo.category, photo.uri]), [['box', 'old-file'], ['mattress', 'new-file']]);
  assert.equal(notices, 0);

  // Las fracciones de segundo distinguen etiquetas tomadas en el mismo segundo.
  const newer = makeAsset('mattress', { 0x9003: '2026:11:10 08:00:00', 0x9291: '900' });
  const older = makeAsset('box', { 0x9003: '2026:11:10 08:00:00', 0x9291: '100' });
  assets = [newer, older];
  const labels = flow.appendCaptureBatch([], await fromFiles(2, 'box'), labelStep);
  assert.deepEqual(labels.map(photo => [photo.category, photo.uri]), [['box', 'box'], ['mattress', 'mattress']]);
  assert.equal(notices, 0);

  // Las zonas explícitas permiten comparar fotos tomadas con relojes locales distintos.
  assets = [makeAsset('later', { 0x9003: '2026:11:10 12:00:00', 0x9011: '-06:00' }), makeAsset('earlier', { 0x9004: '2026:11:10 17:00:00', 0x9012: '+00:00' })];
  assert.deepEqual((await fromFiles(2, 'box')).map(photo => photo.uri), ['earlier', 'later']);

  // Sin fecha o con empate, no se inventa una secuencia ni se pierde ninguna foto.
  assets = [newer, makeAsset('missing', {}), older];
  assert.deepEqual((await fromFiles(3, 'box')).map(photo => photo.uri), assets.map(asset => asset.uri));
  assert.equal(notices, 1);
  assets = [newer, makeAsset('tie', { 0x9003: '2026:11:10 08:00:00', 0x9291: '900' })];
  assert.deepEqual((await fromFiles(2, 'box')).map(photo => photo.uri), ['mattress', 'tie']);
  assert.equal(notices, 2);
  // La fecha que el selector inventa al importar no debe determinar el orden.
  assets = [{ ...newFile, lastModified: Date.now() + 1000 }, oldFile];
  assert.deepEqual((await fromFiles(2, 'box')).map(photo => photo.uri), ['new-file', 'old-file']);
  assert.equal(notices, 3);
  canceled = true;
  assert.deepEqual(await fromFiles(2, 'box'), []);
  console.log('PASS: orden por EXIF, nombre o fecha de Archivos en 2 y 9 fotos, asignación en PDF, empates y Galería intacta.');
}
checkDirectFiles().catch(error => { console.error(error); process.exitCode = 1; });
