/**
 * Firebase Cloud Function: Release Validation
 * 
 * Validates release checklist completion before publishing
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Validate release checklist completion
 */
export const validateRelease = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { releaseId } = request.data;

      // Validate input
      if (!releaseId || typeof releaseId !== 'string') {
        throw new HttpsError('invalid-argument', 'releaseId is required and must be a string');
      }

      // Check if user is authenticated
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = request.auth.uid;

      // Get release
      const releaseDoc = await db.collection('releases').doc(releaseId).get();
      
      if (!releaseDoc.exists) {
        throw new HttpsError('not-found', 'Release not found');
      }

      const releaseData = releaseDoc.data();
      if (!releaseData) {
        throw new HttpsError('not-found', 'Release data not found');
      }

      // Verify user has access
      if (releaseData.userId !== userId) {
        // Check if user is a collaborator on the project
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

      // Validate checklist
      const checklist = releaseData.checklist || [];
      const requiredItems = checklist.filter((item: any) => item.required);
      const completedRequiredItems = requiredItems.filter((item: any) => item.status === 'completed');

      const validation = {
        isValid: completedRequiredItems.length === requiredItems.length,
        totalRequired: requiredItems.length,
        completedRequired: completedRequiredItems.length,
        missingRequired: requiredItems
          .filter((item: any) => item.status !== 'completed')
          .map((item: any) => ({
            id: item.id,
            title: item.title,
          })),
        warnings: [] as string[],
      };

      // Add warnings
      if (!releaseData.title || !releaseData.title.trim()) {
        validation.warnings.push('Release title is missing');
      }

      if (!releaseData.releaseDate) {
        validation.warnings.push('Release date is not set');
      }

      if (checklist.length === 0) {
        validation.warnings.push('No checklist items defined');
      }

      logger.info(`Release validation for ${releaseId}: ${validation.isValid ? 'valid' : 'invalid'}`);

      return {
        success: true,
        validation,
      };
    } catch (error) {
      logger.error('Error validating release:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to validate release'
      );
    }
  }
);

