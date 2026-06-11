/**
 * Asset Fingerprinting API
 * 
 * Firebase Function endpoint for computing file fingerprints and hashes
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { computeFileIdentifiers } from '../../services/fingerprint/fingerprintService';
import { getStorage } from 'firebase-admin/storage';

const storage = getStorage();

/**
 * Compute fingerprint and hash for an asset file
 * 
 * Request: { filePath: string } or { fileData: string (base64) }
 * Response: { hash: string, fingerprint: string }
 */
export const computeAssetFingerprint = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      // Check authentication
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      // Authenticated user available via request.auth.uid if needed
      const { filePath, fileData } = request.data;

      // Validate input
      if (!filePath && !fileData) {
        throw new HttpsError(
          'invalid-argument',
          'Either filePath or fileData is required'
        );
      }

      let fileBlob: Buffer;

      if (filePath) {
        // Fetch file from storage
        if (typeof filePath !== 'string') {
          throw new HttpsError('invalid-argument', 'filePath must be a string');
        }

        // Verify user has access to the file
        // In production, add proper access checks here

        const bucket = storage.bucket();
        const file = bucket.file(filePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
          throw new HttpsError('not-found', 'File not found');
        }

        // Download file
        const [buffer] = await file.download();
        fileBlob = buffer;
      } else {
        // Use provided file data (base64)
        if (typeof fileData !== 'string') {
          throw new HttpsError('invalid-argument', 'fileData must be a string');
        }

        try {
          fileBlob = Buffer.from(fileData, 'base64');
        } catch (error) {
          throw new HttpsError('invalid-argument', 'Invalid base64 file data');
        }
      }

      // Compute identifiers
      logger.info(`Computing fingerprint for file (size: ${fileBlob.length} bytes)`);
      const { hash, fingerprint } = await computeFileIdentifiers(fileBlob);

      return { hash, fingerprint };
    } catch (error) {
      logger.error('Error computing fingerprint', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to compute fingerprint'
      );
    }
  }
);

