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
const { buildPhotoReportHtml, buildReportPages } = load('report-html', { './report-logo': logo });

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
assert(html.includes('RESUMEN GENERAL'));
assert(html.includes('LOTE 10'));
assert(html.includes('MODELO 2'));
const escaped = buildPhotoReportHtml({ ...report, models: [{ ...report.models[0], name: '<script>bad</script>' }] });
assert(!escaped.includes('<script>bad</script>'));
assert(escaped.includes('&lt;script&gt;bad&lt;/script&gt;'));

// Nueve modelos por resumen, como en la paginación del script Python.
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
const continuation = regressionHtml.split('<section class="page">').find(page => page.includes('APARIENCIA GENERAL Y MEDIDAS - CONTINUACIÓN'));
assert(!continuation.includes('Imagen no ingresada'));
assert(continuation.includes('<figcaption>APARIENCIA 4</figcaption>'));
assert(continuation.includes('<figcaption>MEDIDA 10</figcaption>'));
// Los títulos mantienen la categoría sin añadir la numeración interna de las fotos.
assert(!/ · FOTO \d+/.test(regressionHtml));
assert(regressionHtml.includes('<figcaption>FOTO DE LA ETIQUETA DE LA CAJA</figcaption>'));
assert(regressionHtml.includes('<figcaption>FOTO DE LA ETIQUETA DEL COLCHÓN</figcaption>'));

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

// La opción de vista previa genera solo HTML de prueba para verificar visualmente la plantilla.
if (process.argv[2]) {
  const fixture = { ...multi, models: multi.models.map(model => ({ ...model, photos: model.photos.map(photo => ({ ...photo, base64: logo.REPORT_LOGO.split(',')[1] })) })) };
  fs.writeFileSync(process.argv[2], buildPhotoReportHtml(fixture));
}
