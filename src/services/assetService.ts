/**
 * Asset Service
 * 
 * Service for managing assets and duplicate detection
 */

import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Asset } from '../types/asset';
import { computeFingerprint, hashFileClient } from './fingerprint/fingerprintService';

/**
 * Check for duplicate assets by hash
 */
export async function checkDuplicateByHash(
  hash: string,
  userId: string
): Promise<Asset | null> {
  const assetsRef = collection(db, 'assets');
  const q = query(assetsRef, where('hash', '==', hash), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const existingAsset = querySnapshot.docs[0];
    return { id: existingAsset.id, ...existingAsset.data() } as Asset;
  }

  return null;
}

/**
 * Check for duplicate assets by fingerprint
 */
export async function checkDuplicateByFingerprint(
  fingerprint: string,
  userId: string
): Promise<Asset | null> {
  if (!fingerprint) {
    return null;
  }

  const assetsRef = collection(db, 'assets');
  const q = query(
    assetsRef,
    where('fingerprint', '==', fingerprint),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const existingAsset = querySnapshot.docs[0];
    return { id: existingAsset.id, ...existingAsset.data() } as Asset;
  }

  return null;
}

/**
 * Check for duplicate assets (by hash and fingerprint)
 */
export async function checkDuplicates(
  hash: string,
  fingerprint?: string,
  userId?: string
): Promise<{ hashMatch: Asset | null; fingerprintMatch: Asset | null }> {
  if (!userId) {
    return { hashMatch: null, fingerprintMatch: null };
  }

  const results = await Promise.allSettled([
    checkDuplicateByHash(hash, userId),
    fingerprint ? checkDuplicateByFingerprint(fingerprint, userId) : Promise.resolve(null),
  ]);

  const hashMatch = results[0].status === 'fulfilled' ? results[0].value : null;
  const fingerprintMatch = results[1].status === 'fulfilled' ? results[1].value : null;

  return { hashMatch, fingerprintMatch };
}

/**
 * Compute hash and fingerprint for a file
 */
export async function computeAssetIdentifiers(file: File | Blob): Promise<{
  hash: string;
  fingerprint: string;
}> {
  // Compute hash client-side for speed
  const hash = await hashFileClient(file);

  // Compute fingerprint server-side (requires file data)
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const { fingerprint } = await computeFingerprint(undefined, base64);

  return { hash, fingerprint };
}

/**
 * Link asset to existing asset (for duplicates)
 */
export async function linkToExistingAsset(
  newAssetId: string,
  existingAssetId: string
): Promise<void> {
  const assetRef = doc(db, 'assets', newAssetId);
  await updateDoc(assetRef, {
    linkedTo: existingAssetId,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Merge metadata from new asset into existing asset
 */
export async function mergeAssetMetadata(
  existingAssetId: string,
  newAssetMetadata: Partial<Asset>
): Promise<void> {
  const assetRef = doc(db, 'assets', existingAssetId);
  const assetDoc = await getDoc(assetRef);

  if (!assetDoc.exists()) {
    throw new Error('Existing asset not found');
  }

  const existingAsset = assetDoc.data() as Asset;

  // Merge metadata
  const mergedMetadata = {
    ...existingAsset.metadata,
    ...newAssetMetadata.metadata,
  };

  await updateDoc(assetRef, {
    ...newAssetMetadata,
    metadata: mergedMetadata,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Force create asset despite duplicate
 */
export async function forceCreateAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const assetsRef = collection(db, 'assets');
  const now = new Date().toISOString();
  const assetData = {
    ...asset,
    createdAt: now,
    updatedAt: now,
    forceCreated: true, // Flag to indicate this was created despite duplicate
  };

  const docRef = await addDoc(assetsRef, assetData);
  return docRef.id;
}

