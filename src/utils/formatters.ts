/**
 * Format bytes into human readable string
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g. "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format duration in seconds to MM:SS format
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g. "3:45")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format date to locale string
 * @param date Date object or string
 * @returns Formatted string (e.g. "Jan 15, 2024")
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Sanitize a filename by replacing invalid characters with underscores
 * @param filename The filename to sanitize
 * @returns Sanitized filename safe for file systems
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Remove file extension from a filename
 * @param filename The filename with extension
 * @returns Filename without extension
 */
export function removeFileExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Format duration from string or number to MM:SS format
 * Handles both string formats (e.g., "3:45" or "225") and number formats (seconds)
 * @param duration Duration as string or number
 * @returns Formatted string (e.g. "3:45")
 */
export function formatDurationFromString(duration: string | number): string {
  if (typeof duration === 'string') {
    // If it's already in MM:SS format, return as is
    if (duration.includes(':')) {
      return duration;
    }
    // If it's a string number, convert to number first
    const seconds = parseInt(duration, 10);
    if (isNaN(seconds)) {
      return '0:00';
    }
    return formatDuration(seconds);
  }
  // If it's a number, format it
  return formatDuration(duration);
}

/**
 * Converts duration to seconds (number)
 * Handles both string formats ("MM:SS", "H:MM:SS") and number formats
 * @param duration - Duration as string (e.g., "3:45") or number (seconds)
 * @returns Duration in seconds as number
 */
export function parseDurationToSeconds(duration: string | number): number {
  if (typeof duration === 'number') {
    return Math.floor(duration);
  }
  
  if (typeof duration === 'string') {
    // Handle "MM:SS" format
    const parts = duration.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return minutes * 60 + seconds;
      }
    }
    // Handle "H:MM:SS" format
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
        return hours * 3600 + minutes * 60 + seconds;
      }
    }
    // Try parsing as number string
    const parsed = parseFloat(duration);
    if (!isNaN(parsed)) {
      return Math.floor(parsed);
    }
  }
  
  // Default to 0 if parsing fails
  return 0;
} 