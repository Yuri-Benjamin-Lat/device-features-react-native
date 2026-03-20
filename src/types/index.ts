// Navigation param list
export type RootStackParamList = {
  Home: undefined;
  AddEntry: undefined;
};

// Travel diary entry
export interface TravelEntry {
  id: string;
  imageUri: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string; // ISO date string
}

// Theme shape
export interface AppTheme {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  dangerText: string;
  headerBg: string;
  headerText: string;
  statusBar: string;
  shadow: string;
  cardBg: string;
  emptyIcon: string;
  isDark: boolean;
}

// Context types
export interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
}

export interface EntriesContextType {
  entries: TravelEntry[];
  addEntry: (entry: TravelEntry) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  loadEntries: () => Promise<void>;
}