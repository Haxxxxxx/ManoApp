/**
 * Firebase Cloud Function: AI Metadata Generation
 * 
 * POST /api/ai/metadata
 * 
 * Generates AI-assisted metadata suggestions for uploaded audio assets.
 * Currently uses a mock implementation that can be swapped with a real AI service.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Mock AI metadata generator
 * Returns realistic fake metadata suggestions
 * TODO: Replace with real AI service integration
 */
async function generateMockAIMetadata(assetId: string, filePath?: string): Promise<{
  suggestedTags: Array<{ tag: string; confidence: number; category?: string }>;
  bpm?: { bpm: number; confidence: number };
  key?: { key: string; confidence: number; scale?: string };
  genres?: Array<{ tag: string; confidence: number; category?: string }>;
  moods?: Array<{ tag: string; confidence: number; category?: string }>;
  overallConfidence: number;
}> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  // Generate realistic fake data
  const genres = [
    { tag: 'Pop', confidence: 0.75, category: 'genre' },
    { tag: 'Electronic', confidence: 0.68, category: 'genre' },
  ];
  
  const moods = [
    { tag: 'Energetic', confidence: 0.72, category: 'mood' },
    { tag: 'Upbeat', confidence: 0.65, category: 'mood' },
  ];

  const bpm = 120 + Math.floor(Math.random() * 40);
  const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em'];
  const key = keys[Math.floor(Math.random() * keys.length)];

  return {
    suggestedTags: [...genres, ...moods],
    bpm: {
      bpm,
      confidence: 0.7 + Math.random() * 0.25,
    },
    key: {
      key,
      confidence: 0.65 + Math.random() * 0.3,
      scale: key.includes('m') ? 'minor' : 'major',
    },
    genres,
    moods,
    overallConfidence: 0.7 + Math.random() * 0.2,
  };
}

/**
 * AI Metadata Cloud Function
 * 
 * Request body:
 * {
 *   assetId: string (required) - Song/asset ID
 *   filePath?: string - Optional file path in storage
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   metadata: AIMetadata
 *   error?: string
 * }
 */
export const aiMetadata = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { assetId, filePath } = request.data;

      // Validate input
      if (!assetId || typeof assetId !== 'string') {
        throw new HttpsError('invalid-argument', 'assetId is required and must be a string');
      }

      // Check if user is authenticated
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = request.auth.uid;

      // Verify user has access to the asset
      try {
        const songDoc = await db.collection('songs').doc(assetId).get();
        
        if (!songDoc.exists) {
          throw new HttpsError('not-found', 'Song not found');
        }

        const songData = songDoc.data();
        if (!songData) {
          throw new HttpsError('not-found', 'Song data not found');
        }

        // Check if user owns the song or has access via project
        if (songData.userId !== userId) {
          // Check if user is a collaborator on the project
          if (songData.tripId) {
            const tripDoc = await db.collection('trips').doc(songData.tripId).get();
            const tripData = tripDoc.data();
            const collaborators = tripData?.collaborators || [];
            
            if (!collaborators.includes(userId)) {
              throw new HttpsError('permission-denied', 'User does not have access to this song');
            }
          } else {
            throw new HttpsError('permission-denied', 'User does not have access to this song');
          }
        }
      } catch (error) {
        if (error instanceof HttpsError) {
          throw error;
        }
        logger.error('Error verifying song access:', error);
        throw new HttpsError('internal', 'Error verifying song access');
      }

      // Generate AI metadata (using mock for now)
      logger.info(`Generating AI metadata for asset: ${assetId}`);
      const aiMetadata = await generateMockAIMetadata(assetId, filePath);

      // Add timestamp and model version
      const generatedAt = new Date().toISOString();
      const metadata = {
        ...aiMetadata,
        generatedAt,
        modelVersion: 'mock-v1.0.0',
      };

      // Update song document with AI metadata
      await db.collection('songs').doc(assetId).update({
        'metadata.aiMetadata': metadata,
        'metadata.suggestedTags': aiMetadata.suggestedTags.map(t => t.tag),
      });

      logger.info(`AI metadata generated successfully for asset: ${assetId}`);

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      logger.error('Error generating AI metadata:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to generate AI metadata'
      );
    }
  }
);

