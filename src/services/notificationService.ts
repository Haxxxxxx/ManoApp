/**
 * Notification Service
 * 
 * Service for handling notifications, particularly for @mentions in comments
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Notification {
  id?: string;
  userId: string;
  type: 'mention' | 'comment' | 'assignment' | 'release' | 'other';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Create a notification
 */
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
  try {
    const notificationData = {
      ...notification,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return {
      id: docRef.id,
      ...notificationData,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create notifications for @mentions
 */
export const createMentionNotifications = async (
  mentionedUserIds: string[],
  commentId: string,
  projectId: string,
  authorName: string
): Promise<void> => {
  try {
    const notifications = mentionedUserIds.map(userId => ({
      userId,
      type: 'mention' as const,
      title: 'You were mentioned in a comment',
      message: `${authorName} mentioned you in a comment`,
      read: false,
      link: `/project/${projectId}?comment=${commentId}`,
      metadata: {
        commentId,
        projectId,
      },
    }));

    await Promise.all(notifications.map(notif => createNotification(notif)));
  } catch (error) {
    console.error('Failed to create mention notifications:', error);
  }
};

