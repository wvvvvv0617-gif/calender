import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const DRIVE_FILE_NAME = 'ShiftMate_Backup_Data.json';
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Initialize Firebase App instance safely (prevent duplicate initializeApp calls)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
// Prompt user to select account if needed
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize auth state listener.
 * Cached token is managed strictly in-memory per security guidelines.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

/**
 * Sign in with Google Popup and obtain access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('구글 인증 토큰(Access Token)을 가져오지 못했습니다.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Return current cached access token in memory
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Log out and clear in-memory token
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
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
    throw new Error(errorData?.error?.message || `드라이브 파일 조회 실패 (HTTP ${response.status})`);
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
    throw new Error(`드라이브 파일 내용 다운로드 실패 (HTTP ${response.status})`);
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
      throw new Error(err?.error?.message || `드라이브 파일 업데이트 실패 (HTTP ${response.status})`);
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
      throw new Error(err?.error?.message || `드라이브 파일 생성 실패 (HTTP ${createRes.status})`);
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
      throw new Error(err?.error?.message || `드라이브 파일 업로드 실패 (HTTP ${uploadRes.status})`);
    }

    const uploaded = await uploadRes.json();
    return {
      fileId: newFileId,
      modifiedTime: uploaded.modifiedTime || new Date().toISOString(),
    };
  }
};
