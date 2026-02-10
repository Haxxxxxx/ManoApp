/**
 * Admin Feature Flags API
 * 
 * Firebase Function endpoint for managing feature flags (admin only)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { requireAdmin } from '../../services/userRoleService';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Set a feature flag
 * 
 * Request: { flag: string, enabled: boolean }
 * Response: { success: boolean }
 */
export const setFeatureFlag = onCall(
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
      await requireAdmin(userId);

      const { flag, enabled } = request.data;

      if (!flag || typeof flag !== 'string') {
        throw new HttpsError('invalid-argument', 'flag is required and must be a string');
      }

      if (typeof enabled !== 'boolean') {
        throw new HttpsError('invalid-argument', 'enabled is required and must be a boolean');
      }

      // Update feature flags in Firestore
      const flagsRef = db.collection('system').doc('featureFlags');
      await flagsRef.set(
        {
          [flag]: enabled,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        },
        { merge: true }
      );

      logger.info(`Feature flag ${flag} set to ${enabled} by admin ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error setting feature flag', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      if (error instanceof Error && error.message === 'Admin privileges required') {
        throw new HttpsError('permission-denied', 'Admin privileges required');
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to set feature flag'
      );
    }
  }
);

/**
 * Get all feature flags
 * 
 * Request: {}
 * Response: { flags: Record<string, boolean> }
 */
export const getFeatureFlags = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const flagsRef = db.collection('system').doc('featureFlags');
      const flagsDoc = await flagsRef.get();

      if (!flagsDoc.exists) {
        // Return default flags (all false)
        return {
          flags: {
            distributor: false,
            fingerprint: false,
            exportPresets: false,
            splitSheet: false,
          },
        };
      }

      const flagsData = flagsDoc.data();
      // Remove metadata fields
      const { updatedAt, updatedBy, ...flags } = flagsData || {};

      return { flags };
    } catch (error) {
      logger.error('Error getting feature flags', error);

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to get feature flags'
      );
    }
  }
);

