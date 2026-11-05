// Prueba preferencias, traducciones y contraste sin cargar módulos nativos del teléfono.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

/** Resuelve utilidades TypeScript puras y sus dependencias locales. */
function load(name) {
  const file = path.resolve(__dirname, '../utils', name + '.ts');
  const module = new Module(file);
  module.require = dependency => dependency.startsWith('./') ? load(dependency.slice(2)) : require(dependency);
  module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, file);
  return module.exports;
}
const { createTranslator, resolveLanguage, english, LocalizedError } = load('i18n');
const { parsePreferences, defaultPreferences, palettes } = load('app-preferences');
const { validateReportTable, missingReportPhotos } = load('report-photos');
const { buildPhotoReportHtml } = load('report-html');

// Una instalación nueva sigue el sistema; un archivo corrupto vuelve a valores seguros.
for (const raw of [null, '{broken', 'null', '42', '[]', '{"language":"fr","theme":"blue"}']) {
  assert.deepEqual(parsePreferences(raw), defaultPreferences);
}
assert.deepEqual(parsePreferences('{"language":"es","theme":"dark"}'), { language: 'es', theme: 'dark' });
assert.deepEqual(parsePreferences('{"language":"en"}'), { language: 'en', theme: 'system' });
assert.equal(resolveLanguage('system', ['es-MX', 'en']), 'es');
assert.equal(resolveLanguage('system', ['en-GB', 'es']), 'en');
assert.equal(resolveLanguage('system', ['fr', 'ES-sv']), 'es');
assert.equal(resolveLanguage('system', ['fr', null]), 'en');
assert.equal(resolveLanguage('es', ['en']), 'es');
assert.equal(resolveLanguage('en', ['es']), 'en');

// Los parámetros del reporte sobreviven a ambas traducciones sin cambios ni pérdidas.
const en = createTranslator('en');
const es = createTranslator('es');
for (const [key, translated] of Object.entries(english)) {
  const placeholders = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  assert.deepEqual(placeholders(key), placeholders(translated), key);
}
assert.equal(en('Modelo: {name}', { name: 'SD14Q' }), 'Models: SD14Q');
assert.equal(es('MODELS'), 'MODELOS');
assert.equal(es('MEASURES'), 'MEDIDAS');
assert.equal(en('Foto {n}', { n: 7 }), 'Photo 7');
// Los errores ya visibles también cambian de idioma, conservando sus datos.
const localizedError = new LocalizedError('No se pudo generar correctamente la página {n}. Intenta nuevamente.', { n: 3 }, es);
assert(localizedError.message.includes('página 3'));
assert.equal(localizedError.localize(en), 'Could not generate page 3 correctly. Please try again.');
const report = { code: 'WH-TEST', date: '2026-11-04', principalLot: '', models: [] };
assert.equal(validateReportTable(report, en), 'Enter the main report lot.');
assert.equal(validateReportTable(report, es), 'Ingresa el lote principal del reporte.');
report.principalLot = 'LOT 1';
report.models = [{ id: 'one', name: 'SD14Q', quantity: 20, photos: [] }];
assert.equal(missingReportPhotos(report, en), 'SD14Q: missing box label photo.');
assert(missingReportPhotos(report, es).includes('falta foto de la etiqueta'));
// La salida PDF no utiliza las preferencias de idioma ni los colores de la interfaz.
const before = buildPhotoReportHtml(report);
for (const language of ['en', 'es']) {
  createTranslator(language)('RESUMEN GENERAL');
  assert.equal(buildPhotoReportHtml(report), before);
}
assert(before.includes('GENERAL SUMMARY'));
assert(before.includes('MAIN LOT'));
assert(!before.includes('RESUMEN GENERAL'));

/** Contraste WCAG con luminancia sRGB, incluyendo las superficies de mayor elevación. */
function contrast(a, b) {
  const luminance = color => {
    const rgb = color.match(/[\da-f]{2}/gi).map(channel => parseInt(channel, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const surface of ['background', 'surface', 'elevated']) {
  assert(contrast(palettes.dark.text, palettes.dark[surface]) >= 15.8, surface);
}
for (const colors of Object.values(palettes)) {
  for (const surface of ['background', 'surface', 'elevated', 'inset', 'selected']) {
    for (const text of ['text', 'muted', 'accent', 'danger']) assert(contrast(colors[text], colors[surface]) >= 4.5, `${text}/${surface}`);
  }
  for (const [foreground, background] of [['onPrimary', 'primary'], ['onSecondary', 'secondary'], ['onHeader', 'header'], ['onDanger', 'dangerSurface']]) {
    assert(contrast(colors[foreground], colors[background]) >= 4.5, `${foreground}/${background}`);
  }
}
console.log('PASS: preferencias válidas y corruptas, idioma del sistema, traducciones parametrizadas, PDF inglés y contraste WCAG en ambos temas.');
