import 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

const vaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#09090b',
    card: '#111113',
    text: '#f4f4f5',
    border: '#27272a',
    primary: '#a78bfa',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={vaultTheme}>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
