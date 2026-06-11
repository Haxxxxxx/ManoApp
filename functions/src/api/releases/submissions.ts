/**
 * Release Submissions API
 * 
 * Firebase Function endpoint for retrieving submission status
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getSubmissions, updateSubmissionStatus } from '../../services/orchestrator';
import { getProviderRegistry } from '../../services/providerRegistry';
import { ProviderSubmission } from '../../types/submissions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Verify the caller owns the release or collaborates on its project.
 * Throws HttpsError on failure.
 */
async function assertReleaseAccess(releaseId: string, userId: string): Promise<void> {
  const releaseDoc = await db.collection('releases').doc(releaseId).get();
  if (!releaseDoc.exists) {
    throw new HttpsError('not-found', 'Release not found');
  }

  const releaseData = releaseDoc.data();
  if (!releaseData) {
    throw new HttpsError('not-found', 'Release data not found');
  }

  if (releaseData.userId === userId) return;

  if (releaseData.projectId) {
    const tripDoc = await db.collection('trips').doc(releaseData.projectId).get();
    const collaborators = tripDoc.data()?.collaborators || [];
    if (collaborators.includes(userId)) return;
  }

  throw new HttpsError('permission-denied', 'User does not have access to this release');
}

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

      await assertReleaseAccess(releaseId, userId);

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

/**
 * Refresh in-flight submissions by polling each provider, then return
 * the updated set.
 *
 * Request: { releaseId: string }
 * Response: { submissions: Record<string, ProviderSubmission> }
 */
export const refreshReleaseSubmissions = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { releaseId } = request.data;
      if (!releaseId || typeof releaseId !== 'string') {
        throw new HttpsError('invalid-argument', 'releaseId is required and must be a string');
      }

      await assertReleaseAccess(releaseId, request.auth.uid);

      const registry = getProviderRegistry();
      const submissions = await getSubmissions(releaseId);

      for (const [providerId, submission] of Object.entries(submissions) as Array<
        [string, ProviderSubmission]
      >) {
        const inFlight = submission.status === 'pending' || submission.status === 'processing';
        if (!inFlight || !submission.submissionId) continue;

        const connector = registry.getProvider(providerId);
        if (!connector?.getSubmissionStatus) continue;

        try {
          const result = await connector.getSubmissionStatus(submission.submissionId);
          if (result.status !== submission.status) {
            await updateSubmissionStatus(
              releaseId,
              providerId,
              result.status,
              result.submissionId,
              result.error,
              result.providerData,
              result.providerUrl
            );
          }
        } catch (pollError) {
          // A failed poll should not fail the whole refresh
          logger.warn(`Status poll failed for provider ${providerId}`, pollError);
        }
      }

      return { submissions: await getSubmissions(releaseId) };
    } catch (error) {
      logger.error('Error refreshing submissions', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to refresh submissions'
      );
    }
  }
);

