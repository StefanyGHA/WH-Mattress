import Header from '@/components/Header';
import { reportStyles as s } from '@/components/report-styles';
import { useReport } from '@/contexts/report';
import { PHOTO_CATEGORIES, type ReportPhoto } from '@/utils/report-photos';
import { buildPhotoReportHtml } from '@/utils/report-html';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
function PhotoPanel({ photo }: { photo: ReportPhoto }) {
  return <View style={s.photoCard}><Text style={[s.caption, { backgroundColor: '#315E78', color: '#FFFFFF' }]}>Foto {photo.number}</Text><Image source={{ uri: photo.uri }} style={s.photo} resizeMode="contain" /></View>;
}
export default function ReportScreen() {
  const router = useRouter();
  const { photos, setPhotos } = useReport();
  const [busy, setBusy] = useState(false);
  const date = new Date().toLocaleDateString('sv-SE');
  const generate = async () => {
    if (busy || !photos.length) return;
    setBusy(true);
    try {
      if (photos.some(photo => !photo.base64)) throw new Error('Missing image data');
      const result = await Print.printToFileAsync({ html: buildPhotoReportHtml(photos, date), width: 792, height: 612 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Compartir informe WH Mattress' });
      else Alert.alert('PDF generado', `Guardado en: ${result.uri}`);
    } catch { Alert.alert('No se pudo generar el PDF', 'Intenta nuevamente. Si el problema persiste, vuelve a cargar las fotografías.'); }
    finally { setBusy(false); }
  };
  const cancel = () => Alert.alert('Cancelar informe', '¿Deseas eliminar todas las fotografías del informe actual?', [
    { text: 'No', style: 'cancel' }, { text: 'Sí, cancelar', style: 'destructive', onPress: () => { setPhotos([]); router.dismissAll(); router.replace('/'); } },
  ]);
  return <SafeAreaView style={s.screen}><Header showBackButton /><ScrollView contentContainerStyle={s.content}>
    <TouchableOpacity disabled={busy} style={s.button} onPress={() => router.push('/edit-report')}><Text style={s.buttonText}>Editar informe · organizar fotos</Text></TouchableOpacity>
    <Text style={s.title}>Vista previa del informe</Text>
    <Text style={s.text}>{photos.length} fotografías · {date}</Text>
    <View style={s.card}><Text style={s.category}>PRODUCTION REPORT WH MATTRESS PANAMA</Text><Text style={s.text}>ETIQUETAS DEL MODELO</Text>
      {PHOTO_CATEGORIES.slice(0, 2).map(category => <View key={category.id} style={{ gap: 8 }}><Text style={s.category}>{category.title}</Text><View style={s.grid}>{photos.filter(photo => photo.category === category.id).map(photo => <PhotoPanel key={photo.id} photo={photo} />)}</View>{!photos.some(photo => photo.category === category.id) && <Text style={s.text}>Sin fotografías</Text>}</View>)}
    </View>
    <View style={s.card}><Text style={s.category}>APARIENCIA GENERAL Y MEDIDAS</Text><Text style={s.text}>El PDF muestra apariencia a la izquierda y medidas a la derecha. Todas las fotos se incluyen en páginas adicionales cuando es necesario.</Text>
      {PHOTO_CATEGORIES.slice(2).map(category => <View key={category.id} style={{ gap: 8 }}><Text style={s.category}>{category.title}</Text><View style={s.grid}>{photos.filter(photo => photo.category === category.id).map(photo => <PhotoPanel key={photo.id} photo={photo} />)}</View>{!photos.some(photo => photo.category === category.id) && <Text style={s.text}>Sin fotografías</Text>}</View>)}
    </View>
    <TouchableOpacity disabled={busy || !photos.length} style={[s.button, (busy || !photos.length) && s.disabled]} onPress={generate}><Text style={s.buttonText}>{busy ? 'Generando PDF…' : 'Generar y compartir PDF'}</Text></TouchableOpacity>
    <TouchableOpacity disabled={busy} onPress={cancel}><Text style={{ textAlign: 'center', padding: 15, color: '#DC2626', fontWeight: '600' }}>Cancelar informe</Text></TouchableOpacity>
  </ScrollView></SafeAreaView>;
}
