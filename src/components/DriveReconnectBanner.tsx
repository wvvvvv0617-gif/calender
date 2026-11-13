import React from 'react';
import { useShift } from '../context/ShiftContext';

export const DriveReconnectBanner: React.FC = () => {
  const {
    hasUsedDriveBefore,
    isGoogleDriveConnected,
    hasPendingDriveBackup,
    pendingBackupSummary,
    isReconnectBannerDismissed,
    dismissReconnectBanner,
    reconnectAndSyncDrive,
    saveToDriveWithConfirm,
    openDataSafetyModal,
    isDriveSyncing,
  } = useShift();

  // State A: Previously connected to Google Drive, new browser session requires 1-tap reconnect
  if (hasUsedDriveBefore && !isGoogleDriveConnected && !isReconnectBannerDismissed) {
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 mb-2">
        <div className="rounded-2xl bg-[#eff3ff] border border-[#004ac6]/25 px-3 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">
                {hasPendingDriveBackup ? 'cloud_upload' : 'cloud_sync'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#131b2e] truncate">
                  구글 드라이브 세션 재연결
                </span>
                {hasPendingDriveBackup && (
                  <span className="px-1.5 py-0.5 rounded bg-[#fff3e0] border border-[#ffb74d]/60 text-[#b35300] text-[10px] font-bold shrink-0">
                    백업 대기
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#434655] truncate">
                {hasPendingDriveBackup
                  ? `${pendingBackupSummary || '변경된 일정'} · 연결 시 즉시 백업`
                  : '새 세션에서 1탭으로 드라이브 동기화 유지'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={reconnectAndSyncDrive}
              disabled={isDriveSyncing}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            >
              <span
                className={`material-symbols-outlined text-[15px] ${
                  isDriveSyncing ? 'animate-spin' : ''
                }`}
              >
                {isDriveSyncing ? 'sync' : 'link'}
              </span>
              <span>{hasPendingDriveBackup ? '연결·백업' : '재연결'}</span>
            </button>
            <button
              type="button"
              onClick={dismissReconnectBanner}
              className="min-h-[38px] min-w-[38px] rounded-xl text-[#737686] hover:bg-[#dbe1ff]/60 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="재연결 안내 닫기"
              title="닫기"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State B: Connected and has unbacked-up local changes
  if (isGoogleDriveConnected && hasPendingDriveBackup) {
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 mb-2">
        <div className="rounded-2xl bg-[#fff8ef] border border-[#ffb74d]/60 px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#ffeed9] text-[#b35300] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#131b2e] block truncate">
                드라이브 미백업 변경사항
              </span>
              <span className="text-[11px] text-[#7a4100] block truncate">
                {pendingBackupSummary || '최신 일정 수정 내역을 백업하세요'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={saveToDriveWithConfirm}
            disabled={isDriveSyncing}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#b35300] hover:bg-[#964500] text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[15px]">backup</span>
            <span>지금 백업</span>
          </button>
        </div>
      </div>
    );
  }

  // State C: Never connected yet, but edits exist — subtle 1-line dismissible prompt
  if (!hasUsedDriveBefore && hasPendingDriveBackup && !isReconnectBannerDismissed) {
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 mb-2">
        <div className="rounded-xl bg-[#f2f3ff] border border-[#c3c6d7]/40 px-3 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-[#434655]">
            <span className="material-symbols-outlined text-[16px] text-[#004ac6] shrink-0">
              cloud_queue
            </span>
            <span className="truncate">
              일정 변경됨 · 구글 드라이브 연결 시 1탭 자동 백업 가능
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={openDataSafetyModal}
              className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#004ac6] text-white text-[11px] font-bold hover:bg-[#003ea8] active:scale-95 transition-all cursor-pointer"
            >
              연결
            </button>
            <button
              type="button"
              onClick={dismissReconnectBanner}
              className="min-h-[32px] min-w-[32px] rounded-lg text-[#737686] hover:bg-[#eaedff] flex items-center justify-center cursor-pointer"
              aria-label="안내 닫기"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
