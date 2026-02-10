/**
 * Export Presets CRUD API
 * 
 * Firebase Functions for managing export presets
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Create an export preset
 * 
 * Request: { preset: Omit<ExportPreset, 'id' | 'createdAt' | 'updatedAt'> }
 * Response: { preset: ExportPreset }
 */
export const createPreset = onCall(
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
      const { preset } = request.data;

      if (!preset || !preset.name || !preset.provider) {
        throw new HttpsError('invalid-argument', 'Preset name and provider are required');
      }

      const now = new Date().toISOString();
      const presetData = {
        ...preset,
        createdAt: now,
        updatedAt: now,
      };

      // If this is set as default, unset other defaults for this provider
      if (preset.isDefault) {
        await unsetOtherDefaults(userId, preset.provider);
      }

      const presetRef = await db
        .collection('users')
        .doc(userId)
        .collection('exportPresets')
        .add(presetData);

      return {
        preset: {
          id: presetRef.id,
          ...presetData,
        },
      };
    } catch (error) {
      logger.error('Error creating preset', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to create preset'
      );
    }
  }
);

/**
 * Update an export preset
 * 
 * Request: { presetId: string, updates: Partial<ExportPreset> }
 * Response: { preset: ExportPreset }
 */
export const updatePreset = onCall(
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
      const { presetId, updates } = request.data;

      if (!presetId || !updates) {
        throw new HttpsError('invalid-argument', 'Preset ID and updates are required');
      }

      const presetRef = db
        .collection('users')
        .doc(userId)
        .collection('exportPresets')
        .doc(presetId);

      const presetDoc = await presetRef.get();
      if (!presetDoc.exists) {
        throw new HttpsError('not-found', 'Preset not found');
      }

      // If setting as default, unset other defaults for this provider
      if (updates.isDefault) {
        const currentData = presetDoc.data();
        await unsetOtherDefaults(userId, currentData?.provider || updates.provider, presetId);
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await presetRef.update(updateData);

      const updatedDoc = await presetRef.get();
      return {
        preset: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        },
      };
    } catch (error) {
      logger.error('Error updating preset', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to update preset'
      );
    }
  }
);

/**
 * Delete an export preset
 * 
 * Request: { presetId: string }
 * Response: { success: boolean }
 */
export const deletePreset = onCall(
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
      const { presetId } = request.data;

      if (!presetId) {
        throw new HttpsError('invalid-argument', 'Preset ID is required');
      }

      const presetRef = db
        .collection('users')
        .doc(userId)
        .collection('exportPresets')
        .doc(presetId);

      const presetDoc = await presetRef.get();
      if (!presetDoc.exists) {
        throw new HttpsError('not-found', 'Preset not found');
      }

      await presetRef.delete();

      return { success: true };
    } catch (error) {
      logger.error('Error deleting preset', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to delete preset'
      );
    }
  }
);

/**
 * Get all presets for a user
 * 
 * Request: { provider?: string }
 * Response: { presets: ExportPreset[] }
 */
export const getPresets = onCall(
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
      const { provider } = request.data;

      let query = db
        .collection('users')
        .doc(userId)
        .collection('exportPresets')
        .orderBy('createdAt', 'desc');

      if (provider) {
        query = query.where('provider', '==', provider) as admin.firestore.Query;
      }

      const snapshot = await query.get();
      const presets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { presets };
    } catch (error) {
      logger.error('Error getting presets', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to get presets'
      );
    }
  }
);

/**
 * Unset other default presets for a provider
 */
async function unsetOtherDefaults(
  userId: string,
  provider: string,
  excludePresetId?: string
): Promise<void> {
  const presetsRef = db
    .collection('users')
    .doc(userId)
    .collection('exportPresets');

  const query = presetsRef.where('provider', '==', provider).where('isDefault', '==', true);
  const snapshot = await query.get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    if (doc.id !== excludePresetId) {
      batch.update(doc.ref, {
        isDefault: false,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  if (!snapshot.empty) {
    await batch.commit();
  }
}

