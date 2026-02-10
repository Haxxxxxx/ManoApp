/**
 * Comments Panel Component
 * 
 * Main panel for displaying and managing collaborative comments with @mentions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Comment } from '../../types/comment';
import CommentThread from '../common/CommentThread';
import CommentComposer from '../common/CommentComposer';
import {
  getCommentsForProject,
  getCommentsForAsset,
  subscribeToProjectComments,
  subscribeToAssetComments,
  resolveComment,
  unresolveComment,
  createComment,
} from '../../services/commentService';
import { createMentionNotifications } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface CommentsPanelProps {
  projectId: string;
  assetId?: string;
  collaborators: Array<{ id: string; name: string; email?: string; avatar?: string }>;
  onClose: () => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  projectId,
  assetId,
  collaborators,
  onClose: _onClose,
}) => {
  const { currentUser } = useAuth();
  const { showSuccess, showError, ToastComponent } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const lastSubmitTimeRef = useRef<number>(0);
  const submitDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        // If assetId is provided, load comments for that asset, otherwise load all project comments
        const loadedComments = assetId 
          ? await getCommentsForAsset(assetId)
          : await getCommentsForProject(projectId);
        setComments(loadedComments);
      } catch (error) {
        showError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, assetId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!projectId) return;

    // Subscribe to asset-specific comments if assetId is provided, otherwise project comments
    const unsubscribe = assetId
      ? subscribeToAssetComments(assetId, (updatedComments) => {
          if (isMountedRef.current) {
            setComments(updatedComments);
          }
        })
      : subscribeToProjectComments(projectId, (updatedComments) => {
          if (isMountedRef.current) {
            setComments(updatedComments);
          }
        });

    return () => {
      unsubscribe();
    };
  }, [projectId, assetId]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear any pending debounce
      if (submitDebounceRef.current) {
        clearTimeout(submitDebounceRef.current);
        submitDebounceRef.current = null;
      }
    };
  }, []);

  // Build comment threads
  const buildThreads = useCallback((comments: Comment[]): Array<{ comment: Comment; replies: any[] }> => {
    const rootComments = comments.filter(c => !c.replyTo);
    const repliesMap = new Map<string, Comment[]>();

    comments.forEach(comment => {
      if (comment.replyTo) {
        if (!repliesMap.has(comment.replyTo)) {
          repliesMap.set(comment.replyTo, []);
        }
        repliesMap.get(comment.replyTo)!.push(comment);
      }
    });

    const buildReplies = (comment: Comment): any[] => {
      const directReplies = repliesMap.get(comment.id) || [];
      return directReplies.map(reply => ({
        comment: reply,
        replies: buildReplies(reply),
      }));
    };

    return rootComments.map(comment => ({
      comment,
      replies: buildReplies(comment),
    }));
  }, []);

  const threads = buildThreads(comments);

  // Filter threads by tab
  const filteredThreads = threads.filter(thread => {
    if (activeTab === 'unresolved') return !thread.comment.resolved;
    if (activeTab === 'resolved') return thread.comment.resolved;
    return true;
  });

  const handleSubmitComment = async (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;

    // Rate limiting: max 1 comment per 2 seconds
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;
    if (timeSinceLastSubmit < 2000) {
      showError('Please wait a moment before posting another comment');
      return;
    }

    // Clear any existing debounce
    if (submitDebounceRef.current) {
      clearTimeout(submitDebounceRef.current);
    }

    // Debounce: wait 500ms before submitting
    return new Promise<void>((resolve, reject) => {
      submitDebounceRef.current = setTimeout(async () => {
        // Check if component is still mounted
        if (!isMountedRef.current) {
          resolve();
          return;
        }

        try {
          lastSubmitTimeRef.current = Date.now();

          const newComment = await createComment({
            ...commentData,
            projectId,
            assetId,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email || 'Unknown User',
          });

          // Check again before state updates
          if (!isMountedRef.current) {
            resolve();
            return;
          }

          // Create notifications for mentions
          if (commentData.mentions && commentData.mentions.length > 0) {
            await createMentionNotifications(
              commentData.mentions,
              newComment.id,
              projectId,
              newComment.authorName || 'Someone'
            );
          }

          showSuccess('Comment posted successfully');
          setReplyingTo(null);
          resolve();
        } catch (error) {
          if (isMountedRef.current) {
            showError('Failed to post comment');
          }
          reject(error);
        }
      }, 500);
    });
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    if (!currentUser) return;

    try {
      if (resolved) {
        await resolveComment(commentId, currentUser.uid);
      } else {
        await unresolveComment(commentId);
      }
      showSuccess(resolved ? 'Comment resolved' : 'Comment unresolved');
    } catch (error) {
      showError('Failed to update comment');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Comments
      </Typography>

      <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 2 }}>
        <Tab label="All" value="all" />
        <Tab label="Unresolved" value="unresolved" />
        <Tab label="Resolved" value="resolved" />
      </Tabs>

      {/* Comment Composer */}
      <Box sx={{ mb: 3 }}>
        <CommentComposer
          collaborators={collaborators}
          onSubmit={handleSubmitComment}
          replyTo={replyingTo || undefined}
          placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
        />
      </Box>

      {/* Comment Threads */}
      {filteredThreads.length === 0 ? (
        <Alert severity="info">No comments yet. Be the first to comment!</Alert>
      ) : (
        <Box>
          {filteredThreads.map((thread) => (
            <CommentThread
              key={thread.comment.id}
              comment={thread.comment}
              replies={thread.replies}
              currentUserId={currentUser?.uid || ''}
              onResolve={handleResolve}
              onReply={setReplyingTo}
            />
          ))}
        </Box>
      )}

      <ToastComponent />
    </Box>
  );
};

export default CommentsPanel;

