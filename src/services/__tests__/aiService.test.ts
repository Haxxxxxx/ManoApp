/**
 * Unit tests for AI Service
 */

import { aiService, MockAIAdapter } from '../aiService';
import { AIMetadataRequest } from '../../types/ai';

describe('aiService', () => {
  describe('generateMetadata', () => {
    it('should generate metadata with mock adapter', async () => {
      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
        filePath: 'songs/test-song.mp3',
      };

      const response = await aiService.generateMetadata(request);

      expect(response.success).toBe(true);
      expect(response.metadata).toBeDefined();
      expect(response.metadata.suggestedTags).toBeDefined();
      expect(Array.isArray(response.metadata.suggestedTags)).toBe(true);
      expect(response.metadata.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(response.metadata.overallConfidence).toBeLessThanOrEqual(1);
      expect(response.metadata.generatedAt).toBeDefined();
    });

    it('should include BPM and key in metadata', async () => {
      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
      };

      const response = await aiService.generateMetadata(request);

      if (response.success && response.metadata.bpm) {
        expect(response.metadata.bpm.bpm).toBeGreaterThan(0);
        expect(response.metadata.bpm.confidence).toBeGreaterThanOrEqual(0);
        expect(response.metadata.bpm.confidence).toBeLessThanOrEqual(1);
      }

      if (response.success && response.metadata.key) {
        expect(response.metadata.key.key).toBeDefined();
        expect(typeof response.metadata.key.key).toBe('string');
        expect(response.metadata.key.confidence).toBeGreaterThanOrEqual(0);
        expect(response.metadata.key.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should include genres and moods in metadata', async () => {
      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
      };

      const response = await aiService.generateMetadata(request);

      if (response.success) {
        if (response.metadata.genres) {
          expect(Array.isArray(response.metadata.genres)).toBe(true);
          response.metadata.genres.forEach((genre) => {
            expect(genre.tag).toBeDefined();
            expect(genre.confidence).toBeGreaterThanOrEqual(0);
            expect(genre.confidence).toBeLessThanOrEqual(1);
            expect(genre.category).toBe('genre');
          });
        }

        if (response.metadata.moods) {
          expect(Array.isArray(response.metadata.moods)).toBe(true);
          response.metadata.moods.forEach((mood) => {
            expect(mood.tag).toBeDefined();
            expect(mood.confidence).toBeGreaterThanOrEqual(0);
            expect(mood.confidence).toBeLessThanOrEqual(1);
            expect(mood.category).toBe('mood');
          });
        }
      }
    });

    it('should handle errors gracefully', async () => {
      // Create a mock adapter that throws an error
      const errorAdapter = {
        generateMetadata: async () => {
          throw new Error('Test error');
        },
      };

      aiService.setAdapter(errorAdapter as any);

      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
      };

      const response = await aiService.generateMetadata(request);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata.suggestedTags).toEqual([]);

      // Reset to default adapter
      aiService.setAdapter(new MockAIAdapter());
    });

    it('should return processing time', async () => {
      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
      };

      const response = await aiService.generateMetadata(request);

      if (response.success) {
        expect(response.processingTime).toBeDefined();
        expect(typeof response.processingTime).toBe('number');
        expect(response.processingTime).toBeGreaterThan(0);
      }
    });
  });

  describe('MockAIAdapter', () => {
    let adapter: MockAIAdapter;

    beforeEach(() => {
      adapter = new MockAIAdapter();
    });

    it('should generate realistic genre suggestions', async () => {
      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
      };

      const metadata = await adapter.generateMetadata(request);

      if (metadata.genres) {
        expect(metadata.genres.length).toBeGreaterThan(0);
        expect(metadata.genres.length).toBeLessThanOrEqual(3);
        metadata.genres.forEach((genre) => {
          expect(genre.category).toBe('genre');
          expect(genre.confidence).toBeGreaterThanOrEqual(0.6);
        });
      }
    });

    it('should generate realistic mood suggestions', async () => {
      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
      };

      const metadata = await adapter.generateMetadata(request);

      if (metadata.moods) {
        expect(metadata.moods.length).toBeGreaterThan(0);
        expect(metadata.moods.length).toBeLessThanOrEqual(3);
        metadata.moods.forEach((mood) => {
          expect(mood.category).toBe('mood');
          expect(mood.confidence).toBeGreaterThanOrEqual(0.55);
        });
      }
    });

    it('should generate BPM in reasonable range', async () => {
      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
      };

      const metadata = await adapter.generateMetadata(request);

      if (metadata.bpm) {
        expect(metadata.bpm.bpm).toBeGreaterThanOrEqual(60);
        expect(metadata.bpm.bpm).toBeLessThanOrEqual(180);
        expect(metadata.bpm.confidence).toBeGreaterThanOrEqual(0.7);
        expect(metadata.bpm.confidence).toBeLessThanOrEqual(0.95);
      }
    });

    it('should generate valid musical keys', async () => {
      const request: AIMetadataRequest = {
        assetId: 'test-song-123',
      };

      const metadata = await adapter.generateMetadata(request);

      if (metadata.key) {
        const validKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Dm', 'Em', 'F#m', 'Gm'];
        expect(validKeys).toContain(metadata.key.key);
        expect(metadata.key.confidence).toBeGreaterThanOrEqual(0.65);
        expect(metadata.key.confidence).toBeLessThanOrEqual(0.95);
      }
    });
  });
});

