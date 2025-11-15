import React, { useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface ToastOptions {
  severity?: AlertColor;
  duration?: number;
  action?: React.ReactNode;
}

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration: number;
  action?: React.ReactNode;
}

/**
 * Custom hook for managing toast notifications
 * Provides consistent success/error/info/warning feedback
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 6000,
  });

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    setToast({
      open: true,
      message,
      severity: options.severity || 'info',
      duration: options.duration || 6000,
      action: options.action,
    });
  }, []);

  const showSuccess = useCallback((message: string, options?: Omit<ToastOptions, 'severity'>) => {
    showToast(message, { ...options, severity: 'success' });
  }, [showToast]);

  const showError = useCallback((message: string, options?: Omit<ToastOptions, 'severity'>) => {
    showToast(message, { ...options, severity: 'error' });
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: Omit<ToastOptions, 'severity'>) => {
    showToast(message, { ...options, severity: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: Omit<ToastOptions, 'severity'>) => {
    showToast(message, { ...options, severity: 'info' });
  }, [showToast]);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  const ToastComponent = useCallback(() => (
    <Snackbar
      open={toast.open}
      autoHideDuration={toast.duration}
      onClose={closeToast}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          borderRadius: 2,
        }
      }}
    >
      <Alert
        onClose={closeToast}
        severity={toast.severity}
        variant="filled"
        sx={{
          width: '100%',
          borderRadius: 2,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        action={toast.action}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  ), [toast, closeToast]);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeToast,
    ToastComponent,
  };
}

