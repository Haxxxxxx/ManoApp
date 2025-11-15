/**
 * ExportPanel Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import ExportPanel from './ExportPanel';
import { mockReleaseManifest, mockReleaseManifestInvalid } from '../mocks/storybook/mockReleaseManifest';
import {
  mockPreflightValid,
  mockPreflightWithErrors,
  mockPreflightWithWarnings,
} from '../mocks/storybook/mockPreflightResults';

const meta: Meta<typeof ExportPanel> = {
  title: 'Components/ExportPanel',
  component: ExportPanel,
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
type Story = StoryObj<typeof ExportPanel>;

const mockProviders = [
  { id: 'soundcloud', name: 'SoundCloud', enabled: true },
  { id: 'spotify', name: 'Spotify', enabled: false },
  { id: 'apple', name: 'Apple Music', enabled: false },
];

const mockOnRunPreflight = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return mockPreflightValid;
};

const mockOnSubmit = async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return [
    {
      submissionId: 'sub-1',
      status: 'completed' as const,
      providerUrl: 'https://soundcloud.com/test-track',
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
  ];
};

export const Default: Story = {
  args: {
    manifest: mockReleaseManifest,
    providers: mockProviders,
    onRunPreflight: mockOnRunPreflight,
    onSubmit: mockOnSubmit,
  },
};

export const PreflightErrors: Story = {
  args: {
    manifest: mockReleaseManifestInvalid,
    providers: mockProviders,
    preflightResult: mockPreflightWithErrors,
    onRunPreflight: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockPreflightWithErrors;
    },
    onSubmit: mockOnSubmit,
  },
};

export const PreflightWarnings: Story = {
  args: {
    manifest: mockReleaseManifest,
    providers: mockProviders,
    preflightResult: mockPreflightWithWarnings,
    onRunPreflight: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockPreflightWithWarnings;
    },
    onSubmit: mockOnSubmit,
  },
};

export const ExportInProgress: Story = {
  args: {
    manifest: mockReleaseManifest,
    providers: mockProviders,
    preflightResult: mockPreflightValid,
    exporting: true,
    onRunPreflight: mockOnRunPreflight,
    onSubmit: mockOnSubmit,
  },
};

export const WithHistory: Story = {
  args: {
    manifest: mockReleaseManifest,
    providers: mockProviders,
    preflightResult: mockPreflightValid,
    exportHistory: [
      {
        id: 'hist-1',
        provider: 'SoundCloud',
        status: 'completed',
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        result: {
          submissionId: 'sub-1',
          status: 'completed',
          providerUrl: 'https://soundcloud.com/track-1',
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86300000).toISOString(),
        },
      },
      {
        id: 'hist-2',
        provider: 'SoundCloud',
        status: 'failed',
        submittedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
    onRunPreflight: mockOnRunPreflight,
    onSubmit: mockOnSubmit,
  },
};

export const NoProviders: Story = {
  args: {
    manifest: mockReleaseManifest,
    providers: [],
    preflightResult: mockPreflightValid,
    onRunPreflight: mockOnRunPreflight,
    onSubmit: mockOnSubmit,
  },
};

