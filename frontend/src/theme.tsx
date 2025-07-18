import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#10b981' : '#059669',
        light: mode === 'dark' ? '#34d399' : '#10b981',
        dark: mode === 'dark' ? '#059669' : '#047857',
      },
      secondary: {
        main: mode === 'dark' ? '#f59e0b' : '#d97706',
        light: mode === 'dark' ? '#fbbf24' : '#f59e0b',
        dark: mode === 'dark' ? '#d97706' : '#b45309',
      },
      success: {
        main: mode === 'dark' ? '#10b981' : '#059669',
        light: mode === 'dark' ? '#34d399' : '#10b981',
        dark: mode === 'dark' ? '#059669' : '#047857',
      },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f8fafc',
        paper: mode === 'dark' ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f1f5f9' : '#0f172a',
        secondary: mode === 'dark' ? '#94a3b8' : '#475569',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'dark' 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
    },
  });
