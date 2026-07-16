import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState, Platform } from 'react-native';

// expo-notifications was removed from Expo Go on Android (SDK 53+): even
// importing it there throws. Lazy-require so the app still runs in Expo Go
// (UI only, no system notifications); a development build gets the real thing.
let Notifications: typeof import('expo-notifications') | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch {
    Notifications = null;
  }
}

const NATIVE = Notifications !== null;
import { getOpenIncidents } from './api';
import { useApp } from './AppContext';
import { timeAgo } from './dates';
import { getTracker, setTracker, TrackerState } from './storage';
import { Incident } from './types';

export interface NotificationEvent {
  title: string;
  body: string;
}

/** Pure diff: compares persisted open-incident ids against the fresh fetch.
 *  First successful poll only seeds state (no post-login storm). A vanished id
 *  means the incident resolved -> recovery event. */
export function diffIncidents(
  prev: TrackerState,
  fetched: Incident[],
): { next: TrackerState; events: NotificationEvent[] } {
  const nextKnown: TrackerState['knownOpen'] = {};
  for (const incident of fetched) {
    nextKnown[String(incident.id)] = { urlName: incident.url_name, severity: incident.severity };
  }
  const next: TrackerState = { seeded: true, knownOpen: nextKnown };
  if (!prev.seeded) return { next, events: [] };

  const events: NotificationEvent[] = [];
  for (const incident of fetched) {
    if (!(String(incident.id) in prev.knownOpen)) {
      const emoji = incident.severity === 'WARN' ? '🟠' : '🔴';
      const verb = incident.severity === 'WARN' ? 'is degraded' : 'is DOWN';
      events.push({
        title: `${emoji} ${incident.url_name} ${verb}`,
        body: `${incident.url_address} — since ${timeAgo(incident.started_at)}`,
      });
    }
  }
  for (const [id, meta] of Object.entries(prev.knownOpen)) {
    if (!(id in nextKnown)) {
      events.push({ title: `🟢 ${meta.urlName} recovered`, body: 'The monitor is back up.' });
    }
  }
  return { next, events };
}

if (NATIVE) {
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

interface NotificationsState {
  openCount: number;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsState>({ openCount: 0, refresh: async () => {} });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const [openCount, setOpenCount] = useState(0);
  const inFlight = useRef(false);

  const poll = useCallback(async () => {
    if (!user || inFlight.current) return;
    inFlight.current = true;
    try {
      const open = await getOpenIncidents();
      setOpenCount(open.length);
      const prev = await getTracker();
      const { next, events } = diffIncidents(prev, open);
      if (NATIVE) {
        for (const event of events) {
          await Notifications!.scheduleNotificationAsync({
            content: { title: event.title, body: event.body, data: { screen: 'incidents' } },
            trigger: null,
          });
        }
      } else {
        // Web preview: use the browser's Notification API instead.
        const WebNotification = (globalThis as any).Notification;
        if (WebNotification && WebNotification.permission === 'granted') {
          for (const event of events) {
            new WebNotification(event.title, { body: event.body });
          }
        }
      }
      await setTracker(next);
    } catch {
      // Network blip: skip the cycle unchanged; never fake a recovery.
    } finally {
      inFlight.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (NATIVE) {
        const { status } = await Notifications!.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications!.setNotificationChannelAsync('incidents', {
            name: 'Incident alerts',
            importance: Notifications!.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF7F50',
          });
        }
      } else {
        const WebNotification = (globalThis as any).Notification;
        if (WebNotification && WebNotification.permission === 'default') {
          await WebNotification.requestPermission();
        }
      }
      if (!cancelled) void poll();
    })();

    const interval = setInterval(() => void poll(), 30000);
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state === 'active') void poll();
    });
    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
  }, [user, poll]);

  const value = useMemo(() => ({ openCount, refresh: poll }), [openCount, poll]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsState {
  return useContext(NotificationsContext);
}
