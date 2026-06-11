import { ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { FeatureKey, PLANS, PLAN_ORDER } from '../../config/plans';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { palette } from '../../theme/tokens';

/** Lowest plan name that unlocks a given feature — for the prompt copy. */
const lowestPlanFor = (feature: FeatureKey): string => {
  for (const id of PLAN_ORDER) {
    if (PLANS[id].features[feature]) return PLANS[id].name;
  }
  return 'a paid';
};

interface FeatureGateProps {
  feature: FeatureKey;
  /** What to render when the user is entitled */
  children: ReactNode;
  /** Optional label describing the gated capability */
  title?: string;
  description?: string;
  /** Render nothing (instead of the prompt) when locked */
  hideWhenLocked?: boolean;
}

/**
 * Wrap any premium capability. Renders children if the current plan includes
 * `feature`; otherwise shows an inline upgrade prompt (or nothing).
 * UI gating only — privileged actions are also enforced server-side.
 */
export const FeatureGate = ({
  feature,
  children,
  title,
  description,
  hideWhenLocked,
}: FeatureGateProps) => {
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();

  if (hasFeature(feature)) return <>{children}</>;
  if (hideWhenLocked) return null;

  const requiredPlan = lowestPlanFor(feature);

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: palette.surface.default,
        border: `1px dashed ${palette.border.default}`,
        textAlign: 'center',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: palette.accent.soft,
          }}
        >
          <LockOutlinedIcon sx={{ color: palette.accent.hover, fontSize: 20 }} />
        </Box>
        <Typography variant="h4">{title ?? `Available on ${requiredPlan}`}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {description ?? `Upgrade to ${requiredPlan} to unlock this feature.`}
        </Typography>
        <Button variant="contained" size="small" onClick={() => navigate('/pricing')}>
          View plans
        </Button>
      </Stack>
    </Box>
  );
};

export default FeatureGate;
