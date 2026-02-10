import { db, auth } from '../firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';

export interface Submission {
  id: string;
  releaseId: string;
  platformId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submissionId?: string;
  providerUrl?: string;
  error?: string;
  submittedAt: string;
  completedAt?: string;
}

export async function createSubmission(
  submission: Omit<Submission, 'id'>
): Promise<Submission> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in');

  const docRef = await addDoc(collection(db, 'submissions'), {
    ...submission,
    userId: currentUser.uid,
  });
  return { id: docRef.id, ...submission, userId: currentUser.uid };
}

export async function getSubmissionsForRelease(releaseId: string): Promise<Submission[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in');

  const q = query(
    collection(db, 'submissions'),
    where('releaseId', '==', releaseId),
    where('userId', '==', currentUser.uid),
    orderBy('submittedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
}

export async function updateSubmissionStatus(
  submissionDocId: string,
  status: Submission['status'],
  extra?: Partial<Submission>
): Promise<void> {
  const ref = doc(db, 'submissions', submissionDocId);
  await updateDoc(ref, {
    status,
    ...extra,
    ...(status === 'completed' || status === 'failed' ? { completedAt: new Date().toISOString() } : {}),
  });
}

export async function getUserSubmissions(): Promise<Submission[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be logged in');

  const q = query(
    collection(db, 'submissions'),
    where('userId', '==', currentUser.uid),
    orderBy('submittedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
}
