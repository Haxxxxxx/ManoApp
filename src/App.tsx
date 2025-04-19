import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TripProvider } from './contexts/TripContext'
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import MainContent from './components/MainContent'
import AuthForm from './components/AuthForm'
import ProfilePage from './components/pages/ProfilePage'
import Sidebar from './components/Sidebar'
import SongDetail from './pages/SongDetail'
import { Box } from '@mui/material'
import { useState, useEffect } from 'react'
import AlbumCustomizationPage from './components/pages/AlbumCustomizationPage'
import AlbumsPage from './components/pages/AlbumsPage'
import AlbumDetailPage from './components/pages/AlbumDetailPage'

// Create a base theme that will be overridden by our custom theme
const baseTheme = createTheme()

function AppContent() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Extract trip ID from URL if available
  useEffect(() => {
    const tripMatch = location.pathname.match(/\/trip\/([^\/]+)/)
    if (tripMatch && tripMatch[1]) {
      setSelectedTrip(tripMatch[1])
    } else if (location.pathname === '/') {
      // If on dashboard, clear selected trip
      setSelectedTrip(null)
    }
  }, [location])

  const handleSelectTrip = (tripId: string) => {
    setSelectedTrip(tripId)
    navigate(`/trip/${tripId}`)
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      <Sidebar selectedTrip={selectedTrip} onSelectTrip={handleSelectTrip} />
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          width: '100%', // Use full width
        }}
      >
        <Routes>
          <Route path="/" element={<MainContent selectedTrip={null} onSelectTrip={handleSelectTrip} />} />
          <Route path="/trip/:tripId" element={<MainContent selectedTrip={selectedTrip} onSelectTrip={handleSelectTrip} />} />
          <Route path="/song/:songId" element={<SongDetail />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
          <Route path="/albums/create" element={<AlbumCustomizationPage />} />
          <Route path="/albums/:albumId/edit" element={<AlbumCustomizationPage />} />
        </Routes>
      </Box>
    </Box>
  )
}

function App() {
  return (
    <Router>
      <MuiThemeProvider theme={baseTheme}>
        <CssBaseline />
        <AuthProvider>
          <CustomThemeProvider>
            <TripProvider>
              <Routes>
                <Route path="/auth" element={<AuthForm />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/*" element={<AppContent />} />
              </Routes>
            </TripProvider>
          </CustomThemeProvider>
        </AuthProvider>
      </MuiThemeProvider>
    </Router>
  )
}

export default App
