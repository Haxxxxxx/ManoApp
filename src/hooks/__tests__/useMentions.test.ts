/**
 * Unit tests for useMentions hook
 */

import { renderHook, act } from '@testing-library/react';
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
        onChange: jest.fn(),
      })
    );

    expect(result.current.mentions.length).toBeGreaterThan(0);
  });

  it('should extract mentioned user IDs', () => {
    const { result } = renderHook(() =>
      useMentions({
        collaborators,
        value: '@john and @jane are working on this',
        onChange: jest.fn(),
      })
    );

    expect(result.current.mentionedUserIds.length).toBeGreaterThan(0);
  });

  it('should provide autocomplete options when in mention context', () => {
    const { result } = renderHook(() =>
      useMentions({
        collaborators,
        value: 'Hey @j',
        onChange: jest.fn(),
      })
    );

    expect(result.current.isInMentionContext).toBe(true);
    expect(result.current.autocompleteOptions.length).toBeGreaterThan(0);
  });
});

