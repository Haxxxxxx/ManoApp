/**
 * RightsEditor Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import RightsEditor from './RightsEditor';
import { RightsSplit } from '../types/export';

const meta: Meta<typeof RightsEditor> = {
  title: 'Components/RightsEditor',
  component: RightsEditor,
  parameters: {
    layout: 'padded',
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RightsEditor>;

const mockCollaborators = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-3', name: 'Bob Johnson', email: 'bob@example.com' },
];

export const Default: Story = {
  args: {
    splits: [],
    collaborators: mockCollaborators,
    showValidation: true,
  },
};

export const WithEqualSplits: Story = {
  args: {
    splits: [
      { userId: 'user-1', name: 'John Doe', percentage: 50 },
      { userId: 'user-2', name: 'Jane Smith', percentage: 50 },
    ],
    collaborators: mockCollaborators,
    showValidation: true,
  },
};

export const InvalidSplits: Story = {
  args: {
    splits: [
      { userId: 'user-1', name: 'John Doe', percentage: 60 },
      { userId: 'user-2', name: 'Jane Smith', percentage: 30 },
    ],
    collaborators: mockCollaborators,
    showValidation: true,
  },
};

export const ThreeWaySplit: Story = {
  args: {
    splits: [
      { userId: 'user-1', name: 'John Doe', percentage: 40, role: 'Artist' },
      { userId: 'user-2', name: 'Jane Smith', percentage: 40, role: 'Producer' },
      { userId: 'user-3', name: 'Bob Johnson', percentage: 20, role: 'Writer' },
    ],
    collaborators: mockCollaborators,
    showValidation: true,
  },
};

export const ReadOnly: Story = {
  args: {
    splits: [
      { userId: 'user-1', name: 'John Doe', percentage: 50 },
      { userId: 'user-2', name: 'Jane Smith', percentage: 50 },
    ],
    collaborators: mockCollaborators,
    readOnly: true,
    showValidation: true,
  },
};

export const NoCollaborators: Story = {
  args: {
    splits: [],
    collaborators: [],
    showValidation: true,
  },
};

