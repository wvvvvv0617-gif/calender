import React, { useState, useEffect, useRef } from 'react';
import { useShift } from '../context/ShiftContext';
import { formatKRW } from '../utils/calculations';
import { PaydayOption, Workplace } from '../types';
import { WORKPLACE_ICON_CATEGORIES } from '../utils/sampleData';
import { useLongPress } from '../utils/useLongPress';
import { DeleteWorkplaceModal } from './DeleteWorkplaceModal';

interface WorkplaceSettingsCardProps {
  wp: Workplace;
  isActive: boolean;
  onSelect: () => void;
  onLongPressDelete: (wp: Workplace) => void;
}

const WorkplaceSettingsCard: React.FC<WorkplaceSettingsCardProps> = ({
  wp,
  isActive,
  onSelect,
  onLongPressDelete,
}) => {
  const bind = useLongPress({
    threshold: 480,
    onLongPress: () => {
      onLongPressDelete(wp);
    },
    onClick: () => {
      onSelect();
    },
  });

  return (
    <div
      {...bind}
      className={`group relative p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
        isActive
          ? 'bg-[#eaedff] border-[#004ac6] shadow-xs ring-1 ring-[#004ac6]/30'
          : 'bg-white border-[#c3c6d7]/40 hover:border-[#004ac6]/40 hover:bg-[#faf8ff]'
      }`}
      title="터치하여 선택 · 꾹(길게) 누르면 삭제"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-xs border border-[#c3c6d7]/30 shrink-0">
            {wp.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[#131b2e] truncate">{wp.name}</span>
              {isActive && (
                <span className="text-[10px] font-extrabold bg-[#004ac6] text-white px-1.5 py-0.2 rounded-md">
                  선택됨
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#434655] mt-0.5">
              {wp.role} · {wp.hourlyWage.toLocaleString()}원
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLongPressDelete(wp);
          }}
          className="p-1.5 rounded-lg hover:bg-[#ffdad6] text-[#737686] hover:text-[#ba1a1a] transition-all shrink-0 cursor-pointer"
          title="근무처 삭제 (길게 눌러도 삭제)"
          aria-label={`${wp.name} 삭제`}
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>

      <div className="mt-2 pt-2 border-t border-[#c3c6d7]/20 flex items-center justify-between text-[10px] text-[#737686]">
        <span className="flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[12px] text-[#004ac6]">touch_app</span>
          <span>꾹 눌러 삭제</span>
        </span>
        <span className="font-semibold text-[#004ac6]">
          {isActive ? '✓ 현재 적용 중' : '터치하여 전환'}
        </span>
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const {
    activeWorkplace,
    updateWorkplace,
    workplaces,
    addNewWorkplace,
    setActiveWorkplaceId,
    presets,
    openPresetModal,
    deletePreset,
    paydayOption,
    setPaydayOption,
    taxOption,
    setTaxOption,
    holidayPayOption,
    setHolidayPayOption,
    minimumWages,
    addMinimumWageRate,
    openPdfModal,
    openPwaModal,
    loadSampleData,
    clearAllShifts,
    showToast,
    profileImage,
    userName,
    updateUserName,
    exportAppData,
    importAppData,
    openProfileModal,
    resetToDefaultProfile,
    openWorkplaceModal,
    openTermsModal,
    openDataSafetyModal,
    isGoogleDriveConnected,
    googleUser,
    lastDriveSyncTime,
  } = useShift();

  const [inputUserName, setInputUserName] = useState(userName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputUserName(userName);
  }, [userName]);

  const [isEditingWorkplace, setIsEditingWorkplace] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(activeWorkplace.icon);
  const [wpName, setWpName] = useState(activeWorkplace.name);
  const [wpRole, setWpRole] = useState(activeWorkplace.role);
  const [wpWage, setWpWage] = useState(String(activeWorkplace.hourlyWage));
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  // Keep workplace form synced with activeWorkplace
  useEffect(() => {
    setSelectedIcon(activeWorkplace.icon);
    setWpName(activeWorkplace.name);
    setWpRole(activeWorkplace.role);
    setWpWage(String(activeWorkplace.hourlyWage));
  }, [activeWorkplace]);

  const handleSaveUserName = () => {
    const trimmed = inputUserName.trim();
    if (!trimmed) {
      showToast('⚠️ 이름을 1글자 이상 입력해 주세요.');
      return;
    }
    updateUserName(trimmed);
    showToast(`이름이 '${trimmed}'(으)로 안전하게 저장되었습니다.`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importAppData(content);
      }
    };
    reader.onerror = () => {
      showToast('⚠️ 파일을 읽는 도중 오류가 발생했습니다.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Workplace Long-Press Delete Modal State
  const [wpToDelete, setWpToDelete] = useState<Workplace | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenDelete = (wp: Workplace) => {
    setWpToDelete(wp);
    setIsDeleteModalOpen(true);
  };

  // Notification states (D-1 as requested)
  const [shiftAlert, setShiftAlert] = useState(true);
  const [paydayAlert, setPaydayAlert] = useState(true);

  // New year minimum wage dialog
  const [isAddingWageYear, setIsAddingWageYear] = useState(false);
  const [newWageYear, setNewWageYear] = useState(2027);
  const [newWageAmount, setNewWageAmount] = useState(10650);

  const handleSaveWorkplace = () => {
    const numWage = parseInt(wpWage.replace(/,/g, ''), 10) || 10320;
    updateWorkplace({
      icon: customEmojiInput.trim() || selectedIcon,
      name: wpName.trim() || '연구소 및 사업장',
      role: wpRole.trim() || '연구원',
      hourlyWage: numWage,
    });
    setIsEditingWorkplace(false);
    showToast('근무지 정보가 성공적으로 반영되었습니다.');
  };

  const handleAddWorkplacePrompt = () => {
    openWorkplaceModal('create');
  };

  const handleSaveNewMinimumWage = () => {
    if (newWageYear && newWageAmount) {
      addMinimumWageRate({
        year: Number(newWageYear),
        wage: Number(newWageAmount),
        label: `${newWageYear}년 ${newWageAmount.toLocaleString()}원`,
      });
      setIsAddingWageYear(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Workplace,Date,Type,Name,Hours,Wage,Total\n' +
      `${activeWorkplace.name},2026-10-13,Work,연구실근무,8,${activeWorkplace.hourlyWage},${activeWorkplace.hourlyWage * 8}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shiftmate_payroll_${activeWorkplace.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('엑셀(CSV) 파일이 다운로드되었습니다.');
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-28 md:pb-12 max-w-4xl mx-auto px-4 md:px-6 pt-2">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-[#004ac6] tracking-wider uppercase">
            SETTINGS &amp; RULES
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-[#131b2e]">근무처 및 급여 정산 설정</h1>
          <p className="text-xs text-[#434655] mt-0.5">
            연구원 및 다양한 직종의 정확한 주휴수당과 실수령액 계산 맞춤 기준
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#004ac6] shadow-xs shrink-0">
          <span className="material-symbols-outlined text-[22px]">tune</span>
        </div>
      </div>

      {/* User Profile Section with Direct Name/Nickname Editor */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative cursor-pointer" onClick={openProfileModal} title="사진 변경">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userName}
                  className="w-13 h-13 rounded-2xl object-cover ring-2 ring-[#004ac6]/30 shadow-xs"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center text-2xl border border-[#c3c6d7]/40 shadow-xs">
                  <span className="material-symbols-outlined text-[30px]">person</span>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#004ac6] text-white flex items-center justify-center shadow-xs text-[11px]">
                📷
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-[#131b2e]">{userName}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#eaedff] text-[#004ac6]">
                  {profileImage ? '커스텀 사진' : '기본 프로필'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#e8f5e9] text-[#2e7d32]">
                  안전 저장 활성화됨
                </span>
              </div>
              <p className="text-xs text-[#434655] mt-0.5">
                현재 선택된 근무처: <strong>{activeWorkplace.name}</strong> ({activeWorkplace.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {profileImage && (
              <button
                type="button"
                onClick={resetToDefaultProfile}
                className="px-2.5 py-1.5 rounded-xl bg-[#f2f3ff] hover:bg-[#ffdad6]/40 text-[#ad0033] text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                기본으로
              </button>
            )}
            <button
              type="button"
              onClick={openProfileModal}
              className="px-3 py-1.5 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">upload</span>
              <span>사진/캐릭터 설정</span>
            </button>
          </div>
        </div>

        {/* Direct Name / Nickname Input Field */}
        <div className="pt-3 border-t border-[#c3c6d7]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#f8f9ff] p-3 rounded-xl border border-[#004ac6]/15">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px] text-[#004ac6]">badge</span>
              <span>이름 / 연구원 닉네임</span>
            </label>
            <span className="text-[11px] text-[#737686]">
              근무일지, 달력, 급여명세서에 표기되며 브라우저 종료 후 재접속 시에도 유지됩니다.
            </span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <input
              type="text"
              value={inputUserName}
              onChange={(e) => setInputUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveUserName();
              }}
              placeholder="예: 홍길동 연구원, 매니저"
              className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-[#131b2e] border border-[#c3c6d7]/50 focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] outline-none w-44 sm:w-52 shadow-2xs"
            />
            <button
              type="button"
              onClick={handleSaveUserName}
              className="px-3.5 py-1.5 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">save</span>
              <span>저장</span>
            </button>
          </div>
        </div>
      </section>

      {/* Workplace Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#131b2e]">등록된 근무처 목록</h2>
            <p className="text-[11px] text-[#434655]">
              근무처를 터치하여 전환하고, <strong>꾹(길게) 누르면 삭제</strong>할 수 있습니다.
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#006c49] bg-[#6cf8bb]/40 px-2.5 py-0.5 rounded-full shrink-0">
            {workplaces.length}개 등록됨
          </span>
        </div>

        {/* Workplace Grid (Tap to switch, Long-press to delete) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {workplaces.map((wp) => (
            <WorkplaceSettingsCard
              key={wp.id}
              wp={wp}
              isActive={wp.id === activeWorkplace.id}
              onSelect={() => {
                setActiveWorkplaceId(wp.id);
                showToast(`'${wp.name}' 근무처로 변경되었습니다.`);
              }}
              onLongPressDelete={handleOpenDelete}
            />
          ))}
        </div>

        <div className="pt-1 flex items-center justify-between">
          <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#004ac6]">tune</span>
            <span>선택된 &lsquo;{activeWorkplace.name}&rsquo; 시급 및 세부 설정</span>
          </span>
        </div>

        {/* Active Workplace Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#eaedff] flex items-center justify-center text-2xl border border-[#c3c6d7]/40 shadow-xs">
                  {activeWorkplace.icon}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingWorkplace(!isEditingWorkplace)}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#004ac6] text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                  aria-label="아이콘 변경"
                >
                  <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-[#131b2e] truncate">
                    {activeWorkplace.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#dbe1ff] text-[#004ac6]">
                    기본
                  </span>
                </div>
                <p className="text-xs text-[#434655] mt-0.5">{activeWorkplace.role}</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingWorkplace(!isEditingWorkplace)}
              className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#004ac6] text-xs font-semibold active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>정보 수정</span>
            </button>
          </div>

          {/* Wage Detail Grid with 2026 Standard & Future Years */}
          <div className="p-3.5 rounded-xl bg-[#f2f3ff] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-[#434655]">적용 기본시급 설정</span>
                <div className="flex items-center gap-1 text-[#006c49] text-[11px] font-semibold mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span>2026 최저(10,320원) 대비 {activeWorkplace.hourlyWage >= 10320 ? `+${activeWorkplace.hourlyWage - 10320}원` : `${activeWorkplace.hourlyWage - 10320}원`}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-xl border border-[#c3c6d7]/40 shadow-xs">
                <input
                  type="text"
                  value={activeWorkplace.hourlyWage.toLocaleString()}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                    updateWorkplace({ hourlyWage: val });
                  }}
                  className="w-20 text-right text-base font-bold text-[#004ac6] bg-transparent outline-none"
                  aria-label="시급 직접 입력"
                />
                <span className="text-xs font-semibold text-[#131b2e]">원</span>
              </div>
            </div>

            {/* Dynamic Legal Minimum Wages List */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#c3c6d7]/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#434655]">
                  법정 최저시급 연도별 원클릭 적용
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingWageYear(true)}
                  className="text-[11px] text-[#004ac6] font-bold hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[13px]">add</span>
                  <span>연도별 최저시급 추가</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {minimumWages.map((item) => (
                  <button
                    key={item.year}
                    type="button"
                    onClick={() => {
                      updateWorkplace({ hourlyWage: item.wage });
                      showToast(`${item.year}년 최저시급 (${item.wage.toLocaleString()}원)이 적용되었습니다.`);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all ${
                      item.year === 2026
                        ? 'bg-[#dbe1ff] text-[#004ac6] ring-1 ring-[#004ac6]'
                        : 'bg-white hover:bg-[#eaedff] text-[#131b2e] border border-[#c3c6d7]/30'
                    }`}
                  >
                    <span>{item.year}년</span>
                    <span>{formatKRW(item.wage)}원</span>
                    {item.year === 2026 && (
                      <span className="bg-[#004ac6] text-white text-[9px] px-1 py-0.2 rounded font-bold">
                        현재
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Add New Minimum Wage Year Modal Popup */}
              {isAddingWageYear && (
                <div className="p-3 bg-white rounded-xl border border-[#004ac6]/30 shadow-sm mt-1 space-y-2">
                  <div className="text-xs font-bold text-[#131b2e]">새 연도 최저시급 등록</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#737686]">적용 연도</span>
                      <input
                        type="number"
                        value={newWageYear}
                        onChange={(e) => setNewWageYear(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs border rounded bg-[#f2f3ff]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#737686]">시간당 최저시급 (원)</span>
                      <input
                        type="number"
                        value={newWageAmount}
                        onChange={(e) => setNewWageAmount(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs border rounded bg-[#f2f3ff]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingWageYear(false)}
                      className="px-2.5 py-1 text-xs text-[#737686]"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewMinimumWage}
                      className="px-3 py-1 bg-[#004ac6] text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      등록하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center justify-between pt-1 border-t border-[#eaedff]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006c49] bg-[#6cf8bb]/40 px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[13px]">check_circle</span> 주휴수당 자동적용
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#434655] bg-[#eaedff] px-2 py-0.5 rounded">
                {taxOption === 'freelance' ? '3.3% 원천징수' : '4대보험 요율'}
              </span>
            </div>
            <button
              onClick={() => setIsEditingWorkplace(!isEditingWorkplace)}
              className="text-xs font-semibold text-[#004ac6] hover:underline flex items-center"
              type="button"
            >
              수정 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Rich Workplace & Researcher Icon Editor Drawer */}
        {isEditingWorkplace && (
          <div className="bg-white rounded-2xl p-4 border border-[#004ac6]/30 shadow-sm flex flex-col gap-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaedff]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#004ac6] text-[18px]">storefront</span>
                <span className="text-xs font-bold text-[#131b2e]">
                  근무지 정보 &amp; 연구원/직종 아이콘 선택
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#006c49] bg-[#6cf8bb]/40 px-2 py-0.5 rounded">
                실시간 저장
              </span>
            </div>

            {/* Categorized Icons with Science / Researcher Focus */}
            <div className="space-y-3">
              {WORKPLACE_ICON_CATEGORIES.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <span className="text-[11px] font-bold text-[#004ac6] block">
                    {cat.category}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {cat.icons.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setSelectedIcon(opt.icon);
                          setCustomEmojiInput('');
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs flex items-center justify-start gap-2 active:scale-95 transition-all text-left min-w-0 ${
                          selectedIcon === opt.icon && !customEmojiInput
                            ? 'bg-[#dbe1ff] border border-[#004ac6] text-[#004ac6] font-bold shadow-xs'
                            : 'bg-[#f2f3ff] hover:bg-[#eaedff] text-[#434655]'
                        }`}
                      >
                        <span className="text-base shrink-0">{opt.icon}</span>
                        <span className="text-[11px] font-medium break-keep leading-tight">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Direct Emoji Input */}
              <div className="flex items-center gap-2 pt-1">
                <label className="text-[11px] font-semibold text-[#434655] shrink-0">
                  직접 이모지 입력:
                </label>
                <input
                  type="text"
                  placeholder="예: 🚀, 🔭, 🧪"
                  value={customEmojiInput}
                  onChange={(e) => {
                    setCustomEmojiInput(e.target.value);
                    if (e.target.value.trim()) setSelectedIcon(e.target.value.trim());
                  }}
                  className="w-24 px-2 py-1 text-xs border rounded-lg bg-[#f2f3ff]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 pt-1">
              <label className="text-xs font-semibold text-[#434655]">근무처 이름</label>
              <input
                type="text"
                value={wpName}
                onChange={(e) => setWpName(e.target.value)}
                placeholder="근무처 이름을 입력하세요 (예: 한국화학연구원, 카카오 R&D, 카페 소라)"
                className="w-full px-3 py-2 rounded-xl bg-[#f2f3ff] text-xs text-[#131b2e] border border-[#c3c6d7]/30 focus:border-[#004ac6] focus:bg-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#434655]">직무 및 파트</label>
              <input
                type="text"
                value={wpRole}
                onChange={(e) => setWpRole(e.target.value)}
                placeholder="예: 선임연구원 / 연구보조원 / 파트타임"
                className="w-full px-3 py-2 rounded-xl bg-[#f2f3ff] text-xs text-[#131b2e] border border-[#c3c6d7]/30 focus:border-[#004ac6] focus:bg-white outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setIsEditingWorkplace(false)}
                className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] text-xs font-semibold text-[#131b2e]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveWorkplace}
                className="px-4 py-1.5 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>저장 완료</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleAddWorkplacePrompt}
          className="w-full py-2.5 px-4 rounded-2xl bg-[#eaedff] hover:bg-[#dbe1ff] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 text-[#004ac6] text-xs font-bold"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>새로운 연구실/알바/근무처 추가</span>
        </button>
      </section>

      {/* Mobile Download PWA & HTML Shortcut Banner */}
      <section className="bg-gradient-to-r from-[#dbe1ff] via-[#eaedff] to-[#6cf8bb]/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs border border-[#c3c6d7]/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">install_mobile</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#131b2e] truncate">
              홈 화면에 앱 추가 & 바로가기 사이트 접속
            </span>
            <span className="text-[11px] text-[#434655] truncate">
              스마트폰 PWA 설치, 바로가기 HTML 다운로드 및 사이트 직접 연결
            </span>
          </div>
        </div>
        <button
          onClick={openPwaModal}
          className="shrink-0 px-3.5 py-2 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 transition-all cursor-pointer"
        >
          설치 & 바로가기
        </button>
      </section>

      {/* Payroll & Calculation Rules Section */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#004ac6] text-[20px]">calculate</span>
            <h2 className="text-sm font-bold text-[#131b2e]">급여 및 수당 정산 규칙</h2>
          </div>
          <button
            onClick={() => showToast('2026년 최저임금 10,320원 및 주휴수당 기준 안내')}
            className="text-xs text-[#004ac6] flex items-center gap-0.5 font-medium"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">info</span> 규정안내
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3.5">
          {/* Payday Selection */}
          <div>
            <label className="block text-xs font-bold text-[#131b2e] mb-1.5">급여 지급일</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([1, 5, 10, 15, 25, 'last'] as PaydayOption[]).map((day) => {
                const isSelected = paydayOption === day;
                const label = day === 'last' ? '매월 말일' : `매월 ${day}일`;
                return (
                  <button
                    key={String(day)}
                    type="button"
                    onClick={() => {
                      setPaydayOption(day);
                      showToast(`급여일이 ${label}로 설정되었습니다.`);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#004ac6] text-white font-bold shadow-xs'
                        : 'bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff]'
                    }`}
                  >
                    {label} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly Holiday Pay Rules */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-[#131b2e]">주휴수당 산정 방식</label>
                <span className="text-[10px] bg-[#6cf8bb]/40 text-[#00714d] px-1.5 py-0.2 rounded font-bold">
                  근로기준법
                </span>
              </div>
              <span className="text-[11px] text-[#434655]">주 15시간 이상 근무 시</span>
            </div>

            <div className="space-y-1.5">
              <label
                onClick={() => setHolidayPayOption('auto')}
                className={`flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-colors ${
                  holidayPayOption === 'auto'
                    ? 'bg-[#eaedff] border border-[#004ac6]/30'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff]'
                }`}
              >
                <input
                  type="radio"
                  name="holidayPayRule"
                  checked={holidayPayOption === 'auto'}
                  onChange={() => setHolidayPayOption('auto')}
                  className="mt-0.5 text-[#004ac6]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#131b2e]">
                      자동 계산 (법정 산식 적용)
                    </span>
                    <span className="text-[10px] text-[#004ac6] font-bold">추천</span>
                  </div>
                  <p className="text-[11px] text-[#434655] mt-0.5">
                    (1주일 총 근로시간 ÷ 40시간) × 8 × 시급 (최대 8시간 한도)
                  </p>
                </div>
              </label>

              <label
                onClick={() => setHolidayPayOption('none')}
                className={`flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-colors ${
                  holidayPayOption === 'none'
                    ? 'bg-[#eaedff] border border-[#004ac6]/30'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff]'
                }`}
              >
                <input
                  type="radio"
                  name="holidayPayRule"
                  checked={holidayPayOption === 'none'}
                  onChange={() => setHolidayPayOption('none')}
                  className="mt-0.5 text-[#004ac6]"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-[#131b2e]">
                    미적용 또는 시급에 포함 계약
                  </span>
                  <p className="text-[11px] text-[#434655] mt-0.5">
                    계약상 주휴수당이 기본시급에 이미 산입되어 있거나 주휴 미지급 사업장일 때 사용합니다.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Tax Option Selection */}
          <div>
            <label className="block text-xs font-bold text-[#131b2e] mb-1.5">세금 공제 기본값</label>
            <div className="space-y-1.5">
              <label
                onClick={() => setTaxOption('freelance')}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                  taxOption === 'freelance'
                    ? 'bg-[#eaedff] border border-[#004ac6]/30'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="taxSetting"
                    checked={taxOption === 'freelance'}
                    onChange={() => setTaxOption('freelance')}
                    className="text-[#004ac6]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#131b2e]">3.3% 사업소득세 원천징수</span>
                    <p className="text-[11px] text-[#434655]">일반 아르바이트 및 프리랜서 소득세율</p>
                  </div>
                </div>
                {taxOption === 'freelance' && (
                  <span className="text-[10px] font-bold bg-[#dbe1ff] text-[#004ac6] px-2 py-0.5 rounded">
                    선택됨
                  </span>
                )}
              </label>

              <label
                onClick={() => setTaxOption('insurance')}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                  taxOption === 'insurance'
                    ? 'bg-[#eaedff] border border-[#004ac6]/30'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="taxSetting"
                    checked={taxOption === 'insurance'}
                    onChange={() => setTaxOption('insurance')}
                    className="text-[#004ac6]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#131b2e]">4대 사회보험 적용</span>
                    <p className="text-[11px] text-[#434655]">
                      국민연금, 건강보험, 고용보험 (월 60h 이상)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[#737686]">약 ~9.4%</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Preset Templates Management */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#006c49] text-[20px]">bookmark</span>
            <h2 className="text-sm font-bold text-[#131b2e]">내 근무 템플릿 프리셋</h2>
          </div>
          <button
            onClick={() => openPresetModal()}
            className="text-xs font-bold text-[#004ac6] hover:underline"
            type="button"
          >
            + 새 프리셋
          </button>
        </div>

        <div className="space-y-1.5">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#c3c6d7]/30 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-lg shrink-0">
                  {preset.emoji || '⚡️'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#131b2e] truncate">{preset.name}</span>
                    <span className="text-[10px] text-[#434655] bg-[#f2f3ff] px-1.5 py-0.2 rounded font-medium">
                      {preset.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#737686] mt-0.5">
                    {preset.startTime} ~ {preset.endTime} (휴게 {preset.breakMinutes}분)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openPresetModal(preset)}
                  className="p-1.5 text-[#737686] hover:text-[#004ac6] active:scale-90"
                  aria-label="프리셋 수정"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="p-1.5 text-[#737686] hover:text-[#ad0033] active:scale-90"
                  aria-label="프리셋 삭제"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Smart Notifications - D-1 update */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-[#131b2e]">스마트 알림 설정</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#dbe1ff] flex items-center justify-center text-[#004ac6] shrink-0">
                <span className="material-symbols-outlined text-[20px]">alarm</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#131b2e]">근무 시작 30분 전 알림</span>
                <p className="text-[11px] text-[#434655]">출근 전 스케줄 리마인더와 출근 탭 알림</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShiftAlert(!shiftAlert);
                showToast(shiftAlert ? '출근 전 알림이 해제되었습니다.' : '출근 30분 전 알림이 켜졌습니다.');
              }}
              className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                shiftAlert ? 'bg-[#004ac6]' : 'bg-[#e2e7ff]'
              }`}
              type="button"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                  shiftAlert ? 'ml-auto' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#eaedff]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#6cf8bb]/40 flex items-center justify-center text-[#006c49] shrink-0">
                <span className="material-symbols-outlined text-[20px]">celebration</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#131b2e]">급여일 D-1 정산 알림</span>
                <p className="text-[11px] text-[#434655]">지급일 1일 전 확정 실수령액과 명세서 요약 확인</p>
              </div>
            </div>
            <button
              onClick={() => {
                setPaydayAlert(!paydayAlert);
                showToast(paydayAlert ? '급여일 알림이 해제되었습니다.' : '급여일 D-1 알림이 설정되었습니다.');
              }}
              className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                paydayAlert ? 'bg-[#004ac6]' : 'bg-[#e2e7ff]'
              }`}
              type="button"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                  paydayAlert ? 'ml-auto' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Data Management, Backup, and Sample Controls */}
      <section className="bg-[#f2f3ff] rounded-2xl p-4 flex flex-col gap-3.5 border border-[#c3c6d7]/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#131b2e]">데이터 영구 보관 &amp; 클라우드 동기화</span>
          <span className="text-[11px] text-[#004ac6] font-bold flex items-center gap-1 bg-[#dbe1ff] px-2 py-0.5 rounded">
            <span className="material-symbols-outlined text-[13px]">cloud_sync</span>
            <span>{isGoogleDriveConnected ? 'Google Drive 연동 중' : 'Google Drive 지원'}</span>
          </span>
        </div>

        {/* Google Drive Status Banner */}
        <div className="p-3.5 rounded-xl bg-linear-to-r from-[#eff3ff] to-white border-2 border-[#004ac6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">cloud</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#131b2e]">구글 드라이브 무료 자동 동기화</span>
                {isGoogleDriveConnected ? (
                  <span className="text-[10px] font-bold bg-[#6cf8bb]/40 text-[#006c49] px-1.5 py-0.2 rounded-md">
                    연결됨
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-[#ffdad6]/60 text-[#ad0033] px-1.5 py-0.2 rounded-md">
                    미연결
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#434655] mt-0.5 truncate">
                {isGoogleDriveConnected
                  ? `${googleUser?.email || '구글 계정'} 연동 완료 · 크롬 기록삭제에도 영구 보존`
                  : '구글 계정(Gmail)만 있으면 100% 무료로 크롬 기록삭제에도 영구 보존됩니다.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openDataSafetyModal}
            className="py-2 px-3.5 bg-[#004ac6] hover:bg-[#003ea8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isGoogleDriveConnected ? 'sync' : 'link'}
            </span>
            <span>{isGoogleDriveConnected ? '드라이브 동기화 관리' : '구글 드라이브 연결'}</span>
          </button>
        </div>

        {/* Chrome Clear Explanation Notice */}
        <div className="p-3.5 rounded-xl bg-white border border-[#004ac6]/20 flex flex-col gap-2 text-xs shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#004ac6]">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>Chrome 기록 삭제와 데이터 보존 안내</span>
            </div>
            <button
              type="button"
              onClick={openDataSafetyModal}
              className="text-[11px] font-bold text-[#006c49] bg-[#6cf8bb]/30 hover:bg-[#6cf8bb]/50 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>상세 보관소 열기</span>
            </button>
          </div>
          <p className="text-[11px] text-[#434655] leading-relaxed">
            Chrome 브라우저에서 <strong>[인터넷 사용 기록 삭제(쿠키 및 사이트 데이터)]</strong>를 실행하면 브라우저 정책상 로컬 저장소가 비워집니다. PWA 앱도 브라우저의 저장 엔진을 사용하므로, 중요한 기록을 영구 보관하려면 아래 <strong>[데이터 백업 파일 다운로드]</strong>를 통해 스마트폰 또는 PC에 백업 파일을 저장해 두세요. 기록이 초기화되어도 <strong>[백업 복원]</strong> 버튼을 누르면 1초 만에 그대로 되살아납니다!
          </p>
        </div>

        {/* Real Backup & Restore Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={exportAppData}
            className="py-2.5 px-3 bg-[#004ac6] hover:bg-[#003ea8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>데이터 백업 (JSON 파일 다운로드)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 bg-white hover:bg-[#eaedff] text-[#004ac6] border border-[#004ac6]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">file_upload</span>
            <span>백업 복원 (JSON 파일 불러오기)</span>
          </button>

          {/* Hidden File Input for Backup Restore */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json,application/json"
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportCSV}
            className="py-2 px-3 bg-white hover:bg-[#eaedff] text-[#131b2e] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006c49]">table_view</span>
            <span>엑셀(CSV) 다운</span>
          </button>

          <button
            onClick={() => openPdfModal('timesheet')}
            className="py-2 px-3 bg-white hover:bg-[#eaedff] text-[#ad0033] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>근무 캘린더 PDF 출력</span>
          </button>
        </div>

        {/* Sample Data & Reset Controls */}
        <div className="pt-2 border-t border-[#c3c6d7]/30 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={loadSampleData}
            className="px-3 py-1.5 rounded-xl bg-white text-[#004ac6] text-xs font-bold border border-[#004ac6]/30 hover:bg-[#eaedff] shadow-xs active:scale-95 transition-all"
          >
            샘플 데이터 불러오기
          </button>
          <button
            onClick={() => {
              if (confirm('모든 근무 기록을 초기화하시겠습니까?')) {
                clearAllShifts();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-white text-[#ad0033] text-xs font-bold border border-[#ad0033]/30 hover:bg-[#ffdad6]/40 shadow-xs active:scale-95 transition-all"
          >
            근무 기록 비우기
          </button>
        </div>

        <div className="pt-1 flex items-center justify-between text-[11px] text-[#737686]">
          <span>ShiftMate Core v2.6.0 (2026 근로기준법 개정 반영)</span>
          <button
            type="button"
            onClick={openTermsModal}
            className="text-[#004ac6] cursor-pointer hover:underline font-semibold"
          >
            이용약관 및 정책 보기
          </button>
        </div>
      </section>

      {/* Workplace Long-Press Delete Modal */}
      <DeleteWorkplaceModal
        workplace={wpToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
