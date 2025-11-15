/**
 * Integration Types
 * 
 * Types for external service integrations (OAuth connectors, etc.)
 */

/**
 * Integration provider type
 */
export type IntegrationProvider = 'google-drive' | 'soundcloud' | 'spotify';

/**
 * Encrypted token storage
 */
export interface EncryptedTokens {
  /** Encrypted access token */
  accessToken: string;
  /** Encrypted refresh token (if available) */
  refreshToken?: string;
  /** Token expiration timestamp (ISO string) */
  expiresAt?: string;
  /** Additional provider-specific token data */
  metadata?: Record<string, unknown>;
}

/**
 * Connector document in Firestore
 */
export interface Connector {
  /** Unique identifier */
  id: string;
  
  /** User ID who connected the service */
  userId: string;
  
  /** Integration provider */
  provider: IntegrationProvider;
  
  /** Encrypted OAuth tokens */
  encryptedTokens: EncryptedTokens;
  
  /** Provider account information (e.g., email, name) */
  accountInfo?: {
    email?: string;
    name?: string;
    avatar?: string;
    [key: string]: unknown;
  };
  
  /** Whether the connection is active */
  active: boolean;
  
  /** Timestamp when created */
  createdAt: string;
  
  /** Timestamp when last updated */
  updatedAt: string;
  
  /** Timestamp when last used */
  lastUsedAt?: string;
}

/**
 * OAuth state for CSRF protection
 */
export interface OAuthState {
  /** User ID */
  userId: string;
  /** Random state token */
  state: string;
  /** Timestamp when created */
  createdAt: string;
  /** Expiration timestamp */
  expiresAt: string;
}

