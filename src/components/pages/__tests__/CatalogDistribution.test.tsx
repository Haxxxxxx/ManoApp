import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks -------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'user-1' } }),
}));

const mockSongs = [
  {
    id: 'song-1',
    title: 'Midnight Drive',
    artist: 'Nova',
    duration: '3:24',
    filePath: 'x',
    userId: 'user-1',
    tripId: 'trip-1',
    status: 'ready',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];
const mockAlbums = [
  {
    id: 'album-1',
    title: 'After Hours',
    artist: 'Nova',
    coverImage: null,
    songs: [{ songId: 'song-1' }],
    userId: 'user-1',
  },
];
const mockReleases = [
  {
    id: 'rel-1',
    title: 'Midnight Drive — Single',
    type: 'single',
    projectId: 'trip-1',
    userId: 'user-1',
    status: 'in-progress',
    progress: 60,
    checklist: [],
    releaseDate: '2026-07-01T00:00:00.000Z',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];
const mockTrips = [{ id: 'trip-1', name: 'Summer EP', userId: 'user-1' }];

vi.mock('../../../services/firebaseService', () => ({
  getUserSongs: vi.fn(async () => mockSongs),
  getAlbums: vi.fn(async () => mockAlbums),
  getTrips: vi.fn(async () => mockTrips),
  getUserReleases: vi.fn(async () => mockReleases),
}));

// Imported after mocks
import CatalogPage from '../CatalogPage';
import DistributionPage from '../DistributionPage';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('CatalogPage', () => {
  it('renders the catalog and lists songs from all projects', async () => {
    renderWithRouter(<CatalogPage />);
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Midnight Drive')).toBeInTheDocument());
    // song row shows its parent project name
    expect(screen.getByText('Summer EP')).toBeInTheDocument();
  });
});

describe('DistributionPage', () => {
  it('renders releases with their pipeline status', async () => {
    renderWithRouter(<DistributionPage />);
    expect(screen.getByText('Distribution')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('Midnight Drive — Single')).toBeInTheDocument()
    );
    // status ramp label rendered (chip + filter toggle both say "In progress")
    expect(screen.getAllByText('In progress').length).toBeGreaterThan(0);
  });
});
