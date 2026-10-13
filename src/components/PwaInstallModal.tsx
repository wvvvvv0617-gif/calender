import React from 'react';
import { useShift } from '../context/ShiftContext';

export const PwaInstallModal: React.FC = () => {
  const { isPwaModalOpen, closePwaModal, triggerPwaInstall, isInstallable } = useShift();

  if (!isPwaModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-[#c3c6d7]/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#004ac6] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">install_mobile</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">핸드폰 앱으로 다운로드</h2>
              <span className="text-[10px] text-[#434655]">홈 화면에 추가하여 앱처럼 사용</span>
            </div>
          </div>
          <button
            onClick={closePwaModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737686] hover:bg-[#eaedff]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-[#131b2e]">
          <div className="p-3 rounded-2xl bg-[#eaedff] flex items-center gap-3">
            <img
              alt="ShiftMate"
              className="w-12 h-12 rounded-2xl shadow-xs"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGVvfQ-ogoFmu1BuA6gi68GDcv7UVHkfsyGZacWfbct5NFV49E1Ra1Ba8MBd5X_8mE97rm3bvIu4xClF99ySyN_a1cO2lIvNqYSfZY6MElg37KN-XTIv9n4O945Y8_G0PwbYUEU-68EaUVcK0cFWfjOafTPE9xFOXAy7CZggPE8VAojTrrVaHgaift7PtATTk29lj_IJhaE9uQSeQB23RuRF_ugnJAdhLD5rMKd8o8Z2EY-FfC5phEBA"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#131b2e]">ShiftMate (시프트메이트)</span>
              <span className="text-[#434655] text-[11px]">
                오프라인에서도 근무 기록과 급여 계산이 안전하게 자동 저장됩니다.
              </span>
            </div>
          </div>

          {/* Android Chrome button */}
          {isInstallable && (
            <button
              onClick={triggerPwaInstall}
              className="w-full py-3 px-4 rounded-2xl bg-[#004ac6] text-white text-xs font-bold shadow-md hover:bg-[#003ea8] active:scale-95 flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>지금 1초 만에 설치하기</span>
            </button>
          )}

          {/* Instructions for iOS Safari */}
          <div className="space-y-2.5 pt-1">
            <span className="font-bold text-[#004ac6] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">phone_iphone</span>
              <span>아이폰 (iOS Safari) 설치 방법</span>
            </span>
            <div className="p-3 bg-[#f2f3ff] rounded-xl space-y-1.5 text-[11px] text-[#434655]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#004ac6] text-white flex items-center justify-center text-[9px] font-bold">1</span>
                <span>사파리(Safari) 브라우저 하단의 <strong>공유 [↑] 버튼</strong>을 누릅니다.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#004ac6] text-white flex items-center justify-center text-[9px] font-bold">2</span>
                <span>메뉴에서 <strong>&lsquo;홈 화면에 추가&rsquo;</strong>를 선택합니다.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#004ac6] text-white flex items-center justify-center text-[9px] font-bold">3</span>
                <span>우측 상단의 <strong>&lsquo;추가&rsquo;</strong>를 누르면 바탕화면에 설치됩니다!</span>
              </div>
            </div>
          </div>

          {/* Instructions for Android Chrome */}
          <div className="space-y-2.5">
            <span className="font-bold text-[#006c49] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">android</span>
              <span>갤럭시 / 안드로이드 (Chrome) 설치 방법</span>
            </span>
            <div className="p-3 bg-[#f2f3ff] rounded-xl space-y-1.5 text-[11px] text-[#434655]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#006c49] text-white flex items-center justify-center text-[9px] font-bold">1</span>
                <span>크롬 브라우저 우측 상단의 <strong>더보기 [⋮] 버튼</strong>을 누릅니다.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#006c49] text-white flex items-center justify-center text-[9px] font-bold">2</span>
                <span><strong>&lsquo;앱 설치&rsquo;</strong> 또는 <strong>&lsquo;홈 화면에 추가&rsquo;</strong>를 선택합니다.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#f2f3ff] border-t border-[#eaedff] flex items-center justify-between">
          <span className="text-[10px] text-[#737686]">PWA Standalone App 지원</span>
          <button
            onClick={closePwaModal}
            className="px-4 py-1.5 rounded-xl bg-white text-xs font-bold text-[#131b2e] border border-[#c3c6d7]/30 hover:bg-[#eaedff]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
