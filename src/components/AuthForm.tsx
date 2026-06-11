import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Link,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { usingEmulators } from '../firebase/config';
import { palette } from '../theme/tokens';

const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, loading, devBypass } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  // Bypass works only against the local Auth emulator (anonymous sign-in is
  // disabled in production) — keep in sync with the guard inside devBypass()
  const isDev = import.meta.env.DEV && usingEmulators;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Authentication failed'));
    }
  };

  const handleDevBypass = async () => {
    setError(null);
    try {
      await devBypass();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Dev bypass failed'));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        // Subtle radial glow behind the card — restrained, not a candy gradient
        background: `radial-gradient(60% 50% at 50% 0%, ${palette.accent.soft} 0%, transparent 70%)`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <Stack spacing={1} alignItems="center" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              background: palette.accent.main,
              color: palette.text.onAccent,
              fontWeight: 700,
              fontSize: 20,
              mb: 0.5,
            }}
          >
            M
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            ManoApp
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Distribute, manage, and track your music catalog.
          </Typography>
        </Stack>

        <Box
          sx={{
            position: 'relative',
            p: 4,
            backgroundColor: palette.surface.default,
            border: `1px solid ${palette.border.subtle}`,
            borderRadius: 3,
          }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(14, 14, 17, 0.6)',
                borderRadius: 3,
                zIndex: 1,
              }}
            >
              <CircularProgress size={28} />
            </Box>
          )}

          <Typography variant="h3" sx={{ mb: 0.5 }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isSignUp
              ? 'Start managing your releases in minutes.'
              : 'Sign in to your studio.'}
          </Typography>

          {error && (
            <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                  Email
                </Typography>
                <TextField
                  type="email"
                  fullWidth
                  placeholder="you@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  aria-label="Email address"
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                  Password
                </Typography>
                <TextField
                  type="password"
                  fullWidth
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  helperText={isSignUp ? 'At least 6 characters.' : undefined}
                  aria-label="Password"
                />
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 1, py: 1.25 }}
              >
                {isSignUp ? 'Create account' : 'Sign in'}
              </Button>
            </Stack>
          </form>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 3 }}
          >
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              component="button"
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              underline="hover"
              sx={{ color: palette.accent.hover, fontWeight: 600 }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Link>
          </Typography>

          {isDev && (
            <Box
              sx={{
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${palette.border.subtle}`,
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                onClick={handleDevBypass}
                disabled={loading}
                sx={{ borderStyle: 'dashed' }}
              >
                Dev bypass (emulator)
              </Button>
            </Box>
          )}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
          sx={{ mt: 3 }}
        >
          By continuing you agree to the Terms and Privacy Policy.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthForm;
