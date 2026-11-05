import { useState } from 'react';
import { usePreferences } from '@/contexts/preferences';
import SettingsMenu from './SettingsMenu';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  showBackButton?: boolean;
  /** Permite retroceder dentro del asistente sin abandonar el reporte. */
  onBack?: () => void;
  backDisabled?: boolean;
}

export default function Header({
  showBackButton = false,
  onBack,
  backDisabled = false,
}: HeaderProps) {
  const router = useRouter();
  const { t, colors } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
   return (
    <View style={[styles.header, { backgroundColor: colors.header }]}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          accessibilityLabel={t('Retroceder')}
          disabled={backDisabled}
          onPress={() => onBack ? onBack() : router.canGoBack() ? router.back() : router.replace("/")}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color={colors.onHeader}
          />
        </TouchableOpacity>
      )}

      {/* Abre ajustes sin salir del formulario ni perder fotografías. */}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('Ajustes')} disabled={backDisabled} onPress={() => setSettingsOpen(true)} style={{ position: 'absolute', right: 12, padding: 12, zIndex: 1 }}><Ionicons name="settings-outline" size={26} color={colors.onHeader} /></TouchableOpacity>
      <SettingsMenu visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/wh-m.jpg")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={[styles.logoText, { color: colors.onHeader }]}>WH Mattress</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  logoImage: {
    width: 45,
    height: 45,
  },

  logoText: {
    fontSize: 28,
    fontWeight: "600",
  },

   backButton: {
    position: "absolute",
    left: 20,
    zIndex: 1,
  },
});