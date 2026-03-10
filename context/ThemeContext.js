import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  dark: false,
  bg: '#F0F4FF',
  card: '#FFFFFF',
  header: '#1D6FEB',
  headerText: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  input: '#F9FAFB',
  inputBorder: '#E5E7EB',
  statCard: '#FFFFFF',
  pill: '#FFFFFF',
  pillBorder: '#E5E7EB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  success: '#16A34A',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  blue: '#1D6FEB',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
  scanCard: '#FFFFFF',
  shadow: '#000',
};

export const darkTheme = {
  dark: true,
  bg: '#0F172A',
  card: '#1E293B',
  header: '#1E293B',
  headerText: '#F1F5F9',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  input: '#0F172A',
  inputBorder: '#334155',
  statCard: '#1E293B',
  pill: '#1E293B',
  pillBorder: '#334155',
  danger: '#F87171',
  dangerBg: '#450A0A',
  dangerBorder: '#7F1D1D',
  success: '#4ADE80',
  successBg: '#052E16',
  successBorder: '#14532D',
  blue: '#60A5FA',
  blueBg: '#172554',
  blueBorder: '#1E3A8A',
  scanCard: '#1E293B',
  shadow: '#000',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const saved = await AsyncStorage.getItem('theme');
    if (saved === 'dark') setIsDark(true);
  };

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('theme', newVal ? 'dark' : 'light');
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);