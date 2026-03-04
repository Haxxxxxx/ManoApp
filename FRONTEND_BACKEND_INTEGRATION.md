# Frontend-Backend Integration Summary

This document summarizes how the frontend components are integrated with the backend services we created.

## 1. Distributor Orchestrator Integration

### Backend Services
- `functions/src/services/orchestrator.ts` - Core orchestrator logic
- `functions/src/api/releases/distribute.ts` - `distributeReleaseToProviders` endpoint
- `functions/src/api/releases/submissions.ts` - `getReleaseSubmissions` endpoint

### Frontend Integration
- **Service**: `src/services/orchestratorService.ts`
  - `distributeRelease()` - Calls `distributeReleaseToProviders`
  - `getSubmissions()` - Calls `getReleaseSubmissions`

- **Component**: `src/components/panels/ReleaseExportPanel.tsx`
  - Uses `distributeRelease()` when `distributor` feature flag is enabled
  - Falls back to direct connector if orchestrator disabled
  - Loads submission history using `getSubmissions()`
  - Displays submission status in ExportPanel

### Feature Flag
- `distributor` - Controls orchestrator usage
- When enabled: Uses orchestrator service
- When disabled: Falls back to direct connector calls

---

## 2. Fingerprinting & Duplicate Detection Integration

### Backend Services
- `functions/src/services/fingerprint/fingerprintService.ts` - Fingerprint computation
- `functions/src/api/assets/fingerprint.ts` - `computeAssetFingerprint` endpoint
- `functions/src/api/admin/duplicates.ts` - `scanDuplicates` endpoint
- `functions/src/integrations/googleDrive/routes.ts` - Updated to compute fingerprint

### Frontend Integration
- **Service**: `src/services/fingerprint/fingerprintService.ts`
  - `computeFingerprint()` - Calls `computeAssetFingerprint`
  - `hashFileClient()` - Client-side hash computation

- **Service**: `src/services/assetService.ts`
  - `checkDuplicates()` - Checks for hash and fingerprint matches
  - `computeAssetIdentifiers()` - Computes both hash and fingerprint
  - `linkToExistingAsset()`, `mergeAssetMetadata()`, `forceCreateAsset()` - Duplicate handling

- **Service**: `src/services/uploadService.ts`
  - `checkUploadDuplicates()` - Checks duplicates before upload
  - Helper functions for duplicate detection

- **Component**: `src/components/dialogs/DuplicateAssetDialog.tsx`
  - Shows duplicate options: Link, Merge, Force Create
  - Integrated into upload flow (state added to MainContent)

- **Google Drive Import**: 
  - Backend computes fingerprint during import
  - Returns duplicate info if found
  - Frontend can show duplicate dialog

### Feature Flag
- `fingerprint` - Controls fingerprinting feature
- When enabled: Computes fingerprints, shows duplicate dialogs
- When disabled: Only uses hash-based duplicate detection

---

## 3. Export Presets Integration

### Backend Services
- `functions/src/api/presets/crud.ts` - Preset CRUD operations
  - `createPreset`, `updatePreset`, `deletePreset`, `getPresets`

### Frontend Integration
- **Service**: `src/services/presetService.ts`
  - Wraps all preset CRUD operations
  - Calls Firebase Functions endpoints

- **Component**: `src/components/panels/ExportPresetManager.tsx`
  - Full CRUD UI for presets
  - Lists presets by provider
  - Create/edit/delete functionality
  - Default preset support

- **Component**: `src/components/ExportPanel.tsx`
  - Loads presets when provider selected
  - Shows preset dropdown
  - Auto-applies default preset
  - Applies preset settings to manifest

### Feature Flag
- `exportPresets` - Controls preset feature
- When enabled: Shows preset UI, loads presets
- When disabled: Preset UI hidden

---

## 4. Split-Sheet Generation Integration

### Backend Services
- `functions/src/services/rights/splitSheetService.ts` - CSV/PDF generation
- `functions/src/api/splits/generate.ts` - `generateSplitSheet` endpoint
- `functions/src/services/signature/mockSignService.ts` - Mock signing service

### Frontend Integration
- **Component**: `src/components/RightsEditor.tsx`
  - "Export Split Sheet" button calls `generateSplitSheet`
  - Downloads CSV or PDF file
  - "Send for Signature" button (placeholder)
  - Requires `releaseId` prop for split-sheet generation

- **Component**: `src/components/panels/ReleasePlanningPanel.tsx`
  - Passes `releaseId` to RightsEditor
  - Enables split-sheet features when release exists

### Feature Flag
- `splitSheet` - Controls split-sheet features
- When enabled: Shows export buttons in RightsEditor
- When disabled: Buttons hidden

---

## 5. Admin & Feature Flag Management Integration

### Backend Services
- `functions/src/services/userRoleService.ts` - Admin role checking
- `functions/src/api/admin/featureFlags.ts` - Feature flag management
  - `setFeatureFlag`, `getFeatureFlags`

### Frontend Integration
- **Service**: `src/services/userRoleService.ts`
  - `checkIsAdmin()` - Checks if user is admin

- **Component**: `src/components/admin/FeatureFlagPanel.tsx`
  - Admin-only UI for toggling feature flags
  - Calls `setFeatureFlag` and `getFeatureFlags`
  - Shows all feature flags with switches

- **Component**: `src/components/admin/ConnectionsPanel.tsx`
  - Admin-only UI for provider connections
  - Shows connection status
  - Connect/revoke buttons

- **Component**: `src/components/pages/AdminPage.tsx`
  - Main admin page with tabs
  - Integrates FeatureFlagPanel and ConnectionsPanel

- **Routing**: `src/App.tsx`
  - Added `/admin` route
  - Admin link in Sidebar (only for admins)

### Feature Flag
- All features gated by flags in `src/config/features.ts`
- Components check `isFeatureEnabled()` before showing features

---

## 6. Onboarding Integration

### Components
- `src/components/Onboarding/NewFeaturesTour.tsx`
  - Guided tour for new features
  - Shows when new features are enabled
  - Stores completion in localStorage

- `src/components/Onboarding/FeatureConsentDialog.tsx`
  - Consent dialog for provider data sharing
  - Shows before connecting providers

### Integration
- **App.tsx**: Wraps AppContent with NewFeaturesTour
- Tour shows automatically when new features enabled
- Consent dialog can be shown before provider connections

---

## Feature Flag Usage Throughout Codebase

### Components Checking Feature Flags

1. **ReleaseExportPanel**: Checks `distributor` and `soundcloud`
2. **ExportPanel**: Checks `exportPresets` for preset UI
3. **RightsEditor**: Checks `splitSheet` for split-sheet buttons
4. **ReleasePlanningPanel**: Checks `soundcloud` and `splitSheet` for RightsEditor
5. **MainContent**: Can check `fingerprint` for duplicate detection (state added)
6. **AdminPage**: Always accessible to admins (no flag check)

---

## Missing Integrations (To Complete)

1. **Duplicate Detection in Upload Flow**
   - State added to MainContent but not fully integrated
   - Need to call `checkUploadDuplicates()` before upload
   - Show DuplicateAssetDialog when duplicate found
   - Handle user choice (link/merge/force)

2. **Preset Application Logic**
   - ExportPanel has preset selection but `applyPreset()` is placeholder
   - Need to actually update manifest with preset settings

3. **Send for Signature Flow**
   - RightsEditor has button but handler is placeholder
   - Need to integrate with mock signing service
   - Create signature record and show signing UI

4. **Submission Status Polling**
   - ExportPanel loads history but doesn't poll for updates
   - Could add polling to refresh submission status

5. **Feature Flag Sync**
   - Frontend reads from hardcoded config
   - Should read from Firestore (getFeatureFlags) and sync

---

## Testing Checklist

- [ ] Distributor orchestrator distributes to multiple providers
- [ ] Submission history loads and displays correctly
- [ ] Fingerprinting computes on upload/import
- [ ] Duplicate dialog shows and handles user choices
- [ ] Export presets create/edit/delete work
- [ ] Presets apply to export form
- [ ] Split-sheet generates CSV and PDF
- [ ] Admin can toggle feature flags
- [ ] Admin can view provider connections
- [ ] Onboarding tour shows for new features
- [ ] All features respect feature flags

