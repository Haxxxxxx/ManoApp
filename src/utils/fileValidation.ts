import { FILE_SIZE_LIMITS, ALLOWED_AUDIO_TYPES, ALLOWED_AUDIO_EXTENSIONS, ALLOWED_IMAGE_TYPES } from './constants';
import { formatBytes } from './formatters';

/**
 * Validates an audio file
 * @param file The file to validate
 * @param maxSize Maximum file size in bytes (defaults to AUDIO_UPLOAD limit)
 * @returns Error message if invalid, null if valid
 */
export const validateAudioFile = (
  file: File,
  maxSize: number = FILE_SIZE_LIMITS.AUDIO_UPLOAD
): string | null => {
  if (file.size > maxSize) {
    return `${file.name} exceeds the maximum file size of ${formatBytes(maxSize)}`;
  }

  const fileType = file.type || '';
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();

  const isValidType = ALLOWED_AUDIO_TYPES.includes(fileType as typeof ALLOWED_AUDIO_TYPES[number]);
  const isValidExtension = ALLOWED_AUDIO_EXTENSIONS.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );

  if (!isValidType && !isValidExtension) {
    return `${file.name} is not a supported audio format. Supported formats: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`;
  }

  return null;
};

/**
 * Validates an image file
 * @param file The file to validate
 * @param maxSize Maximum file size in bytes (defaults to AUDIO_UPLOAD limit)
 * @returns Error message if invalid, null if valid
 */
export const validateImageFile = (
  file: File,
  maxSize: number = FILE_SIZE_LIMITS.AUDIO_UPLOAD
): string | null => {
  if (file.size > maxSize) {
    return `${file.name} exceeds the maximum file size of ${formatBytes(maxSize)}`;
  }

  const fileType = file.type || '';
  if (!ALLOWED_IMAGE_TYPES.includes(fileType as typeof ALLOWED_IMAGE_TYPES[number])) {
    return `${file.name} is not a supported image format. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
  }

  return null;
};

/**
 * Checks if a file is a valid audio file (returns boolean)
 * @param file The file to check
 * @returns True if valid audio file, false otherwise
 */
export const isValidAudioFile = (file: File): boolean => {
  return validateAudioFile(file) === null;
};

/**
 * Checks if a file is a valid image file (returns boolean)
 * @param file The file to check
 * @returns True if valid image file, false otherwise
 */
export const isValidImageFile = (file: File): boolean => {
  return validateImageFile(file) === null;
};

