import { Stack } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

export default function RootLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" />
      </Stack.Protected>
    </Stack>
  );
}