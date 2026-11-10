import { useState } from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { usePreferences } from '@/contexts/preferences';
import { photoSourceUri, type ReportPhoto } from '@/utils/report-photos';
import { useReportStyles } from './report-styles';

/** Cuadro de miniaturas: cada toque asigna el siguiente número sin modificar aún el reporte. */
export default function PhotoOrderDialog({ photos, onConfirm, onCancel }: {
  photos: ReportPhoto[]; onConfirm: (ids: string[]) => void; onCancel: () => void;
}) {
  const { t, colors } = usePreferences();
  const s = useReportStyles();
  const [order, setOrder] = useState<string[]>([]);
  return <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: colors.overlay }}><View style={[s.card, { backgroundColor: colors.elevated, maxHeight: '94%', width: '100%', maxWidth: 680, alignSelf: 'center' }]} accessibilityViewIsModal>
      <Text style={s.title}>{t('Orden de las fotos')}</Text>
      <Text style={s.text}>{t('Toca las fotos en el orden del reporte. Los números aparecen al seleccionarlas.')}</Text>
      <Text style={s.category}>{t('{count}/{total} fotos numeradas', { count: order.length, total: photos.length })}</Text>
      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((photo, index) => {
          const number = order.indexOf(photo.id) + 1;
          return <TouchableOpacity key={photo.id} accessibilityRole="button" accessibilityLabel={t('Imagen {n}, posición {position}', { n: index + 1, position: number || '-' })} onPress={() => setOrder(current => current.includes(photo.id) ? current.filter(id => id !== photo.id) : [...current, photo.id])} style={{ width: '31%', borderWidth: number ? 2 : 1, borderColor: number ? colors.primary : colors.border, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.inset }}>
            <Image source={{ uri: photoSourceUri(photo) }} resizeMode="contain" style={{ width: '100%', height: 110 }} />
            {!!number && <View style={{ position: 'absolute', top: 4, left: 4, minWidth: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={s.buttonText}>{number}</Text></View>}
          </TouchableOpacity>;
        })}
      </ScrollView>
      <TouchableOpacity accessibilityRole="button" onPress={() => setOrder([])} style={[s.button, s.secondary]}><Text style={[s.buttonText, s.secondaryText]}>{t('Reiniciar numeración')}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={order.length !== photos.length} style={[s.button, order.length !== photos.length && s.disabled]} onPress={() => onConfirm(order)}><Text style={s.buttonText}>{t('Usar este orden')}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onCancel} style={{ padding: 8, alignItems: 'center' }}><Text style={s.text}>{t('Cancelar')}</Text></TouchableOpacity>
    </View></View>
  </Modal>;
}
