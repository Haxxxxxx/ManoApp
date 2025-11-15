import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    this.props.onError?.(error, errorInfo);
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onReset();
    navigate('/');
  };

  const handleRefresh = () => {
    onReset();
    window.location.reload();
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: 64,
            color: 'error.main',
            mb: 2,
          }}
        />
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We're sorry, but something unexpected happened. Please try refreshing the page or return to the home page.
        </Typography>
        
        {error && import.meta.env.DEV && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'error.light',
              borderRadius: 2,
              textAlign: 'left',
            }}
          >
            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
              Error Details (Development Only):
            </Typography>
            <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
              {error.toString()}
              {error.stack && `\n\n${error.stack}`}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ minWidth: 150 }}
          >
            Refresh Page
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{ minWidth: 150 }}
          >
            Go Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Provides a user-friendly error UI instead of a blank screen
 */
export const ErrorBoundary: React.FC<Props> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;

