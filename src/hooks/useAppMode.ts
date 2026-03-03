import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppMode = 'dj' | 'viewer' | null;

const MODE_STORAGE_KEY = '@cuecontrol_mode';
const CHANNEL_STORAGE_KEY = '@cuecontrol_channel';

export function useAppMode() {
  const [mode, setModeState] = useState<AppMode>(null);
  const [channelName, setChannelNameState] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersistedValues();
  }, []);

  async function loadPersistedValues() {
    try {
      const [savedMode, savedChannel] = await Promise.all([
        AsyncStorage.getItem(MODE_STORAGE_KEY),
        AsyncStorage.getItem(CHANNEL_STORAGE_KEY),
      ]);

      if (savedMode === 'dj' || savedMode === 'viewer') {
        setModeState(savedMode);
      }
      if (savedChannel) {
        setChannelNameState(savedChannel);
      }
    } catch (error) {
      console.error('Failed to load app mode:', error);
    } finally {
      setLoading(false);
    }
  }

  async function setMode(newMode: AppMode) {
    try {
      if (newMode) {
        await AsyncStorage.setItem(MODE_STORAGE_KEY, newMode);
      } else {
        await AsyncStorage.removeItem(MODE_STORAGE_KEY);
      }
      setModeState(newMode);
    } catch (error) {
      console.error('Failed to save app mode:', error);
    }
  }

  async function setChannelName(name: string) {
    try {
      await AsyncStorage.setItem(CHANNEL_STORAGE_KEY, name);
      setChannelNameState(name);
    } catch (error) {
      console.error('Failed to save channel name:', error);
    }
  }

  async function clearMode() {
    try {
      await AsyncStorage.removeItem(MODE_STORAGE_KEY);
      setModeState(null);
    } catch (error) {
      console.error('Failed to clear app mode:', error);
    }
  }

  return {
    mode,
    setMode,
    channelName,
    setChannelName,
    clearMode,
    loading,
  };
}
