import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  linkWithCredential, 
  EmailAuthProvider,
  signOut
} from 'firebase/auth';
import { initFirebase } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const setupAuth = async () => {
      try {
        const { auth } = await initFirebase();
        const addLog = (m) => window.__RHYTHM_LOGS?.push(`[Auth] ${m}`);
        
        if (!auth) {
          addLog("No Auth instance found. Ending.");
          setLoading(false);
          return;
        }

        addLog("Starting onAuthStateChanged...");
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            addLog(`User Detected: ${currentUser.uid} (${currentUser.email || 'Anonymous'})`);
            setUser(currentUser);
            setAuthError(null);
            setLoading(false);
          } else {
            addLog("No user. Starting Anonymous Sign-in...");
            signInAnonymously(auth)
              .then((result) => {
                 addLog(`Anonymous Sign-in: SUCCESS (${result.user.uid})`);
                 setAuthError(null);
                 setLoading(false);
              })
              .catch((error) => {
                 addLog(`Anonymous Sign-in: FAIL - ${error.message}`);
                 setAuthError(error.code || error.message);
                 setLoading(false);
              });
          }
        });
      } catch (e) {
        window.__RHYTHM_LOGS?.push(`[Auth] CRITICAL: ${e.message}`);
      }
    };

    const timer = setTimeout(() => {
      if (loading) {
        console.warn("[AuthContext] Initialization timeout. Forcing Local Mode.");
        setLoading(false);
      }
    }, 10000);

    setupAuth();

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const login = async (email, password) => {
    const { auth } = await initFirebase();
    setAuthError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    const { auth } = await initFirebase();
    return await signOut(auth);
  };

  const signupAndLink = async (email, password) => {
    const { auth } = await initFirebase();
    setAuthError(null);
    
    // If we are currently anonymous, we LINK the account to preserve data
    if (user && user.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      try {
        const result = await linkWithCredential(user, credential);
        return result;
      } catch (error) {
        // If the email is already in use, we might need to just log in
        setAuthError(error.message);
        throw error;
      }
    } else {
      // Direct signup
      try {
        return await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        setAuthError(error.message);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout, signupAndLink }}>
        {!loading ? children : (
          <div className="flex items-center justify-center min-h-screen bg-bg-primary text-text-secondary">
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <div className="w-12 h-12 border-4 border-accent-green border-t-transparent rounded-full animate-spin"></div>
              <span className="font-mono text-sm uppercase tracking-widest text-accent-green">Initializing Identity</span>
            </div>
          </div>
        )}
    </AuthContext.Provider>
  );
};
