/**
 * AI Metadata Types
 * 
 * Types for AI-assisted metadata suggestions and tagging
 */

/**
 * Confidence score for AI suggestions (0-1)
 */
export type ConfidenceScore = number;

/**
 * Suggested tag with confidence score
 */
export interface SuggestedTag {
  /** The tag value */
  tag: string;
  /** Confidence score (0-1) */
  confidence: ConfidenceScore;
  /** Category of the tag (genre, mood, instrument, etc.) */
  category?: 'genre' | 'mood' | 'instrument' | 'production' | 'other';
}

/**
 * AI-detected BPM information
 */
export interface AIDetectedBPM {
  /** Detected BPM value */
  bpm: number;
  /** Confidence score */
  confidence: ConfidenceScore;
}

/**
 * AI-detected key information
 */
export interface AIDetectedKey {
  /** Detected musical key (e.g., "C", "Am", "F#m") */
  key: string;
  /** Confidence score */
  confidence: ConfidenceScore;
  /** Scale type (major, minor, etc.) */
  scale?: 'major' | 'minor' | 'other';
}

/**
 * AI metadata suggestions for a song/asset
 */
export interface AIMetadata {
  /** Suggested tags with confidence scores */
  suggestedTags: SuggestedTag[];
  
  /** Detected BPM */
  bpm?: AIDetectedBPM;
  
  /** Detected musical key */
  key?: AIDetectedKey;
  
  /** Suggested genres */
  genres?: SuggestedTag[];
  
  /** Suggested mood tags */
  moods?: SuggestedTag[];
  
  /** Overall confidence score for all suggestions */
  overallConfidence: ConfidenceScore;
  
  /** Timestamp when suggestions were generated */
  generatedAt: string;
  
  /** Model version or identifier used for generation */
  modelVersion?: string;
}

/**
 * Request payload for AI metadata generation
 */
export interface AIMetadataRequest {
  /** Asset/song ID */
  assetId: string;
  
  /** File path in storage */
  filePath?: string;
  
  /** Optional existing metadata to refine suggestions */
  existingMetadata?: {
    title?: string;
    artist?: string;
    duration?: number;
  };
}

/**
 * Response from AI metadata service
 */
export interface AIMetadataResponse {
  /** Generated AI metadata */
  metadata: AIMetadata;
  
  /** Success status */
  success: boolean;
  
  /** Error message if generation failed */
  error?: string;
  
  /** Processing time in milliseconds */
  processingTime?: number;
}

/**
 * Options for applying AI suggestions
 */
export interface ApplyAISuggestionsOptions {
  /** Whether to apply all suggestions automatically */
  applyAll?: boolean;
  
  /** Specific tags to apply (by tag value) */
  tagsToApply?: string[];
  
  /** Whether to apply BPM suggestion */
  applyBPM?: boolean;
  
  /** Whether to apply key suggestion */
  applyKey?: boolean;
  
  /** Minimum confidence threshold for auto-applying (0-1) */
  minConfidence?: ConfidenceScore;
}

