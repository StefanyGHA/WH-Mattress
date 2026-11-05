import { LocalizedError, type Translate } from '@/utils/i18n';
import { usePreferences } from '@/contexts/preferences';
import Header from '@/components/Header';
import ReportSummaryTable from '@/components/ReportSummaryTable';
import CancelReportButton from '@/components/CancelReportButton';
import { useReportStyles } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { PHOTO_CATEGORIES, missingReportPhotos, modelSampleCount, photoSourceUri, validateReportTable, type ReportPhoto } from '@/utils/report-photos';
import { buildPhotoReportHtml } from '@/utils/report-html';
import { prepareReportForPrint } from '@/utils/prepare-report';
import { preparePrintPhoto } from '@/utils/prepare-report-images';
import { printReportHtml } from '@/utils/print-report';
import { exportReportPdf } from '@/utils/export-report';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, SectionList, Text, TouchableOpacity, View } from 'react-native';

/** Conserva las miniaturas y los estilos existentes de la vista previa. */
function PhotoPanel({ photo }: { photo: ReportPhoto }) {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  return <View style={s.photoCard}><Text style={[s.caption, { backgroundColor: colors.secondary, color: colors.onSecondary }]}>{t('Foto {n}', { n: photo.number })}{photo.category === 'appearance' || photo.category === 'measures' ? ` · ${t('Muestra {n}', { n: photo.sampleNumber ?? 1 })}` : ''}</Text><Image source={{ uri: photoSourceUri(photo) }} style={s.photo} resizeMode="contain" /></View>;
}

/** Presenta todos los modelos del reporte y permite editarlo o compartir su PDF. */
export default function ReportScreen() {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  const router = useRouter();
  const { report } = useReport();
  const [busy, setBusy] = useState(false);
  // Permite ver el avance cuando el reporte contiene muchas fotografías.
  const [progress, setProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState<((translate: Translate) => string) | null>(null);
  const error = errorMessage?.(t);
  const photos = report?.models.flatMap(model => model.photos) ?? [];

  // Las filas virtualizadas limitan las imágenes montadas al revisar muestras grandes.
  const sections = useMemo(() => report?.models.flatMap(model => PHOTO_CATEGORIES.flatMap(category => {
    const samples = category.id === 'box' || category.id === 'mattress' ? [0] : Array.from(new Set([1, ...model.photos.filter(photo => photo.category === category.id).map(photo => photo.sampleNumber ?? 1)])).sort((a, b) => a - b);
    return samples.map(sample => {
      const group = model.photos.filter(photo => photo.category === category.id && (!sample || (photo.sampleNumber ?? 1) === sample)).sort((a, b) => a.number - b.number);
      return { key: `${model.id}-${category.id}-${sample}`, title: `${model.name} · ${t(category.title)}${sample ? ` · ${t('Muestra {n}', { n: sample })}` : ''}`, data: group.length ? Array.from({ length: Math.ceil(group.length / 2) }, (_, index) => group.slice(index * 2, index * 2 + 2)) : [[]] };
    });
  })) ?? [], [report, t]);

  /** Exporta la fecha de creación y todas las páginas, incluido el resumen de Python. */
  const generate = async () => {
    if (busy || !report?.models.length) return;
    const invalid = validateReportTable(report, t) ?? missingReportPhotos(report, t);
    if (invalid) { setErrorMessage(() => (translate: Translate) => validateReportTable(report, translate) ?? missingReportPhotos(report, translate) ?? ''); return; }
    setErrorMessage(null); setBusy(true);
    try {
      setProgress(t('Preparando fotografías…'));
      const prepared = await prepareReportForPrint(report, preparePrintPhoto, (completed, total) => setProgress(t('Preparando fotos {completed}/{total}…', { completed, total })), t);
      setProgress(t('Generando PDF…'));
      // En web se usa la impresión del navegador; en celular se genera un archivo compartible.
      if (Platform.OS === 'web') { await printReportHtml(buildPhotoReportHtml(prepared), t); return; }
      const result = await exportReportPdf(prepared, (completed, total) => setProgress(t('Generando página {completed}/{total}…', { completed, total })), t);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t('Compartir informe WH Mattress') });
      else Alert.alert(t('PDF generado'), t('Guardado en: {uri}', { uri: result.uri }));
    } catch (error) {
      setErrorMessage(() => (translate: Translate) => error instanceof LocalizedError ? error.localize(translate) : translate('No se pudo generar el PDF. Intenta nuevamente.'));
    } finally { setBusy(false); }
  };

  return <SafeAreaView style={s.screen}><Header showBackButton backDisabled={busy} /><SectionList style={{ flex: 1 }} sections={sections} contentContainerStyle={s.content} stickySectionHeadersEnabled={false} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5}
    keyExtractor={(row, index) => row.map(photo => photo.id).join('-') || `empty-${index}`}
    renderSectionHeader={({ section }) => <Text style={[s.category, { marginTop: 16 }]}>{section.title}</Text>}
    renderItem={({ item }) => <View style={s.grid}>{item.length ? item.map(photo => <PhotoPanel key={photo.id} photo={photo} />) : <Text style={s.text}>{t('Sin fotografías')}</Text>}</View>}
    ListHeaderComponent={<View style={{ gap: 16 }}>
    <TouchableOpacity disabled={busy || !report?.models.length} style={s.button} onPress={() => router.push('/edit-report')}><Text style={s.buttonText}>{t('Editar informe · organizar fotos')}</Text></TouchableOpacity>
    <Text style={s.title}>{t('Vista previa del informe')}</Text>
    <Text style={s.text}>{t('{count} fotografías · {date}', { count: photos.length, date: report?.date })}</Text>

    {/* El resumen conserva fecha, lote principal y tabla de modelos del archivo Python. */}
    <View style={s.card}>
      <Image source={require('../assets/images/wh-m.jpg')} style={{ width: 45, height: 45 }} resizeMode="contain" />
      <Text style={s.category}>{t('PRODUCTION REPORT WH MATTRESS PANAMA')}</Text>
      <Text style={s.category}>{t('RESUMEN GENERAL')}</Text>
      <Text style={s.text}>{t('Fecha del reporte: {date}', { date: report?.date })}</Text>
      <Text style={s.text}>{t('Lote principal: {lot}', { lot: report?.principalLot })}</Text>
      {report && <ReportSummaryTable report={report} />}
      {report?.models.map(model => <Text key={model.id} style={s.text}>{t('{name}: muestra de {count} colchones · {photos} fotos + 2 etiquetas', { name: model.name, count: modelSampleCount(model), photos: modelSampleCount(model) * 9 })}</Text>)}
      <Text style={s.text}>{t('Total de modelos registrados: {count}', { count: report?.models.length ?? 0 })}</Text>
    </View>

    </View>}
    ListFooterComponent={<View style={{ gap: 16 }}>
    <Text style={s.text}>{t('En el PDF, las 3 fotos de apariencia y las 6 de medidas comparten página. Cada colchón de la muestra tiene su propia página. Las fotos adicionales se conservan.')}</Text>
    <TouchableOpacity disabled={busy || !report?.models.length} style={[s.button, (busy || !report?.models.length) && s.disabled]} onPress={generate}><Text style={s.buttonText}>{busy ? progress : t('Generar y compartir PDF')}</Text></TouchableOpacity>
    {!!error && <View style={s.card}><Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text><TouchableOpacity onPress={() => router.push('/edit-report')}><Text style={s.category}>{t('Editar o reemplazar fotografías')}</Text></TouchableOpacity><TouchableOpacity onPress={() => router.dismissTo('/')}><Text style={s.category}>{t('Volver a la captura')}</Text></TouchableOpacity></View>}
    <CancelReportButton disabled={busy} />
  </View>} /></SafeAreaView>;
}
