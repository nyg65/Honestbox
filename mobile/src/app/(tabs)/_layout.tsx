import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSession } from '../../lib/session';
import { C, F } from '../../lib/theme';

const Icon = ({ d, color }: { d: string; color: ColorValue }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><Path d={d} /></Svg>
);

export default function TabsLayout() {
  const { account } = useSession();
  if (!account) return <Redirect href="/welcome" />;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.green },
        headerTitleStyle: { fontFamily: F.serif, color: C.ivory, fontSize: 20 },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: C.green, borderTopColor: C.rule },
        tabBarActiveTintColor: C.brass,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontFamily: F.sans, fontSize: 11 },
        sceneStyle: { backgroundColor: C.green },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Boxes', tabBarIcon: ({ color }) => <Icon color={color} d="M3 7h18v13H3zM3 11h18M12 7v13" /> }} />
      <Tabs.Screen name="drops" options={{ title: 'Drops', tabBarIcon: ({ color }) => <Icon color={color} d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l3 2M9 2h6" /> }} />
      <Tabs.Screen name="vault" options={{ title: 'Vault', tabBarIcon: ({ color }) => <Icon color={color} d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color }) => <Icon color={color} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /> }} />
    </Tabs>
  );
}
