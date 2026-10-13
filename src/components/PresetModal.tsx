import React, { useState, useEffect, useMemo } from 'react';
import { useShift } from '../context/ShiftContext';
import { Preset, PresetBadge, PresetBadgeTheme } from '../types';
import { formatKRW, calculateShiftMinutes } from '../utils/calculations';
import { PRESET_COLOR_PALETTES, COLOR_THEME_KEYS } from '../utils/themeColors';

export const PresetModal: React.FC = () => {
  const {
    isPresetModalOpen,
    closePresetModal,
    editingPreset,
    addPreset,
    updatePreset,
    activeWorkplace,
    showToast,
  } = useShift();

  const [mode, setMode] = useState<'work' | 'leave'>('work');
  const [name, setName] = useState('');
  const [badge, setBadge] = useState<PresetBadge>('오픈');
  const [badgeTheme, setBadgeTheme] = useState<PresetBadgeTheme>('purple');
  const [colorTheme, setColorTheme] = useState<PresetBadgeTheme>('purple');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [rateType, setRateType] = useState<'default' | 'custom'>('default');
  const [customWage, setCustomWage] = useState<number>(activeWorkplace.hourlyWage);
  const [showInQuickBar, setShowInQuickBar] = useState(true);

  useEffect(() => {
    if (editingPreset) {
      setName(editingPreset.name);
      setBadge(editingPreset.badge);
      setBadgeTheme(editingPreset.badgeTheme);
      setColorTheme(editingPreset.colorTheme || editingPreset.badgeTheme || 'purple');
      setStartTime(editingPreset.startTime);
      setEndTime(editingPreset.endTime);
      setBreakMinutes(editingPreset.breakMinutes);
      setRateType(editingPreset.hourlyRateType);
      setCustomWage(editingPreset.customHourlyWage || activeWorkplace.hourlyWage);
      setShowInQuickBar(editingPreset.showInQuickBar ?? true);
      setMode(editingPreset.badge === '휴무' ? 'leave' : 'work');
    } else {
      setName('연구실 주간 근무');
      setBadge('오픈');
      setBadgeTheme('purple');
      setColorTheme('purple');
      setStartTime('09:00');
      setEndTime('18:00');
      setBreakMinutes(60);
      setRateType('default');
      setCustomWage(activeWorkplace.hourlyWage);
      setShowInQuickBar(true);
      setMode('work');
    }
  }, [editingPreset, activeWorkplace.hourlyWage, isPresetModalOpen]);

  // Quick suggestions including researcher lab presets
  const quickSuggestions = [
    { label: '🔬 연구실 주간', theme: 'purple' as const, badge: '오픈' as const, start: '09:00', end: '18:00', breakMin: 60 },
    { label: '🧪 실험실 오후', theme: 'teal' as const, badge: '미들' as const, start: '13:00', end: '19:00', breakMin: 30 },
    { label: '☕️ 평일 오픈', theme: 'emerald' as const, badge: '오픈' as const, start: '09:00', end: '14:00', breakMin: 30 },
    { label: '🌙 마감 풀타임', theme: 'indigo' as const, badge: '마감' as const, start: '18:00', end: '23:30', breakMin: 30 },
    { label: '⚡️ 주말 특근', theme: 'amber' as const, badge: '풀타임' as const, start: '10:00', end: '18:00', breakMin: 60 },
  ];

  // Live estimated wage calculation for this preset
  const shiftTime = useMemo(() => {
    return calculateShiftMinutes(startTime, endTime, breakMinutes);
  }, [startTime, endTime, breakMinutes]);

  const workedHours = shiftTime.workedMinutes / 60;
  const nightHours = shiftTime.nightMinutes / 60;
  const activeRate = rateType === 'custom' ? customWage : activeWorkplace.hourlyWage;

  const estimatedWage = useMemo(() => {
    let base = Math.round(workedHours * activeRate);
    let night = badge === '마감' && nightHours > 0 ? Math.round(nightHours * activeRate * 0.5) : 0;
    return base + night;
  }, [workedHours, activeRate, badge, nightHours]);

  if (!isPresetModalOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      showToast('프리셋 명칭을 입력해주세요.');
      return;
    }

    const presetData: Omit<Preset, 'id'> = {
      name: name.trim(),
      iconName:
        colorTheme === 'purple'
          ? 'science'
          : badge === '마감'
          ? 'dark_mode'
          : badge === '오픈'
          ? 'wb_sunny'
          : 'routine',
      emoji:
        colorTheme === 'purple'
          ? '🔬'
          : badge === '오픈'
          ? '☕️'
          : badge === '미들'
          ? '🥪'
          : badge === '마감'
          ? '🧁'
          : badge === '풀타임'
          ? '⚡️'
          : '🏖',
      badge,
      badgeTheme: colorTheme,
      colorTheme: colorTheme,
      startTime: mode === 'leave' ? '00:00' : startTime,
      endTime: mode === 'leave' ? '00:00' : endTime,
      breakMinutes: mode === 'leave' ? 0 : breakMinutes,
      hourlyRateType: rateType,
      customHourlyWage: rateType === 'custom' ? customWage : undefined,
      isNightBonus: badge === '마감' || nightHours > 0,
      showInQuickBar,
    };

    if (editingPreset) {
      updatePreset(editingPreset.id, presetData);
    } else {
      addPreset(presetData);
    }

    closePresetModal();
  };

  const selectedPalette = PRESET_COLOR_PALETTES[colorTheme] || PRESET_COLOR_PALETTES.purple;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#131b2e]/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={closePresetModal}
      />

      {/* Sheet / Dialog Content */}
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in slide-in-from-bottom duration-200">
        {/* Grabber Handle for mobile */}
        <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-[#c3c6d7]/60" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#eaedff] bg-[#f2f3ff]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base shadow-xs"
              style={{ backgroundColor: selectedPalette.hex }}
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#131b2e]">
                  {editingPreset ? '근무 프리셋 수정' : '새 근무 프리셋 추가'}
                </h2>
                <span className="bg-[#6cf8bb]/40 text-[#00714d] px-2 py-0.5 rounded-full text-[10px] font-bold">
                  원터치 스탬프
                </span>
              </div>
              <p className="text-[11px] text-[#434655]">
                색상과 시간을 지정하여 캘린더에 드래그/원터치로 적용할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={closePresetModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737686] hover:bg-[#eaedff] cursor-pointer"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Mode Switcher */}
          <div className="flex bg-[#f2f3ff] p-1 rounded-2xl border border-[#c3c6d7]/20">
            <button
              type="button"
              onClick={() => {
                setMode('work');
                if (badge === '휴무') setBadge('오픈');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'work' ? 'bg-white text-[#004ac6] shadow-xs' : 'text-[#434655]'
              }`}
            >
              근무 일정 프리셋
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('leave');
                setBadge('휴무');
                setColorTheme('rose');
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'leave' ? 'bg-white text-[#ad0033] shadow-xs' : 'text-[#434655]'
              }`}
            >
              휴무 / 연차 프리셋
            </button>
          </div>

          {/* Preset Name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#131b2e]">
                프리셋 명칭 <span className="text-[#ad0033]">*</span>
              </label>
              <span className="text-[10px] text-[#737686]">최대 14자</span>
            </div>

            <div className="relative flex items-center">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 연구실 주간 근무, 오전 분석, 마감 지원"
                className="w-full h-11 px-3.5 rounded-xl bg-[#f2f3ff] text-sm text-[#131b2e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004ac6] border border-[#c3c6d7]/30"
              />
              {name && (
                <button
                  onClick={() => setName('')}
                  className="absolute right-3 w-6 h-6 rounded-full bg-[#e2e7ff] text-[#434655] flex items-center justify-center text-xs cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {quickSuggestions.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => {
                    setName(sug.label);
                    setBadge(sug.badge);
                    setBadgeTheme(sug.theme);
                    setColorTheme(sug.theme);
                    setStartTime(sug.start);
                    setEndTime(sug.end);
                    setBreakMinutes(sug.breakMin);
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] text-xs text-[#434655] active:scale-95 transition-all cursor-pointer"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* COLOR THEME SELECTOR (NEW: Color picker added as requested!) */}
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#c3c6d7]/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#004ac6]">palette</span>
                <span>프리셋 전용 테마 색상 선택</span>
              </label>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: selectedPalette.hex }}
              >
                {selectedPalette.label}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {COLOR_THEME_KEYS.map((key) => {
                const pal = PRESET_COLOR_PALETTES[key];
                const isSelected = colorTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setColorTheme(key);
                      setBadgeTheme(key);
                    }}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white shadow-sm ring-2 ring-[#004ac6] scale-105'
                        : 'bg-white/60 hover:bg-white'
                    }`}
                    title={pal.label}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[12px] shadow-xs"
                      style={{ backgroundColor: pal.hex }}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-[#434655] mt-1 truncate w-full text-center">
                      {pal.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Preview of Tag Chip */}
            <div className="flex items-center justify-between pt-2 border-t border-[#c3c6d7]/20 text-xs">
              <span className="text-[#737686]">캘린더 칩 미리보기:</span>
              <span
                className="px-2.5 py-1 rounded-md font-bold text-xs"
                style={{
                  backgroundColor: selectedPalette.softBgHex,
                  color: selectedPalette.hex,
                }}
              >
                {name || '프리셋 텍스트'}
              </span>
            </div>
          </div>

          {/* Badge Type Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#131b2e]">근무 배지 유형</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { type: '오픈' as const, icon: 'wb_sunny' },
                { type: '미들' as const, icon: 'routine' },
                { type: '마감' as const, icon: 'dark_mode' },
                { type: '풀타임' as const, icon: 'all_inclusive' },
                { type: '휴무' as const, icon: 'beach_access' },
              ].map((item) => {
                const isSelected = badge === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setBadge(item.type)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#dae2fd] shadow-xs ring-1 ring-[#004ac6]'
                        : 'bg-[#f2f3ff] hover:bg-[#eaedff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#434655]">
                      {item.icon}
                    </span>
                    <span
                      className={`text-[10px] mt-1 font-bold ${
                        isSelected ? 'text-[#004ac6]' : 'text-[#434655]'
                      }`}
                    >
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Work Hours Schedule (if work mode) */}
          {mode === 'work' && (
            <div className="bg-[#f2f3ff] rounded-2xl p-3.5 flex flex-col gap-3 border border-[#c3c6d7]/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">schedule</span>
                  근무 시간 설정
                </span>
                <span className="text-[10px] text-[#004ac6] font-bold bg-[#dbe1ff] px-2 py-0.5 rounded">
                  실근무: {workedHours}시간
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#434655]">출근 시간</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-white border border-[#c3c6d7]/30 text-xs font-bold text-[#131b2e]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[#434655]">퇴근 시간</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-white border border-[#c3c6d7]/30 text-xs font-bold text-[#131b2e]"
                  />
                </div>
              </div>

              {/* Break Minutes */}
              <div className="flex items-center justify-between pt-1 border-t border-[#c3c6d7]/20">
                <span className="text-xs text-[#434655] font-semibold">휴게 시간 (무급 공제)</span>
                <div className="flex items-center gap-1">
                  {[0, 30, 60].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setBreakMinutes(min)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        breakMinutes === min
                          ? 'bg-[#004ac6] text-white shadow-xs'
                          : 'bg-white text-[#434655] hover:bg-[#eaedff]'
                      }`}
                    >
                      {min}분
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Wage Display */}
              <div className="flex items-center justify-between pt-2 border-t border-[#c3c6d7]/20 bg-white rounded-xl p-2.5">
                <span className="text-xs text-[#434655]">1회 출근 예상 급여</span>
                <span className="text-sm font-extrabold text-[#004ac6]">
                  {formatKRW(estimatedWage)}원
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#eaedff] flex items-center justify-end gap-2 bg-[#f2f3ff]">
          <button
            type="button"
            onClick={closePresetModal}
            className="px-4 py-2 rounded-xl bg-white text-xs font-semibold text-[#131b2e] border border-[#c3c6d7]/30 hover:bg-[#eaedff] cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: selectedPalette.hex }}
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            <span>{editingPreset ? '수정 완료' : '프리셋 저장'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
