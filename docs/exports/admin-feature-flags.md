# Admin Feature Flag Management

## Overview

Feature flags allow admins to control which features are enabled in the application. This enables gradual rollouts and A/B testing.

## Managing Feature Flags

### Access
- Only users with `role: 'admin'` can manage flags
- Access via Admin Panel > Feature Flags

### Available Flags

- **distributor**: Distributor orchestrator and provider registry
- **fingerprint**: Audio fingerprinting and duplicate detection
- **exportPresets**: Export preset management
- **splitSheet**: Split-sheet generation and signing

### Setting Flags

1. Navigate to Admin Panel
2. Open Feature Flags section
3. Toggle flags on/off
4. Changes take effect immediately

## Flag Storage

Flags stored in Firestore: `system/featureFlags`
- Updated by admins only
- Client reads from Firestore (not hardcoded)
- Defaults: All flags `false`

## Client-Side Usage

Components check flags before rendering:
```typescript
import { isFeatureEnabled } from '../config/features';

if (isFeatureEnabled('distributor')) {
  // Show distributor features
}
```

## Best Practices

1. Start with flags disabled
2. Enable for testing users first
3. Monitor for issues
4. Gradually roll out to all users
5. Document flag changes

## Security

- Admin-only access enforced server-side
- Client-side checks are for UX only
- Server-side validation required for all operations

