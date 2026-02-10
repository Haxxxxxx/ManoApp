/**
 * User Role Service (Client)
 * 
 * Client service for checking user roles
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Check if current user is an admin
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status', error);
    return false;
  }
}

