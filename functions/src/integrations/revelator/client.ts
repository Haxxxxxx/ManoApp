/**
 * Revelator API Client
 *
 * Thin HTTP client for the Revelator distribution API with a deterministic
 * mock mode (default) so the full distribution flow works end-to-end before
 * partner credentials exist.
 *
 * Environment variables:
 * - REVELATOR_MODE          'live' to call the real API, anything else = mock
 * - REVELATOR_API_URL       API base URL (default https://api.revelator.com)
 * - REVELATOR_CLIENT_ID     OAuth client credentials (live mode only)
 * - REVELATOR_CLIENT_SECRET OAuth client credentials (live mode only)
 */

import { logger } from 'firebase-functions';
import {
  RevelatorConfig,
  RevelatorDistributionResponse,
  RevelatorReleasePayload,
  RevelatorReleaseResponse,
  RevelatorTokenResponse,
} from './types';

export function getRevelatorConfig(): RevelatorConfig {
  return {
    mode: process.env.REVELATOR_MODE === 'live' ? 'live' : 'mock',
    apiUrl: process.env.REVELATOR_API_URL || 'https://api.revelator.com',
    clientId: process.env.REVELATOR_CLIENT_ID,
    clientSecret: process.env.REVELATOR_CLIENT_SECRET,
  };
}

export class RevelatorClient {
  private config: RevelatorConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: RevelatorConfig = getRevelatorConfig()) {
    this.config = config;
  }

  get mode(): 'mock' | 'live' {
    return this.config.mode;
  }

  /**
   * Whether the client can operate: mock mode always works,
   * live mode requires credentials.
   */
  isConfigured(): boolean {
    if (this.config.mode === 'mock') return true;
    return Boolean(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Create (or upsert by externalId) a release in Revelator's catalog
   */
  async createRelease(payload: RevelatorReleasePayload): Promise<RevelatorReleaseResponse> {
    if (this.config.mode === 'mock') {
      logger.info(`[revelator:mock] createRelease "${payload.title}" (${payload.tracks.length} tracks)`);
      return { releaseId: `rev-mock-${payload.externalId}` };
    }

    const res = await this.request('POST', '/content/releases', payload);
    return res as RevelatorReleaseResponse;
  }

  /**
   * Trigger distribution of a catalog release to DSPs
   */
  async distributeRelease(releaseId: string): Promise<RevelatorDistributionResponse> {
    if (this.config.mode === 'mock') {
      logger.info(`[revelator:mock] distributeRelease ${releaseId}`);
      return {
        distributionId: `dist-${releaseId}`,
        status: 'processing',
        dashboardUrl: `https://app.revelator.com/releases/${releaseId}`,
      };
    }

    const res = await this.request('POST', `/content/releases/${encodeURIComponent(releaseId)}/distribute`, {});
    return res as RevelatorDistributionResponse;
  }

  /**
   * Poll distribution status
   */
  async getDistributionStatus(distributionId: string): Promise<RevelatorDistributionResponse> {
    if (this.config.mode === 'mock') {
      // Mock distributions complete on first poll so the UI flow is demoable
      const releaseId = distributionId.replace(/^dist-/, '');
      return {
        distributionId,
        status: 'delivered',
        dashboardUrl: `https://app.revelator.com/releases/${releaseId}`,
      };
    }

    const res = await this.request('GET', `/distribution/${encodeURIComponent(distributionId)}`);
    return res as RevelatorDistributionResponse;
  }

  /**
   * OAuth2 client-credentials token with in-instance caching
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error(
        'Revelator credentials are not configured. Set REVELATOR_CLIENT_ID and REVELATOR_CLIENT_SECRET, or use REVELATOR_MODE=mock.'
      );
    }

    const res = await fetch(`${this.config.apiUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!res.ok) {
      throw new Error(`Revelator auth failed: ${res.status} ${res.statusText}`);
    }

    const token = (await res.json()) as RevelatorTokenResponse;
    this.accessToken = token.access_token;
    this.tokenExpiresAt = Date.now() + token.expires_in * 1000;
    return this.accessToken;
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.config.apiUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Revelator API ${method} ${path} failed: ${res.status} ${text.slice(0, 300)}`);
    }

    return res.json();
  }
}
