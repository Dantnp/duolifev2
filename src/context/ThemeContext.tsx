import React, { createContext, useContext, useState } from 'react';

const lightColors = {
  // Backgrounds
  bg: '#f8f8f8',
  screenBg: '#ffffff',
  altBg: '#f0f4f8',
  mapBg: '#f0f6ff',
  chipBg: '#f8f8f8',
  inputBg: '#f0f4f8',
  // Cards
  card: '#ffffff',
  cardAlt: '#f8faff',
  cardAlt2: '#f8f8f8',
  // Borders
  border: '#f0f0f0',
  borderCard: '#e8e8e8',
  // Text
  text: '#222222',
  subtext: '#aaaaaa',
  mutedText: '#999999',
  bodyText: '#333333',
  rowLabel: '#333333',
  backIcon: '#333333',
  accentText: '#1a56db',
  // Tab bar
  tabBar: '#ffffff',
  tabBarBorder: '#f0f0f0',
  // Status bar
  statusBar: 'dark-content' as 'dark-content' | 'light-content',
};

const darkColors: typeof lightColors = {
  bg: '#121212',
  screenBg: '#1a1a1a',
  altBg: '#181818',
  mapBg: '#14192a',
  chipBg: '#2a2a2a',
  inputBg: '#2a2a2a',
  card: '#252525',
  cardAlt: '#1e2235',
  cardAlt2: '#222222',
  border: '#2a2a2a',
  borderCard: '#333333',
  text: '#f0f0f0',
  subtext: '#777777',
  mutedText: '#666666',
  bodyText: '#cccccc',
  rowLabel: '#cccccc',
  backIcon: '#cccccc',
  accentText: '#6aabff',
  tabBar: '#1a1a1a',
  tabBarBorder: '#2a2a2a',
  statusBar: 'light-content',
};

type ThemeContextType = {
  isDark: boolean;
  toggleDark: () => void;
  colors: typeof lightColors;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleDark: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const toggleDark = () => setIsDark(prev => !prev);
  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, colors: isDark ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
