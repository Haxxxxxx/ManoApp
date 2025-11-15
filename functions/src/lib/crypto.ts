/**
 * Shared Crypto Utility
 * 
 * Token encryption/decryption utilities for all integrations.
 * This is a shared utility to avoid duplication.
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. ' +
      'In production, use a key management system (KMS) instead.'
    );
  }
  
  if (encryptionKey.length > 64) {
    try {
      return Buffer.from(encryptionKey, 'base64');
    } catch {
      // Not base64, use as-is
    }
  }
  
  return crypto.pbkdf2Sync(encryptionKey, 'manoapp-salt', ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a value
 */
export function encrypt(value: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    const combined = Buffer.concat([
      iv,
      tag,
      Buffer.from(encrypted, 'base64')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a value
 */
export function decrypt(encryptedValue: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedValue, 'base64');
    
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

