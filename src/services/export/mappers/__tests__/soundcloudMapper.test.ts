/**
 * SoundCloud Mapper Tests
 */

import {
  mapReleaseManifestToSoundCloud,
  validateSoundCloudPayload,
} from '../soundcloudMapper';
import { ReleaseManifest } from '../../../../types/export';
import { Song } from '../../../../types/song';

describe('SoundCloud Mapper', () => {
  const createMockSong = (overrides?: Partial<Song>): Song => ({
    id: 'song-1',
    title: 'Test Song',
    artist: 'Test Artist',
    filePath: 'https://storage.example.com/song.mp3',
    userId: 'user-1',
    tripId: 'trip-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  const createMockManifest = (overrides?: Partial<ReleaseManifest>): ReleaseManifest => ({
    releaseId: 'release-1',
    title: 'Test Release',
    type: 'single',
    tracks: [
      {
        trackNumber: 1,
        songId: 'song-1',
        song: createMockSong(),
      },
    ],
    ...overrides,
  });

  describe('mapReleaseManifestToSoundCloud', () => {
    it('should map basic manifest to SoundCloud payload', async () => {
      const manifest = createMockManifest();

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.title).toBe('Test Song');
      expect(payload.license).toBe('all-rights-reserved');
      expect(payload.sharing).toBe('public');
      expect(payload.downloadable).toBe(false);
    });

    it('should use track title if provided', async () => {
      const manifest = createMockManifest({
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: createMockSong(),
            title: 'Custom Track Title',
          },
        ],
      });

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.title).toBe('Custom Track Title');
    });

    it('should include description', async () => {
      const manifest = createMockManifest({
        description: 'Test description',
      });

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.description).toContain('Test description');
    });

    it('should include genre', async () => {
      const manifest = createMockManifest({
        genre: 'Electronic',
      });

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.genre).toBe('Electronic');
    });

    it('should build tags from multiple sources', async () => {
      const manifest = createMockManifest({
        tags: ['release-tag-1', 'release-tag-2'],
        genre: 'Electronic',
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: createMockSong({
              metadata: {
                tags: ['song-tag-1', 'song-tag-2'],
              },
            }),
            metadata: {
              tags: ['track-tag-1'],
            },
          },
        ],
      });

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.tags).toBeTruthy();
      const tagsArray = payload.tags?.split(',') || [];
      expect(tagsArray).toContain('release-tag-1');
      expect(tagsArray).toContain('release-tag-2');
      expect(tagsArray).toContain('song-tag-1');
      expect(tagsArray).toContain('song-tag-2');
      expect(tagsArray).toContain('track-tag-1');
      expect(tagsArray).toContain('Electronic');
    });

    it('should include BPM if available', async () => {
      const manifest = createMockManifest({
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: createMockSong({
              metadata: {
                bpm: 128,
              },
            }),
          },
        ],
      });

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.bpm).toBe(128);
    });

    it('should include key if available', async () => {
      const manifest = createMockManifest({
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: createMockSong({
              metadata: {
                key: 'C major',
              },
            }),
          },
        ],
      });

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.key_signature).toBe('C major');
    });

    it('should include ISRC if available', async () => {
      const manifest = createMockManifest({
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: createMockSong(),
            metadata: {
              isrc: 'USRC17607839',
            },
          },
        ],
      });

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.isrc).toBe('USRC17607839');
    });

    it('should include explicit content flag', async () => {
      const manifest = createMockManifest({
        tracks: [
          {
            trackNumber: 1,
            songId: 'song-1',
            song: createMockSong(),
            metadata: {
              explicit: true,
            },
          },
        ],
      });

      const payload = await mapReleaseManifestToSoundCloud(manifest);

      expect(payload.explicit_content).toBe(true);
    });

    it('should throw error if no tracks', async () => {
      const manifest = createMockManifest({
        tracks: [],
      });

      await expect(mapReleaseManifestToSoundCloud(manifest)).rejects.toThrow('No tracks');
    });
  });

  describe('validateSoundCloudPayload', () => {
    it('should validate correct payload', () => {
      const payload = {
        title: 'Test Song',
        description: 'Test description',
        genre: 'Electronic',
        tags: 'tag1,tag2',
        license: 'all-rights-reserved',
        sharing: 'public',
        downloadable: false,
      };

      const result = validateSoundCloudPayload(payload as any);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing title', () => {
      const payload = {
        description: 'Test description',
      };

      const result = validateSoundCloudPayload(payload as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should fail for title too long', () => {
      const payload = {
        title: 'a'.repeat(256),
      };

      const result = validateSoundCloudPayload(payload as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be 255 characters or less');
    });

    it('should fail for description too long', () => {
      const payload = {
        title: 'Test Song',
        description: 'a'.repeat(5001),
      };

      const result = validateSoundCloudPayload(payload as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description must be 5000 characters or less');
    });
  });
});

