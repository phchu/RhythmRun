import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// ---- Local Storage (The source of truth for offline/missing DB) ----
const LS_KEY = 'rhythmrun_runs';

const getLocalRuns = (uid) => {
  try {
    const raw = localStorage.getItem(`${LS_KEY}_${uid}`);
    if (!raw) return [];
    return JSON.parse(raw).map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
  } catch { return []; }
};

const saveLocalRuns = (uid, runs) => {
  try {
    localStorage.setItem(`${LS_KEY}_${uid}`, JSON.stringify(runs));
  } catch (e) {
    console.warn('[DB] localStorage save failed:', e);
  }
};

// ---- Firestore availability cache ----
let _firestoreState = 'unknown'; // 'unknown', 'online', 'offline'

/**
 * Attempts a fast Firestore check. 
 * If it doesn't resolve in 1.5s, we assume offline/slow and use local.
 */
const checkConnectivity = async (uid) => {
  if (_firestoreState === 'offline') return false;
  
  try {
    const ref = collection(db, `users/${uid}/runs`);
    await Promise.race([
      getDocs(query(ref, orderBy('createdAt', 'desc'))).catch(() => getDocs(ref)),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
    ]);
    _firestoreState = 'online';
    return true;
  } catch (e) {
    _firestoreState = 'offline';
    console.warn('[DB] Firestore unreachable or missing DB. Switching to Local Mode.');
    return false;
  }
};

// ---- Public API ----

export const getRuns = async (uid) => {
  console.log('[DB] Fetching runs...');
  
  // 1. Immediately get local data for instant UI
  const localData = getLocalRuns(uid);
  
  // 2. If we already know we are offline, return local immediately
  if (_firestoreState === 'offline') {
    return localData;
  }

  // 3. Try to get Firestore data with a tight timeout
  try {
    const isOnline = await checkConnectivity(uid);
    if (!isOnline) return localData;

    const ref = collection(db, `users/${uid}/runs`);
    let snap;
    try {
      snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
    } catch {
      snap = await getDocs(ref);
    }

    const firestoreRuns = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        distance: data.distance || 0,
        duration: data.duration || 0,
        avgPace: data.avgPace || null,
        coordinates: data.coordinates || [],
        splits: data.splits || [],
        bpmUsed: data.bpmUsed || null,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });

    // Merge logic: ensure local-only runs are preserved
    const fsIds = new Set(firestoreRuns.map(r => r.id));
    const localOnly = localData.filter(r => !fsIds.has(r.id));
    const merged = [...firestoreRuns, ...localOnly].sort((a, b) => b.createdAt - a.createdAt);
    
    // Self-healing: Update local cache with Firestore data
    saveLocalRuns(uid, merged);
    
    return merged;
  } catch (e) {
    console.warn('[DB] getRuns failed, returning local:', e.message);
    return localData;
  }
};

export const saveRun = async (uid, runData) => {
  console.log('[DB] Saving run...');

  const run = {
    id: `local_${Date.now()}`,
    distance: runData.distance || 0,
    duration: runData.duration || 0,
    avgPace: runData.avgPace || null,
    coordinates: runData.coordinates || [],
    splits: runData.splits || [],
    bpmUsed: runData.bpmUsed || null,
    createdAt: new Date(),
  };

  // 1. Save to local storage first (instant)
  const local = getLocalRuns(uid);
  local.unshift(run);
  saveLocalRuns(uid, local);

  // 2. Try to sync to Firestore in background/online
  if (_firestoreState !== 'offline') {
    try {
      const ref = collection(db, `users/${uid}/runs`);
      const docRef = await addDoc(ref, {
        distance: run.distance,
        duration: run.duration,
        avgPace: run.avgPace,
        coordinates: run.coordinates,
        splits: run.splits,
        bpmUsed: run.bpmUsed,
        createdAt: serverTimestamp()
      });
      // Update local ID with Firestore ID
      const updatedLocal = getLocalRuns(uid);
      const index = updatedLocal.findIndex(r => r.id === run.id);
      if (index !== -1) {
        updatedLocal[index].id = docRef.id;
        saveLocalRuns(uid, updatedLocal);
      }
      console.log('[DB] Synced to Firestore:', docRef.id);
    } catch (e) {
      console.warn('[DB] Sync to Firestore failed:', e.message);
      // We don't mark offline here yet, just log it
    }
  }
  
  return run.id;
};

export const deleteRun = async (uid, runId) => {
  // Remove from local
  const local = getLocalRuns(uid);
  saveLocalRuns(uid, local.filter(r => r.id !== runId));

  // Try Firestore
  if (_firestoreState === 'online' && !runId.startsWith('local_')) {
    try {
      await deleteDoc(doc(db, `users/${uid}/runs`, runId));
    } catch (e) {
      console.warn('[DB] Firestore delete failed:', e.message);
    }
  }
};
