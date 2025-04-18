import { useState, useEffect } from 'react'
import { Box, CssBaseline, ThemeProvider, createTheme, CircularProgress, alpha } from '@mui/material'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TripProvider, useTrips } from './contexts/TripContext'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import SongDetail from './pages/SongDetail'
import AuthForm from './components/AuthForm'
import ProfilePage from './components/pages/ProfilePage'

// Create a more sophisticated theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DB954', // Spotify green
      light: '#4EDD84',
      dark: '#0E9E3F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C4DFF', // Purple accent
      light: '#B47CFF',
      dark: '#3F1DCB',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#121212',
      paper: '#181818',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#29B6F6',
      light: '#4FC3F7',
      dark: '#0288D1',
    },
    success: {
      main: '#66BB6A',
      light: '#81C784',
      dark: '#388E3C',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
})

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          bgcolor: 'background.default',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Box sx={{ 
          mt: 2, 
          color: 'text.secondary',
          fontWeight: 500
        }}>
          Loading...
        </Box>
      </Box>
    )
  }

  if (!currentUser) {
    return <Navigate to="/auth" />
  }

  return <>{children}</>
}

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          bgcolor: 'background.default',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Box sx={{ 
          mt: 2, 
          color: 'text.secondary',
          fontWeight: 500
        }}>
          Loading...
        </Box>
      </Box>
    )
  }

  if (currentUser) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

function AppContent() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const { currentUser, loading: authLoading } = useAuth();
  const { trips, loading: tripsLoading } = useTrips();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract trip ID from URL if available
  useEffect(() => {
    const tripMatch = location.pathname.match(/\/trip\/([^\/]+)/);
    if (tripMatch && tripMatch[1]) {
      setSelectedTrip(tripMatch[1]);
    } else if (location.pathname === '/') {
      // If on dashboard, clear selected trip
      setSelectedTrip(null);
    }
  }, [location]);

  const handleSelectTrip = (tripId: string) => {
    setSelectedTrip(tripId);
    navigate(`/trip/${tripId}`);
  };

  // Show loading state while auth is initializing
  if (authLoading || tripsLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default'
      }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  // If not authenticated, redirect to auth page
  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar selectedTrip={selectedTrip} onSelectTrip={handleSelectTrip} />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {location.pathname === '/' && <MainContent selectedTrip={null} onSelectTrip={handleSelectTrip} />}
        {location.pathname.startsWith('/trip/') && <MainContent selectedTrip={selectedTrip} onSelectTrip={handleSelectTrip} />}
        {location.pathname.startsWith('/song/') && <SongDetail />}
        {location.pathname === '/profile' && <ProfilePage />}
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <TripProvider>
            <Routes>
              <Route path="/auth" element={
                <AuthRoute>
                  <AuthForm />
                </AuthRoute>
              } />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              } />
            </Routes>
          </TripProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
