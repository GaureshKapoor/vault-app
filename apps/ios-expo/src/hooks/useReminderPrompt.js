import { Alert } from 'react-native';

export function useReminderPrompt() {
  const scheduleReminder = async () => {
    Alert.alert('Coming soon', 'Push notifications will be added once Expo EAS is wired.');
  };
  return { scheduleReminder };
}
