import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Executive, ScheduleItem, DocumentSettings } from './types/schedule';
import { INITIAL_EXECUTIVES, INITIAL_SCHEDULES, INITIAL_SETTINGS } from './data/initialData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection per critical requirement
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// --- Firestore Data Operations ---

/**
 * Seed initial data if collections are empty in Firestore
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const execSnap = await getDocs(collection(db, 'executives'));
    if (execSnap.empty) {
      console.log('Seeding initial executives to Firestore...');
      const batch = writeBatch(db);
      for (const exec of INITIAL_EXECUTIVES) {
        batch.set(doc(db, 'executives', exec.id), exec);
      }
      await batch.commit();
    } else {
      // Ensure newly added initial executives are present in existing Firestore database
      const existingIds = new Set<string>();
      execSnap.forEach((d) => existingIds.add(d.id));
      const missing = INITIAL_EXECUTIVES.filter((e) => !existingIds.has(e.id));
      if (missing.length > 0) {
        console.log(`Adding ${missing.length} missing initial executives to Firestore...`);
        const batch = writeBatch(db);
        for (const exec of missing) {
          batch.set(doc(db, 'executives', exec.id), exec);
        }
        await batch.commit();
      }
    }

    const schedSnap = await getDocs(collection(db, 'schedules'));
    if (schedSnap.empty) {
      console.log('Seeding initial schedules to Firestore...');
      const batch = writeBatch(db);
      for (const item of INITIAL_SCHEDULES) {
        batch.set(doc(db, 'schedules', item.id), item);
      }
      await batch.commit();
    }

    const settingsDocRef = doc(db, 'settings', 'config');
    const settingsSnap = await getDocs(collection(db, 'settings'));
    if (settingsSnap.empty) {
      console.log('Seeding initial settings to Firestore...');
      await setDoc(settingsDocRef, INITIAL_SETTINGS);
    }
  } catch (error) {
    console.warn('Initial seeding note:', error);
  }
}

/**
 * Save single schedule item to Firestore
 */
export async function saveScheduleToFirestore(item: ScheduleItem): Promise<void> {
  const path = `schedules/${item.id}`;
  try {
    await setDoc(doc(db, 'schedules', item.id), {
      ...item,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete schedule item from Firestore
 */
export async function deleteScheduleFromFirestore(id: string): Promise<void> {
  const path = `schedules/${id}`;
  try {
    await deleteDoc(doc(db, 'schedules', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save executive to Firestore
 */
export async function saveExecutiveToFirestore(exec: Executive): Promise<void> {
  const path = `executives/${exec.id}`;
  try {
    await setDoc(doc(db, 'executives', exec.id), exec);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete executive from Firestore
 */
export async function deleteExecutiveFromFirestore(id: string): Promise<void> {
  const path = `executives/${id}`;
  try {
    await deleteDoc(doc(db, 'executives', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save settings to Firestore
 */
export async function saveSettingsToFirestore(settings: DocumentSettings): Promise<void> {
  const path = 'settings/config';
  try {
    await setDoc(doc(db, 'settings', 'config'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Batch save executives (e.g. after reordering)
 */
export async function batchSaveExecutivesToFirestore(execs: Executive[]): Promise<void> {
  const path = 'executives';
  try {
    const batch = writeBatch(db);
    for (const e of execs) {
      batch.set(doc(db, 'executives', e.id), e);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Batch restore data to Firestore
 */
export async function batchRestoreDataToFirestore(
  execs: Executive[],
  scheds: ScheduleItem[],
  setts: DocumentSettings
): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const e of execs) {
      batch.set(doc(db, 'executives', e.id), e);
    }
    for (const s of scheds) {
      batch.set(doc(db, 'schedules', s.id), s);
    }
    batch.set(doc(db, 'settings', 'config'), setts);
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch-restore');
  }
}

