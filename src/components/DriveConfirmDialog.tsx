import React from 'react';

export interface DriveConfirmDialogProps {
  isOpen: boolean;
  type: 'save' | 'restore';
  title: string;
  description: string;
  details?: {
    shiftsCount: number;
    workplacesCount: number;
    presetsCount: number;
    lastUpdated?: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DriveConfirmDialog: React.FC<DriveConfirmDialogProps> = ({
  isOpen,
  type,
  title,
  description,
  details,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              type === 'save'
                ? 'bg-[#004ac6] text-white'
                : 'bg-[#b35300] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {type === 'save' ? 'cloud_upload' : 'cloud_download'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#131b2e] leading-snug">{title}</h3>
            <p className="text-xs text-[#434655] mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Details card */}
        {details && (
          <div className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#dbe1ff] flex flex-col gap-1.5 text-xs">
            <div className="text-[11px] font-bold text-[#434655] flex items-center justify-between">
              <span>반영될 데이터 항목:</span>
              <span className="text-[#004ac6] font-semibold">
                ShiftMate_Backup_Data.json
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#131b2e] font-semibold pt-1 border-t border-[#dbe1ff]">
              <span>📅 근무: <strong>{details.shiftsCount}</strong>건</span>
              <span>🏢 사업장: <strong>{details.workplacesCount}</strong>곳</span>
              <span>⚡ 프리셋: <strong>{details.presetsCount}</strong>개</span>
            </div>
            {details.lastUpdated && (
              <div className="text-[10px] text-[#737686] pt-0.5">
                드라이브 저장 시각: {details.lastUpdated}
              </div>
            )}
          </div>
        )}

        {/* Warning Callout for Overwriting */}
        <div className="p-3 rounded-xl bg-[#fff8e1] border border-[#ffe082] text-[11px] text-[#854d0e] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] shrink-0 text-[#b35300]">info</span>
          <span>
            {type === 'save'
              ? '구글 드라이브 내 기존 파일 내용이 현재 앱의 최신 데이터로 업데이트(덮어쓰기)됩니다.'
              : '현재 기기에 저장된 근무 기록이 구글 드라이브의 저장 데이터로 교체(복원)됩니다.'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#434655] text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
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
                <span>{type === 'save' ? '확인 및 드라이브 저장' : '확인 및 데이터 복원'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
