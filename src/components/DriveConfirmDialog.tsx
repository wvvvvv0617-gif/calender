import React from 'react';

export interface DriveConfirmDialogProps {
  isOpen: boolean;
  type: 'save' | 'restore';
  title: string;
  description: string;
  changeSummary?: string | null;
  isAutoPrompt?: boolean;
  needsSignIn?: boolean;
  details?: {
    shiftsCount: number;
    workplacesCount: number;
    presetsCount: number;
    lastUpdated?: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  onMuteSessionPrompt?: () => void;
  isLoading?: boolean;
}

export const DriveConfirmDialog: React.FC<DriveConfirmDialogProps> = ({
  isOpen,
  type,
  title,
  description,
  changeSummary,
  isAutoPrompt = false,
  needsSignIn = false,
  details,
  onConfirm,
  onCancel,
  onMuteSessionPrompt,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              type === 'save'
                ? 'bg-[#004ac6] text-white'
                : 'bg-[#b35300] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">
              {type === 'save' ? 'cloud_upload' : 'cloud_download'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] sm:text-base font-bold text-[#131b2e] leading-snug">{title}</h3>
            <p className="text-xs text-[#434655] mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Change Summary Highlight (for edit-triggered 1-tap backup) */}
        {changeSummary && type === 'save' && (
          <div className="px-3 py-2 rounded-xl bg-[#eef3ff] border border-[#004ac6]/20 text-xs font-bold text-[#004ac6] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">edit_calendar</span>
            <span className="truncate">방금 변경: {changeSummary}</span>
          </div>
        )}

        {/* Details card */}
        {details && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#dbe1ff] flex flex-col gap-1.5 text-xs">
            <div className="text-[11px] font-bold text-[#434655] flex items-center justify-between gap-2">
              <span>반영될 데이터 항목</span>
              <span className="text-[#004ac6] font-semibold truncate">
                ShiftMate_Backup_Data.json
              </span>
            </div>
            <div className="flex items-center justify-between sm:justify-start sm:gap-3 text-[#131b2e] font-semibold pt-1 border-t border-[#dbe1ff] tabular-nums text-[11px] sm:text-xs">
              <span>근무 <strong>{details.shiftsCount}</strong>건</span>
              <span className="text-[#c3c6d7]">·</span>
              <span>사업장 <strong>{details.workplacesCount}</strong>곳</span>
              <span className="text-[#c3c6d7]">·</span>
              <span>프리셋 <strong>{details.presetsCount}</strong>개</span>
            </div>
            {details.lastUpdated && (
              <div className="text-[10px] text-[#737686] pt-0.5 tabular-nums">
                드라이브 저장 시각: {details.lastUpdated}
              </div>
            )}
          </div>
        )}

        {/* Warning Callout for Overwriting */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-[#fff8e1] border border-[#ffe082] text-[11px] text-[#854d0e] flex items-start gap-2 leading-snug">
          <span className="material-symbols-outlined text-[18px] shrink-0 text-[#b35300] mt-0.5">info</span>
          <span>
            {type === 'save'
              ? needsSignIn
                ? '확인을 누르면 구글 계정 인증 후 내 드라이브의 기존 백업 파일을 최신 데이터로 업데이트합니다.'
                : '구글 드라이브 내 기존 파일 내용이 현재 앱의 최신 데이터로 업데이트(덮어쓰기)됩니다.'
              : '현재 기기에 저장된 근무 기록이 구글 드라이브의 저장 데이터로 교체(복원)됩니다.'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="min-h-[44px] px-4 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#434655] text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isAutoPrompt ? '나중에' : '취소'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 min-h-[44px] px-3 sm:px-4 rounded-xl text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                type === 'save'
                  ? 'bg-[#004ac6] hover:bg-[#003ea8]'
                  : 'bg-[#b35300] hover:bg-[#8f4200]'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    {type === 'save' ? 'check' : 'restore'}
                  </span>
                  <span className="whitespace-nowrap">
                    {type === 'save'
                      ? needsSignIn
                        ? '로그인 후 드라이브 저장'
                        : '확인 및 드라이브 저장'
                      : '확인 및 데이터 복원'}
                  </span>
                </>
              )}
            </button>
          </div>

          {isAutoPrompt && onMuteSessionPrompt && (
            <button
              type="button"
              onClick={onMuteSessionPrompt}
              disabled={isLoading}
              className="text-[11px] text-[#737686] hover:text-[#131b2e] underline py-1 text-center cursor-pointer transition-colors"
            >
              이번 작업 동안 백업 확인 창 묻지 않기 (상단 배너에서 언제든 백업 가능)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
