/**
 * SoundCloud Integration Routes
 * 
 * Firebase Functions for SoundCloud OAuth and submission operations
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
  hasValidToken,
  getStoredTokens,
} from './auth';
import { SubmissionPayload, SubmissionResult } from '../../types/export';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Check if user has SoundCloud token
 */
export const checkSoundCloudToken = onCall(
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
      const hasToken = await hasValidToken(userId);

      return { hasToken };
    } catch (error) {
      logger.error('Error checking SoundCloud token', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to check token'
      );
    }
  }
);

/**
 * Start SoundCloud OAuth flow
 * Returns OAuth authorization URL
 */
export const startSoundCloudOAuth = onCall(
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

      return { redirectUrl: authUrl, state };
    } catch (error) {
      logger.error('Error starting SoundCloud OAuth', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to start OAuth flow'
      );
    }
  }
);

/**
 * Handle SoundCloud OAuth callback
 * Exchanges authorization code for tokens and stores them
 */
export const handleSoundCloudCallback = onCall(
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

      // Get user info from SoundCloud (optional)
      // TODO: Fetch user profile from SoundCloud API if needed

      // Store encrypted tokens
      await storeTokens(userId, tokens);

      return { success: true };
    } catch (error) {
      logger.error('Error handling SoundCloud callback', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to complete OAuth flow'
      );
    }
  }
);

/**
 * Submit release to SoundCloud
 * 
 * TODO: Replace with real SoundCloud API integration
 * - Use SoundCloud Upload API
 * - Handle multipart form data for file uploads
 * - Return real submission ID from SoundCloud
 */
export const submitToSoundCloud = onCall(
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

      const payload: SubmissionPayload = request.data;
      const userId = request.auth.uid;

      // Get access token
      const tokens = await getStoredTokens(userId);
      if (!tokens) {
        throw new HttpsError('unauthenticated', 'SoundCloud not connected');
      }

      // TODO: Implement real SoundCloud API submission
      // For now, return mock success
      logger.info('SoundCloud submission (mock)', { userId, payload: payload.metadata });

      const submissionId = `soundcloud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store submission record
      const submissionData = {
        userId,
        provider: 'soundcloud',
        submissionId,
        payload: payload.metadata,
        status: 'completed', // Mock: immediately completed
        providerData: {
          trackUrl: 'https://soundcloud.com/mock-track',
          trackId: 'mock-track-id',
        },
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('submissions').add(submissionData);

      const result: SubmissionResult = {
        submissionId,
        status: 'completed',
        providerData: submissionData.providerData,
        providerUrl: 'https://soundcloud.com/mock-track',
        submittedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      logger.error('Error submitting to SoundCloud', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to submit to SoundCloud'
      );
    }
  }
);

/**
 * Get SoundCloud submission status
 * 
 * TODO: Implement real status polling from SoundCloud API
 */
export const getSoundCloudSubmissionStatus = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { submissionId } = request.data;
      const userId = request.auth.uid;

      if (!submissionId || typeof submissionId !== 'string') {
        throw new HttpsError('invalid-argument', 'submissionId is required');
      }

      // Get submission from Firestore
      const submissions = await db
        .collection('submissions')
        .where('userId', '==', userId)
        .where('submissionId', '==', submissionId)
        .limit(1)
        .get();

      if (submissions.empty) {
        throw new HttpsError('not-found', 'Submission not found');
      }

      const submission = submissions.docs[0].data();

      const result: SubmissionResult = {
        submissionId: submission.submissionId,
        status: submission.status || 'pending',
        providerData: submission.providerData,
        providerUrl: submission.providerData?.trackUrl,
        submittedAt: submission.submittedAt?.toDate().toISOString() || new Date().toISOString(),
        completedAt: submission.completedAt?.toDate().toISOString(),
      };

      return result;
    } catch (error) {
      logger.error('Error getting SoundCloud submission status', error);
      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to get submission status'
      );
    }
  }
);

