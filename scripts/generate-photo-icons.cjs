// Incrusta los SVG locales como el logo del reporte, sin transformadores ni dependencias nuevas.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const names = { trashcanIcon: ['trashcan_icon.svg', '#ff0c0c'], reloadIcon: ['reload_icon.svg', '#315E78'] };
const lines = ['// Generado desde assets/icons por scripts/generate-photo-icons.cjs.'];
for (const [name, [file, color]] of Object.entries(names)) {
  const svg = fs.readFileSync(path.join(root, 'assets/icons', file), 'utf8').replace(/width="1em"/g, 'width="24"').replace(/height="1em"/g, 'height="24"').replace(/currentColor/g, color);
  lines.push(`export const ${name} = { uri: ${JSON.stringify('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'))} };`);
}
fs.writeFileSync(path.join(root, 'utils/photo-icons.ts'), lines.join('\n') + '\n');
