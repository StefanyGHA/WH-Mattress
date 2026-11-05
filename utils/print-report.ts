import type { Translate } from './i18n';
import * as Print from 'expo-print';

/** Implementación nativa; la variante .web imprime el HTML en un documento separado. */
export async function printReportHtml(html: string, _t?: Translate) {
  await Print.printAsync({ html });
}
