import { Stack } from 'expo-router';

export default function TasksLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tapping-speed" />
      <Stack.Screen name="stroop-test" />
      <Stack.Screen name="reaction-time" />
      <Stack.Screen name="tower-of-hanoi" />
      <Stack.Screen name="spatial-memory" />
      <Stack.Screen name="decision-task" />
      <Stack.Screen name="sound-discrimination" />
    </Stack>
  );
}