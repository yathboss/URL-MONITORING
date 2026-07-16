import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'uptime_jwt';
const BASE_URL_KEY = 'uptime_base_url';
const TRACKER_KEY = 'incidentTracker:v1';

// SecureStore has no web implementation; browser preview falls back to
// AsyncStorage (dev convenience only — the real app runs on the phone).
const secureAvailable = Platform.OS !== 'web';

export async function getToken(): Promise<string | null> {
  if (!secureAvailable) return AsyncStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (!secureAvailable) {
    if (token === null) await AsyncStorage.removeItem(TOKEN_KEY);
    else await AsyncStorage.setItem(TOKEN_KEY, token);
    return;
  }
  if (token === null) await SecureStore.deleteItemAsync(TOKEN_KEY);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getBaseUrl(): Promise<string | null> {
  return AsyncStorage.getItem(BASE_URL_KEY);
}

export async function setBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(BASE_URL_KEY, url.replace(/\/+$/, ''));
}

export interface TrackerState {
  seeded: boolean;
  knownOpen: Record<string, { urlName: string; severity: string }>;
}

export const EMPTY_TRACKER: TrackerState = { seeded: false, knownOpen: {} };

export async function getTracker(): Promise<TrackerState> {
  const raw = await AsyncStorage.getItem(TRACKER_KEY);
  if (!raw) return EMPTY_TRACKER;
  try {
    return JSON.parse(raw) as TrackerState;
  } catch {
    return EMPTY_TRACKER;
  }
}

export async function setTracker(state: TrackerState): Promise<void> {
  await AsyncStorage.setItem(TRACKER_KEY, JSON.stringify(state));
}

export async function resetTracker(): Promise<void> {
  await AsyncStorage.removeItem(TRACKER_KEY);
}
