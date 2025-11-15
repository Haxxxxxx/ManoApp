/**
 * Activity log entry for trips/projects
 */
export interface ActivityItem {
  id: string;
  userId: string;
  action: string;
  timestamp: string | Date;
  details?: Record<string, unknown>;
  type?: 'create' | 'update' | 'delete' | 'collaborate' | 'upload' | 'export';
}

