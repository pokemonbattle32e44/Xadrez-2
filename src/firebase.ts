import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

// Use the provisioned databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Get persistent anonymous session ID across tabs or page reloads
export const getLocalSessionPlayerId = (): string => {
  const STORAGE_KEY = 'xadrez2_session_uid';
  let uid = localStorage.getItem(STORAGE_KEY);
  if (!uid) {
    // Generate secure unique ID
    uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(STORAGE_KEY, uid);
  }
  return uid;
};

// Authenticate anonymously if enabled on Firebase project, or fallback gracefully to persistent session ID
export const ensurePlayerSessionId = async (): Promise<string> => {
  // If Firebase Auth already has a user, return it
  if (auth.currentUser) return auth.currentUser.uid;

  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (err: any) {
    // If anonymous auth is restricted (auth/admin-restricted-operation) or not yet enabled in Console,
    // fallback seamlessly to the persistent unique device session ID.
    console.warn('Firebase Auth anonymous login not enabled or restricted; using persistent session ID:', err?.code || err);
    return getLocalSessionPlayerId();
  }
};
