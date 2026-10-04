const fs = require('fs');
const assert = require('node:assert/strict');
const ts = require(process.cwd() + '/node_modules/typescript');
const Module = require('module');
function load(file, deps = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const m = new Module(file);
  m.require = name => deps[name] ?? require(name);
  m._compile(compiled, file);
  return m.exports;
}
const photoUtils = load(process.cwd() + '/utils/report-photos.ts');
const { buildPhotoReportHtml } = load(process.cwd() + '/utils/report-html.ts', { './report-photos': photoUtils });
assert.deepEqual(Array.from({length: 9}, (_,i) => photoUtils.categoryForNumber(i+1)), ['box','mattress','appearance','appearance','appearance','measures','measures','measures','measures']);
const photos = Array.from({length: 16}, (_,i) => ({ id: String(i+1), uri: 'test', number: i+1, category: photoUtils.categoryForNumber(i+1), base64: 'test' }));
const moved = photoUtils.movePhoto(photos, '7', 'appearance');
assert.equal(moved[6].category, 'appearance');
assert.equal(moved[6].number, 7);
assert.equal(photos[6].category, 'measures');
const html = buildPhotoReportHtml(moved, '2026-10-03');
assert.equal((html.match(/<figure>/g) || []).length, 16);
assert.equal((html.match(/<section class="page">/g) || []).length, 3);
assert.equal((html.match(/FOTO 7</g) || []).length, 1);
assert(html.includes('OVERALL APPEARANCE · FOTO 7'));
const without = moved.filter(p => p.id !== '1');
assert.equal(without[5].number, 7);
assert.equal((buildPhotoReportHtml(without, '2026-10-03').match(/<figure>/g) || []).length, 15);
console.log('PASS: classification, immutable movement, stable numbering, deletion, pagination, all photos included.');
