/**
 * Preset Service
 *
 * Client service for managing export presets via direct Firestore CRUD
 */

import { db, auth } from '../firebase/config';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ExportPreset } from '../types/preset';

/**
 * Create an export preset
 */
export async function createPreset(
  preset: Omit<ExportPreset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ExportPreset> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in');

  const now = new Date().toISOString();
  const presetData = {
    ...preset,
    userId: currentUser.uid,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, 'presets'), presetData);
  return { id: docRef.id, ...presetData };
}

/**
 * Update an export preset
 */
export async function updatePreset(
  presetId: string,
  updates: Partial<ExportPreset>
): Promise<ExportPreset> {
  const presetRef = doc(db, 'presets', presetId);
  await updateDoc(presetRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  const updatedDoc = await getDoc(presetRef);
  if (!updatedDoc.exists()) throw new Error('Preset not found');
  return { id: updatedDoc.id, ...updatedDoc.data() } as ExportPreset;
}

/**
 * Delete an export preset
 */
export async function deletePreset(presetId: string): Promise<void> {
  await deleteDoc(doc(db, 'presets', presetId));
}

/**
 * Get all presets for the current user
 */
export async function getPresets(provider?: string): Promise<ExportPreset[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in');

  let q;
  if (provider) {
    q = query(
      collection(db, 'presets'),
      where('userId', '==', currentUser.uid),
      where('provider', '==', provider)
    );
  } else {
    q = query(
      collection(db, 'presets'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExportPreset));
}
