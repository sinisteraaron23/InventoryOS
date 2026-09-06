import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  type Unsubscribe 
} from 'firebase/firestore';
import type { InventoryItem, StorageBox, Room } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with configured database ID
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Auth functions
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// Subscriptions for real-time sync under /users/{userId}/...
export function subscribeToItems(userId: string, callback: (items: InventoryItem[]) => void): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'items');
  return onSnapshot(colRef, (snapshot) => {
    const items: InventoryItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as Omit<InventoryItem, 'id'>) });
    });
    callback(items);
  }, (error) => {
    console.warn('Firestore items sync error:', error);
  });
}

export function subscribeToBoxes(userId: string, callback: (boxes: StorageBox[]) => void): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'boxes');
  return onSnapshot(colRef, (snapshot) => {
    const boxes: StorageBox[] = [];
    snapshot.forEach((docSnap) => {
      boxes.push({ id: docSnap.id, ...(docSnap.data() as Omit<StorageBox, 'id'>) });
    });
    callback(boxes);
  }, (error) => {
    console.warn('Firestore boxes sync error:', error);
  });
}

export function subscribeToRooms(userId: string, callback: (rooms: Room[]) => void): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'rooms');
  return onSnapshot(colRef, (snapshot) => {
    const rooms: Room[] = [];
    snapshot.forEach((docSnap) => {
      rooms.push({ id: docSnap.id, ...(docSnap.data() as Omit<Room, 'id'>) });
    });
    callback(rooms);
  }, (error) => {
    console.warn('Firestore rooms sync error:', error);
  });
}

function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as Partial<T>;
}

// Mutator functions
export async function saveItemToCloud(userId: string, item: InventoryItem): Promise<void> {
  const docRef = doc(db, 'users', userId, 'items', item.id);
  const { id: _, ...data } = item;
  await setDoc(docRef, cleanUndefined(data), { merge: true });
}

export async function deleteItemFromCloud(userId: string, itemId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'items', itemId);
  await deleteDoc(docRef);
}

export async function saveBoxToCloud(userId: string, box: StorageBox): Promise<void> {
  const docRef = doc(db, 'users', userId, 'boxes', box.id);
  const { id: _, ...data } = box;
  await setDoc(docRef, cleanUndefined(data), { merge: true });
}

export async function deleteBoxFromCloud(userId: string, boxId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'boxes', boxId);
  await deleteDoc(docRef);
}

export async function saveRoomToCloud(userId: string, room: Room): Promise<void> {
  const docRef = doc(db, 'users', userId, 'rooms', room.id);
  const { id: _, ...data } = room;
  await setDoc(docRef, cleanUndefined(data), { merge: true });
}

export async function deleteRoomFromCloud(userId: string, roomId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'rooms', roomId);
  await deleteDoc(docRef);
}

// Bulk sync helper (e.g. migrate local guest items to cloud upon first sign-in)
export async function bulkUploadInitialData(
  userId: string,
  items: InventoryItem[],
  boxes: StorageBox[],
  rooms: Room[]
): Promise<void> {
  const batch = writeBatch(db);

  rooms.forEach((room) => {
    const docRef = doc(db, 'users', userId, 'rooms', room.id);
    const { id: _, ...data } = room;
    batch.set(docRef, data, { merge: true });
  });

  boxes.forEach((box) => {
    const docRef = doc(db, 'users', userId, 'boxes', box.id);
    const { id: _, ...data } = box;
    batch.set(docRef, data, { merge: true });
  });

  items.forEach((item) => {
    const docRef = doc(db, 'users', userId, 'items', item.id);
    const { id: _, ...data } = item;
    batch.set(docRef, data, { merge: true });
  });

  await batch.commit();
}

// Clear all inventory items, boxes, and rooms from user's cloud account
export async function clearAllUserDataFromCloud(userId: string): Promise<void> {
  const collections = ['items', 'boxes', 'rooms'];
  for (const colName of collections) {
    const colRef = collection(db, 'users', userId, colName);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

// Clear specifically test/demo items from user's cloud account
export async function clearDemoTestDataFromCloud(userId: string): Promise<void> {
  const testItemIds = ['item-101', 'item-102', 'item-103', 'item-104', 'item-105', 'item-106', 'item-107', 'item-108'];
  const testBoxIds = ['box-01', 'box-02', 'box-03', 'box-04'];
  const testRoomIds = ['room-office', 'room-living', 'room-garage', 'room-closet'];

  const batch = writeBatch(db);
  testItemIds.forEach((id) => batch.delete(doc(db, 'users', userId, 'items', id)));
  testBoxIds.forEach((id) => batch.delete(doc(db, 'users', userId, 'boxes', id)));
  testRoomIds.forEach((id) => batch.delete(doc(db, 'users', userId, 'rooms', id)));
  
  await batch.commit();
}
