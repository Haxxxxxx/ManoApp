/**
 * Upload Service
 * 
 * Service for handling file uploads with duplicate detection
 */

import { computeAssetIdentifiers, checkDuplicates } from './assetService';
import { Asset } from '../types/asset';
import { isFeatureEnabled } from '../config/features';

/**
 * Check for duplicates before upload
 */
export async function checkUploadDuplicates(
  file: File | Blob,
  userId: string
): Promise<{ hashMatch: Asset | null; fingerprintMatch: Asset | null } | null> {
  if (!isFeatureEnabled('fingerprint')) {
    return null; // Skip duplicate check if feature disabled
  }

  try {
    const { hash, fingerprint } = await computeAssetIdentifiers(file);
    const duplicates = await checkDuplicates(hash, fingerprint, userId);
    return duplicates;
  } catch (error) {
    console.error('Failed to check duplicates:', error);
    return null; // Continue with upload if check fails
  }
}

/**
 * Handle duplicate detection result
 */
export function hasDuplicates(duplicates: { hashMatch: Asset | null; fingerprintMatch: Asset | null } | null): boolean {
  if (!duplicates) return false;
  return !!(duplicates.hashMatch || duplicates.fingerprintMatch);
}

/**
 * Get duplicate asset (prefer hash match over fingerprint match)
 */
export function getDuplicateAsset(duplicates: { hashMatch: Asset | null; fingerprintMatch: Asset | null } | null): Asset | null {
  if (!duplicates) return null;
  return duplicates.hashMatch || duplicates.fingerprintMatch || null;
}

