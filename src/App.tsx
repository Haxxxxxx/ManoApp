import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TripProvider } from './contexts/TripContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { ThemeProvider as CustomThemeProvider } from './contexts/ThemeContext'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import MainContent from './components/MainContent'
import AuthForm from './components/AuthForm'
import ProfilePage from './components/pages/ProfilePage'
import Sidebar from './components/Sidebar'
import SongDetail from './components/pages/SongDetail'
import { Box } from '@mui/material'
import { useState, useEffect, useCallback } from 'react'
import AlbumCustomizationPage from './components/pages/AlbumCustomizationPage'
import AlbumsPage from './components/pages/AlbumsPage'
import AlbumDetailPage from './components/pages/AlbumDetailPage'
import AdminPage from './components/pages/AdminPage'
import AnalyticsDashboardPage from './components/pages/AnalyticsDashboardPage'
import PricingPage from './components/billing/PricingPage'
import BillingPage from './components/billing/BillingPage'
import ErrorBoundary from './components/common/ErrorBoundary'
import NewFeaturesTour from './components/Onboarding/NewFeaturesTour'
import { featureFlags, isFeatureEnabled } from './config/features'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useGlobalSearch } from './hooks/useGlobalSearch'
import CommandPalette from './components/common/CommandPalette'
import ShortcutGuideDialog from './components/common/ShortcutGuideDialog'

// Create a base theme that will be overridden by our custom theme
const baseTheme = createTheme()

function AppContent() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)
  const [shortcutGuideOpen, setShortcutGuideOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { toggle: toggleSearch } = useGlobalSearch()

  // Wire keyboard shortcuts
  const shortcuts = useCallback(() => {
    if (!isFeatureEnabled('keyboardShortcuts')) return []
    return [
      { key: 'k', ctrlKey: true, metaKey: true, action: () => toggleSearch(), description: 'Command palette' },
      { key: '?', shiftKey: true, action: () => setShortcutGuideOpen(true), description: 'Shortcut guide' },
      { key: 'd', altKey: true, action: () => navigate('/'), description: 'Dashboard' },
      { key: 'Escape', action: () => setShortcutGuideOpen(false), description: 'Close' },
    ]
  }, [toggleSearch, navigate])

  useKeyboardShortcuts(shortcuts())

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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
          <Route path="/albums/create" element={<AlbumCustomizationPage />} />
          <Route path="/albums/:albumId/edit" element={<AlbumCustomizationPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Routes>
      </Box>
      {isFeatureEnabled('globalSearch') && <CommandPalette />}
      {isFeatureEnabled('keyboardShortcuts') && (
        <ShortcutGuideDialog open={shortcutGuideOpen} onClose={() => setShortcutGuideOpen(false)} />
      )}
    </Box>
  )
}

function AppWithOnboarding() {
  return (
    <>
      <AppContent />
      <NewFeaturesTour flags={featureFlags} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MuiThemeProvider theme={baseTheme}>
          <CssBaseline />
          <AuthProvider>
            <CustomThemeProvider>
              <SubscriptionProvider>
                <TripProvider>
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/auth" element={<AuthForm />} />
                      <Route path="/*" element={<AppWithOnboarding />} />
                    </Routes>
                  </ErrorBoundary>
                </TripProvider>
              </SubscriptionProvider>
            </CustomThemeProvider>
          </AuthProvider>
        </MuiThemeProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
