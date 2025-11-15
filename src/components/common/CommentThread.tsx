/**
 * Comment Thread Component
 * 
 * Displays a comment with its replies in a threaded format
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { Comment } from '../../types/comment';
import { formatDate } from '../../utils/formatters';

interface CommentThreadProps {
  /** Comment to display */
  comment: Comment;
  
  /** Nested replies */
  replies?: CommentThreadProps[];
  
  /** Current user ID */
  currentUserId: string;
  
  /** Callback to resolve/unresolve comment */
  onResolve?: (commentId: string, resolved: boolean) => void;
  
  /** Callback to reply to comment */
  onReply?: (commentId: string) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  replies = [],
  currentUserId,
  onResolve,
  onReply,
}) => {
  const theme = useTheme();
  const isAuthor = comment.authorId === currentUserId;

  return (
    <Box sx={{ mb: 2 }}>
      <Paper
        sx={{
          p: 2,
          bgcolor: comment.resolved ? alpha(theme.palette.success.main, 0.05) : 'background.paper',
          border: comment.resolved ? `1px solid ${theme.palette.success.main}` : '1px solid',
          borderColor: comment.resolved ? 'success.main' : 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar>
            {comment.authorName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="600">
                {comment.authorName || 'Unknown User'}
              </Typography>
              {comment.resolved && (
                <Chip
                  label="Resolved"
                  size="small"
                  color="success"
                  icon={<CheckCircleIcon />}
                />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {formatDate(comment.createdAt)}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
              {comment.body}
            </Typography>

            {comment.mentions && comment.mentions.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                {comment.mentions.map((userId) => (
                  <Chip
                    key={userId}
                    label={`@${userId}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {onReply && (
                <IconButton size="small" onClick={() => onReply(comment.id)}>
                  <ReplyIcon fontSize="small" />
                </IconButton>
              )}
              {onResolve && (isAuthor || comment.resolved) && (
                <IconButton
                  size="small"
                  onClick={() => onResolve(comment.id, !comment.resolved)}
                  color={comment.resolved ? 'success' : 'default'}
                >
                  {comment.resolved ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Replies */}
      {replies.length > 0 && (
        <Box sx={{ ml: 4, mt: 1 }}>
          {replies.map((reply) => (
            <CommentThread
              key={reply.comment.id}
              comment={reply.comment}
              replies={reply.replies}
              currentUserId={currentUserId}
              onResolve={onResolve}
              onReply={onReply}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CommentThread;

