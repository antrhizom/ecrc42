import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase-Konfiguration - BITTE MIT DEINEN EIGENEN WERTEN ERSETZEN
const firebaseConfig = {
  apiKey: "DEINE_API_KEY",
  authDomain: "DEIN_AUTH_DOMAIN",
  projectId: "DEINE_PROJECT_ID",
  storageBucket: "DEINE_STORAGE_BUCKET",
  messagingSenderId: "DEINE_MESSAGING_SENDER_ID",
  appId: "DEINE_APP_ID"
};

// Firebase nur einmal initialisieren
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
