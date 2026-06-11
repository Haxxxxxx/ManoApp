import { vi } from 'vitest';
/**
 * SoundCloud Connector Tests
 */

import { SoundCloudConnector } from '../soundcloudConnector';
import { ReleaseManifest, RightsSplit } from '../../../../types/export';

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

vi.mock('../../../../firebase/config', () => ({
  functions: {
    // Mock functions object
  },
}));

describe('SoundCloudConnector', () => {
  let connector: SoundCloudConnector;

  beforeEach(() => {
    connector = new SoundCloudConnector();
    vi.clearAllMocks();
  });

  describe('properties', () => {
    it('should have correct name and id', () => {
      expect(connector.name).toBe('SoundCloud');
      expect(connector.id).toBe('soundcloud');
    });
  });

  describe('runPreflight', () => {
    it('should pass preflight for valid manifest', async () => {
      const manifest: ReleaseManifest = {
        releaseId: 'release-1',
        title: 'Test Release',
        type: 'single',
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: {
              id: 'song-1',
              title: 'Test Song',
              artist: 'Test Artist',
              duration: '3:00',
              filePath: 'https://storage.example.com/song.mp3',
              userId: 'user-1',
              tripId: 'trip-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        ],
      };

      const result = await connector.runPreflight(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail preflight for missing title', async () => {
      const manifest: ReleaseManifest = {
        releaseId: 'release-1',
        title: '',
        type: 'single',
        tracks: [],
      };

      const result = await connector.runPreflight(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_TITLE')).toBe(true);
    });

    it('should fail preflight for no tracks', async () => {
      const manifest: ReleaseManifest = {
        releaseId: 'release-1',
        title: 'Test Release',
        type: 'single',
        tracks: [],
      };

      const result = await connector.runPreflight(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'NO_TRACKS')).toBe(true);
    });

    it('should fail preflight for invalid rights splits', async () => {
      const splits: RightsSplit[] = [
        { userId: 'user-1', name: 'User 1', percentage: 60 },
        { userId: 'user-2', name: 'User 2', percentage: 30 },
      ];

      const manifest: ReleaseManifest = {
        releaseId: 'release-1',
        title: 'Test Release',
        type: 'single',
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: {
              id: 'song-1',
              title: 'Test Song',
              artist: 'Test Artist',
              duration: '3:00',
              filePath: 'https://storage.example.com/song.mp3',
              userId: 'user-1',
              tripId: 'trip-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        ],
        rightsSplits: splits,
      };

      const result = await connector.runPreflight(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_SPLITS')).toBe(true);
    });

    it('should warn for missing artwork', async () => {
      const manifest: ReleaseManifest = {
        releaseId: 'release-1',
        title: 'Test Release',
        type: 'single',
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: {
              id: 'song-1',
              title: 'Test Song',
              artist: 'Test Artist',
              duration: '3:00',
              filePath: 'https://storage.example.com/song.mp3',
              userId: 'user-1',
              tripId: 'trip-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        ],
      };

      const result = await connector.runPreflight(manifest);

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.code === 'MISSING_ARTWORK')).toBe(true);
    });

    it('should warn for album type', async () => {
      const manifest: ReleaseManifest = {
        releaseId: 'release-1',
        title: 'Test Album',
        type: 'album',
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: {
              id: 'song-1',
              title: 'Track 1',
              artist: 'Test Artist',
              duration: '3:00',
              filePath: 'https://storage.example.com/track1.mp3',
              userId: 'user-1',
              tripId: 'trip-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
          {
            trackNumber: 2,
            songId: 'song-2',
            song: {
              id: 'song-2',
              title: 'Track 2',
              artist: 'Test Artist',
              duration: '3:00',
              filePath: 'https://storage.example.com/track2.mp3',
              userId: 'user-1',
              tripId: 'trip-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        ],
      };

      const result = await connector.runPreflight(manifest);

      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.code === 'ALBUM_NOT_SUPPORTED')).toBe(true);
    });
  });

  describe('authorize', () => {
    it('should return redirect URL if not authorized', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: { hasToken: false },
      });

      const mockOAuthCallable = vi.fn().mockResolvedValue({
        data: { redirectUrl: 'https://soundcloud.com/oauth' },
      });

      const { httpsCallable } = await import('firebase/functions');
      vi.mocked(httpsCallable)
        .mockReturnValueOnce(mockCallable)
        .mockReturnValueOnce(mockOAuthCallable);

      const result = await connector.authorize('user-1');

      expect(result).toEqual({ redirectUrl: 'https://soundcloud.com/oauth' });
    });

    it('should return authorized if token exists', async () => {
      const mockCallable = vi.fn().mockResolvedValue({
        data: { hasToken: true },
      });

      const { httpsCallable } = await import('firebase/functions');
      vi.mocked(httpsCallable).mockReturnValue(mockCallable);

      const result = await connector.authorize('user-1');

      expect(result).toBe('authorized');
    });
  });
});

