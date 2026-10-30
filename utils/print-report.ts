import * as Print from 'expo-print';

/** Implementación nativa; la variante .web imprime el HTML en un documento separado. */
export async function printReportHtml(html: string) {
  await Print.printAsync({ html });
}
