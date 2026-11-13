import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  reauthenticateWithPopup,
  getRedirectResult,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const DRIVE_FILE_NAME = 'ShiftMate_Backup_Data.json';
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Google OAuth access tokens typically expire in 60 minutes; refresh safely at 55 minutes
const ACCESS_TOKEN_TTL_MS = 55 * 60 * 1000;

// Initialize Firebase App instance safely (prevent duplicate initializeApp calls)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicitly enforce durable persistence across PWA restarts & browser refreshes
const persistenceReady: Promise<void> = setPersistence(auth, indexedDBLocalPersistence)
  .catch(() => setPersistence(auth, browserLocalPersistence))
  .catch((err) => {
    console.warn('Firebase Auth persistence setup warning:', err);
  });

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

/**
 * Initialize auth state listener.
 * Firebase Auth persists the signed-in Google account across reloads/PWA restarts,
 * while the OAuth access token stays strictly in-memory.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void,
  onRedirectError?: (error: any) => void
) => {
  const redirectChecked = persistenceReady
    .then(() => getRedirectResult(auth))
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setCachedAccessToken(credential.accessToken);
        }
        return result;
      }
      return null;
    })
    .catch((err) => {
      console.warn('Google redirect result warning:', err);
      if (onRedirectError) onRedirectError(err);
      return null;
    });

  return onAuthStateChanged(auth, async (user: User | null) => {
    await redirectChecked;
    if (user) {
      const validToken = isAccessTokenValid() ? cachedAccessToken : null;
      if (onAuthSuccess) onAuthSuccess(user, validToken);
    } else {
      if (!isSigningIn) {
        setCachedAccessToken(null);
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Sign in (or refresh token) with Google Popup, falling back to Redirect on standalone PWA if popups are blocked
 */
export const googleSignIn = async (options?: {
  forceAccountSelect?: boolean;
  loginHint?: string | null;
}): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    await persistenceReady;

    const customProvider = buildGoogleProvider(options);
    let result;

    if (auth.currentUser && !options?.forceAccountSelect) {
      try {
        result = await reauthenticateWithPopup(auth.currentUser, customProvider);
      } catch (reauthErr: any) {
        if (
          reauthErr?.code === 'auth/user-mismatch' ||
          reauthErr?.code === 'auth/credential-already-in-use'
        ) {
          result = await signInWithPopup(
            auth,
            buildGoogleProvider({ ...options, forceAccountSelect: true })
          );
        } else {
          throw reauthErr;
        }
      }
    } else {
      result = await signInWithPopup(auth, customProvider);
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('구글 인증 토큰(Access Token)을 가져오지 못했습니다.');
    }

    setCachedAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    // Fallback to redirect flow if popup is blocked on top-level PWA/mobile webview
    if (
      error?.code === 'auth/popup-blocked' &&
      typeof window !== 'undefined' &&
      window.self === window.top
    ) {
      try {
        await signInWithRedirect(auth, buildGoogleProvider(options));
        return null;
      } catch (redirectErr) {
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
  if (!isAccessTokenValid()) {
    setCachedAccessToken(null);
    return null;
  }
  return cachedAccessToken;
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
