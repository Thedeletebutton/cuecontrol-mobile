import { Stack } from 'expo-router';
import { colors } from '../../src/constants/theme';

export default function ViewerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.panel,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: colors.background.main,
        },
      }}
    >
      <Stack.Screen
        name="request"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
