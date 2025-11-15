/**
 * Comment Service
 * 
 * Service for managing collaborative comments with @mentions
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Comment } from '../types/comment';

const commentsCollection = 'comments';

/**
 * Create a new comment
 */
export const createComment = async (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> => {
  try {
    const now = new Date().toISOString();
    const commentData = {
      ...comment,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, commentsCollection), commentData);
    return {
      id: docRef.id,
      ...commentData,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update a comment
 */
export const updateComment = async (commentId: string, updates: Partial<Comment>): Promise<Comment> => {
  try {
    const commentRef = doc(db, commentsCollection, commentId);
    await updateDoc(commentRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await getDoc(commentRef);
    if (!updatedDoc.exists()) {
      throw new Error('Comment not found');
    }

    return { id: updatedDoc.id, ...updatedDoc.data() } as Comment;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, commentsCollection, commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    throw error;
  }
};

/**
 * Get comments for a project
 */
export const getCommentsForProject = async (projectId: string): Promise<Comment[]> => {
  try {
    const q = query(
      collection(db, commentsCollection),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  } catch (error) {
    throw error;
  }
};

/**
 * Get comments for an asset
 */
export const getCommentsForAsset = async (assetId: string): Promise<Comment[]> => {
  try {
    const q = query(
      collection(db, commentsCollection),
      where('assetId', '==', assetId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  } catch (error) {
    throw error;
  }
};

/**
 * Resolve a comment
 */
export const resolveComment = async (commentId: string, userId: string): Promise<Comment> => {
  return updateComment(commentId, {
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolvedBy: userId,
  });
};

/**
 * Unresolve a comment
 */
export const unresolveComment = async (commentId: string): Promise<Comment> => {
  return updateComment(commentId, {
    resolved: false,
    resolvedAt: undefined,
    resolvedBy: undefined,
  });
};

/**
 * Subscribe to comments for a project (real-time)
 */
export const subscribeToProjectComments = (
  projectId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, commentsCollection),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
    callback(comments);
  });
};

/**
 * Subscribe to comments for an asset (real-time)
 */
export const subscribeToAssetComments = (
  assetId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, commentsCollection),
    where('assetId', '==', assetId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
    callback(comments);
  });
};

