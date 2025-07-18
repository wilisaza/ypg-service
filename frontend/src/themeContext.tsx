
import { createContext } from 'react';

export type ThemeContextType = {
  mode: 'light' | 'dark';
  toggleMode: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleMode: () => {},
});
