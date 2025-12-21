import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase-Konfiguration - BITTE MIT DEINEN EIGENEN WERTEN ERSETZEN
const firebaseConfig = {
  apiKey: "AIzaSyCr1L8Dhcf1dMNkoPJxB9ZoBYsKsSQKkRU",
  authDomain: "ecrc42.firebaseapp.com",
  projectId: "ecrc42",
  storageBucket: "ecrc42.firebasestorage.app",
  messagingSenderId: "783331523622",
  appId: "1:783331523622:web:7fc78af1f01047759b3ae7"
};

// Firebase nur einmal initialisieren
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
