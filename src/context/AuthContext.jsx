import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("[AuthContext] User is authenticated:", currentUser.uid, currentUser.isAnonymous ? "(Anonymous)" : "(Permanent)");
        setUser(currentUser);
        setAuthError(null);
        setLoading(false);
      } else {
        console.log("[AuthContext] No user found, attempting anonymous sign-in...");
        // Automatically sign in anonymously if not authenticated
        signInAnonymously(auth)
          .then((result) => {
             console.log("[AuthContext] Anonymous sign-in successful. UID:", result.user.uid);
             setAuthError(null);
          })
          .catch((error) => {
             console.error("[AuthContext] Anonymous authentication failed", error);
             setAuthError(error.code || error.message);
             setLoading(false);
          });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
        {!loading && children}
    </AuthContext.Provider>
  );
};
