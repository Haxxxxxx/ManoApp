/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Export AI metadata function
export { aiMetadata } from './aiMetadata';

// Export release validation function
export { validateRelease } from './releaseValidation';

// Export Google Drive integration functions
export {
  startGoogleDriveOAuth,
  handleGoogleDriveCallback,
  listGoogleDriveFiles,
  importGoogleDriveFile,
} from './integrations/googleDrive/routes';

// Export SoundCloud integration functions
export {
  checkSoundCloudToken,
  startSoundCloudOAuth,
  handleSoundCloudCallback,
  submitToSoundCloud,
  getSoundCloudSubmissionStatus,
} from './integrations/soundcloud/routes';

// Export orchestrator functions
export { distributeReleaseToProviders } from './api/releases/distribute';
export { getReleaseSubmissions } from './api/releases/submissions';

// Export fingerprinting functions
export { computeAssetFingerprint } from './api/assets/fingerprint';

// Export admin functions
export { scanDuplicates } from './api/admin/duplicates';

// Export preset functions
export {
  createPreset,
  updatePreset,
  deletePreset,
  getPresets,
} from './api/presets/crud';

// Export split-sheet functions
export { generateSplitSheet } from './api/splits/generate';

// Export admin feature flag functions
export { setFeatureFlag, getFeatureFlags } from './api/admin/featureFlags';

// Register job processors
import { processJob } from './lib/queue';
import { processSubmitToProvider } from './jobs/submitToProvider';

processJob('submitToProvider', processSubmitToProvider);
