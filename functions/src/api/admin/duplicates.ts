/**
 * Admin Duplicates API
 * 
 * Firebase Function endpoint for scanning and reporting duplicate assets
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Scan for duplicate assets
 * 
 * Request: { userId?: string }
 * Response: { groups: Array<{ hash: string, assets: Asset[] }> }
 */
export const scanDuplicates = onCall(
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
      const { targetUserId } = request.data;

      // Only allow users to scan their own assets, or admins to scan any user's assets
      const scanUserId = targetUserId || userId;
      
      if (scanUserId !== userId) {
        // Check if user is admin
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData?.isAdmin) {
          throw new HttpsError('permission-denied', 'Only admins can scan other users\' assets');
        }
      }

      logger.info(`Scanning duplicates for user ${scanUserId}`);

      // Get all assets for the user
      const assetsRef = db.collection('assets');
      const q = assetsRef.where('userId', '==', scanUserId);
      const snapshot = await q.get();

      // Group assets by hash
      const hashGroups: Map<string, admin.firestore.DocumentData[]> = new Map();

      snapshot.forEach((doc) => {
        const asset = doc.data();
        const hash = asset.hash;

        if (!hashGroups.has(hash)) {
          hashGroups.set(hash, []);
        }

        hashGroups.get(hash)!.push({
          id: doc.id,
          ...asset,
        });
      });

      // Filter to only groups with duplicates (more than one asset)
      const duplicateGroups = Array.from(hashGroups.entries())
        .filter(([_, assets]) => assets.length > 1)
        .map(([hash, assets]) => ({
          hash,
          assets,
        }));

      logger.info(`Found ${duplicateGroups.length} duplicate groups`);

      return {
        groups: duplicateGroups,
        totalAssets: snapshot.size,
        duplicateCount: duplicateGroups.reduce((sum, group) => sum + group.assets.length, 0),
      };
    } catch (error) {
      logger.error('Error scanning duplicates', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to scan duplicates'
      );
    }
  }
);

