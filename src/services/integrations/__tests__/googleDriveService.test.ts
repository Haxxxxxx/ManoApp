import { vi } from 'vitest';
/**
 * Google Drive Service Tests
 */

import {
  startGoogleDriveOAuth,
  handleGoogleDriveCallback,
  listGoogleDriveFiles,
  importGoogleDriveFile,
  isGoogleDriveConnected,
} from '../googleDriveService';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('../../../firebase/config', () => ({
  functions: {
    // Mock functions object
  },
}));

describe('GoogleDriveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startGoogleDriveOAuth', () => {
    it('should return OAuth URL and state', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: { authUrl: 'https://accounts.google.com/oauth', state: 'test-state' },
      });

      (httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

      const result = await startGoogleDriveOAuth();

      expect(result).toEqual({
        authUrl: 'https://accounts.google.com/oauth',
        state: 'test-state',
      });
      expect(mockCallable).toHaveBeenCalledWith({});
    });

    // TODO: re-enable if the config module gets an injectable accessor.
    // Spying a getter on a vi.mock factory object is not possible under ESM,
    // and this only asserts the `if (!functions) throw` guard clause.
    it.skip('should throw error if functions not available', async () => {
      await expect(startGoogleDriveOAuth()).rejects.toThrow(
        'Firebase Functions service is not available'
      );
    });
  });

  describe('handleGoogleDriveCallback', () => {
    it('should handle callback successfully', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: { success: true },
      });

      (httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

      const result = await handleGoogleDriveCallback('test-code', 'test-state');

      expect(result).toEqual({ success: true });
      expect(mockCallable).toHaveBeenCalledWith({ code: 'test-code', state: 'test-state' });
    });
  });

  describe('listGoogleDriveFiles', () => {
    it('should list files with options', async () => {
      const mockFiles = [
        { id: '1', name: 'file1.mp3', mimeType: 'audio/mpeg' },
        { id: '2', name: 'file2.wav', mimeType: 'audio/wav' },
      ];

      const mockCallable = vi.fn().mockResolvedValue({
        data: { files: mockFiles, nextPageToken: 'next-token' },
      });

      (httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

      const result = await listGoogleDriveFiles({ pageSize: 20, pageToken: 'token' });

      expect(result.files).toEqual(mockFiles);
      expect(result.nextPageToken).toBe('next-token');
      expect(mockCallable).toHaveBeenCalledWith({ pageSize: 20, pageToken: 'token' });
    });

    it('should list files without options', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: { files: [], nextPageToken: undefined },
      });

      (httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

      const result = await listGoogleDriveFiles();

      expect(result.files).toEqual([]);
      expect(mockCallable).toHaveBeenCalledWith({});
    });
  });

  describe('importGoogleDriveFile', () => {
    it('should import file successfully', async () => {
      const mockAsset = {
        id: 'asset-1',
        filename: 'test.mp3',
        mimeType: 'audio/mpeg',
        hash: 'abc123',
        source: 'google-drive',
        userId: 'user-1',
      };

      const mockCallable = vi.fn().mockResolvedValue({
        data: { assetId: 'asset-1', duplicate: false, asset: mockAsset },
      });

      (httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

      const result = await importGoogleDriveFile({
        fileId: 'file-1',
        projectId: 'project-1',
      });

      expect(result.assetId).toBe('asset-1');
      expect(result.duplicate).toBe(false);
      expect(result.asset).toEqual(mockAsset);
      expect(mockCallable).toHaveBeenCalledWith({
        fileId: 'file-1',
        projectId: 'project-1',
      });
    });

    it('should handle duplicate file', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: { assetId: 'existing-asset', duplicate: true, message: 'File already imported' },
      });

      (httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

      const result = await importGoogleDriveFile({ fileId: 'file-1' });

      expect(result.duplicate).toBe(true);
      expect(result.message).toBe('File already imported');
    });
  });

  describe('isGoogleDriveConnected', () => {
    it('should return true if connected', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: { files: [], nextPageToken: undefined },
      });

      (httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

      const result = await isGoogleDriveConnected();

      expect(result).toBe(true);
    });

    it('should return false if not connected', async () => {
      const mockCallable = vi.fn().mockRejectedValue(new Error('Not connected'));

      (httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockCallable);

      const result = await isGoogleDriveConnected();

      expect(result).toBe(false);
    });
  });
});

