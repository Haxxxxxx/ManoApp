import { useState } from 'react'
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import RightPanel from './components/RightPanel'
import SongDetail from './pages/SongDetail'
import Login from './pages/Login'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1DB954', // Spotify green
    },
    background: {
      default: '#121212',
      paper: '#181818',
    },
  },
})

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <Box>Loading...</Box>
  }

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

function AppContent() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar 
        selectedTrip={selectedTrip} 
        onSelectTrip={setSelectedTrip}
      />
      <Routes>
        <Route path="/" element={<MainContent selectedTrip={selectedTrip} />} />
        <Route path="/trip/:tripId/song/:songId" element={<SongDetail />} />
      </Routes>
      <RightPanel />
    </Box>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
