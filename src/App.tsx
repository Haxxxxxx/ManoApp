import { useState } from 'react'
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import RightPanel from './components/RightPanel'
import SongDetail from './pages/SongDetail'
import AuthForm from './components/AuthForm'

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
    return <Navigate to="/auth" />
  }

  return <>{children}</>
}

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <Box>Loading...</Box>
  }

  if (currentUser) {
    return <Navigate to="/" />
  }

  return <>{children}</>
}

function AppContent() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Routes>
        <Route path="/auth" element={
          <AuthRoute>
            <AuthForm />
          </AuthRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Box sx={{ display: 'flex', width: '100%' }}>
              <Sidebar 
                selectedTrip={selectedTrip} 
                onSelectTrip={setSelectedTrip}
              />
              <MainContent selectedTrip={selectedTrip} />
            </Box>
          </ProtectedRoute>
        } />
        <Route path="/trip/:tripId/song/:songId" element={
          <ProtectedRoute>
            <Box sx={{ display: 'flex', width: '100%' }}>
              <Sidebar 
                selectedTrip={selectedTrip} 
                onSelectTrip={setSelectedTrip}
              />
              <SongDetail />
            </Box>
          </ProtectedRoute>
        } />
      </Routes>
    </Box>
  )
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
