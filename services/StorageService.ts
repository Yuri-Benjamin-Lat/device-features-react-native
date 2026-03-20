import AsyncStorage from '@react-native-async-storage/async-storage';
import { TravelEntry } from '../src/types';

const ENTRIES_KEY = '@travel_diary_entries';

export const StorageService = {
  async getEntries(): Promise<TravelEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(ENTRIES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as TravelEntry[];
    } catch (error) {
      console.error('StorageService.getEntries error:', error);
      return [];
    }
  },

  async saveEntries(entries: TravelEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('StorageService.saveEntries error:', error);
      throw new Error('Failed to save entries. Please try again.');
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ENTRIES_KEY);
    } catch (error) {
      console.error('StorageService.clearAll error:', error);
    }
  },
};