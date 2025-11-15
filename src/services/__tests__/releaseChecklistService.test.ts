/**
 * Unit tests for Release Checklist Service
 */

import {
  generateChecklist,
  calculateChecklistProgress,
  getChecklistItemsByStatus,
  getChecklistItemsByCategory,
  getRequiredChecklistItems,
  getOverdueChecklistItems,
} from '../releaseChecklistService';
import { ChecklistItem, ReleaseType } from '../../types/release';

describe('releaseChecklistService', () => {
  describe('generateChecklist', () => {
    it('should generate checklist for single release', () => {
      const checklist = generateChecklist('single');
      expect(checklist.length).toBeGreaterThan(0);
      expect(checklist.every(item => item.id)).toBe(true);
      expect(checklist.every(item => item.createdAt)).toBe(true);
    });

    it('should generate checklist for album release', () => {
      const checklist = generateChecklist('album');
      expect(checklist.length).toBeGreaterThanOrEqual(8);
      expect(checklist.some(item => item.title.includes('album'))).toBe(true);
    });

    it('should generate checklist for EP release', () => {
      const checklist = generateChecklist('ep');
      expect(checklist.length).toBeGreaterThan(0);
    });

    it('should generate checklist for mixtape release', () => {
      const checklist = generateChecklist('mixtape');
      expect(checklist.length).toBeGreaterThan(0);
    });
  });

  describe('calculateChecklistProgress', () => {
    it('should return 0 for empty checklist', () => {
      expect(calculateChecklistProgress([])).toBe(0);
    });

    it('should return 100 for all completed', () => {
      const checklist: ChecklistItem[] = [
        { id: '1', title: 'Item 1', status: 'completed', required: true, createdAt: '', updatedAt: '' },
        { id: '2', title: 'Item 2', status: 'completed', required: true, createdAt: '', updatedAt: '' },
      ];
      expect(calculateChecklistProgress(checklist)).toBe(100);
    });

    it('should return 50 for half completed', () => {
      const checklist: ChecklistItem[] = [
        { id: '1', title: 'Item 1', status: 'completed', required: true, createdAt: '', updatedAt: '' },
        { id: '2', title: 'Item 2', status: 'pending', required: true, createdAt: '', updatedAt: '' },
      ];
      expect(calculateChecklistProgress(checklist)).toBe(50);
    });
  });

  describe('getChecklistItemsByStatus', () => {
    it('should filter items by status', () => {
      const checklist: ChecklistItem[] = [
        { id: '1', title: 'Item 1', status: 'completed', required: true, createdAt: '', updatedAt: '' },
        { id: '2', title: 'Item 2', status: 'pending', required: true, createdAt: '', updatedAt: '' },
        { id: '3', title: 'Item 3', status: 'completed', required: true, createdAt: '', updatedAt: '' },
      ];
      const completed = getChecklistItemsByStatus(checklist, 'completed');
      expect(completed.length).toBe(2);
      expect(completed.every(item => item.status === 'completed')).toBe(true);
    });
  });

  describe('getRequiredChecklistItems', () => {
    it('should return only required items', () => {
      const checklist: ChecklistItem[] = [
        { id: '1', title: 'Item 1', status: 'completed', required: true, createdAt: '', updatedAt: '' },
        { id: '2', title: 'Item 2', status: 'pending', required: false, createdAt: '', updatedAt: '' },
        { id: '3', title: 'Item 3', status: 'pending', required: true, createdAt: '', updatedAt: '' },
      ];
      const required = getRequiredChecklistItems(checklist);
      expect(required.length).toBe(2);
      expect(required.every(item => item.required)).toBe(true);
    });
  });
});

