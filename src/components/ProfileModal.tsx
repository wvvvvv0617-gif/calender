import React, { useRef, useState } from 'react';
import { useShift } from '../context/ShiftContext';

// Preset avatar icons for quick selection
const AVATAR_PRESETS = [
  { id: 'researcher', icon: '🔬', label: '연구원' },
  { id: 'engineer', icon: '💻', label: '연구/개발' },
  { id: 'cafe', icon: '☕', label: '카페/서비스' },
  { id: 'medical', icon: '🏥', label: '연구/의료' },
  { id: 'education', icon: '📚', label: '학습/교육' },
  { id: 'default', icon: '👤', label: '기본' },
];

export const ProfileModal: React.FC = () => {
  const {
    isProfileModalOpen,
    closeProfileModal,
    profileImage,
    updateProfileImage,
    resetToDefaultProfile,
    userName,
    updateUserName,
    activeWorkplace,
    currentMonth,
    shifts,
    clearShiftsByPeriod,
    showToast,
  } = useShift();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Confirmation state for shift reset
  const [resetConfirm, setResetConfirm] = useState<{
    period: 'month' | 'year' | 'all';
    label: string;
    count: number;
  } | null>(null);

  if (!isProfileModalOpen) return null;

  const [currentYear, currentMonthNum] = currentMonth.split('-');

  // Calculate counts for each reset scope
  const monthShiftsCount = shifts.filter((s) => s.date.startsWith(currentMonth)).length;
  const yearShiftsCount = shifts.filter((s) => s.date.startsWith(currentYear)).length;
  const allShiftsCount = shifts.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일(JPG, PNG, WebP 등)만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateProfileImage(result);
        showToast('프로필 사진이 성공적으로 업로드되었습니다!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectPresetAvatar = (icon: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="#eaedff"/>
      <text x="64" y="80" font-size="64" text-anchor="middle" font-family="sans-serif">${icon}</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    updateProfileImage(dataUrl);
    showToast(`프로필 아이콘이 '${icon}'으로 설정되었습니다.`);
  };

  const handleExecuteReset = () => {
    if (!resetConfirm) return;
    const count = clearShiftsByPeriod(resetConfirm.period);
    showToast(`${resetConfirm.label} 근무 기록 (총 ${count}건)이 초기화되었습니다.`);
    setResetConfirm(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-[#c3c6d7]/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6] text-[22px]">account_circle</span>
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">프로필 및 데이터 관리</h2>
              <span className="text-[11px] text-[#434655]">사진 업로드 및 근무 기록 초기화</span>
            </div>
          </div>
          <button
            onClick={closeProfileModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737686] hover:bg-[#eaedff] active:scale-95 transition-all cursor-pointer"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative group">
              <div className="w-22 h-22 rounded-full overflow-hidden border-3 border-[#004ac6]/30 shadow-md flex items-center justify-center bg-[#eaedff]">
                {profileImage ? (
                  <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#004ac6]">
                    <span className="material-symbols-outlined text-[50px]">person</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#004ac6] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                title="사진 업로드"
              >
                <span className="material-symbols-outlined text-[15px]">photo_camera</span>
              </button>
            </div>

            <span className="text-xs font-semibold text-[#131b2e]">
              {profileImage ? '커스텀 사진 적용 중' : '기본 프로필 상태'}
            </span>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Photo Action Buttons */}
            <div className="w-full flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">upload</span>
                <span>스마트폰/PC 사진 업로드</span>
              </button>

              <button
                type="button"
                onClick={resetToDefaultProfile}
                className="py-2 px-3 rounded-xl bg-[#f2f3ff] text-[#434655] hover:bg-[#ffdad6]/40 hover:text-[#ad0033] text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                기본 프로필
              </button>
            </div>
          </div>

          {/* Quick Avatar Characters */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eaedff]">
            <span className="text-[11px] font-bold text-[#434655]">추천 캐릭터/아이콘 선택</span>
            <div className="grid grid-cols-6 gap-1.5">
              {AVATAR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (p.id === 'default') {
                      resetToDefaultProfile();
                    } else {
                      handleSelectPresetAvatar(p.icon);
                    }
                  }}
                  className="py-1.5 px-1 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-90 text-base flex flex-col items-center justify-center transition-all border border-transparent hover:border-[#004ac6]/30 cursor-pointer"
                  title={p.label}
                >
                  <span>{p.icon}</span>
                  <span className="text-[9px] text-[#737686] truncate w-full text-center mt-0.5">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-1 pt-2 border-t border-[#eaedff]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#131b2e]">이름 / 연구원 닉네임</label>
              <span className="text-[10px] text-[#006c49] font-bold bg-[#6cf8bb]/40 px-1.5 py-0.2 rounded">
                입력 즉시 안전 저장
              </span>
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => updateUserName(e.target.value)}
              placeholder="근무자 또는 연구원 이름"
              className="w-full px-3 py-2 rounded-xl bg-[#f2f3ff] text-xs font-bold text-[#131b2e] border border-[#c3c6d7]/30 focus:border-[#004ac6] focus:bg-white outline-none"
            />
            <span className="text-[10px] text-[#737686]">
              현재 근무처: {activeWorkplace.name} ({activeWorkplace.role}) · 브라우저를 껐다 켜도 안전하게 유지됩니다.
            </span>
          </div>

          {/* SHIFT RESET SECTION (User requested: 이번 달, 올 해, 모든 기록 + 재차 확인 창) */}
          <div className="pt-3 border-t border-[#eaedff] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#ad0033]">
                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                <span>근무 기록 초기화</span>
              </div>
              <span className="text-[10px] text-[#737686]">총 {allShiftsCount}건 저장됨</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setResetConfirm({
                    period: 'month',
                    label: `이번 달 (${currentYear}년 ${currentMonthNum}월)`,
                    count: monthShiftsCount,
                  })
                }
                className="py-2 px-1.5 rounded-xl bg-[#f2f3ff] hover:bg-[#ffdad6]/40 text-[#434655] hover:text-[#ad0033] text-xs font-semibold border border-[#c3c6d7]/30 active:scale-95 transition-all text-center flex flex-col items-center justify-center cursor-pointer"
              >
                <span>이번 달 삭제</span>
                <span className="text-[10px] text-[#737686] mt-0.5">({monthShiftsCount}건)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setResetConfirm({
                    period: 'year',
                    label: `올 해 (${currentYear}년)`,
                    count: yearShiftsCount,
                  })
                }
                className="py-2 px-1.5 rounded-xl bg-[#f2f3ff] hover:bg-[#ffdad6]/40 text-[#434655] hover:text-[#ad0033] text-xs font-semibold border border-[#c3c6d7]/30 active:scale-95 transition-all text-center flex flex-col items-center justify-center cursor-pointer"
              >
                <span>올 해 삭제</span>
                <span className="text-[10px] text-[#737686] mt-0.5">({yearShiftsCount}건)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setResetConfirm({
                    period: 'all',
                    label: '모든 기록 전체',
                    count: allShiftsCount,
                  })
                }
                className="py-2 px-1.5 rounded-xl bg-[#ffdad6]/50 hover:bg-[#ffdad6] text-[#ad0033] text-xs font-bold border border-[#ad0033]/30 active:scale-95 transition-all text-center flex flex-col items-center justify-center cursor-pointer"
              >
                <span>전체 초기화</span>
                <span className="text-[10px] text-[#ad0033]/80 mt-0.5">({allShiftsCount}건)</span>
              </button>
            </div>

            {/* Double Confirmation Box */}
            {resetConfirm && (
              <div className="p-3.5 rounded-2xl bg-[#ffdadb]/50 border border-[#ad0033]/30 animate-in fade-in flex flex-col gap-2 mt-1">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#ad0033] text-[18px] shrink-0 mt-0.5">
                    warning
                  </span>
                  <div className="flex flex-col text-xs leading-relaxed">
                    <span className="font-bold text-[#ad0033]">
                      정말 [{resetConfirm.label}] 근무 기록을 삭제하시겠습니까?
                    </span>
                    <span className="text-[11px] text-[#434655] mt-0.5">
                      삭제 대상: 총 <strong>{resetConfirm.count}건</strong>의 근무 기록이 영구 삭제되며 복구할 수 없습니다.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#ad0033]/20">
                  <button
                    type="button"
                    onClick={() => setResetConfirm(null)}
                    className="px-3 py-1.5 rounded-xl bg-white text-xs font-semibold text-[#131b2e] border border-[#c3c6d7]/40 hover:bg-[#eaedff] active:scale-95 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteReset}
                    className="px-3.5 py-1.5 rounded-xl bg-[#ad0033] text-white text-xs font-bold shadow-xs hover:bg-[#8e0029] active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                    <span>네, 삭제합니다</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#f2f3ff] border-t border-[#eaedff] flex items-center justify-end">
          <button
            type="button"
            onClick={closeProfileModal}
            className="px-5 py-2 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
