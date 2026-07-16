import { Redirect } from 'expo-router';
import { useApp } from '../lib/AppContext';

export default function Index() {
  const { isReady, user } = useApp();
  if (!isReady) return null;
  return <Redirect href={user ? '/(tabs)/monitors' : '/login'} />;
}
