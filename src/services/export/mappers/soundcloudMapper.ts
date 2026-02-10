/**
 * SoundCloud Mapper
 * 
 * Maps ReleaseManifest to SoundCloud API payload format
 * 
 * SoundCloud API Documentation:
 * https://developers.soundcloud.com/docs/api/guide
 */

import { ReleaseManifest } from '../../../types/export';

/**
 * SoundCloud track payload
 */
export interface SoundCloudTrackPayload {
  /** Track title */
  title: string;
  
  /** Track description */
  description?: string;
  
  /** Genre */
  genre?: string;
  
  /** Tags (comma-separated string) */
  tags?: string;
  
  /** License type */
  license?: string;
  
  /** Sharing (public/private) */
  sharing?: 'public' | 'private';
  
  /** Downloadable */
  downloadable?: boolean;
  
  /** Artwork data URL or file */
  artwork_data?: string;
  
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Map ReleaseManifest to SoundCloud API payload
 * 
 * Note: SoundCloud API supports single track uploads.
 * For albums with multiple tracks, each track should be submitted separately.
 */
export async function mapReleaseManifestToSoundCloud(
  manifest: ReleaseManifest
): Promise<SoundCloudTrackPayload> {
  // For single tracks, use the first track
  // For albums, this would be called once per track
  const track = manifest.tracks[0];
  
  if (!track) {
    throw new Error('No tracks in release manifest');
  }

  // Build tags string (SoundCloud uses comma-separated tags)
  const tagsArray: string[] = [];
  
  // Add release tags
  if (manifest.tags && manifest.tags.length > 0) {
    tagsArray.push(...manifest.tags);
  }
  
  // Add track-specific tags
  if (track.metadata?.tags && track.metadata.tags.length > 0) {
    tagsArray.push(...track.metadata.tags);
  }
  
  // Add genre as tag if present
  if (manifest.genre) {
    tagsArray.push(manifest.genre);
  }
  
  // Add song metadata tags
  if (track.song.metadata?.tags && track.song.metadata.tags.length > 0) {
    tagsArray.push(...track.song.metadata.tags);
  }
  
  // Remove duplicates and limit to reasonable number
  const uniqueTags = Array.from(new Set(tagsArray)).slice(0, 20);
  const tagsString = uniqueTags.join(',');

  // Build description
  let description = manifest.description || '';
  
  // Add release info to description
  if (manifest.type !== 'single') {
    description = `${description}\n\nRelease: ${manifest.title}`;
    if (manifest.releaseDate) {
      description = `${description}\nRelease Date: ${manifest.releaseDate}`;
    }
  }
  
  // Add track metadata
  if (track.song.metadata?.lyrics) {
    description = `${description}\n\nLyrics:\n${track.song.metadata.lyrics}`;
  }

  // Determine license (default to "all-rights-reserved")
  // SoundCloud license options:
  // - "no-rights-reserved"
  // - "all-rights-reserved"
  // - "cc-by"
  // - "cc-by-nc"
  // - "cc-by-nd"
  // - "cc-by-sa"
  // - "cc-by-nc-nd"
  // - "cc-by-nc-sa"
  const license = 'all-rights-reserved'; // Default, can be configured

  // Build SoundCloud payload
  const payload: SoundCloudTrackPayload = {
    title: track.title || track.song.title,
    description: description.trim(),
    genre: manifest.genre || track.song.metadata?.genre?.[0] || undefined,
    tags: tagsString || undefined,
    license,
    sharing: 'public', // Default to public, can be configured
    downloadable: false, // Default to false, can be configured
  };

  // Add explicit content flag if present
  if (track.metadata?.explicit) {
    payload.explicit_content = true;
  }

  // Add BPM if available
  if (track.song.metadata?.bpm) {
    payload.bpm = track.song.metadata.bpm;
  }

  // Add key if available
  if (track.song.metadata?.key) {
    payload.key_signature = track.song.metadata.key;
  }

  // Add ISRC if available
  if (track.metadata?.isrc) {
    payload.isrc = track.metadata.isrc;
  }

  // Handle artwork
  // SoundCloud expects artwork_data as base64-encoded image
  // This should be handled in the connector's prepare() method
  // For now, we'll pass the artwork URL and let the server handle it
  if (manifest.artworkUrl) {
    // Artwork will be fetched and converted to base64 in the connector
    payload.artwork_data = undefined; // Placeholder
  }

  return payload;
}

/**
 * Validate SoundCloud payload
 */
export function validateSoundCloudPayload(
  payload: SoundCloudTrackPayload
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Title is required
  if (!payload.title || payload.title.trim().length === 0) {
    errors.push('Title is required');
  }

  // Title max length
  if (payload.title && payload.title.length > 255) {
    errors.push('Title must be 255 characters or less');
  }

  // Description max length
  if (payload.description && payload.description.length > 5000) {
    errors.push('Description must be 5000 characters or less');
  }

  // Tags max length (SoundCloud has a limit)
  if (payload.tags && payload.tags.length > 200) {
    errors.push('Tags string is too long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

