/**
 * User Role Service
 * 
 * Service for checking user roles and admin privileges
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';

const db = admin.firestore();

/**
 * Check if a user is an admin
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    logger.error('Error checking admin status', error);
    return false;
  }
}

/**
 * Require admin role (throws error if not admin)
 */
export async function requireAdmin(userId: string): Promise<void> {
  const isAdmin = await checkIsAdmin(userId);
  if (!isAdmin) {
    throw new Error('Admin privileges required');
  }
}

