import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { palette, radius, typography as typeTokens, spacingUnit } from '../theme/tokens';

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
  primaryColor: palette.accent.main,
  secondaryColor: palette.accent.hover,
  darkMode: true, // dark studio is the default identity
  fontSize: 14,
  animations: true,
  borderRadius: radius.md,
  spacing: spacingUnit,
  fontFamily: typeTokens.fontFamily,
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
    // Dark studio is the product identity. Light mode is still supported via
    // settings, but the refined token system targets dark; light falls back to
    // a clean neutral rather than the old peach gradients.
    const dark = newSettings.darkMode;
    const r = newSettings.borderRadius;
    const accent = newSettings.primaryColor;
    const accentHover = newSettings.secondaryColor;

    const bg = dark ? palette.bg.base : '#FAFAF9';
    const bgRaised = dark ? palette.bg.raised : '#FFFFFF';
    const surface = dark ? palette.surface.default : '#FFFFFF';
    const surfaceElevated = dark ? palette.surface.elevated : '#FFFFFF';
    const borderSubtle = dark ? palette.border.subtle : '#E7E5E4';
    const borderDefault = dark ? palette.border.default : '#D6D3D1';
    const textPrimary = dark ? palette.text.primary : '#1C1917';
    const textSecondary = dark ? palette.text.secondary : '#78716C';

    const transition = newSettings.animations ? 'all 0.15s ease' : 'none';

    const newTheme = createTheme({
      palette: {
        mode: dark ? 'dark' : 'light',
        primary: {
          main: accent,
          light: accentHover,
          dark: palette.accent.pressed,
          contrastText: palette.text.onAccent,
        },
        secondary: {
          main: accentHover,
          contrastText: palette.text.onAccent,
        },
        background: {
          default: bg,
          paper: surface,
        },
        text: {
          primary: textPrimary,
          secondary: textSecondary,
        },
        divider: borderSubtle,
        error: { main: palette.semantic.error },
        warning: { main: palette.semantic.warning },
        info: { main: palette.semantic.info },
        success: { main: palette.semantic.success },
      },
      typography: {
        fontFamily: newSettings.fontFamily,
        fontSize: newSettings.fontSize,
        h1: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
        h2: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 },
        h3: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
        h4: { fontSize: 16, fontWeight: 600, lineHeight: 1.35 },
        h5: { fontSize: 14, fontWeight: 600, lineHeight: 1.4 },
        h6: { fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
        subtitle1: { fontSize: 14, fontWeight: 500 },
        subtitle2: { fontSize: 13, fontWeight: 500, color: textSecondary },
        body1: { fontSize: 14, fontWeight: 400, lineHeight: 1.55 },
        body2: { fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: textSecondary },
        caption: { fontSize: 12, fontWeight: 400, color: textSecondary },
        button: { fontSize: 14, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
      },
      shape: { borderRadius: r },
      spacing: newSettings.spacing,
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: bg,
              color: textPrimary,
              minHeight: '100vh',
              fontFeatureSettings: typeTokens.fontFeatureSettings,
              scrollbarWidth: 'thin',
              scrollbarColor: `${borderDefault} transparent`,
              '&::-webkit-scrollbar': { width: '10px', height: '10px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: borderDefault,
                borderRadius: '6px',
                border: `2px solid ${bg}`,
              },
              '&::-webkit-scrollbar-thumb:hover': { background: palette.border.strong },
            },
          },
        },
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: {
            root: {
              borderRadius: r,
              textTransform: 'none',
              fontWeight: 500,
              padding: '8px 16px',
              transition,
            },
            containedPrimary: {
              backgroundColor: accent,
              color: palette.text.onAccent,
              '&:hover': { backgroundColor: accentHover },
              '&:active': { backgroundColor: palette.accent.pressed },
            },
            outlined: {
              borderColor: borderDefault,
              color: textPrimary,
              '&:hover': {
                borderColor: palette.border.strong,
                backgroundColor: dark ? palette.surface.hover : '#F5F5F4',
              },
            },
            text: {
              color: textSecondary,
              '&:hover': {
                backgroundColor: dark ? palette.surface.hover : '#F5F5F4',
                color: textPrimary,
              },
            },
          },
        },
        MuiPaper: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: surface,
              borderRadius: r,
              transition,
            },
            outlined: { border: `1px solid ${borderSubtle}` },
          },
        },
        MuiCard: {
          defaultProps: { elevation: 0 },
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: surface,
              border: `1px solid ${borderSubtle}`,
              borderRadius: r,
              transition,
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundImage: 'none',
              backgroundColor: surfaceElevated,
              border: `1px solid ${borderDefault}`,
              borderRadius: radius.lg,
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: bgRaised,
              backgroundImage: 'none',
              borderBottom: `1px solid ${borderSubtle}`,
              boxShadow: 'none',
              color: textPrimary,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: bgRaised,
              backgroundImage: 'none',
              borderRight: `1px solid ${borderSubtle}`,
            },
          },
        },
        MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              backgroundColor: dark ? palette.bg.raised : '#FFFFFF',
              borderRadius: r,
              transition,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: borderDefault },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.border.strong },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: accent,
                borderWidth: '1px',
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: { borderRadius: radius.sm, fontWeight: 500 },
            outlined: { borderColor: borderDefault },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: surfaceElevated,
              color: textPrimary,
              border: `1px solid ${borderDefault}`,
              fontSize: 12,
              borderRadius: radius.sm,
            },
          },
        },
        MuiDivider: { styleOverrides: { root: { borderColor: borderSubtle } } },
        MuiTableCell: {
          styleOverrides: {
            root: { borderColor: borderSubtle },
            head: { color: textSecondary, fontWeight: 600, fontSize: 12 },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: r,
              transition,
              '&.Mui-selected': {
                backgroundColor: palette.accent.soft,
                '&:hover': { backgroundColor: palette.accent.softHover },
              },
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