/**
 * AI Service
 * 
 * Service for interacting with AI metadata generation.
 * Currently uses a mock adapter that returns realistic fake data.
 * Designed to be easily swapped with a real AI service implementation.
 */

import {
  AIMetadata,
  AIMetadataRequest,
  AIMetadataResponse,
  SuggestedTag,
} from '../types/ai';

/**
 * Mock AI adapter that returns realistic fake metadata suggestions
 * This can be replaced with a real AI service implementation
 */
class MockAIAdapter {
  /**
   * Generate realistic fake metadata suggestions
   */
  async generateMetadata(_request: AIMetadataRequest): Promise<AIMetadata> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    // Generate realistic fake data based on common patterns
    const genres = this.generateGenres();
    const moods = this.generateMoods();
    const instruments = this.generateInstruments();
    const tags = [...genres, ...moods, ...instruments];

    // Generate BPM (common range: 60-180)
    const bpm = 60 + Math.floor(Math.random() * 120);
    const bpmConfidence = 0.7 + Math.random() * 0.25;

    // Generate key (common keys)
    const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Dm', 'Em', 'F#m', 'Gm'];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const keyConfidence = 0.65 + Math.random() * 0.3;

    // Calculate overall confidence
    const overallConfidence = Math.min(
      (bpmConfidence + keyConfidence) / 2 + Math.random() * 0.1,
      0.95
    );

    return {
      suggestedTags: tags,
      bpm: {
        bpm,
        confidence: bpmConfidence,
      },
      key: {
        key,
        confidence: keyConfidence,
        scale: key.includes('m') ? 'minor' : 'major',
      },
      genres,
      moods,
      overallConfidence,
      generatedAt: new Date().toISOString(),
      modelVersion: 'mock-v1.0.0',
    };
  }

  /**
   * Generate realistic genre suggestions
   */
  private generateGenres(): SuggestedTag[] {
    const commonGenres = [
      'Pop',
      'Rock',
      'Hip Hop',
      'Electronic',
      'Jazz',
      'R&B',
      'Country',
      'Folk',
      'Metal',
      'Indie',
      'Alternative',
      'Blues',
    ];

    const count = 1 + Math.floor(Math.random() * 3); // 1-3 genres
    const selected = this.shuffleArray([...commonGenres]).slice(0, count);

    return selected.map((genre) => ({
      tag: genre,
      confidence: 0.6 + Math.random() * 0.35,
      category: 'genre' as const,
    }));
  }

  /**
   * Generate realistic mood suggestions
   */
  private generateMoods(): SuggestedTag[] {
    const commonMoods = [
      'Happy',
      'Energetic',
      'Calm',
      'Melancholic',
      'Aggressive',
      'Peaceful',
      'Upbeat',
      'Dark',
      'Dramatic',
      'Romantic',
      'Nostalgic',
      'Intense',
    ];

    const count = 1 + Math.floor(Math.random() * 3); // 1-3 moods
    const selected = this.shuffleArray([...commonMoods]).slice(0, count);

    return selected.map((mood) => ({
      tag: mood,
      confidence: 0.55 + Math.random() * 0.4,
      category: 'mood' as const,
    }));
  }

  /**
   * Generate realistic instrument suggestions
   */
  private generateInstruments(): SuggestedTag[] {
    const commonInstruments = [
      'Piano',
      'Guitar',
      'Drums',
      'Bass',
      'Synth',
      'Strings',
      'Vocals',
      'Saxophone',
      'Trumpet',
      'Violin',
    ];

    const count = Math.floor(Math.random() * 4); // 0-3 instruments
    if (count === 0) return [];

    const selected = this.shuffleArray([...commonInstruments]).slice(0, count);

    return selected.map((instrument) => ({
      tag: instrument,
      confidence: 0.5 + Math.random() * 0.4,
      category: 'instrument' as const,
    }));
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Real AI adapter interface (for future implementation)
 * This can be implemented to connect to actual AI services
 */
interface RealAIAdapter {
  generateMetadata(request: AIMetadataRequest): Promise<AIMetadata>;
}

/**
 * AI Service class
 * Handles metadata generation with configurable adapter
 */
class AIService {
  private adapter: MockAIAdapter | RealAIAdapter;

  constructor() {
    // Use mock adapter by default
    // TODO: Replace with real AI adapter when ready
    this.adapter = new MockAIAdapter();
  }

  /**
   * Set a custom AI adapter (for testing or real implementation)
   */
  setAdapter(adapter: MockAIAdapter | RealAIAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Generate AI metadata suggestions for an asset
   * @param request - Metadata generation request
   * @returns AI metadata response
   */
  async generateMetadata(
    request: AIMetadataRequest
  ): Promise<AIMetadataResponse> {
    try {
      const startTime = Date.now();
      const metadata = await this.adapter.generateMetadata(request);
      const processingTime = Date.now() - startTime;

      return {
        metadata,
        success: true,
        processingTime,
      };
    } catch (error) {
      return {
        metadata: {
          suggestedTags: [],
          overallConfidence: 0,
          generatedAt: new Date().toISOString(),
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Call Firebase Cloud Function for AI metadata
   * @param assetId - Asset/song ID
   * @param filePath - Optional file path
   * @returns AI metadata response
   */
  async callAIMetadataFunction(
    assetId: string,
    filePath?: string
  ): Promise<AIMetadataResponse> {
    // TODO: Implement Firebase Cloud Function call
    // For now, use local mock adapter
    return this.generateMetadata({
      assetId,
      filePath,
    });
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export adapter classes for testing
export { MockAIAdapter };

