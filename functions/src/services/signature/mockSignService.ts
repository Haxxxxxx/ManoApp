/**
 * Mock Signing Service
 * 
 * Mock implementation for signature flow
 * 
 * TODO: Replace with real e-signature service (DocuSign, HelloSign, etc.)
 */

import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Signature, SignatureStatus } from '../../../../src/types/splitSheet';

const db = admin.firestore();

/**
 * Send split-sheet for signature
 */
export async function sendForSignature(
  releaseId: string,
  splits: Array<{ userId: string; userName: string; percentage: number; role?: string }>,
  userId: string
): Promise<{ signatureId: string; signingUrl: string }> {
  logger.info(`Sending split-sheet for signature: release ${releaseId}`);

  const now = new Date().toISOString();
  const signatureData: Omit<Signature, 'id'> = {
    releaseId,
    splits,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const signatureRef = await db
    .collection('releases')
    .doc(releaseId)
    .collection('signatures')
    .add(signatureData);

  // Generate mock signing URL
  // In production, this would be a real e-signature service URL
  const signingUrl = `/sign/${signatureRef.id}`;

  logger.info(`Created signature record: ${signatureRef.id}`);

  return {
    signatureId: signatureRef.id,
    signingUrl,
  };
}

/**
 * Mock sign a split-sheet
 */
export async function mockSign(signatureId: string, releaseId: string, signerId: string): Promise<void> {
  logger.info(`Mock signing: signature ${signatureId} by user ${signerId}`);

  const signatureRef = db
    .collection('releases')
    .doc(releaseId)
    .collection('signatures')
    .doc(signatureId);

  const signatureDoc = await signatureRef.get();
  if (!signatureDoc.exists) {
    throw new Error('Signature not found');
  }

  const now = new Date().toISOString();
  await signatureRef.update({
    status: 'signed' as SignatureStatus,
    signedAt: now,
    signerId,
    updatedAt: now,
  });

  logger.info(`Signature ${signatureId} marked as signed`);
}

/**
 * Get signature status
 */
export async function getSignatureStatus(
  releaseId: string,
  signatureId: string
): Promise<Signature | null> {
  const signatureRef = db
    .collection('releases')
    .doc(releaseId)
    .collection('signatures')
    .doc(signatureId);

  const signatureDoc = await signatureRef.get();
  if (!signatureDoc.exists) {
    return null;
  }

  return {
    id: signatureDoc.id,
    ...signatureDoc.data(),
  } as Signature;
}

