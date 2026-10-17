import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({
  showBackButton = false,
}: HeaderProps) {
  const router = useRouter();
  
   return (
    <View style={styles.header}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      )}

      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/wh-m.jpg")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.logoText}>WH Mattress</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 140,
    backgroundColor: "#28C9C2",
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
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
  },

   backButton: {
    position: "absolute",
    left: 20,
    zIndex: 1,
  },
});