import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppTheme, ThemeContextType } from '../types';

const lightTheme: AppTheme = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  danger: '#ef4444',
  dangerText: '#ffffff',
  headerBg: '#ffffff',
  headerText: '#0f172a',
  statusBar: 'dark',
  shadow: 'rgba(0,0,0,0.08)',
  cardBg: '#ffffff',
  emptyIcon: '#cbd5e1',
  isDark: false,
};

const darkTheme: AppTheme = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#334155',
  primary: '#3b82f6',
  primaryText: '#ffffff',
  danger: '#ef4444',
  dangerText: '#ffffff',
  headerBg: '#1e293b',
  headerText: '#f1f5f9',
  statusBar: 'light',
  shadow: 'rgba(0,0,0,0.3)',
  cardBg: '#1e293b',
  emptyIcon: '#334155',
  isDark: true,
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}