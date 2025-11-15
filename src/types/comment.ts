/**
 * Comment Types
 * 
 * Types for collaborative comments with @mentions
 */

/**
 * Comment interface
 */
export interface Comment {
  /** Unique identifier */
  id: string;
  
  /** Comment body/text */
  body: string;
  
  /** User ID of comment author */
  authorId: string;
  
  /** Author display name */
  authorName?: string;
  
  /** Author avatar URL */
  authorAvatar?: string;
  
  /** Array of mentioned user IDs */
  mentions: string[];
  
  /** Whether comment is resolved */
  resolved: boolean;
  
  /** Parent comment ID (for threading) */
  replyTo?: string;
  
  /** Associated project/trip ID */
  projectId: string;
  
  /** Associated song/asset ID (optional) */
  assetId?: string;
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
  
  /** Timestamp when resolved */
  resolvedAt?: string;
  
  /** User ID who resolved the comment */
  resolvedBy?: string;
  
  /** Array of reply comment IDs */
  replies?: string[];
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Comment thread (comment with all replies)
 */
export interface CommentThread {
  /** Root comment */
  comment: Comment;
  
  /** Nested replies */
  replies: CommentThread[];
  
  /** Total reply count (including nested) */
  replyCount: number;
}

/**
 * Comment mention
 */
export interface CommentMention {
  /** User ID mentioned */
  userId: string;
  
  /** User display name */
  userName: string;
  
  /** Start position in comment body */
  start: number;
  
  /** End position in comment body */
  end: number;
}

