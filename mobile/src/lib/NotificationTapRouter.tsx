import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useApp } from './AppContext';

/** Routes notification taps to the Incidents tab. Lives in its own module so
 *  the root layout can lazy-require it — importing expo-notifications crashes
 *  in Expo Go on Android (module removed in SDK 53+). */
export default function NotificationTapRouter() {
  const lastResponse = Notifications.useLastNotificationResponse();
  const { user } = useApp();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/incidents');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (user && lastResponse?.notification.request.content.data?.screen === 'incidents') {
      router.push('/(tabs)/incidents');
    }
  }, [user, lastResponse]);

  return null;
}
