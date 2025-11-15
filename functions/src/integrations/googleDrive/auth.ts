/**
 * Google Drive OAuth Authentication
 * 
 * Handles OAuth flow setup and token management for Google Drive integration
 */

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { encrypt, decrypt } from './crypto';

const db = admin.firestore();

/**
 * Google OAuth2 configuration
 */
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Get Google OAuth configuration from environment variables
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GDRIVE_CLIENT_ID;
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GDRIVE_CALLBACK_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Google Drive OAuth configuration. ' +
      'Required: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_CALLBACK_URL'
    );
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(userId: string, state: string): string {
  const config = getGoogleOAuthConfig();
  const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}> {
  const config = getGoogleOAuthConfig();
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : undefined;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  };
}

/**
 * Store encrypted tokens in Firestore
 */
export async function storeTokens(
  userId: string,
  tokens: { accessToken: string; refreshToken?: string; expiresAt?: string },
  accountInfo?: { email?: string; name?: string; avatar?: string }
): Promise<void> {
  const encryptedTokens = {
    accessToken: encrypt(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
    expiresAt: tokens.expiresAt,
  };

  const connectorData = {
    userId,
    provider: 'google-drive' as const,
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
    .where('provider', '==', 'google-drive')
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
  refreshToken?: string;
  expiresAt?: string;
} | null> {
  const connector = await db
    .collection('connectors')
    .where('userId', '==', userId)
    .where('provider', '==', 'google-drive')
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
    refreshToken: encryptedTokens.refreshToken ? decrypt(encryptedTokens.refreshToken) : undefined,
    expiresAt: encryptedTokens.expiresAt,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: string;
}> {
  const config = getGoogleOAuthConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();

  return {
    accessToken: data.access_token,
    expiresAt,
  };
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getStoredTokens(userId);
  
  if (!tokens) {
    throw new Error('No Google Drive connection found for user');
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  if (tokens.expiresAt) {
    const expiresAt = new Date(tokens.expiresAt);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow && tokens.refreshToken) {
      // Refresh the token
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      
      // Update stored tokens
      await storeTokens(userId, {
        accessToken: refreshed.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: refreshed.expiresAt,
      });

      return refreshed.accessToken;
    }
  }

  return tokens.accessToken;
}

/**
 * Generate and store OAuth state for CSRF protection
 */
export async function generateOAuthState(userId: string): Promise<string> {
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

