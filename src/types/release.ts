/**
 * Release Types
 * 
 * Types for release planning and checklist management
 */

/**
 * Checklist item status
 */
export type ChecklistItemStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

/**
 * Checklist item priority
 */
export type ChecklistItemPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Release type
 */
export type ReleaseType = 'single' | 'album' | 'ep' | 'mixtape';

/**
 * Checklist item
 */
export interface ChecklistItem {
  /** Unique identifier */
  id: string;
  
  /** Item title/description */
  title: string;
  
  /** Detailed description */
  description?: string;
  
  /** Current status */
  status: ChecklistItemStatus;
  
  /** Priority level */
  priority?: ChecklistItemPriority;
  
  /** Assigned user ID */
  assigneeId?: string;
  
  /** Due date (ISO string) */
  dueDate?: string;
  
  /** Whether item is required */
  required: boolean;
  
  /** Category/type of item */
  category?: 'metadata' | 'artwork' | 'licensing' | 'distribution' | 'promotion' | 'other';
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
  
  /** Timestamp when completed */
  completedAt?: string;
}

/**
 * Release interface
 */
export interface Release {
  /** Unique identifier */
  id: string;
  
  /** Release title */
  title: string;
  
  /** Release description */
  description?: string;
  
  /** Release type */
  type: ReleaseType;
  
  /** Associated project/trip ID */
  projectId: string;
  
  /** User ID who created the release */
  userId: string;
  
  /** Checklist items */
  checklist: ChecklistItem[];
  
  /** Release date (ISO string) */
  releaseDate?: string;
  
  /** Target platforms */
  platforms?: string[];
  
  /** Rights splits for collaborators */
  rightsSplits?: Array<{
    userId: string;
    name: string;
    percentage: number;
    role?: string;
  }>;
  
  /** Overall progress (0-100) */
  progress: number;
  
  /** Release status */
  status: 'draft' | 'in-progress' | 'ready' | 'published' | 'cancelled';
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
  
  /** Timestamp when published */
  publishedAt?: string;
}

