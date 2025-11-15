/**
 * SoundCloud OAuth Authentication
 * 
 * Handles OAuth flow setup and token management for SoundCloud integration
 * 
 * SoundCloud OAuth2 Documentation:
 * https://developers.soundcloud.com/docs/api/authentication
 */

import * as admin from 'firebase-admin';
import { encrypt, decrypt } from '../../lib/crypto'; // Use shared crypto utility

const db = admin.firestore();

/**
 * SoundCloud OAuth2 configuration
 */
export interface SoundCloudOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Get SoundCloud OAuth configuration from environment variables
 */
export function getSoundCloudOAuthConfig(): SoundCloudOAuthConfig {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
  const redirectUri = process.env.SOUNDCLOUD_CALLBACK_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing SoundCloud OAuth configuration. ' +
      'Required: SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_CLIENT_SECRET, SOUNDCLOUD_CALLBACK_URL'
    );
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(userId: string, state: string): string {
  const config = getSoundCloudOAuthConfig();
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'non-expiring', // Request non-expiring token
    state: state,
  });

  return `https://api.soundcloud.com/connect?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  expiresAt?: string;
}> {
  const config = getSoundCloudOAuthConfig();
  
  const response = await fetch('https://api.soundcloud.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
      code: code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  
  // SoundCloud tokens can be non-expiring, but check for expires_in
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : undefined;

  return {
    accessToken: data.access_token,
    expiresAt,
  };
}

/**
 * Store encrypted tokens in Firestore
 */
export async function storeTokens(
  userId: string,
  tokens: { accessToken: string; expiresAt?: string },
  accountInfo?: { username?: string; name?: string; avatar?: string }
): Promise<void> {
  const encryptedTokens = {
    accessToken: encrypt(tokens.accessToken),
    refreshToken: undefined, // SoundCloud may not provide refresh tokens
    expiresAt: tokens.expiresAt,
  };

  const connectorData = {
    userId,
    provider: 'soundcloud' as const,
    encryptedTokens,
    accountInfo: accountInfo || {},
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Check if connector already exists
  const existingConnector = await db
    .collection('connectors')
    .where('userId', '==', userId)
    .where('provider', '==', 'soundcloud')
    .limit(1)
    .get();

  if (!existingConnector.empty) {
    // Update existing connector
    const docId = existingConnector.docs[0].id;
    await db.collection('connectors').doc(docId).update({
      ...connectorData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Keep original
    });
  } else {
    // Create new connector
    await db.collection('connectors').add(connectorData);
  }
}

/**
 * Get stored tokens for a user
 */
export async function getStoredTokens(userId: string): Promise<{
  accessToken: string;
  expiresAt?: string;
} | null> {
  const connector = await db
    .collection('connectors')
    .where('userId', '==', userId)
    .where('provider', '==', 'soundcloud')
    .where('active', '==', true)
    .limit(1)
    .get();

  if (connector.empty) {
    return null;
  }

  const data = connector.docs[0].data();
  const encryptedTokens = data.encryptedTokens;

  return {
    accessToken: decrypt(encryptedTokens.accessToken),
    expiresAt: encryptedTokens.expiresAt,
  };
}

/**
 * Check if user has valid SoundCloud token
 */
export async function hasValidToken(userId: string): Promise<boolean> {
  const tokens = await getStoredTokens(userId);
  
  if (!tokens) {
    return false;
  }

  // Check if token is expired
  if (tokens.expiresAt) {
    const expiresAt = new Date(tokens.expiresAt);
    const now = new Date();
    
    if (expiresAt <= now) {
      return false;
    }
  }

  return true;
}

/**
 * Generate and store OAuth state for CSRF protection
 */
export async function generateOAuthState(userId: string): Promise<string> {
  const crypto = await import('crypto');
  const state = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.collection('oauthStates').add({
    userId,
    state,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: expiresAt.toISOString(),
  });

  return state;
}

/**
 * Validate OAuth state
 */
export async function validateOAuthState(userId: string, state: string): Promise<boolean> {
  const states = await db
    .collection('oauthStates')
    .where('userId', '==', userId)
    .where('state', '==', state)
    .limit(1)
    .get();

  if (states.empty) {
    return false;
  }

  const stateData = states.docs[0].data();
  const expiresAt = new Date(stateData.expiresAt);
  
  if (expiresAt < new Date()) {
    // Delete expired state
    await db.collection('oauthStates').doc(states.docs[0].id).delete();
    return false;
  }

  // Delete used state
  await db.collection('oauthStates').doc(states.docs[0].id).delete();
  return true;
}

