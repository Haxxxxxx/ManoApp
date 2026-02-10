/**
 * Release Submissions API
 * 
 * Firebase Function endpoint for retrieving submission status
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getSubmissions } from '../../services/orchestrator';
import { ProviderSubmission } from '../../../src/types/submissions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Get all submissions for a release
 * 
 * Request: { releaseId: string }
 * Response: { submissions: Record<string, ProviderSubmission> }
 */
export const getReleaseSubmissions = onCall(
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

      const userId = request.auth.uid;
      const { releaseId } = request.data;

      // Validate input
      if (!releaseId || typeof releaseId !== 'string') {
        throw new HttpsError('invalid-argument', 'releaseId is required and must be a string');
      }

      // Verify user has access to the release
      const releaseDoc = await db.collection('releases').doc(releaseId).get();
      if (!releaseDoc.exists) {
        throw new HttpsError('not-found', 'Release not found');
      }

      const releaseData = releaseDoc.data();
      if (!releaseData) {
        throw new HttpsError('not-found', 'Release data not found');
      }

      // Check access
      if (releaseData.userId !== userId) {
        // Check if user is a collaborator
        if (releaseData.projectId) {
          const tripDoc = await db.collection('trips').doc(releaseData.projectId).get();
          const tripData = tripDoc.data();
          const collaborators = tripData?.collaborators || [];

          if (!collaborators.includes(userId)) {
            throw new HttpsError('permission-denied', 'User does not have access to this release');
          }
        } else {
          throw new HttpsError('permission-denied', 'User does not have access to this release');
        }
      }

      // Get submissions
      const submissions = await getSubmissions(releaseId);

      return { submissions };
    } catch (error) {
      logger.error('Error getting submissions', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to get submissions'
      );
    }
  }
);

