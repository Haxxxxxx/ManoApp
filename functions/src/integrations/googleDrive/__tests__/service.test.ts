// @vitest-environment node
/**
 * Google Drive Service Tests
 *
 * Unit tests for Drive API service functions
 */

import * as admin from 'firebase-admin';

// ../service imports ../auth, which calls admin.firestore() at module
// scope — an app must exist before that import is evaluated, so the
// service must be imported dynamically after initializeApp.
if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: 'demo-test' });
}
const { computeHash, validateMimeType } = await import('../service');

describe('Google Drive Service', () => {
  describe('computeHash', () => {
    it('should compute SHA256 hash of a buffer', () => {
      const buffer = Buffer.from('test content');
      const hash = computeHash(buffer);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64-character hex string
    });

    it('should produce same hash for same content', () => {
      const buffer = Buffer.from('test content');
      const hash1 = computeHash(buffer);
      const hash2 = computeHash(buffer);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different content', () => {
      const buffer1 = Buffer.from('content 1');
      const buffer2 = Buffer.from('content 2');
      const hash1 = computeHash(buffer1);
      const hash2 = computeHash(buffer2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateMimeType', () => {
    it('should allow audio MIME types', () => {
      expect(validateMimeType('audio/mpeg')).toBe(true);
      expect(validateMimeType('audio/mp3')).toBe(true);
      expect(validateMimeType('audio/wav')).toBe(true);
      expect(validateMimeType('audio/flac')).toBe(true);
      expect(validateMimeType('audio/aac')).toBe(true);
      expect(validateMimeType('audio/ogg')).toBe(true);
    });

    it('should allow image MIME types', () => {
      expect(validateMimeType('image/jpeg')).toBe(true);
      expect(validateMimeType('image/png')).toBe(true);
      expect(validateMimeType('image/gif')).toBe(true);
      expect(validateMimeType('image/webp')).toBe(true);
    });

    it('should allow PDF', () => {
      expect(validateMimeType('application/pdf')).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      expect(validateMimeType('application/zip')).toBe(false);
      expect(validateMimeType('text/plain')).toBe(false);
      expect(validateMimeType('video/mp4')).toBe(false);
      expect(validateMimeType('application/javascript')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(validateMimeType('AUDIO/MPEG')).toBe(true);
      expect(validateMimeType('Image/Jpeg')).toBe(true);
    });
  });
});

