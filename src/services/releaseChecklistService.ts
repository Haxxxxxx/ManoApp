/**
 * Release Checklist Service
 * 
 * Service for generating and managing release checklists
 */

import { ChecklistItem, ReleaseType } from '../types/release';

/**
 * Checklist item templates
 */
const CHECKLIST_TEMPLATES: Record<ReleaseType, Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>[]> = {
  single: [
    {
      title: 'Complete song metadata',
      description: 'Ensure all metadata fields are filled (title, artist, genre, etc.)',
      status: 'pending',
      required: true,
      category: 'metadata',
      priority: 'high',
    },
    {
      title: 'Obtain ISRC code',
      description: 'Get International Standard Recording Code for the single',
      status: 'pending',
      required: true,
      category: 'licensing',
      priority: 'high',
    },
    {
      title: 'Create cover artwork',
      description: 'Design cover art (3000x3000px minimum, square format)',
      status: 'pending',
      required: true,
      category: 'artwork',
      priority: 'high',
    },
    {
      title: 'Master audio file',
      description: 'Final mastered audio file ready for distribution',
      status: 'pending',
      required: true,
      category: 'metadata',
      priority: 'critical',
    },
    {
      title: 'Set release date',
      description: 'Choose and confirm release date',
      status: 'pending',
      required: true,
      category: 'distribution',
      priority: 'high',
    },
    {
      title: 'Prepare distribution',
      description: 'Upload to distribution platforms (Spotify, Apple Music, etc.)',
      status: 'pending',
      required: false,
      category: 'distribution',
      priority: 'medium',
    },
    {
      title: 'Create promotional materials',
      description: 'Social media posts, press release, etc.',
      status: 'pending',
      required: false,
      category: 'promotion',
      priority: 'low',
    },
    {
      title: 'Review and finalize',
      description: 'Final review of all materials before release',
      status: 'pending',
      required: true,
      category: 'other',
      priority: 'high',
    },
  ],
  album: [
    {
      title: 'Complete album metadata',
      description: 'Album title, artist, tracklist, genre, etc.',
      status: 'pending',
      required: true,
      category: 'metadata',
      priority: 'high',
    },
    {
      title: 'Obtain ISRC codes',
      description: 'Get ISRC codes for all tracks',
      status: 'pending',
      required: true,
      category: 'licensing',
      priority: 'high',
    },
    {
      title: 'Create album artwork',
      description: 'Design album cover (3000x3000px minimum, square format)',
      status: 'pending',
      required: true,
      category: 'artwork',
      priority: 'high',
    },
    {
      title: 'Master all tracks',
      description: 'Final mastered audio files for all tracks',
      status: 'pending',
      required: true,
      category: 'metadata',
      priority: 'critical',
    },
    {
      title: 'Create track artwork (optional)',
      description: 'Individual track artwork if needed',
      status: 'pending',
      required: false,
      category: 'artwork',
      priority: 'low',
    },
    {
      title: 'Set release date',
      description: 'Choose and confirm album release date',
      status: 'pending',
      required: true,
      category: 'distribution',
      priority: 'high',
    },
    {
      title: 'Prepare distribution',
      description: 'Upload to distribution platforms',
      status: 'pending',
      required: false,
      category: 'distribution',
      priority: 'medium',
    },
    {
      title: 'Create promotional campaign',
      description: 'Social media, press release, album launch event',
      status: 'pending',
      required: false,
      category: 'promotion',
      priority: 'medium',
    },
    {
      title: 'Review and finalize',
      description: 'Final review of all materials before release',
      status: 'pending',
      required: true,
      category: 'other',
      priority: 'high',
    },
  ],
  ep: [
    {
      title: 'Complete EP metadata',
      description: 'EP title, artist, tracklist, genre',
      status: 'pending',
      required: true,
      category: 'metadata',
      priority: 'high',
    },
    {
      title: 'Obtain ISRC codes',
      description: 'Get ISRC codes for all tracks',
      status: 'pending',
      required: true,
      category: 'licensing',
      priority: 'high',
    },
    {
      title: 'Create EP artwork',
      description: 'Design EP cover (3000x3000px minimum)',
      status: 'pending',
      required: true,
      category: 'artwork',
      priority: 'high',
    },
    {
      title: 'Master all tracks',
      description: 'Final mastered audio files',
      status: 'pending',
      required: true,
      category: 'metadata',
      priority: 'critical',
    },
    {
      title: 'Set release date',
      description: 'Choose and confirm release date',
      status: 'pending',
      required: true,
      category: 'distribution',
      priority: 'high',
    },
    {
      title: 'Prepare distribution',
      description: 'Upload to distribution platforms',
      status: 'pending',
      required: false,
      category: 'distribution',
      priority: 'medium',
    },
    {
      title: 'Create promotional materials',
      description: 'Social media posts, press release',
      status: 'pending',
      required: false,
      category: 'promotion',
      priority: 'low',
    },
    {
      title: 'Review and finalize',
      description: 'Final review before release',
      status: 'pending',
      required: true,
      category: 'other',
      priority: 'high',
    },
  ],
  mixtape: [
    {
      title: 'Complete mixtape metadata',
      description: 'Mixtape title, artist, tracklist',
      status: 'pending',
      required: true,
      category: 'metadata',
      priority: 'high',
    },
    {
      title: 'Clear all samples',
      description: 'Ensure all samples are cleared for use',
      status: 'pending',
      required: true,
      category: 'licensing',
      priority: 'critical',
    },
    {
      title: 'Create mixtape artwork',
      description: 'Design cover art',
      status: 'pending',
      required: true,
      category: 'artwork',
      priority: 'high',
    },
    {
      title: 'Master audio',
      description: 'Final mastered audio file',
      status: 'pending',
      required: true,
      category: 'metadata',
      priority: 'critical',
    },
    {
      title: 'Set release date',
      description: 'Choose release date',
      status: 'pending',
      required: true,
      category: 'distribution',
      priority: 'high',
    },
    {
      title: 'Prepare distribution',
      description: 'Upload to platforms',
      status: 'pending',
      required: false,
      category: 'distribution',
      priority: 'medium',
    },
    {
      title: 'Create promotional materials',
      description: 'Social media, announcements',
      status: 'pending',
      required: false,
      category: 'promotion',
      priority: 'low',
    },
    {
      title: 'Review and finalize',
      description: 'Final review',
      status: 'pending',
      required: true,
      category: 'other',
      priority: 'high',
    },
  ],
};

/**
 * Generate checklist items for a release type
 * @param releaseType - Type of release
 * @returns Array of checklist items with IDs and timestamps
 */
export const generateChecklist = (releaseType: ReleaseType): ChecklistItem[] => {
  const template = CHECKLIST_TEMPLATES[releaseType] || CHECKLIST_TEMPLATES.single;
  const now = new Date().toISOString();

  return template.map((item, index) => ({
    ...item,
    id: `checklist-item-${Date.now()}-${index}`,
    createdAt: now,
    updatedAt: now,
  }));
};

/**
 * Calculate progress percentage for a checklist
 * @param checklist - Array of checklist items
 * @returns Progress percentage (0-100)
 */
export const calculateChecklistProgress = (checklist: ChecklistItem[]): number => {
  if (checklist.length === 0) return 0;

  const completed = checklist.filter(item => item.status === 'completed').length;
  return Math.round((completed / checklist.length) * 100);
};

/**
 * Get checklist items by status
 * @param checklist - Array of checklist items
 * @param status - Status to filter by
 * @returns Filtered checklist items
 */
export const getChecklistItemsByStatus = (
  checklist: ChecklistItem[],
  status: ChecklistItem['status']
): ChecklistItem[] => {
  return checklist.filter(item => item.status === status);
};

/**
 * Get checklist items by category
 * @param checklist - Array of checklist items
 * @param category - Category to filter by
 * @returns Filtered checklist items
 */
export const getChecklistItemsByCategory = (
  checklist: ChecklistItem[],
  category: ChecklistItem['category']
): ChecklistItem[] => {
  return checklist.filter(item => item.category === category);
};

/**
 * Get required checklist items
 * @param checklist - Array of checklist items
 * @returns Required items only
 */
export const getRequiredChecklistItems = (checklist: ChecklistItem[]): ChecklistItem[] => {
  return checklist.filter(item => item.required);
};

/**
 * Get overdue checklist items
 * @param checklist - Array of checklist items
 * @returns Items with past due dates that aren't completed
 */
export const getOverdueChecklistItems = (checklist: ChecklistItem[]): ChecklistItem[] => {
  const now = new Date();
  return checklist.filter(item => {
    if (!item.dueDate || item.status === 'completed') return false;
    return new Date(item.dueDate) < now;
  });
};

