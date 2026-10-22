// The sign-in token lives in the iOS Keychain / Android Keystore via expo-secure-store.
// The browser build (used only for testing) falls back to localStorage, since secure storage does not exist on the web.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'honestbox.token';

export async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return globalThis.localStorage?.getItem(KEY) ?? null; } catch { return null; }
  }
  return SecureStore.getItemAsync(KEY);
}

export async function saveToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try { token ? globalThis.localStorage?.setItem(KEY, token) : globalThis.localStorage?.removeItem(KEY); } catch { /* private mode */ }
    return;
  }
  if (token) await SecureStore.setItemAsync(KEY, token);
  else await SecureStore.deleteItemAsync(KEY);
}
