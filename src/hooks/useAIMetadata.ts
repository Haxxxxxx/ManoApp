import { useState, useCallback, useRef } from 'react';
import { aiService } from '../services/aiService';
import { updateSong } from '../services/firebaseService';
import type { Song, SongMetadata } from '../types/song';
import type { AIMetadata } from '../types/ai';

interface UseAIMetadataReturn {
  aiMetadata: AIMetadata | null;
  loading: boolean;
  applied: boolean;
  error: string | null;
  generate: () => Promise<void>;
  apply: (onSuccess?: (updatedSong: Song) => void) => Promise<void>;
  undo: (onSuccess?: (updatedSong: Song) => void) => Promise<void>;
}

export function useAIMetadata(song: Song, _tripId: string): UseAIMetadataReturn {
  const [aiMetadata, setAiMetadata] = useState<AIMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const snapshotRef = useRef<SongMetadata | undefined>(undefined);

  const generate = useCallback(async () => {
    setLoading(true);
    setApplied(false);
    setError(null);
    try {
      const response = await aiService.generateMetadata({
        assetId: song.id,
        filePath: song.filePath,
      });
      if (response.success && response.metadata) {
        setAiMetadata(response.metadata);
      } else {
        setError('No metadata suggestions available for this track.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI suggestions.');
    } finally {
      setLoading(false);
    }
  }, [song.id, song.filePath]);

  const apply = useCallback(async (onSuccess?: (updatedSong: Song) => void) => {
    if (!aiMetadata) return;

    snapshotRef.current = song.metadata ? { ...song.metadata } : undefined;

    const updates: Partial<SongMetadata> = {};

    if (aiMetadata.bpm?.bpm) updates.bpm = aiMetadata.bpm.bpm;
    if (aiMetadata.key?.key) updates.key = aiMetadata.key.key;
    if (aiMetadata.genres && aiMetadata.genres.length > 0) {
      updates.genre = aiMetadata.genres.map((g) => g.tag);
    }
    if (aiMetadata.suggestedTags && aiMetadata.suggestedTags.length > 0) {
      updates.tags = aiMetadata.suggestedTags.map((t) => (typeof t === 'string' ? t : t.tag));
    }

    const mergedMetadata: SongMetadata = {
      ...song.metadata,
      ...updates,
    };

    setError(null);
    try {
      await updateSong(song.id, { metadata: mergedMetadata });
      setApplied(true);
      if (onSuccess) {
        onSuccess({ ...song, metadata: mergedMetadata });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply suggestions.');
    }
  }, [aiMetadata, song]);

  const undo = useCallback(async (onSuccess?: (updatedSong: Song) => void) => {
    if (!applied) return;
    setError(null);
    try {
      await updateSong(song.id, { metadata: snapshotRef.current || {} });
      setApplied(false);
      if (onSuccess) {
        onSuccess({ ...song, metadata: snapshotRef.current || {} as SongMetadata });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo changes.');
    }
  }, [applied, song]);

  return { aiMetadata, loading, applied, error, generate, apply, undo };
}
