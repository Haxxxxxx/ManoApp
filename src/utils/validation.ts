import { FORM_LIMITS } from './constants';

export interface ValidationResult {
  error: boolean;
  message: string;
}

/**
 * Validates a title field
 */
export function validateTitle(value: string): ValidationResult {
  if (!value.trim()) {
    return { error: true, message: 'Title is required' };
  }
  if (value.length > FORM_LIMITS.TITLE_MAX_LENGTH) {
    return { error: true, message: `Title must be ${FORM_LIMITS.TITLE_MAX_LENGTH} characters or less` };
  }
  return { error: false, message: '' };
}

/**
 * Validates an artist field
 */
export function validateArtist(value: string): ValidationResult {
  if (!value.trim()) {
    return { error: true, message: 'Artist name is required' };
  }
  if (value.length > FORM_LIMITS.ARTIST_MAX_LENGTH) {
    return { error: true, message: `Artist name must be ${FORM_LIMITS.ARTIST_MAX_LENGTH} characters or less` };
  }
  return { error: false, message: '' };
}

/**
 * Validates a genre field
 */
export function validateGenre(value: string): ValidationResult {
  if (value.length > FORM_LIMITS.GENRE_MAX_LENGTH) {
    return { error: true, message: `Genre must be ${FORM_LIMITS.GENRE_MAX_LENGTH} characters or less` };
  }
  return { error: false, message: '' };
}

/**
 * Validates a description field
 */
export function validateDescription(value: string): ValidationResult {
  if (value.length > FORM_LIMITS.DESCRIPTION_MAX_LENGTH) {
    return { error: true, message: `Description must be ${FORM_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less` };
  }
  return { error: false, message: '' };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) {
    return { error: true, message: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { error: true, message: 'Please enter a valid email address' };
  }
  return { error: false, message: '' };
}

/**
 * Validates password
 */
export function validatePassword(password: string, minLength: number = 6): ValidationResult {
  if (!password) {
    return { error: true, message: 'Password is required' };
  }
  if (password.length < minLength) {
    return { error: true, message: `Password must be at least ${minLength} characters long` };
  }
  return { error: false, message: '' };
}

