// Incrusta el logo original para que expo-print pueda usarlo sin rutas locales en iOS.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base64 = fs.readFileSync(path.join(root, 'assets/images/wh-m.jpg')).toString('base64');
// Ejecuta este script nuevamente si se reemplaza assets/images/wh-m.jpg.
fs.writeFileSync(path.join(root, 'utils/report-logo.ts'), `/** Logo generado desde assets/images/wh-m.jpg; compatible con PDF sin conexión. */\nexport const REPORT_LOGO = 'data:image/jpeg;base64,${base64}';\n`);
