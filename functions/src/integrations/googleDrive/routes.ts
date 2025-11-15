/**
 * Google Drive Integration Routes
 * 
 * Firebase Functions for Google Drive OAuth and file operations
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  generateAuthUrl,
  exchangeCodeForTokens,
  storeTokens,
  generateOAuthState,
  validateOAuthState,
} from './auth';
import { listFiles, downloadFile, computeHash, validateMimeType } from './service';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = getStorage();

/**
 * Start Google Drive OAuth flow
 * Returns OAuth authorization URL
 */
export const startGoogleDriveOAuth = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = request.auth.uid;
      const state = await generateOAuthState(userId);
      const authUrl = generateAuthUrl(userId, state);

      return { authUrl, state };
    } catch (error) {
      logger.error('Error starting Google Drive OAuth', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to start OAuth flow'
      );
    }
  }
);

/**
 * Handle Google Drive OAuth callback
 * Exchanges authorization code for tokens and stores them
 */
export const handleGoogleDriveCallback = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { code, state } = request.data;
      const userId = request.auth.uid;

      if (!code || typeof code !== 'string') {
        throw new HttpsError('invalid-argument', 'Authorization code is required');
      }

      if (!state || typeof state !== 'string') {
        throw new HttpsError('invalid-argument', 'State parameter is required');
      }

      // Validate state for CSRF protection
      const isValidState = await validateOAuthState(userId, state);
      if (!isValidState) {
        throw new HttpsError('permission-denied', 'Invalid or expired state parameter');
      }

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code);

      // Get user info from Google (optional)
      // TODO: Fetch user profile from Google API if needed

      // Store encrypted tokens
      await storeTokens(userId, tokens);

      return { success: true };
    } catch (error) {
      logger.error('Error handling Google Drive callback', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to complete OAuth flow'
      );
    }
  }
);

/**
 * List Google Drive files
 * Returns paginated list of user's Drive files
 */
export const listGoogleDriveFiles = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = request.auth.uid;
      const { pageSize, pageToken, query } = request.data || {};

      const result = await listFiles(userId, {
        pageSize: typeof pageSize === 'number' ? pageSize : undefined,
        pageToken: typeof pageToken === 'string' ? pageToken : undefined,
        query: typeof query === 'string' ? query : undefined,
      });

      return result;
    } catch (error) {
      logger.error('Error listing Google Drive files', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to list files'
      );
    }
  }
);

/**
 * Import file from Google Drive to ManoApp
 * Downloads file, validates, computes hash, uploads to Firebase Storage, creates asset record
 */
export const importGoogleDriveFile = onCall(
  {
    cors: true,
    maxInstances: 5,
    timeoutSeconds: 540, // 9 minutes for large file uploads
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { fileId, projectId, targetFolder } = request.data;
      const userId = request.auth.uid;

      if (!fileId || typeof fileId !== 'string') {
        throw new HttpsError('invalid-argument', 'fileId is required');
      }

      // Download file from Google Drive
      logger.info(`Downloading file ${fileId} from Google Drive for user ${userId}`);
      const { buffer, mimeType, filename } = await downloadFile(userId, fileId);

      // Validate MIME type
      if (!validateMimeType(mimeType)) {
        throw new HttpsError(
          'invalid-argument',
          `File type ${mimeType} is not allowed. Allowed types: audio, image, PDF`
        );
      }

      // Compute SHA256 hash
      const hash = computeHash(buffer);

      // Check for duplicate (existing asset with same hash)
      const existingAsset = await db
        .collection('assets')
        .where('hash', '==', hash)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!existingAsset.empty) {
        const existing = existingAsset.docs[0].data();
        return {
          assetId: existingAsset.docs[0].id,
          duplicate: true,
          message: 'File already imported',
        };
      }

      // Upload to Firebase Storage
      const storagePath = targetFolder
        ? `assets/${userId}/${targetFolder}/${filename}`
        : `assets/${userId}/${filename}`;

      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            source: 'google-drive',
            sourceFileId: fileId,
            importedBy: userId,
          },
        },
      });

      // Make file publicly readable (or use signed URL if needed)
      await file.makePublic();

      // Get download URL
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      // Create asset record in Firestore
      const now = new Date().toISOString();
      const assetData = {
        filename,
        mimeType,
        size: buffer.length,
        hash,
        source: 'google-drive',
        originUrl: `https://drive.google.com/file/d/${fileId}/view`,
        storagePath,
        downloadUrl,
        projectId: projectId || null,
        userId,
        metadata: {
          sourceFileId: fileId,
        },
        createdAt: now,
        updatedAt: now,
      };

      const assetRef = await db.collection('assets').add(assetData);

      logger.info(`Successfully imported file ${fileId} as asset ${assetRef.id}`);

      return {
        assetId: assetRef.id,
        duplicate: false,
        asset: {
          id: assetRef.id,
          ...assetData,
        },
      };
    } catch (error) {
      logger.error('Error importing Google Drive file', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to import file'
      );
    }
  }
);

