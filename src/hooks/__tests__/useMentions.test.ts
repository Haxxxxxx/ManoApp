import { vi } from 'vitest';
/**
 * Unit tests for useMentions hook
 */

import { act, renderHook } from '@testing-library/react';
import { useMentions } from '../useMentions';

describe('useMentions', () => {
  const collaborators = [
    { id: 'user1', name: 'John Doe', email: 'john@example.com' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  it('should parse mentions from text', () => {
    const { result } = renderHook(() =>
      useMentions({
        collaborators,
        value: 'Hey @john, check this out!',
        onChange: vi.fn(),
      })
    );

    expect(result.current.mentions.length).toBeGreaterThan(0);
  });

  it('should extract mentioned user IDs', () => {
    const { result } = renderHook(() =>
      useMentions({
        collaborators,
        value: '@john and @jane are working on this',
        onChange: vi.fn(),
      })
    );

    expect(result.current.mentionedUserIds.length).toBeGreaterThan(0);
  });

  it('should provide autocomplete options when in mention context', () => {
    const value = 'Hey @j';
    const { result } = renderHook(() =>
      useMentions({
        collaborators,
        value,
        onChange: vi.fn(),
      })
    );

    // The consuming input reports the caret position — place it at the end,
    // right after "@j"
    act(() => {
      result.current.setCursorPosition(value.length);
    });

    expect(result.current.isInMentionContext).toBe(true);
    expect(result.current.autocompleteOptions.length).toBeGreaterThan(0);
  });
});

