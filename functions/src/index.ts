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
