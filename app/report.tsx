import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import ReportSummaryTable from '@/components/ReportSummaryTable';
import CancelReportButton from '@/components/CancelReportButton';
import { reportStyles as s } from '@/components/report-styles';
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
import { Alert, Image, Platform, SectionList, Text, TouchableOpacity, View } from 'react-native';

/** Conserva las miniaturas y los estilos existentes de la vista previa. */
function PhotoPanel({ photo }: { photo: ReportPhoto }) {
  return <View style={s.photoCard}><Text style={[s.caption, { backgroundColor: '#315E78', color: '#FFFFFF' }]}>Foto {photo.number}{photo.category === 'appearance' || photo.category === 'measures' ? ` · Muestra ${photo.sampleNumber ?? 1}` : ''}</Text><Image source={{ uri: photoSourceUri(photo) }} style={s.photo} resizeMode="contain" /></View>;
}

/** Presenta todos los modelos del reporte y permite editarlo o compartir su PDF. */
export default function ReportScreen() {
  const router = useRouter();
  const { report } = useReport();
  const [busy, setBusy] = useState(false);
  // Permite ver el avance cuando el reporte contiene muchas fotografías.
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const photos = report?.models.flatMap(model => model.photos) ?? [];

  // Las filas virtualizadas limitan las imágenes montadas al revisar muestras grandes.
  const sections = useMemo(() => report?.models.flatMap(model => PHOTO_CATEGORIES.flatMap(category => {
    const samples = category.id === 'box' || category.id === 'mattress' ? [0] : Array.from(new Set([1, ...model.photos.filter(photo => photo.category === category.id).map(photo => photo.sampleNumber ?? 1)])).sort((a, b) => a - b);
    return samples.map(sample => {
      const group = model.photos.filter(photo => photo.category === category.id && (!sample || (photo.sampleNumber ?? 1) === sample)).sort((a, b) => a.number - b.number);
      return { key: `${model.id}-${category.id}-${sample}`, title: `${model.name} · ${category.title}${sample ? ` · MUESTRA ${sample}` : ''}`, data: group.length ? Array.from({ length: Math.ceil(group.length / 2) }, (_, index) => group.slice(index * 2, index * 2 + 2)) : [[]] };
    });
  })) ?? [], [report]);

  /** Exporta la fecha de creación y todas las páginas, incluido el resumen de Python. */
  const generate = async () => {
    if (busy || !report?.models.length) return;
    const invalid = validateReportTable(report) ?? missingReportPhotos(report);
    if (invalid) { setError(invalid); return; }
    setError(''); setBusy(true);
    try {
      setProgress('Preparando fotografías…');
      const prepared = await prepareReportForPrint(report, preparePrintPhoto, (completed, total) => setProgress(`Preparando fotos ${completed}/${total}…`));
      setProgress('Generando PDF…');
      // En web se usa la impresión del navegador; en celular se genera un archivo compartible.
      if (Platform.OS === 'web') { await printReportHtml(buildPhotoReportHtml(prepared)); return; }
      const result = await exportReportPdf(prepared, (completed, total) => setProgress(`Generando página ${completed}/${total}…`));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Compartir informe WH Mattress' });
      else Alert.alert('PDF generado', `Guardado en: ${result.uri}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo generar el PDF. Intenta nuevamente.');
    } finally { setBusy(false); }
  };

  return <SafeAreaView style={s.screen}><Header showBackButton backDisabled={busy} /><SectionList style={{ flex: 1 }} sections={sections} contentContainerStyle={s.content} stickySectionHeadersEnabled={false} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5}
    keyExtractor={(row, index) => row.map(photo => photo.id).join('-') || `empty-${index}`}
    renderSectionHeader={({ section }) => <Text style={[s.category, { marginTop: 16 }]}>{section.title}</Text>}
    renderItem={({ item }) => <View style={s.grid}>{item.length ? item.map(photo => <PhotoPanel key={photo.id} photo={photo} />) : <Text style={s.text}>Sin fotografías</Text>}</View>}
    ListHeaderComponent={<View style={{ gap: 16 }}>
    <TouchableOpacity disabled={busy || !report?.models.length} style={s.button} onPress={() => router.push('/edit-report')}><Text style={s.buttonText}>Editar informe · organizar fotos</Text></TouchableOpacity>
    <Text style={s.title}>Vista previa del informe</Text>
    <Text style={s.text}>{photos.length} fotografías · {report?.date}</Text>

    {/* El resumen conserva fecha, lote principal y tabla de modelos del archivo Python. */}
    <View style={s.card}>
      <Image source={require('../assets/images/wh-m.jpg')} style={{ width: 45, height: 45 }} resizeMode="contain" />
      <Text style={s.category}>PRODUCTION REPORT WH MATTRESS PANAMA</Text>
      <Text style={s.category}>RESUMEN GENERAL</Text>
      <Text style={s.text}>Fecha del reporte: {report?.date}</Text>
      <Text style={s.text}>Lote principal: {report?.principalLot}</Text>
      {report && <ReportSummaryTable report={report} />}
      {report?.models.map(model => <Text key={model.id} style={s.text}>{model.name}: muestra de {modelSampleCount(model)} colchones · {modelSampleCount(model) * 9} fotos + 2 etiquetas</Text>)}
      <Text style={s.text}>Total de modelos registrados: {report?.models.length ?? 0}</Text>
    </View>

    </View>}
    ListFooterComponent={<View style={{ gap: 16 }}>
    <Text style={s.text}>En el PDF, las 3 fotos de apariencia y las 6 de medidas comparten página. Cada colchón de la muestra tiene su propia página. Las fotos adicionales se conservan.</Text>
    <TouchableOpacity disabled={busy || !report?.models.length} style={[s.button, (busy || !report?.models.length) && s.disabled]} onPress={generate}><Text style={s.buttonText}>{busy ? progress : 'Generar y compartir PDF'}</Text></TouchableOpacity>
    {!!error && <View style={s.card}><Text accessibilityRole="alert" style={{ color: '#DC2626' }}>{error}</Text><TouchableOpacity onPress={() => router.push('/edit-report')}><Text style={s.category}>Editar o reemplazar fotografías</Text></TouchableOpacity><TouchableOpacity onPress={() => router.dismissTo('/')}><Text style={s.category}>Volver a la captura</Text></TouchableOpacity></View>}
    <CancelReportButton disabled={busy} />
  </View>} /></SafeAreaView>;
}
