/**
 * File size constants (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  AUDIO_UPLOAD: 50 * 1024 * 1024, // 50MB
  AUDIO_STORAGE: 100 * 1024 * 1024, // 100MB
  AUDIO_FIREBASE: 10 * 1024 * 1024, // 10MB
  SOUNDCLOUD: 200 * 1024 * 1024, // 200MB
  SPOTIFY: 2 * 1024 * 1024 * 1024, // 2GB
  APPLE_MUSIC: 500 * 1024 * 1024, // 500MB
  YOUTUBE: 1024 * 1024 * 1024, // 1GB
} as const;

/**
 * Allowed audio file MIME types
 */
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
] as const;

/**
 * Allowed audio file extensions
 */
export const ALLOWED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.ogg',
  '.m4a',
] as const;

/**
 * Allowed image file MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Form validation limits
 */
export const FORM_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  ARTIST_MAX_LENGTH: 100,
  GENRE_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 1000,
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  LOCAL_FILES: 'localFiles',
  LOCAL_PROJECT_ID: 'localProjectId',
  ALBUM_DRAFT: 'albumDraft',
  FILE_INFO: (songId: string) => `fileInfo_${songId}`,
  BLOB_URL: (songId: string) => `blobUrl_${songId}`,
} as const;

/**
 * Time constants (in milliseconds)
 */
export const TIME_CONSTANTS = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
} as const;

/**
 * Chunk size for file uploads (in bytes)
 */
export const UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Suggested tags by category
 */
export const SUGGESTED_TAGS = {
  genres: ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Jazz', 'Classical'],
  moods: ['Happy', 'Energetic', 'Calm', 'Melancholic', 'Dark', 'Upbeat'],
  types: ['Single', 'Album', 'EP', 'Demo', 'Remix', 'Cover'],
  status: ['In Progress', 'Draft', 'Final', 'Released']
} as const;

/**
 * Special project IDs
 */
export const SPECIAL_PROJECT_IDS = {
  LOCAL_SONGS: 'local-songs-project',
} as const;

