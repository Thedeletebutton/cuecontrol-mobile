import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

function debugLog(message: string) {
  console.log(`[PUSH] ${message}`);
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  console.log('[PUSH] registerForPushNotificationsAsync called');
  console.log('[PUSH] Platform:', Platform.OS);
  console.log('[PUSH] isDevice:', Device.isDevice);

  if (Platform.OS === 'web') {
    debugLog('Skipped: Platform is web');
    return null;
  }
  if (!Device.isDevice) {
    debugLog('Skipped: Not a physical device (simulator)');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('[PUSH] Existing permission status:', existingStatus);
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('[PUSH] Requesting permission...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[PUSH] New permission status:', finalStatus);
  }

  if (finalStatus !== 'granted') {
    debugLog(`Permission denied: status="${finalStatus}". Go to Settings > CueControl > Notifications and enable.`);
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  console.log('[PUSH] EAS projectId:', projectId);
  if (!projectId) {
    debugLog('No EAS projectId found in app config. Push tokens require a projectId.');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    debugLog(`Token obtained: ${token.data.substring(0, 30)}...`);
    return token.data;
  } catch (error: any) {
    debugLog(`Failed to get push token: ${error.message}`);
    return null;
  }
}

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string
): Promise<void> {
  debugLog(`Sending to: ${pushToken.substring(0, 30)}...\nTitle: ${title}\nBody: ${body}`);
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
      }),
    });
    const result = await response.json();
    debugLog(`Expo Push API response: ${JSON.stringify(result)}`);
  } catch (error: any) {
    debugLog(`Send FAILED: ${error.message}`);
  }
}
