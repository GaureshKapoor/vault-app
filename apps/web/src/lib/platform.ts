import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for conditional rendering and platform-specific behavior.
 * Used to differentiate between web browser and iOS app experiences.
 */

/**
 * Returns true if running inside the iOS native app (Capacitor WebView)
 */
export const isIOSApp = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
};

/**
 * Returns true if running inside any native app (iOS or Android)
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Returns true if running in a web browser (not a native app)
 */
export const isWebBrowser = (): boolean => {
  return !Capacitor.isNativePlatform();
};

/**
 * Returns the current platform: 'ios', 'android', or 'web'
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  if (!Capacitor.isNativePlatform()) {
    return 'web';
  }
  return Capacitor.getPlatform() as 'ios' | 'android';
};
