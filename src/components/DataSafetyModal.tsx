import React, { useState, useEffect, useRef } from 'react';
import { useShift } from '../context/ShiftContext';
import { requestPersistentStorage } from '../utils/storageBackup';

export const DataSafetyModal: React.FC = () => {
  const {
    isDataSafetyModalOpen,
    closeDataSafetyModal,
    exportAppData,
    importAppData,
    getAppDataJsonString,
    shifts,
    workplaces,
    presets,
    userName,
    showToast,
  } = useShift();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [pasteCode, setPasteCode] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isDataSafetyModalOpen) {
      if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persisted) {
        navigator.storage.persisted().then((persisted) => {
          setIsPersisted(persisted);
        }).catch(() => {
          setIsPersisted(false);
        });
      }
    }
  }, [isDataSafetyModalOpen]);

  if (!isDataSafetyModalOpen) return null;

  const handleRequestPersist = async () => {
    const success = await requestPersistentStorage();
    setIsPersisted(success);
    if (success) {
      showToast('🛡️ 브라우저 영구 보관(Persistent Storage)이 활성화되었습니다.');
    } else {
      showToast('ℹ️ 브라우저 정책에 따라 [백업 파일 다운로드]로 보관하는 것을 권장합니다.');
    }
  };

  const handleCopyCode = async () => {
    try {
      const json = getAppDataJsonString();
      await navigator.clipboard.writeText(json);
      setCopied(true);
      showToast('📋 백업 코드가 클립보드에 복사되었습니다! (메모장/카카오톡에 저장 가능)');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast('⚠️ 클립보드 복사에 실패했습니다. [백업 파일 다운로드]를 이용해주세요.');
    }
  };

  const handleRestoreFromPaste = () => {
    if (!pasteCode.trim()) {
      showToast('⚠️ 복원할 백업 코드를 입력해주세요.');
      return;
    }
    const success = importAppData(pasteCode.trim());
    if (success) {
      setPasteCode('');
      setShowPasteBox(false);
      closeDataSafetyModal();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importAppData(content);
        if (success) {
          closeDataSafetyModal();
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#eaedff] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#eaedff] flex items-center justify-between bg-linear-to-r from-[#f2f3ff] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#131b2e]">데이터 자체 저장 &amp; 영구 보관</h2>
              <p className="text-[11px] text-[#434655]">크롬 기록 삭제에도 사라지지 않는 영구 안전 보관소</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDataSafetyModal}
            className="w-8 h-8 rounded-full hover:bg-[#eaedff] text-[#737686] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Why Chrome deletes data Banner */}
          <div className="p-3.5 rounded-2xl bg-[#fff8e1] border border-[#ffe082] text-xs flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-bold text-[#b35300]">
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span>크롬 기록 삭제 시 왜 데이터가 사라지나요?</span>
            </div>
            <p className="text-[11px] text-[#5d4037] leading-relaxed">
              Chrome 브라우저에서 <strong>[인터넷 사용 기록 삭제]</strong> 시 <strong>&apos;쿠키 및 기타 사이트 데이터&apos;</strong>를 체크하면, 브라우저가 모든 웹사이트의 내부 로컬 저장소(localStorage/IndexedDB)를 비우도록 작동합니다.
            </p>
            <p className="text-[11px] text-[#5d4037] leading-relaxed">
              💡 <strong>완벽 해결책:</strong> 아래 <strong>[내 기기에 백업 파일 다운로드]</strong> 또는 <strong>[백업 코드 복사]</strong>를 해두시면, 데이터가 브라우저가 아닌 스마트폰/PC의 파일로 보관되므로 크롬 기록을 100번 지워도 언제든 1초 만에 그대로 되살릴 수 있습니다!
            </p>
          </div>

          {/* Current Data Overview */}
          <div className="p-3 rounded-xl bg-[#f2f3ff] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6] text-[18px]">inventory_2</span>
              <span className="font-semibold text-[#131b2e]">현재 보관된 데이터:</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#004ac6]">
              <span>근무 {shifts.length}건</span>
              <span>·</span>
              <span>사업장 {workplaces.length}곳</span>
              <span>·</span>
              <span>프리셋 {presets.length}개</span>
            </div>
          </div>

          {/* Action 1: File Download & Upload */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#004ac6]">download_for_offline</span>
              <span>방법 1: 내 기기에 영구 파일로 저장 (추천 ⭐⭐⭐)</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportAppData}
                className="py-3 px-3.5 rounded-2xl bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">file_download</span>
                <div className="flex flex-col text-left">
                  <span>백업 파일 다운로드 (.json)</span>
                  <span className="text-[10px] text-white/80 font-normal">스마트폰/PC 파일로 영구 저장</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-3.5 rounded-2xl bg-white hover:bg-[#eaedff] text-[#004ac6] border-2 border-[#004ac6]/30 text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                <div className="flex flex-col text-left">
                  <span>백업 파일 불러와 복원</span>
                  <span className="text-[10px] text-[#737686] font-normal">저장해둔 파일로 1초 복원</span>
                </div>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          </div>

          {/* Action 2: Text / Clipboard Backup */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#eaedff]">
            <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#006c49]">content_copy</span>
              <span>방법 2: 카카오톡/메모장 텍스트 코드로 보관</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="py-2.5 px-3 rounded-xl bg-[#6cf8bb]/20 hover:bg-[#6cf8bb]/30 text-[#006c49] border border-[#006c49]/20 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? '복사 완료!' : '백업 텍스트 복사하기'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteBox(!showPasteBox)}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#434655] border border-[#c3c6d7]/40 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>{showPasteBox ? '붙여넣기 닫기' : '텍스트 붙여넣어 복원'}</span>
              </button>
            </div>

            {showPasteBox && (
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#faf8ff] border border-[#c3c6d7]/30 mt-1 animate-in fade-in">
                <textarea
                  value={pasteCode}
                  onChange={(e) => setPasteCode(e.target.value)}
                  placeholder="복사해 두었던 백업 JSON 코드를 여기에 붙여넣으세요..."
                  className="w-full h-24 p-2.5 text-xs font-mono bg-white rounded-lg border border-[#c3c6d7] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                />
                <button
                  type="button"
                  onClick={handleRestoreFromPaste}
                  className="py-2 bg-[#004ac6] text-white rounded-lg text-xs font-bold hover:bg-[#003ea8] active:scale-95 transition-all cursor-pointer"
                >
                  입력한 코드로 복원 실행
                </button>
              </div>
            )}
          </div>

          {/* Action 3: Persistent Storage Permission */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#eaedff]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#004ac6]">lock</span>
                <span>브라우저 영구 보관 (Persistent Storage)</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isPersisted
                    ? 'bg-[#6cf8bb]/30 text-[#006c49]'
                    : 'bg-[#ffdad6]/60 text-[#ad0033]'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {isPersisted ? 'check_circle' : 'warning'}
                </span>
                <span>{isPersisted ? '활성화됨 (보호 중)' : '미활성 (권장)'}</span>
              </span>
            </div>

            <p className="text-[11px] text-[#737686] leading-snug">
              브라우저의 영구 보관 권한을 획득하면 크롬이 디스크 용량 부족 시에도 데이터를 자동으로 비우지 않도록 보호합니다.
            </p>

            {!isPersisted && (
              <button
                type="button"
                onClick={handleRequestPersist}
                className="py-2 px-3 rounded-xl bg-[#eaedff] hover:bg-[#dbe1ff] text-[#004ac6] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>영구 보관 권한 활성화 요청하기</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#eaedff] bg-[#faf8ff] flex items-center justify-end">
          <button
            type="button"
            onClick={closeDataSafetyModal}
            className="px-4 py-2 rounded-xl bg-[#131b2e] text-white text-xs font-bold hover:bg-[#283044] transition-all cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
