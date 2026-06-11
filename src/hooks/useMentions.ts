/**
 * Mentions Hook
 * 
 * Hook for parsing @mentions and providing autocomplete functionality
 */

import { useState, useMemo, useCallback } from 'react';
import { CommentMention } from '../types/comment';

interface Collaborator {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface UseMentionsOptions {
  /** List of collaborators for autocomplete */
  collaborators: Collaborator[];
  
  /** Current text value */
  value: string;
  
  /** Callback when value changes */
  onChange: (value: string) => void;
}

interface UseMentionsReturn {
  /** Current text value */
  value: string;
  
  /** Update text value */
  setValue: (value: string) => void;
  
  /** Parsed mentions from current text */
  mentions: CommentMention[];
  
  /** Mentioned user IDs */
  mentionedUserIds: string[];
  
  /** Filtered collaborators for autocomplete */
  autocompleteOptions: Collaborator[];
  
  /** Current mention query (text after @) */
  mentionQuery: string | null;
  
  /** Insert mention at cursor position */
  insertMention: (collaborator: Collaborator) => void;

  /** Check if cursor is in a mention context */
  isInMentionContext: boolean;

  /**
   * Report the current cursor position — the consuming input must call
   * this (onSelect/onKeyUp/onClick) or mention autocomplete never triggers
   */
  setCursorPosition: (position: number) => void;
}

/**
 * Parse mentions from text
 */
const parseMentions = (text: string, collaborators: Collaborator[]): CommentMention[] => {
  const mentions: CommentMention[] = [];
  const mentionRegex = /@(\w+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[1];
    const collaborator = collaborators.find(c => 
      c.name.toLowerCase().includes(mentionText.toLowerCase()) ||
      c.email?.toLowerCase().includes(mentionText.toLowerCase())
    );

    if (collaborator) {
      mentions.push({
        userId: collaborator.id,
        userName: collaborator.name,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return mentions;
};

/**
 * Extract mention query from text at cursor position
 */
const getMentionQuery = (text: string, cursorPosition: number): string | null => {
  const textBeforeCursor = text.substring(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');
  
  if (lastAtIndex === -1) return null;
  
  const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
  const spaceIndex = textAfterAt.indexOf(' ');
  
  if (spaceIndex !== -1) return null; // Space found, not in mention context
  
  return textAfterAt;
};

/**
 * Mentions Hook
 */
export const useMentions = (options: UseMentionsOptions): UseMentionsReturn => {
  const { collaborators, value, onChange } = options;
  const [cursorPosition, setCursorPosition] = useState(0);

  // Parse mentions from current text
  const mentions = useMemo(() => {
    return parseMentions(value, collaborators);
  }, [value, collaborators]);

  // Extract mentioned user IDs
  const mentionedUserIds = useMemo(() => {
    return [...new Set(mentions.map(m => m.userId))];
  }, [mentions]);

  // Get mention query for autocomplete
  const mentionQuery = useMemo(() => {
    return getMentionQuery(value, cursorPosition);
  }, [value, cursorPosition]);

  // Check if in mention context
  const isInMentionContext = mentionQuery !== null;

  // Filter collaborators for autocomplete
  const autocompleteOptions = useMemo(() => {
    if (!mentionQuery) return [];
    
    const queryLower = mentionQuery.toLowerCase();
    return collaborators.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(queryLower);
      const emailMatch = c.email?.toLowerCase().includes(queryLower);
      const alreadyMentioned = mentionedUserIds.includes(c.id);
      return (nameMatch || emailMatch) && !alreadyMentioned;
    }).slice(0, 10); // Limit to 10 results
  }, [mentionQuery, collaborators, mentionedUserIds]);

  // Insert mention at cursor
  const insertMention = useCallback((collaborator: Collaborator) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex === -1) return;
    
    const textBeforeAt = textBeforeCursor.substring(0, lastAtIndex);
    const newText = `${textBeforeAt}@${collaborator.name} ${textAfterCursor}`;
    
    onChange(newText);
    setCursorPosition(lastAtIndex + collaborator.name.length + 2); // +2 for @ and space
  }, [value, cursorPosition, onChange]);

  return {
    value,
    setValue: (newValue: string) => {
      onChange(newValue);
    },
    mentions,
    mentionedUserIds,
    autocompleteOptions,
    mentionQuery,
    insertMention,
    isInMentionContext,
    setCursorPosition,
  };
};

