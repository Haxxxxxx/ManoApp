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
  primaryColor: '#4CAF50', // Default green
  secondaryColor: '#2196F3', // Default blue
  darkMode: false,
  fontSize: 14,
  animations: true,
  borderRadius: 8,
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
        console.error('Error loading theme settings:', error);
      }
    };

    loadUserSettings();
  }, [currentUser]);

  // Apply theme settings
  const applyTheme = (newSettings: ThemeSettings) => {
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
          default: newSettings.darkMode ? '#121212' : '#f5f5f5',
          paper: newSettings.darkMode ? '#1e1e1e' : '#ffffff',
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
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: newSettings.darkMode ? '#1e1e1e' : '#f0f0f0',
              },
              '&::-webkit-scrollbar-thumb': {
                background: newSettings.darkMode ? '#555' : '#aaa',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: newSettings.darkMode ? '#777' : '#888',
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
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: newSettings.borderRadius,
              transition: newSettings.animations ? 'all 0.2s ease-in-out' : 'none',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: newSettings.borderRadius,
              transition: newSettings.animations ? 'all 0.2s ease-in-out' : 'none',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: newSettings.borderRadius * 1.5,
            },
          },
        },
      },
    });

    setTheme(newTheme);
  };

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
      console.error('Error saving theme settings:', error);
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