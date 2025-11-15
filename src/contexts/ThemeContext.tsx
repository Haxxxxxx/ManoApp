import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  fontSize: number;
  animations: boolean;
  borderRadius: number;
  spacing: number;
  fontFamily: string;
}

interface ThemeContextType {
  theme: Theme;
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => Promise<void>;
}

export const defaultSettings: ThemeSettings = {
  primaryColor: '#DC2626', // Vibrant red from gradient
  secondaryColor: '#FF6B35', // Orange from gradient
  darkMode: false,
  fontSize: 14,
  animations: true,
  borderRadius: 16, // More rounded to match pig icon style
  spacing: 8,
  fontFamily: 'Roboto, Arial, sans-serif',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: createTheme(),
  settings: defaultSettings,
  updateSettings: async () => {},
});

export const useThemeSettings = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [theme, setTheme] = useState<Theme>(createTheme());

  // Apply theme settings
  const applyTheme = React.useCallback((newSettings: ThemeSettings) => {
    const newTheme = createTheme({
      palette: {
        mode: newSettings.darkMode ? 'dark' : 'light',
        primary: {
          main: newSettings.primaryColor,
          light: newSettings.primaryColor,
          dark: newSettings.primaryColor,
          contrastText: newSettings.darkMode ? '#ffffff' : '#000000',
        },
        secondary: {
          main: newSettings.secondaryColor,
          light: newSettings.secondaryColor,
          dark: newSettings.secondaryColor,
          contrastText: newSettings.darkMode ? '#ffffff' : '#000000',
        },
        background: {
          default: newSettings.darkMode ? '#1a0a0a' : '#FFF5F0', // Light peach background
          paper: newSettings.darkMode ? '#2a1a1a' : '#FFFFFF',
        },
        error: {
          main: '#DC2626',
          light: '#EF4444',
          dark: '#991B1B',
        },
        warning: {
          main: '#FF6B35',
          light: '#FF8C5A',
          dark: '#E55A2B',
        },
        info: {
          main: '#3B82F6',
        },
        success: {
          main: '#10B981',
        },
      },
      typography: {
        fontSize: newSettings.fontSize,
        fontFamily: newSettings.fontFamily,
        h1: {
          fontSize: newSettings.fontSize * 2.5,
          fontWeight: 500,
        },
        h2: {
          fontSize: newSettings.fontSize * 2,
          fontWeight: 500,
        },
        h3: {
          fontSize: newSettings.fontSize * 1.75,
          fontWeight: 500,
        },
        h4: {
          fontSize: newSettings.fontSize * 1.5,
          fontWeight: 500,
        },
        h5: {
          fontSize: newSettings.fontSize * 1.25,
          fontWeight: 500,
        },
        h6: {
          fontSize: newSettings.fontSize * 1.1,
          fontWeight: 500,
        },
        body1: {
          fontSize: newSettings.fontSize,
        },
        body2: {
          fontSize: newSettings.fontSize * 0.875,
        },
      },
      shape: {
        borderRadius: newSettings.borderRadius,
      },
      spacing: newSettings.spacing,
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              transition: newSettings.animations ? 'all 0.3s ease-in-out' : 'none',
              background: newSettings.darkMode 
                ? 'linear-gradient(135deg, #1a0a0a 0%, #2a1a1a 100%)'
                : 'linear-gradient(135deg, #FFF5F0 0%, #FFE5D9 100%)',
              backgroundAttachment: 'fixed',
              minHeight: '100vh',
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: newSettings.darkMode ? '#1e1e1e' : '#FFE5D9',
              },
              '&::-webkit-scrollbar-thumb': {
                background: newSettings.darkMode ? '#DC2626' : '#FF6B35',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: newSettings.darkMode ? '#EF4444' : '#FF8C5A',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: newSettings.borderRadius,
              textTransform: 'none',
              fontWeight: 500,
              transition: newSettings.animations ? 'all 0.2s ease-in-out' : 'none',
            },
            contained: {
              background: newSettings.darkMode
                ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                : 'linear-gradient(135deg, #DC2626 0%, #FF6B35 100%)',
              '&:hover': {
                background: newSettings.darkMode
                  ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                  : 'linear-gradient(135deg, #EF4444 0%, #FF8C5A 100%)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: newSettings.borderRadius,
              transition: newSettings.animations ? 'all 0.2s ease-in-out' : 'none',
              background: newSettings.darkMode 
                ? 'linear-gradient(135deg, #2a1a1a 0%, #3a2a2a 100%)'
                : undefined,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: newSettings.borderRadius,
              transition: newSettings.animations ? 'all 0.2s ease-in-out' : 'none',
              background: newSettings.darkMode 
                ? 'linear-gradient(135deg, #2a1a1a 0%, #3a2a2a 100%)'
                : undefined,
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: newSettings.borderRadius * 1.5,
              background: newSettings.darkMode 
                ? 'linear-gradient(135deg, #2a1a1a 0%, #3a2a2a 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F0 100%)',
            },
          },
        },
      },
    });

    setTheme(newTheme);
  }, []);

  // Apply default theme on mount
  useEffect(() => {
    applyTheme(defaultSettings);
  }, [applyTheme]);

  // Load user theme settings from Firestore
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!currentUser) return;

      try {
        const db = getFirestore();
        const userSettingsRef = doc(db, 'userSettings', currentUser.uid);
        const userSettingsDoc = await getDoc(userSettingsRef);

        if (userSettingsDoc.exists()) {
          const userSettings = userSettingsDoc.data() as ThemeSettings;
          setSettings(userSettings);
          applyTheme(userSettings);
        }
      } catch (error) {
        // Error loading theme settings
      }
    };

    loadUserSettings();
  }, [currentUser, applyTheme]);

  // Update theme settings
  const updateSettings = async (newSettings: Partial<ThemeSettings>) => {
    if (!currentUser) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      applyTheme(updatedSettings);

      // Save to Firestore
      const db = getFirestore();
      const userSettingsRef = doc(db, 'userSettings', currentUser.uid);
      await setDoc(userSettingsRef, updatedSettings, { merge: true });
    } catch (error) {
      // Error saving theme settings
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, settings, updateSettings }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 