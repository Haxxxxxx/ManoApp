import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { openBillingPortal } from '../../services/billingService';
import { palette } from '../../theme/tokens';

const statusColor: Record<string, string> = {
  active: palette.semantic.success,
  past_due: palette.semantic.warning,
  canceled: palette.text.secondary,
  incomplete: palette.semantic.warning,
  none: palette.text.secondary,
};

const BillingPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { plan, planId, status, currentPeriodEnd, loading } = useSubscription();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('checkout') === 'success') {
      setNotice('Payment confirmed — your plan is now active.');
    }
  }, [params]);

  const handleManage = async () => {
    setError(null);
    setBusy(true);
    try {
      const url = await openBillingPortal();
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal.');
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="sm">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
          Back
        </Button>

        <Typography variant="h1" sx={{ mb: 1 }}>
          Billing
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Manage your subscription and payment details.
        </Typography>

        {notice && (
          <Alert severity="success" variant="outlined" sx={{ mb: 3 }}>
            {notice}
          </Alert>
        )}
        {error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: palette.surface.default,
            border: `1px solid ${palette.border.subtle}`,
          }}
        >
          {loading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={24} />
            </Stack>
          ) : (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Current plan
                  </Typography>
                  <Typography variant="h3">{plan.name}</Typography>
                </Box>
                <Chip
                  label={status === 'none' ? 'Free' : status.replace('_', ' ')}
                  size="small"
                  sx={{
                    textTransform: 'capitalize',
                    color: statusColor[status] ?? palette.text.secondary,
                    border: `1px solid ${statusColor[status] ?? palette.border.default}`,
                    bgcolor: 'transparent',
                  }}
                />
              </Stack>

              {currentPeriodEnd && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {status === 'canceled' ? 'Access until' : 'Renews on'}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(currentPeriodEnd).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Stack>
                </>
              )}

              <Divider sx={{ my: 2.5 }} />

              <Stack direction="row" spacing={1.5}>
                <Button variant="contained" onClick={() => navigate('/pricing')} fullWidth>
                  {planId === 'free' ? 'Upgrade plan' : 'Change plan'}
                </Button>
                {planId !== 'free' && (
                  <Button variant="outlined" onClick={handleManage} disabled={busy} fullWidth>
                    {busy ? <CircularProgress size={18} /> : 'Manage billing'}
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default BillingPage;
