import { Platform } from 'react-native';
import { isWebProductionRestricted } from './webAuthPolicy';

export function isWebPlatform(): boolean {
  return Platform.OS === 'web';
}

/** PWA / web staging activé (EXPO_PUBLIC_ALLOW_WEB_PROD=true, build export web). */
export function isWebStagingPwa(): boolean {
  return isWebPlatform() && !isWebProductionRestricted();
}

/** Bandeau « beta web » (staging hébergé, pas expo start --web en dev). */
export function shouldShowWebBetaBanner(): boolean {
  return isWebStagingPwa() && !__DEV__;
}
