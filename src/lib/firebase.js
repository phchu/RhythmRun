import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';

// --- Diagnostic Log System ---
window.__RHYTHM_LOGS = window.__RHYTHM_LOGS || [];
const addLog = (msg) => {
  const time = new Date().toLocaleTimeString();
  const entry = `[${time}] ${msg}`;
  console.log(entry);
  window.__RHYTHM_LOGS.push(entry);
};

addLog("Firebase Module Root Evaluation Start");

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo"
};

let app = null;
let db = null;
let auth = null;
let initialized = false;

export const initFirebase = async () => {
  if (initialized) return { app, db, auth };
  
  try {
    addLog("initFirebase() started - [Manual Mode v3]");
    
    addLog("Calling initializeApp...");
    app = initializeApp(firebaseConfig);
    addLog("initializeApp success");
    
    addLog("Calling initializeFirestore (Standard Cache)...");
    db = initializeFirestore(app, {
      localCache: memoryLocalCache()
    });
    addLog("initializeFirestore success");
    
    // THE CRITICAL CHANGE: 
    // We use initializeAuth with explicit persistence to bypass the auto-detection HANG.
    addLog("Calling initializeAuth (BrowserLocal)...");
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
    addLog("initializeAuth success");

    initialized = true;
    addLog("Firebase initialization sequence complete.");
    return { app, db, auth };
  } catch (e) {
    addLog(`CRITICAL CRASH: ${e.message}`);
    console.error("[Firebase] Late-init failed:", e);
    return { app: null, db: null, auth: null };
  }
};

export { app, db, auth };
