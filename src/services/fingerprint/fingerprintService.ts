/**
 * Fingerprinting Service (Client)
 * 
 * Client wrapper for fingerprinting service
 */

import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../../firebase/config';

/**
 * Compute fingerprint and hash for a file
 */
export async function computeFingerprint(
  filePath?: string,
  fileData?: string
): Promise<{ hash: string; fingerprint: string }> {
  if (!functions) {
    throw new Error('Firebase Functions service is not available');
  }

  const computeFp = httpsCallable<
    { filePath?: string; fileData?: string },
    { hash: string; fingerprint: string }
  >(functions as Functions, 'computeAssetFingerprint');

  const result = await computeFp({ filePath, fileData });

  if (!result.data || !result.data.hash || !result.data.fingerprint) {
    throw new Error('Invalid response from fingerprint service');
  }

  return result.data;
}

/**
 * Compute SHA256 hash of a file (client-side)
 * 
 * This can be done client-side for faster duplicate detection
 */
export async function hashFileClient(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

