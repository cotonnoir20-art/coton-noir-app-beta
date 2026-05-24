import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Accueil' }} />
      <Tabs.Screen name="shortcuts" options={{ title: 'Explorer' }} />
      <Tabs.Screen name="analyze"   options={{ href: null }} />
      <Tabs.Screen name="routine" options={{ title: 'Routine' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil'  }} />
    </Tabs>
  );
}
