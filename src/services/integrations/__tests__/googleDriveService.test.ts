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
import { functions } from '../../../firebase/config';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
}));

jest.mock('../../../firebase/config', () => ({
  functions: {
    // Mock functions object
  },
}));

describe('GoogleDriveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startGoogleDriveOAuth', () => {
    it('should return OAuth URL and state', async () => {
      const mockCallable = jest.fn().mockResolvedValue({
        data: { authUrl: 'https://accounts.google.com/oauth', state: 'test-state' },
      });

      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      const result = await startGoogleDriveOAuth();

      expect(result).toEqual({
        authUrl: 'https://accounts.google.com/oauth',
        state: 'test-state',
      });
      expect(mockCallable).toHaveBeenCalledWith({});
    });

    it('should throw error if functions not available', async () => {
      jest.spyOn(require('../../../firebase/config'), 'functions', 'get').mockReturnValue(null);

      await expect(startGoogleDriveOAuth()).rejects.toThrow(
        'Firebase Functions service is not available'
      );
    });
  });

  describe('handleGoogleDriveCallback', () => {
    it('should handle callback successfully', async () => {
      const mockCallable = jest.fn().mockResolvedValue({
        data: { success: true },
      });

      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

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

      const mockCallable = jest.fn().mockResolvedValue({
        data: { files: mockFiles, nextPageToken: 'next-token' },
      });

      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      const result = await listGoogleDriveFiles({ pageSize: 20, pageToken: 'token' });

      expect(result.files).toEqual(mockFiles);
      expect(result.nextPageToken).toBe('next-token');
      expect(mockCallable).toHaveBeenCalledWith({ pageSize: 20, pageToken: 'token' });
    });

    it('should list files without options', async () => {
      const mockCallable = jest.fn().mockResolvedValue({
        data: { files: [], nextPageToken: undefined },
      });

      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

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

      const mockCallable = jest.fn().mockResolvedValue({
        data: { assetId: 'asset-1', duplicate: false, asset: mockAsset },
      });

      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

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
      const mockCallable = jest.fn().mockResolvedValue({
        data: { assetId: 'existing-asset', duplicate: true, message: 'File already imported' },
      });

      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      const result = await importGoogleDriveFile({ fileId: 'file-1' });

      expect(result.duplicate).toBe(true);
      expect(result.message).toBe('File already imported');
    });
  });

  describe('isGoogleDriveConnected', () => {
    it('should return true if connected', async () => {
      const mockCallable = jest.fn().mockResolvedValue({
        data: { files: [], nextPageToken: undefined },
      });

      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      const result = await isGoogleDriveConnected();

      expect(result).toBe(true);
    });

    it('should return false if not connected', async () => {
      const mockCallable = jest.fn().mockRejectedValue(new Error('Not connected'));

      (httpsCallable as jest.Mock).mockReturnValue(mockCallable);

      const result = await isGoogleDriveConnected();

      expect(result).toBe(false);
    });
  });
});

