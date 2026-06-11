/**
 * Revelator API Types
 *
 * Payload shapes for the Revelator white-label distribution API.
 * NOTE: Exact field names are confirmed during partner onboarding —
 * these follow Revelator's public Original API documentation and are
 * isolated here so schema corrections only touch this module.
 */

export type RevelatorMode = 'mock' | 'live';

export interface RevelatorConfig {
  mode: RevelatorMode;
  apiUrl: string;
  clientId?: string;
  clientSecret?: string;
}

export interface RevelatorTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface RevelatorTrackPayload {
  trackNumber: number;
  title: string;
  primaryArtist: string;
  isrc?: string;
  explicit: boolean;
  /** Downloadable URL the provider ingests the audio from */
  audioUrl?: string;
  /** Storage path fallback when a signed URL could not be generated */
  audioPath?: string;
  durationSeconds?: number;
}

export interface RevelatorReleasePayload {
  /** Our internal release ID, sent as external reference */
  externalId: string;
  title: string;
  releaseType: 'single' | 'album' | 'ep' | 'mixtape';
  primaryArtist: string;
  label?: string;
  genre?: string;
  releaseDate?: string;
  upc?: string;
  artworkUrl?: string;
  tracks: RevelatorTrackPayload[];
  /** Contributor splits, informational for royalty setup */
  splits?: Array<{ name: string; role?: string; percentage: number }>;
}

export interface RevelatorReleaseResponse {
  releaseId: string;
}

export type RevelatorDistributionStatus =
  | 'queued'
  | 'processing'
  | 'delivered'
  | 'failed';

export interface RevelatorDistributionResponse {
  distributionId: string;
  status: RevelatorDistributionStatus;
  /** Provider dashboard URL for this release */
  dashboardUrl?: string;
  error?: string;
}
