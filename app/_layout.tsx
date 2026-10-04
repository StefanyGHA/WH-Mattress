import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { ReportProvider } from '@/contexts/report';
export default function RootLayout() {
  return <ReportProvider><Stack screenOptions={{ headerShown: false }} /></ReportProvider>;
}
