import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  Auth,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const DRIVE_FILE_NAME = 'ShiftMate_Backup_Data.json';
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Google OAuth access tokens typically expire in 60 minutes; refresh safely at 55 minutes
const ACCESS_TOKEN_TTL_MS = 55 * 60 * 1000;
const OAUTH_REDIRECT_PENDING_KEY = 'shiftmate_oauth_redirect_pending_v1';

// Initialize Firebase App instance safely (prevent duplicate initializeApp calls)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Prioritize browserLocalPersistence (synchronous localStorage) before indexedDBLocalPersistence.
// In standalone mobile PWAs (Android Chrome / Samsung Internet / Brave / iOS), IndexedDB can stall
// or drop connections after OS background suspension, whereas localStorage hydrates synchronously
// and reliably persists the signed-in Firebase account across PWA restarts and offline launches.
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence, indexedDBLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch {
  // Auth was already initialized on this app instance
  authInstance = getAuth(app);
}
export const auth = authInstance;

let isSigningIn = false;
// Access tokens are kept strictly in-memory (never persisted to localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedTokenExpiresAt = 0;

const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  cachedTokenExpiresAt = token ? Date.now() + ACCESS_TOKEN_TTL_MS : 0;
};

const isAccessTokenValid = (): boolean => {
  return !!cachedAccessToken && Date.now() < cachedTokenExpiresAt;
};

export const hasValidAccessToken = (): boolean => {
  return isAccessTokenValid();
};

export const clearAccessToken = (): void => {
  setCachedAccessToken(null);
};

/**
 * Synchronous token check so click handlers can launch popups without yielding a microtask first
 */
export const getValidAccessTokenSync = (): string | null => {
  if (!isAccessTokenValid()) {
    setCachedAccessToken(null);
    return null;
  }
  return cachedAccessToken;
};

/**
 * Silently keep the Firebase Auth session fresh when the PWA returns to foreground or regains network.
 * Never signs the user out if offline or if a transient network error occurs.
 */
export const keepFirebaseSessionAlive = async (): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  try {
    await currentUser.getIdToken(false);
  } catch (err) {
    console.warn('Silent Firebase session keep-alive skipped:', err);
  }
};

export class DriveApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'DriveApiError';
    this.status = status;
  }
}

const buildGoogleProvider = (options?: {
  forceAccountSelect?: boolean;
  loginHint?: string | null;
}): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  for (const scope of DRIVE_SCOPES) {
    provider.addScope(scope);
  }
  const effectiveHint = options?.loginHint || auth.currentUser?.email || null;
  if (options?.forceAccountSelect || !effectiveHint) {
    provider.setCustomParameters({
      prompt: 'select_account',
    });
  } else {
    provider.setCustomParameters({
      login_hint: effectiveHint,
    });
  }
  return provider;
};

const hasPendingRedirectFlag = (): boolean => {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(OAUTH_REDIRECT_PENDING_KEY) === '1';
  } catch {
    return false;
  }
};

const setPendingRedirectFlag = (pending: boolean) => {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (pending) {
      sessionStorage.setItem(OAUTH_REDIRECT_PENDING_KEY, '1');
    } else {
      sessionStorage.removeItem(OAUTH_REDIRECT_PENDING_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

/**
 * Initialize auth state listener.
 * Hydrates directly from durable local persistence without triggering slow cross-origin redirect iframes
 * on normal PWA launches, keeping the signed-in Google account intact across restarts and offline use.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void,
  onRedirectError?: (error: any) => void
) => {
  let active = true;

  const hydrationReady = (async () => {
    // Only call getRedirectResult when we actually initiated a redirect fallback.
    // Skipping it on normal PWA boots avoids cross-origin iframe delays/failures on mobile & offline launch.
    if (hasPendingRedirectFlag()) {
      setPendingRedirectFlag(false);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            setCachedAccessToken(credential.accessToken);
          }
        }
      } catch (err) {
        console.warn('Google redirect result warning:', err);
        if (onRedirectError) onRedirectError(err);
      }
    }

    try {
      if (typeof auth.authStateReady === 'function') {
        await auth.authStateReady();
      }
    } catch (err) {
      console.warn('Firebase authStateReady warning:', err);
    }
  })();

  const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
    await hydrationReady;
    if (!active) return;

    const currentUser = user || auth.currentUser;
    if (currentUser) {
      const validToken = isAccessTokenValid() ? cachedAccessToken : null;
      if (onAuthSuccess) onAuthSuccess(currentUser, validToken);
    } else if (!isSigningIn) {
      setCachedAccessToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });

  return () => {
    active = false;
    unsubscribe();
  };
};

/**
 * Sign in (or refresh Drive access token) with Google Popup synchronously from user click.
 * Uses login_hint when an account is already linked so Google skips the account chooser.
 */
export const googleSignIn = async (options?: {
  forceAccountSelect?: boolean;
  loginHint?: string | null;
}): Promise<{ user: User; accessToken: string } | null> => {
  const customProvider = buildGoogleProvider(options);
  try {
    isSigningIn = true;
    // Call signInWithPopup immediately without prior awaits so mobile browsers keep user gesture activation
    const result = await signInWithPopup(auth, customProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('구글 인증 토큰(Access Token)을 가져오지 못했습니다.');
    }

    setCachedAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    // Fallback to redirect flow only if popup is explicitly blocked on a top-level standalone window
    if (
      error?.code === 'auth/popup-blocked' &&
      typeof window !== 'undefined' &&
      window.self === window.top
    ) {
      try {
        setPendingRedirectFlag(true);
        await signInWithRedirect(auth, customProvider);
        return null;
      } catch (redirectErr) {
        setPendingRedirectFlag(false);
        console.error('Google Redirect Sign-in error:', redirectErr);
        throw redirectErr;
      }
    }
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Return current valid in-memory access token (null if missing or expired)
 */
export const getAccessToken = async (): Promise<string | null> => {
  return getValidAccessTokenSync();
};

/**
 * Log out and clear in-memory token
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  setCachedAccessToken(null);
};

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

/**
 * Search if the ShiftMate backup file exists in the user's Google Drive
 */
export const findDriveBackupFile = async (accessToken: string): Promise<DriveFileInfo | null> => {
  const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&spaces=drive`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new DriveApiError(
      errorData?.error?.message || `드라이브 파일 조회 실패 (HTTP ${response.status})`,
      response.status
    );
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0] as DriveFileInfo;
  }
  return null;
};

/**
 * Read contents of the ShiftMate backup file from Google Drive
 */
export const readDriveBackupFile = async (accessToken: string, fileId: string): Promise<string> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new DriveApiError(`드라이브 파일 내용 다운로드 실패 (HTTP ${response.status})`, response.status);
  }

  return await response.text();
};

/**
 * Save / Update ShiftMate backup file in Google Drive
 */
export const saveToGoogleDrive = async (
  accessToken: string,
  dataContent: string
): Promise<{ fileId: string; modifiedTime: string }> => {
  // 1. Check if file already exists
  const existingFile = await findDriveBackupFile(accessToken);

  if (existingFile) {
    // Update existing file content
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
    const response = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: dataContent,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new DriveApiError(
        err?.error?.message || `드라이브 파일 업데이트 실패 (HTTP ${response.status})`,
        response.status
      );
    }

    const updated = await response.json();
    return {
      fileId: existingFile.id,
      modifiedTime: updated.modifiedTime || new Date().toISOString(),
    };
  } else {
    // Create new file: first create metadata, then upload media content
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
      description: 'ShiftMate 근무기록 백업 파일 (자동 동기화)',
    };

    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(metadata),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new DriveApiError(
        err?.error?.message || `드라이브 파일 생성 실패 (HTTP ${createRes.status})`,
        createRes.status
      );
    }

    const newFile = await createRes.json();
    const newFileId = newFile.id;

    // Upload content
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: dataContent,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new DriveApiError(
        err?.error?.message || `드라이브 파일 업로드 실패 (HTTP ${uploadRes.status})`,
        uploadRes.status
      );
    }

    const uploaded = await uploadRes.json();
    return {
      fileId: newFileId,
      modifiedTime: uploaded.modifiedTime || new Date().toISOString(),
    };
  }
};
