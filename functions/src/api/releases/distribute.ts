/**
 * Release Distribution API
 * 
 * Firebase Function endpoint for distributing releases to providers
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { distributeRelease } from '../../services/orchestrator';
import { ProviderSubmission } from '../../../src/types/submissions';

/**
 * Distribute a release to multiple providers
 * 
 * Request: { releaseId: string, providerIds: string[] }
 * Response: { submissions: Record<string, ProviderSubmission> }
 */
export const distributeReleaseToProviders = onCall(
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
      const { releaseId, providerIds } = request.data;

      // Validate input
      if (!releaseId || typeof releaseId !== 'string') {
        throw new HttpsError('invalid-argument', 'releaseId is required and must be a string');
      }

      if (!providerIds || !Array.isArray(providerIds) || providerIds.length === 0) {
        throw new HttpsError(
          'invalid-argument',
          'providerIds is required and must be a non-empty array'
        );
      }

      // Validate provider IDs are strings
      if (!providerIds.every((id) => typeof id === 'string')) {
        throw new HttpsError('invalid-argument', 'All providerIds must be strings');
      }

      logger.info(`Distributing release ${releaseId} to providers: ${providerIds.join(', ')}`);

      // Distribute release
      const submissions = await distributeRelease(releaseId, providerIds, userId);

      return { submissions };
    } catch (error) {
      logger.error('Error distributing release', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to distribute release'
      );
    }
  }
);

