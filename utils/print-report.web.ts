/** Imprime el informe completo, no la vista de la app con su área de scroll recortada. */
export async function printReportHtml(html: string): Promise<void> {
  const frame = document.createElement('iframe');
  frame.title = 'Informe WH Mattress';
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1056px;height:816px;border:0;';
  const loaded = new Promise<void>((resolve, reject) => {
    frame.onload = () => resolve();
    frame.onerror = () => reject(new Error('No se pudo cargar el documento del informe.'));
  });
  frame.srcdoc = html;
  document.body.appendChild(frame);
  try {
    await loaded;
    const content = frame.contentDocument;
    const target = frame.contentWindow;
    if (!content || !target) throw new Error('No se pudo abrir el documento del informe.');
    // Espera la decodificación real de todas las fotos, incluidas las páginas adicionales.
    await Promise.all(Array.from(content.images, image => image.decode()));
    await content.fonts.ready;
    // Mantiene el documento vivo hasta que el navegador cierre su diálogo de impresión.
    const cleanup = () => frame.remove();
    target.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 300000);
    target.focus();
    target.print();
  } catch (error) {
    frame.remove();
    throw error;
  }
}
