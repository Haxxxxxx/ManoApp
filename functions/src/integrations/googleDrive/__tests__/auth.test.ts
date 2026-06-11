import { vi } from 'vitest';
// @vitest-environment node
/**
 * Google Drive Auth Tests
 * 
 * Unit tests for OAuth authentication functions
 */

import { encrypt, decrypt } from '../crypto';

// Mock environment variables
const originalEnv = process.env;

describe('Google Drive Auth - Crypto', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Set a test encryption key
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-bytes-long!!';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a value', () => {
      const originalValue = 'test-access-token-12345';
      const encrypted = encrypt(originalValue);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(originalValue);
      expect(decrypted).toBe(originalValue);
    });

    it('should produce different encrypted values for same input', () => {
      const value = 'test-token';
      const encrypted1 = encrypt(value);
      const encrypted2 = encrypt(value);

      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      expect(decrypt(encrypted1)).toBe(value);
      expect(decrypt(encrypted2)).toBe(value);
    });

    it('should handle empty string', () => {
      const value = '';
      const encrypted = encrypt(value);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(value);
    });

    it('should handle long strings', () => {
      const value = 'a'.repeat(1000);
      const encrypted = encrypt(value);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(value);
    });

    it('should throw error if encryption key is missing', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is required');
    });

    it('should throw error on invalid encrypted data', () => {
      expect(() => decrypt('invalid-encrypted-data')).toThrow('Decryption failed');
    });
  });
});

