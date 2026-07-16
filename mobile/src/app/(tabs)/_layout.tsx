import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../lib/notifications';
import { theme } from '../../lib/theme';

export default function TabsLayout() {
  const { openCount } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.faint,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen
        name="monitors"
        options={{
          title: 'Monitors',
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: 'Incidents',
          tabBarBadge: openCount > 0 ? openCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.down, color: '#fff' },
          tabBarIcon: ({ color, size }) => <Ionicons name="warning" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-sharp" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
