import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types/store';
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
} from '../lib/firebase';
import { verifyAdminAccess } from '../services/firestoreStore';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<boolean>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, fullName: string, pass?: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in the Firebase project. Please sign in with Google or enable Email/Password authentication in the Firebase Console.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many verification requests. Please wait a few minutes before retrying.';
    default:
      return err instanceof Error
        ? err.message
        : 'Authentication request failed.';
  }
}

async function syncCustomerProfileIfVerified(fbUser: User): Promise<void> {
  if (!fbUser.emailVerified || !fbUser.email) return;
  try {
    const ref = doc(db, 'customers', fbUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: fbUser.uid,
        email: fbUser.email,
        fullName: fbUser.displayName || fbUser.email.split('@')[0] || 'Customer',
        role: 'customer',
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    // Non-fatal if rules deny unverified or restricted write; Firestore Rules remain the authority
    console.warn('Customer profile sync skipped:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setFirebaseUser(fbUser);
      const adminStatus = await verifyAdminAccess(
        fbUser.uid,
        fbUser.email,
        fbUser.emailVerified
      );

      setIsAdmin(adminStatus);
      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        fullName:
          fbUser.displayName || fbUser.email?.split('@')[0] || 'MK Labs User',
        role: adminStatus ? 'admin' : 'customer',
        accountStatus: 'active',
        avatarUrl: fbUser.photoURL || undefined,
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        updatedAt: fbUser.metadata.lastSignInTime || new Date().toISOString(),
      });

      if (!adminStatus) {
        void syncCustomerProfileIfVerified(fbUser);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<boolean> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase authentication is not configured.');
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return await verifyAdminAccess(
        cred.user.uid,
        cred.user.email,
        cred.user.emailVerified
      );
    } catch (err) {
      throw new Error(mapAuthErrorMessage(err));
    }
  };

  const login = async (email: string, pass: string): Promise<void> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase authentication is not configured.');
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err) {
      throw new Error(mapAuthErrorMessage(err));
    }
  };

  const register = async (
    email: string,
    fullName: string,
    pass?: string
  ): Promise<void> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase authentication is not configured.');
    }
    if (!pass || pass.length < 6) {
      throw new Error('A password of at least 6 characters is required.');
    }
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        pass
      );
      if (fullName.trim()) {
        await updateProfile(cred.user, { displayName: fullName.trim() });
      }
      await sendEmailVerification(cred.user).catch(() => {
        // Non-blocking if email verification quota or provider config restricts it
      });
    } catch (err) {
      throw new Error(mapAuthErrorMessage(err));
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!isFirebaseConfigured || !auth.currentUser) {
      throw new Error('No signed-in user session.');
    }
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err) {
      throw new Error(mapAuthErrorMessage(err));
    }
  };

  const logout = async (): Promise<void> => {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAdmin,
        isLoading,
        loginWithGoogle,
        login,
        register,
        resendVerificationEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
