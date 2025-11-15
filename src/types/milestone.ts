/**
 * Milestone Types
 * 
 * Types for project milestones and deadlines
 */

/**
 * Milestone status
 */
export type MilestoneStatus = 'upcoming' | 'in-progress' | 'completed' | 'overdue' | 'cancelled';

/**
 * Milestone interface
 */
export interface Milestone {
  /** Unique identifier */
  id: string;
  
  /** Milestone title */
  title: string;
  
  /** Milestone description */
  description?: string;
  
  /** Target date (ISO string) */
  targetDate: string;
  
  /** Actual completion date (ISO string) */
  completedDate?: string;
  
  /** Current status */
  status: MilestoneStatus;
  
  /** Associated project/trip ID */
  projectId: string;
  
  /** User ID who created the milestone */
  userId: string;
  
  /** Related checklist items */
  checklistItemIds?: string[];
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
}

