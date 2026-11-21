import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import appletFirebaseConfig from '../../firebase-applet-config.json';

interface ResolvedFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const hasProvisionedAppletConfig = Boolean(
  appletFirebaseConfig?.apiKey &&
    appletFirebaseConfig?.projectId &&
    appletFirebaseConfig?.appId &&
    appletFirebaseConfig.projectId !== 'remixed-project-id'
);

const resolvedConfig: ResolvedFirebaseConfig = hasProvisionedAppletConfig
  ? {
      apiKey: appletFirebaseConfig.apiKey,
      authDomain: appletFirebaseConfig.authDomain,
      projectId: appletFirebaseConfig.projectId,
      storageBucket: appletFirebaseConfig.storageBucket,
      messagingSenderId: appletFirebaseConfig.messagingSenderId,
      appId: appletFirebaseConfig.appId,
      firestoreDatabaseId: appletFirebaseConfig.firestoreDatabaseId || undefined,
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      firestoreDatabaseId:
        import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined,
    };

export const isFirebaseConfigured = Boolean(
  resolvedConfig.apiKey &&
    resolvedConfig.projectId &&
    resolvedConfig.appId &&
    resolvedConfig.projectId !== 'remixed-project-id'
);

export const firebaseProjectId = resolvedConfig.projectId;
export const firestoreDatabaseId = resolvedConfig.firestoreDatabaseId;

// Singleton Firebase App Initialization
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);

function initDb(
  firebaseApp: FirebaseApp,
  databaseId?: string
): Firestore {
  // In browser/iframe/proxied environments, WebChannel streams can hang or fail with
  // code=unavailable; forcing long-polling ensures reliable Cloud Firestore transport.
  if (typeof window !== 'undefined') {
    try {
      return initializeFirestore(
        firebaseApp,
        { experimentalForceLongPolling: true },
        databaseId
      );
    } catch {
      return databaseId
        ? getFirestore(firebaseApp, databaseId)
        : getFirestore(firebaseApp);
    }
  }
  return databaseId
    ? getFirestore(firebaseApp, databaseId)
    : getFirestore(firebaseApp);
}

export const auth: Auth = getAuth(app);
export const db: Firestore = initDb(app, resolvedConfig.firestoreDatabaseId);
export const storage: FirebaseStorage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// =============================================================================
// Structured Firestore Error Handling
// =============================================================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  const serialized = JSON.stringify(errInfo);
  console.error('Firestore Error: ', serialized);
  throw new Error(serialized);
}

// =============================================================================
// Startup Firestore Connectivity Verification
// =============================================================================

let connectionChecked = false;

export async function testConnection(): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  if (connectionChecked) return true;
  connectionChecked = true;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isOfflineOrUnavailable =
        msg.includes('the client is offline') || msg.includes('unavailable');
      if (!isOfflineOrUnavailable) {
        // Permission error or missing test doc still confirms server reachability
        return true;
      }
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
      console.error('Please check your Firebase configuration.');
      return false;
    }
  }
  return false;
}

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  void testConnection();
}
