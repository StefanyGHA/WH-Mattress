import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { usePreferences } from '@/contexts/preferences';
import { acquirePhotos } from '@/utils/acquire-photos';
import { LocalizedError } from '@/utils/i18n';
import type { ReportPhoto } from '@/utils/report-photos';

type PhotoActionsProps = {
  photo: ReportPhoto;
  disabled: boolean;
  onDelete: () => void;
  onReplace: (photo: ReportPhoto) => void;
  onBusy: (busy: boolean) => void;
};

/** Botones para eliminar o volver a tomar la fotografía. */
export default function PhotoActions({
  photo,
  disabled,
  onDelete,
  onReplace,
  onBusy,
}: PhotoActionsProps) {
  const { t, colors } = usePreferences();

  const active = useRef(false);
  const [retaking, setRetaking] = useState(false);
  const [error, setError] = useState<LocalizedError | null>(null);

  const blocked = disabled || retaking;

  /** Conserva la foto original si se cancela o falla la cámara. */
  const retake = async () => {
    if (disabled || active.current) return;

    active.current = true;
    setRetaking(true);
    setError(null);
    onBusy(true);

    try {
      const [replacement] = await acquirePhotos(
        'camera',
        1,
        photo.category,
        t,
      );

      if (replacement) {
        onReplace(replacement);
      }
    } catch (error) {
      setError(
        error instanceof LocalizedError
          ? error
          : new LocalizedError('No se pudo abrir la imagen.'),
      );
    } finally {
      active.current = false;
      setRetaking(false);
      onBusy(false);
    }
  };

  return (
    <>
      <View pointerEvents="box-none" style={styles.actions}>
        {/* Eliminar: la pantalla mantiene su diálogo de confirmación. */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('Eliminar foto {n}', {
            n: photo.number,
          })}
          accessibilityState={{ disabled: blocked }}
          disabled={blocked}
          activeOpacity={0.7}
          onPress={() => {
            if (!disabled && !active.current) onDelete();
          }}
          style={[
            styles.button,
            blocked && styles.disabled,
          ]}
        >
          <Ionicons
            name="trash-outline"
            size={24}
            color="#C62828"
          />
        </TouchableOpacity>

        {/* Abrir la cámara para reemplazar la fotografía. */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('Retomar foto {n}', {
            n: photo.number,
          })}
          accessibilityState={{
            disabled: blocked,
            busy: retaking,
          }}
          disabled={blocked}
          activeOpacity={0.7}
          onPress={retake}
          style={[
            styles.button,
            blocked && styles.disabled,
          ]}
        >
          {retaking ? (
            <ActivityIndicator
              size="small"
              color="#315E78"
            />
          ) : (
            <Ionicons
              name="camera-outline"
              size={24}
              color="#315E78"
            />
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <Text
          accessibilityRole="alert"
          style={{
            color: colors.danger,
            padding: 8,
          }}
        >
          {error.localize(t)}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E1E8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});