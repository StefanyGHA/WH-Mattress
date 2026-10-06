import Header from '@/components/Header';
import { reportStyles as s } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { PHOTO_CATEGORIES, type ReportPhoto } from '@/utils/report-photos';
import { buildPhotoReportHtml } from '@/utils/report-html';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

/** Conserva las miniaturas y los estilos existentes de la vista previa. */
function PhotoPanel({ photo }: { photo: ReportPhoto }) {
  return <View style={s.photoCard}><Text style={[s.caption, { backgroundColor: '#315E78', color: '#FFFFFF' }]}>Foto {photo.number}</Text><Image source={{ uri: photo.uri }} style={s.photo} resizeMode="contain" /></View>;
}

/** Presenta todos los modelos del reporte y permite editarlo o compartir su PDF. */
export default function ReportScreen() {
  const router = useRouter();
  const { report, setReport } = useReport();
  const [busy, setBusy] = useState(false);
  const photos = report?.models.flatMap(model => model.photos) ?? [];

  /** Exporta la fecha de creación y todas las páginas, incluido el resumen de Python. */
  const generate = async () => {
    if (busy || !report?.models.length) return;
    setBusy(true);
    try {
      if (photos.some(photo => !photo.base64)) throw new Error('Missing image data');
      const html = buildPhotoReportHtml(report);
      // En web se usa la impresión del navegador; en celular se genera un archivo compartible.
      if (Platform.OS === 'web') { await Print.printAsync({ html }); return; }
      const result = await Print.printToFileAsync({ html, width: 792, height: 612, margins: { top: 0, right: 0, bottom: 0, left: 0 } });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Compartir informe WH Mattress' });
      else Alert.alert('PDF generado', `Guardado en: ${result.uri}`);
    } catch {
      Alert.alert('No se pudo generar el PDF', 'Intenta nuevamente. Si el problema persiste, vuelve a cargar las fotografías.');
    } finally { setBusy(false); }
  };

  /** Cancela el reporte completo, incluyendo sus modelos y lotes adicionales. */
  const cancel = () => Alert.alert('Cancelar informe', '¿Deseas eliminar todos los datos y fotografías del informe actual?', [
    { text: 'No', style: 'cancel' },
    { text: 'Sí, cancelar', style: 'destructive', onPress: () => { setReport(null); router.dismissAll(); router.replace('/'); } },
  ]);

  return <SafeAreaView style={s.screen}><Header showBackButton /><ScrollView contentContainerStyle={s.content}>
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
      {report?.models.map((model, index) => <Text key={model.id} style={s.text}>{index + 1}. {model.name} · {model.lot}</Text>)}
      <Text style={s.text}>Total de modelos registrados: {report?.models.length ?? 0}</Text>
    </View>

    {/* Cada modelo mantiene sus dos etiquetas juntas y sus nueve fotos en otra página. */}
    {report?.models.map(model => <View key={model.id} style={{ gap: 16 }}>
      <Text style={s.category}>{model.name} · {model.lot}</Text>
      {[{ title: 'ETIQUETAS DEL MODELO', categories: PHOTO_CATEGORIES.slice(0, 2) }, { title: 'APARIENCIA GENERAL Y MEDIDAS', categories: PHOTO_CATEGORIES.slice(2) }].map(section => <View key={section.title} style={s.card}>
        <Text style={s.category}>{section.title}</Text>
        {section.categories.map(category => <View key={category.id} style={{ gap: 8 }}>
          <Text style={s.category}>{category.title}</Text>
          <View style={s.grid}>{model.photos.filter(photo => photo.category === category.id).map(photo => <PhotoPanel key={photo.id} photo={photo} />)}</View>
          {!model.photos.some(photo => photo.category === category.id) && <Text style={s.text}>Sin fotografías</Text>}
        </View>)}
      </View>)}
    </View>)}
    <Text style={s.text}>En el PDF, las 3 fotos de apariencia y las 6 de medidas comparten página. Los extras van en páginas adicionales del mismo modelo.</Text>
    <TouchableOpacity disabled={busy || !report?.models.length} style={[s.button, (busy || !report?.models.length) && s.disabled]} onPress={generate}><Text style={s.buttonText}>{busy ? 'Generando PDF…' : 'Generar y compartir PDF'}</Text></TouchableOpacity>
    <TouchableOpacity disabled={busy} onPress={cancel}><Text style={{ textAlign: 'center', padding: 15, color: '#DC2626', fontWeight: '600' }}>Cancelar informe</Text></TouchableOpacity>
  </ScrollView></SafeAreaView>;
}
