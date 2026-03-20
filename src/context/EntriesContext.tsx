import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { TravelEntry, EntriesContextType } from '../types';
import { StorageService } from '../../services/StorageService';

const EntriesContext = createContext<EntriesContextType>({
  entries: [],
  addEntry: async () => {},
  removeEntry: async () => {},
  loadEntries: async () => {},
});

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<TravelEntry[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const loaded = await StorageService.getEntries();
    setEntries(loaded);
  };

  const addEntry = async (entry: TravelEntry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    await StorageService.saveEntries(updated);
  };

  const removeEntry = async (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    await StorageService.saveEntries(updated);
  };

  return (
    <EntriesContext.Provider
      value={{ entries, addEntry, removeEntry, loadEntries }}
    >
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries(): EntriesContextType {
  return useContext(EntriesContext);
}