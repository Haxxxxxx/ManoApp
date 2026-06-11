import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { PLAN_ORDER, PLANS, PlanId, planRank } from '../../config/plans';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { startCheckout, BillingInterval } from '../../services/billingService';
import { palette } from '../../theme/tokens';

const PricingPage = () => {
  const navigate = useNavigate();
  const { planId: currentPlanId } = useSubscription();
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (id: PlanId) => {
    if (id === 'free' || id === currentPlanId) return;
    setError(null);
    setBusyPlan(id);
    try {
      const url = await startCheckout(id as Exclude<PlanId, 'free'>, interval);
      window.location.assign(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not start checkout. Try again.'
      );
      setBusyPlan(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>

        <Stack spacing={1.5} alignItems="center" sx={{ mb: 5, textAlign: 'center' }}>
          <Typography variant="h1">Pricing that scales with your catalog</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
            Start free. Upgrade when you're ready to distribute, collaborate, and
            grow. Cancel anytime.
          </Typography>

          <ToggleButtonGroup
            value={interval}
            exclusive
            size="small"
            onChange={(_, v) => v && setInterval(v)}
            sx={{ mt: 2 }}
          >
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="yearly">
              Yearly
              <Chip
                label="2 months free"
                size="small"
                sx={{
                  ml: 1,
                  height: 18,
                  bgcolor: palette.accent.soft,
                  color: palette.accent.hover,
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 3, maxWidth: 560, mx: 'auto' }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              lg: 'repeat(4, 1fr)',
            },
            alignItems: 'stretch',
          }}
        >
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            const isCurrent = id === currentPlanId;
            const price = interval === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const isDowngrade = planRank(id) < planRank(currentPlanId);
            const busy = busyPlan === id;

            return (
              <Box
                key={id}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 3,
                  borderRadius: 3,
                  bgcolor: plan.highlighted
                    ? palette.surface.elevated
                    : palette.surface.default,
                  border: `1px solid ${
                    plan.highlighted ? palette.accent.main : palette.border.subtle
                  }`,
                }}
              >
                {plan.highlighted && (
                  <Chip
                    label="Most popular"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -11,
                      left: 24,
                      bgcolor: palette.accent.main,
                      color: palette.text.onAccent,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Typography variant="h4">{plan.name}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minHeight: 40, mt: 0.5 }}
                >
                  {plan.tagline}
                </Typography>

                <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="h1" sx={{ fontSize: 32 }}>
                    ${price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {price === 0 ? 'forever' : interval === 'monthly' ? '/mo' : '/yr'}
                  </Typography>
                </Stack>

                <Button
                  fullWidth
                  variant={plan.highlighted ? 'contained' : 'outlined'}
                  disabled={isCurrent || id === 'free' || busy || isDowngrade}
                  onClick={() => handleSelect(id)}
                  sx={{ mb: 3 }}
                >
                  {busy ? (
                    <CircularProgress size={18} />
                  ) : isCurrent ? (
                    'Current plan'
                  ) : id === 'free' ? (
                    'Free forever'
                  ) : isDowngrade ? (
                    'Included below'
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>

                <Stack spacing={1.25}>
                  {plan.bullets.map((b) => (
                    <Stack key={b} direction="row" spacing={1} alignItems="flex-start">
                      <CheckIcon
                        sx={{ fontSize: 18, color: palette.accent.hover, mt: '1px' }}
                      />
                      <Typography variant="body2" color="text.primary">
                        {b}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
          sx={{ mt: 4 }}
        >
          Prices in USD. Taxes may apply. You can change or cancel your plan at any
          time from Billing.
        </Typography>
      </Container>
    </Box>
  );
};

export default PricingPage;
