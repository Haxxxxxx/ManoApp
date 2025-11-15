import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert,
  Container,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, loading, devBypass } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

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
      // Auth error
    }
  };

  const handleDevBypass = async () => {
    setError(null);
    try {
      await devBypass();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Dev bypass failed'));
      // Dev bypass error
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            position: 'relative',
          }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <Typography variant="h4" component="h1" gutterBottom align="center">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              helperText={isSignUp ? "We'll never share your email" : undefined}
              aria-label="Email address"
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              helperText={isSignUp ? "Use at least 6 characters" : undefined}
              aria-label="Password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <Typography align="center">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Button
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Button>
          </Typography>

          {/* Dev Bypass Button - Only shown in development */}
          {isDev && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                onClick={handleDevBypass}
                disabled={loading}
                sx={{ 
                  mt: 1,
                  borderStyle: 'dashed',
                  '&:hover': {
                    borderStyle: 'solid',
                  }
                }}
              >
                🚀 Dev Bypass (Skip Auth)
              </Button>
              <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
                Development mode only
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthForm; 