import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { initFirebase } from '../lib/firebase';
import { Preferences } from '@capacitor/preferences';

// --- Diagnostic Log System ---
const addLog = (msg) => {
  const time = new Date().toLocaleTimeString();
  window.__RHYTHM_LOGS?.push(`[DB] [${time}] ${msg}`);
};

// ---- Native Storage (Preferences) ----
const LS_KEY = 'rhythmrun_runs';

/**
 * Migration helper: Move data from localStorage to Native Preferences if needed
 */
const migrateFromLocalStorage = async (uid) => {
  try {
    const legacyKey = `rhythmrun_runs_${uid}`;
    const raw = localStorage.getItem(legacyKey);
    if (raw) {
      addLog("Found legacy localStorage data. Migrating to Native...");
      await Preferences.set({
        key: `${LS_KEY}_${uid}`,
        value: raw
      });
      localStorage.removeItem(legacyKey);
      addLog("Migration SUCCESS");
    }
  } catch (e) {
    addLog(`Migration FAILED: ${e.message}`);
  }
};

const getLocalRuns = async (uid) => {
  try {
    // 1. One-time migration check
    await migrateFromLocalStorage(uid);

    // 2. Get from Native Preferences
    const { value } = await Preferences.get({ key: `${LS_KEY}_${uid}` });
    if (!value) return [];
    
    return JSON.parse(value).map(r => ({ ...r, createdAt: new Date(r.createdAt) }));
  } catch (e) {
    addLog(`getLocalRuns ERROR: ${e.message}`);
    return [];
  }
};

const saveLocalRuns = async (uid, runs) => {
  try {
    await Preferences.set({
      key: `${LS_KEY}_${uid}`,
      value: JSON.stringify(runs)
    });
    addLog(`Saved ${runs.length} runs to Native Storage`);
  } catch (e) {
    addLog(`saveLocalRuns ERROR: ${e.message}`);
    console.warn('[DB] Preferences save failed:', e);
  }
};

// ---- Firestore availability cache ----
let _firestoreState = 'unknown'; // 'unknown', 'online', 'offline'
let _lastUid = null;

/**
 * Attempts a fast Firestore check. 
 */
const checkConnectivity = async (uid) => {
  if (uid !== _lastUid) {
    _firestoreState = 'unknown';
    _lastUid = uid;
  }
  if (_firestoreState === 'online') return true;
  
  try {
    const { db } = await initFirebase();
    if (!db) return false;

    const ref = collection(db, `users/${uid}/runs`);
    await Promise.race([
      getDocs(query(ref, orderBy('createdAt', 'desc'))).catch(() => getDocs(ref)),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
    ]);
    _firestoreState = 'online';
    return true;
  } catch (e) {
    _firestoreState = 'offline';
    addLog(`Firestore unreachable: ${e.message}`);
    return false;
  }
};

// ---- Public API ----

export const getRuns = async (uid) => {
  const { db } = await initFirebase();
  const projectId = db?.app?.options?.projectId || 'Unknown';
  addLog(`Fetching runs for UID: ...${uid?.slice(-5)} (Project: ${projectId})`);
  
  // Get local cache
  const localData = await getLocalRuns(uid);
  
  // Try to connect
  const isOnline = await checkConnectivity(uid);
  if (!isOnline) {
    addLog("Working in Local Mode (Offline)");
    return localData;
  }
  try {
    const { db } = await initFirebase();
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

    // Merge logic
    const fsIds = new Set(firestoreRuns.map(r => r.id));
    const merged = [...firestoreRuns];
    // Only push local records that aren't ALREADY being pushed
    const localOnly = localData.filter(r => r.id.startsWith('local_') && !_activeSyncs.has(r.id));
    
    if (localOnly.length > 0) {
      localOnly.forEach(r => _activeSyncs.add(r.id));
      addLog(`Syncing ${localOnly.length} items in background...`);
      (async () => {
        await new Promise(r => setTimeout(r, 2000));
        for (const run of localOnly) {
          try {
            await Promise.race([
              addDoc(ref, {
                distance: run.distance,
                duration: run.duration,
                avgPace: run.avgPace,
                coordinates: run.coordinates,
                splits: run.splits,
                bpmUsed: run.bpmUsed,
                createdAt: serverTimestamp()
              }).then(docRef => {
                run.id = docRef.id;
                addLog(`Cloud Sync Success: ${docRef.id}`);
              }),
              new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))
            ]);
          } catch (e) {
            addLog(`Cloud Sync Fail: ${e.message}`);
          } finally {
            _activeSyncs.delete(run.id);
          }
        }
        const latest = await getLocalRuns(uid);
        await saveLocalRuns(uid, latest);
      })();
    }

    // FINAL DEDUPLICATION: Merge records that have same 10-minute block, distance and duration
    // This is very aggressive to clean up sync-artifacts during the debugging phase
    const uniqueMap = new Map();
    [...merged, ...localOnly].forEach(run => {
      let d;
      if (run.createdAt && typeof run.createdAt.toDate === 'function') {
        d = run.createdAt.toDate();
      } else {
        d = new Date(run.createdAt);
      }
      
      if (isNaN(d.getTime())) return; // Skip invalid dates

      // Deduplicate by 10-minute buckets: standard for cleaning sync bursts
      const minutes = d.getMinutes();
      const roundedMinutes = Math.floor(minutes / 10) * 10;
      const timeKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${roundedMinutes}`;
      
      // Composite key: Time bucket + Distance (rounded to 2 decimal) + Duration
      const distKey = Math.round((run.distance || 0) * 100) / 100;
      const key = `${timeKey}_${distKey}_${run.duration}`;
      
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, run);
      }
    });

    const finalSorted = Array.from(uniqueMap.values()).sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
    await saveLocalRuns(uid, finalSorted);
    
    addLog(`Load complete: ${finalSorted.length} unique items`);
    return finalSorted;
  } catch (e) {
    addLog(`getRuns failed: ${e.message}`);
    return localData;
  }
};

export const saveRun = async (uid, runData) => {
  addLog('Saving new run...');

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

  // 1. Save to Native storage first
  const local = await getLocalRuns(uid);
  local.unshift(run);
  await saveLocalRuns(uid, local);

  // 2. Try to sync to Firestore
  if (_firestoreState !== 'offline') {
    try {
      const { db } = await initFirebase();
      if (!db) throw new Error("DB not ready");

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

      // Update local ID
      const updatedLocal = await getLocalRuns(uid);
      const index = updatedLocal.findIndex(r => r.id === run.id);
      if (index !== -1) {
        updatedLocal[index].id = docRef.id;
        await saveLocalRuns(uid, updatedLocal);
      }
      addLog(`Sync SUCCESS: ${docRef.id}`);
      return docRef.id;
    } catch (e) {
      addLog(`Sync FAIL: ${e.message}`);
    }
  }
  
  return run.id;
};

export const getRun = async (uid, runId) => {
  const local = await getLocalRuns(uid);
  const run = local.find(r => r.id === runId);
  if (run) return run;

  try {
    const all = await getRuns(uid);
    return all.find(r => r.id === runId) || null;
  } catch {
    return null;
  }
};

export const deleteRun = async (uid, runId) => {
  const local = await getLocalRuns(uid);
  await saveLocalRuns(uid, local.filter(r => r.id !== runId));

  if (_firestoreState === 'online' && !runId.startsWith('local_')) {
    try {
      const { db } = await initFirebase();
      if (db) {
        await deleteDoc(doc(db, `users/${uid}/runs`, runId));
        addLog(`Delete SUCCESS: ${runId}`);
      }
    } catch (e) {
      addLog(`Delete FAIL: ${e.message}`);
    }
  }
};
