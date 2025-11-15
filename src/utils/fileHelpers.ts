/**
 * Fetches an audio blob from various URL types (blob, http, local)
 * @param filePath The file path or URL
 * @returns Promise resolving to the audio blob
 * @throws Error if the file cannot be fetched or is empty
 */
export async function fetchAudioBlob(filePath: string): Promise<Blob> {
  let audioBlob: Blob;
  
  if (filePath.startsWith('blob:') || filePath.startsWith('data:')) {
    // For blob URLs, fetch them directly
    const response = await fetch(filePath);
    audioBlob = await response.blob();
  } else if (filePath.startsWith('http')) {
    // For remote URLs (like Firebase Storage)
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to download audio file: ${response.status} ${response.statusText}`);
    }
    audioBlob = await response.blob();
  } else {
    // For local file paths
    const response = await fetch(filePath);
    audioBlob = await response.blob();
  }
  
  if (audioBlob.size === 0) {
    throw new Error('Downloaded audio file is empty');
  }
  
  return audioBlob;
}

/**
 * Creates metadata object for a song
 * @param song The song to create metadata for
 * @returns Metadata object
 */
export function createSongMetadata(song: { title: string; artist: string; metadata?: { genre?: string[]; tags?: string[]; bpm?: string | number; key?: string; releaseDate?: string }; notes?: string }) {
  return {
    title: song.title,
    artist: song.artist,
    description: `${song.title} by ${song.artist}`,
    genre: song.metadata?.genre?.[0] || '',
    tags: song.metadata?.tags?.join(', ') || '',
    bpm: song.metadata?.bpm || '',
    key: song.metadata?.key || '',
    releaseDate: song.metadata?.releaseDate || '',
    notes: song.notes || ''
  };
}

