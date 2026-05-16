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
      <Tabs.Screen name="index"   options={{ title: 'Accueil' }} />
      <Tabs.Screen name="growth"  options={{ title: 'Progrès' }} />
      <Tabs.Screen name="analyze" options={{ title: 'Ajouter' }} />
      <Tabs.Screen name="routine" options={{ title: 'Routine' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil'  }} />
    </Tabs>
  );
}
