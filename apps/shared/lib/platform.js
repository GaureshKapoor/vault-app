import { Platform } from 'react-native';

export const isIOSApp = () => Platform.OS === 'ios';
export const isAndroidApp = () => Platform.OS === 'android';
export const isNative = () => isIOSApp() || isAndroidApp();
