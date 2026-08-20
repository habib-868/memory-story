import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
        }}
      />

      <Tabs.Screen
        name="stories"
        options={{
          title: 'My Stories',
        }}
      />

      <Tabs.Screen
        name="month"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="week"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      
    </Tabs>
  );
}