import React, { useState, useMemo, useEffect } from 'react';
import { useShift } from '../context/ShiftContext';
import { LeaveType, Preset } from '../types';
import { formatKRW, calculateShiftMinutes } from '../utils/calculations';

export const AddShiftView: React.FC = () => {
  const {
    activeWorkplace,
    updateWorkplace,
    presets,
    openPresetModal,
    selectedDate,
    setSelectedDate,
    addShift,
    deleteShiftByDate,
    shifts,
    minimumWages,
    setActiveTab,
    showToast,
  } = useShift();

  const [activeTabMode, setActiveTabMode] = useState<'work' | 'leave'>('work');

  // Existing shift on the selected date
  const existingShiftOnDate = useMemo(() => {
    return shifts.find((s) => s.date === selectedDate);
  }, [shifts, selectedDate]);

  // Work state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(presets[0]?.id || 'preset_lab');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(60);
  const [hourlyWage, setHourlyWage] = useState<number>(activeWorkplace.hourlyWage || 10320);

  // Allowances toggles
  const [hasWeeklyHolidayPay, setHasWeeklyHolidayPay] = useState<boolean>(true);
  const [hasNightBonus, setHasNightBonus] = useState<boolean>(false);
  const [hasSubstituteBonus, setHasSubstituteBonus] = useState<boolean>(false);

  // Overtime state (추가근무 / 연장근로)
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [hasOvertimeBonus, setHasOvertimeBonus] = useState<boolean>(true); // 기본 1.5배 가산

  // Leave state
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>('연차');
  const [customLeaveTitle, setCustomLeaveTitle] = useState<string>('정기 연차 휴가');
  const [isPaidLeave, setIsPaidLeave] = useState<boolean>(true);
  const [recognizedHours, setRecognizedHours] = useState<number>(8);
  const [leaveMemo, setLeaveMemo] = useState<string>('');

  // If a shift already exists on selectedDate, prefill inputs!
  useEffect(() => {
    if (existingShiftOnDate) {
      if (existingShiftOnDate.type === 'work') {
        setActiveTabMode('work');
        setStartTime(existingShiftOnDate.startTime);
        setEndTime(existingShiftOnDate.endTime);
        setBreakMinutes(existingShiftOnDate.breakMinutes);
        setHourlyWage(existingShiftOnDate.hourlyWage);
        setHasWeeklyHolidayPay(existingShiftOnDate.hasWeeklyHolidayPay);
        setHasNightBonus(existingShiftOnDate.hasNightBonus);
        setHasSubstituteBonus(existingShiftOnDate.hasSubstituteBonus);
        setOvertimeHours(existingShiftOnDate.overtimeHours || 0);
        setHasOvertimeBonus(existingShiftOnDate.hasOvertimeBonus !== false);
        if (existingShiftOnDate.presetId) {
          setSelectedPresetId(existingShiftOnDate.presetId);
        }
      } else {
        setActiveTabMode('leave');
        setSelectedLeaveType(existingShiftOnDate.leaveType || '연차');
        setCustomLeaveTitle(existingShiftOnDate.name);
        setIsPaidLeave(!!existingShiftOnDate.isPaidLeave);
        setRecognizedHours(existingShiftOnDate.recognizedHours || 8);
        setLeaveMemo(existingShiftOnDate.memo || '');
        setOvertimeHours(0);
      }
    } else {
      setOvertimeHours(0);
      setHasOvertimeBonus(true);
    }
  }, [existingShiftOnDate]);

  // Synchronize wage with active workplace
  useEffect(() => {
    if (activeWorkplace.hourlyWage) {
      setHourlyWage(activeWorkplace.hourlyWage);
    }
  }, [activeWorkplace.hourlyWage]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: Preset) => {
    setSelectedPresetId(preset.id);
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
    setBreakMinutes(preset.breakMinutes);
    if (preset.hourlyRateType === 'custom' && preset.customHourlyWage) {
      setHourlyWage(preset.customHourlyWage);
    } else {
      setHourlyWage(activeWorkplace.hourlyWage);
    }
    setHasNightBonus(!!preset.isNightBonus);
  };

  // Date increment / decrement
  const handleShiftDate = (offsetDays: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + offsetDays);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const dateFormatted = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${m}월 ${d}일 (${days[dateObj.getDay()]})`;
  }, [selectedDate]);

  const shiftTimeCalc = useMemo(() => {
    return calculateShiftMinutes(startTime, endTime, breakMinutes);
  }, [startTime, endTime, breakMinutes]);

  const workedHours = shiftTimeCalc.workedMinutes / 60;
  const nightHours = shiftTimeCalc.nightMinutes / 60;

  const estimatedPay = useMemo(() => {
    if (activeTabMode === 'leave') {
      return isPaidLeave ? Math.round(recognizedHours * hourlyWage) : 0;
    }

    let base = Math.round(workedHours * hourlyWage);
    let night = hasNightBonus && nightHours > 0 ? Math.round(nightHours * hourlyWage * 0.5) : 0;
    let sub = hasSubstituteBonus ? Math.round(workedHours * hourlyWage * 0.2) : 0;
    let ot = overtimeHours > 0 ? Math.round(overtimeHours * hourlyWage * (hasOvertimeBonus ? 1.5 : 1.0)) : 0;
    return base + night + sub + ot;
  }, [activeTabMode, isPaidLeave, recognizedHours, hourlyWage, workedHours, nightHours, hasNightBonus, hasSubstituteBonus, overtimeHours, hasOvertimeBonus]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);

    if (activeTabMode === 'work') {
      const activePreset = presets.find((p) => p.id === selectedPresetId);
      const shiftName = activePreset ? activePreset.name : '근무';
      addShift({
        date: selectedDate,
        workplaceId: activeWorkplace.id,
        type: 'work',
        presetId: selectedPresetId,
        name: shiftName,
        startTime,
        endTime,
        breakMinutes,
        hourlyWage,
        status: 'completed',
        hasWeeklyHolidayPay,
        hasNightBonus,
        hasSubstituteBonus,
        overtimeHours,
        hasOvertimeBonus,
      });
    } else {
      addShift({
        date: selectedDate,
        workplaceId: activeWorkplace.id,
        type: 'leave',
        name: customLeaveTitle || selectedLeaveType,
        startTime: '00:00',
        endTime: '00:00',
        breakMinutes: 0,
        hourlyWage,
        status: 'completed',
        hasWeeklyHolidayPay: false,
        hasNightBonus: false,
        hasSubstituteBonus: false,
        leaveType: selectedLeaveType,
        isPaidLeave,
        recognizedHours,
        memo: leaveMemo,
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setActiveTab('calendar');
    }, 600);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-28 md:pb-12 max-w-4xl mx-auto px-4 md:px-6 pt-2">
      {/* Top Segmented Switcher */}
      <div className="bg-[#eaedff] p-1 rounded-2xl flex items-center justify-between">
        <button
          onClick={() => setActiveTabMode('work')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm font-bold ${
            activeTabMode === 'work'
              ? 'bg-white text-[#004ac6] shadow-sm'
              : 'text-[#434655] hover:text-[#131b2e]'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">work</span>
          <span>근무 등록</span>
        </button>

        <button
          onClick={() => setActiveTabMode('leave')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm font-bold ${
            activeTabMode === 'leave'
              ? 'bg-white text-[#ad0033] shadow-sm'
              : 'text-[#434655] hover:text-[#131b2e]'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">beach_access</span>
          <span>휴무 등록</span>
        </button>
      </div>

      {/* Workplace Selector Pill with Dynamic Minimum Wages */}
      <div className="flex flex-col bg-[#f2f3ff] p-3.5 rounded-2xl gap-2 border border-[#c3c6d7]/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#dae2fd] flex items-center justify-center text-[#004ac6] shrink-0 text-base">
              {activeWorkplace.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-medium text-[#434655]">선택된 근무지</span>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm font-bold text-[#131b2e] truncate">{activeWorkplace.name}</span>
                <span className="text-xs font-bold text-[#004ac6] px-1.5 py-0.5 bg-white rounded-md shadow-xs">
                  {formatKRW(hourlyWage)}원
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const newWage = prompt('적용할 시급을 입력하세요:', String(hourlyWage));
                if (newWage && !isNaN(Number(newWage))) {
                  const parsed = Number(newWage);
                  setHourlyWage(parsed);
                  updateWorkplace({ hourlyWage: parsed });
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#eaedff] rounded-xl text-[#004ac6] text-xs font-semibold shadow-xs active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>시급 직접 수정</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-2.5 py-1.5 bg-[#dae2fd] hover:bg-[#eaedff] rounded-xl text-[#131b2e] text-xs font-semibold shadow-xs active:scale-95 transition-all"
              type="button"
            >
              변경
            </button>
          </div>
        </div>

        {/* Dynamic Minimum Wage Quick Buttons (including 2026: 10,320원) */}
        <div className="flex items-center gap-1.5 pt-1 flex-wrap border-t border-[#eaedff]">
          <span className="text-[11px] font-medium text-[#737686] shrink-0">빠른 적용:</span>
          {minimumWages.slice(0, 3).map((w) => (
            <button
              key={w.year}
              type="button"
              onClick={() => {
                setHourlyWage(w.wage);
                updateWorkplace({ hourlyWage: w.wage });
                showToast(`${w.year}년 최저시급 (${w.wage.toLocaleString()}원)이 적용되었습니다.`);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs active:scale-95 transition-all shadow-xs ${
                w.year === 2026
                  ? 'bg-[#dbe1ff] text-[#004ac6] font-black border border-[#004ac6]'
                  : 'bg-white text-[#131b2e] border border-[#c3c6d7]/40 hover:border-[#004ac6]'
              }`}
            >
              <span>⚡ {w.year} 최저 ({formatKRW(w.wage)}원)</span>
              {w.year === 2026 && (
                <span className="text-[9px] bg-[#004ac6] text-white px-1 rounded">26년</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation Card */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-[#c3c6d7]/30 flex items-center justify-between">
        <button
          onClick={() => handleShiftDate(-1)}
          className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] flex items-center justify-center text-[#131b2e] active:scale-90 transition-transform"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#004ac6] text-[20px]">calendar_today</span>
          <div className="text-center">
            <div className="text-base font-bold text-[#131b2e]">{dateFormatted}</div>
            <div className="text-[11px] text-[#006c49] font-bold">
              {existingShiftOnDate ? '기존 근무 등록됨 (수정 가능)' : '오늘 스케줄'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleShiftDate(-1)}
            className="px-2.5 py-1 bg-[#f2f3ff] text-[#434655] text-xs font-semibold rounded-lg active:scale-95 transition-transform"
            type="button"
          >
            -1일
          </button>
          <button
            onClick={() => handleShiftDate(1)}
            className="px-2.5 py-1 bg-[#f2f3ff] text-[#434655] text-xs font-semibold rounded-lg active:scale-95 transition-transform"
            type="button"
          >
            +1일
          </button>
        </div>
      </div>

      {/* Notice if shift already exists */}
      {existingShiftOnDate && (
        <div className="p-3 bg-[#eaedff] rounded-2xl border border-[#004ac6]/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-[#004ac6] text-[18px]">edit_note</span>
            <span>
              선택한 날짜에 <strong>{existingShiftOnDate.name}</strong> 일정이 이미 등록되어 있습니다.
            </span>
          </div>
          <button
            onClick={() => deleteShiftByDate(selectedDate)}
            className="px-2.5 py-1 rounded-xl bg-[#ffdad6] text-[#ad0033] font-bold text-xs hover:bg-[#ffdad6]/80"
          >
            일정 삭제
          </button>
        </div>
      )}

      {activeTabMode === 'work' ? (
        <>
          {/* Presets Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[#004ac6] text-[20px]">bolt</span>
              <h2 className="text-sm font-bold text-[#131b2e]">자주 쓰는 프리셋 원터치</h2>
            </div>
            <button
              onClick={() => openPresetModal()}
              className="flex items-center gap-1 text-[#004ac6] text-xs font-bold active:opacity-70"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>새 프리셋</span>
            </button>
          </div>

          {/* Preset Cards Carousel / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5" id="preset-group">
            {presets.slice(0, 3).map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              const pCalc = calculateShiftMinutes(preset.startTime, preset.endTime, preset.breakMinutes);
              const pHours = pCalc.workedMinutes / 60;
              const pNight = pCalc.nightMinutes / 60;
              let pWage = Math.round(pHours * hourlyWage);
              if (preset.isNightBonus && pNight > 0) {
                pWage += Math.round(pNight * hourlyWage * 0.5);
              }

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.99] border ${
                    isSelected
                      ? 'bg-[#dae2fd]/60 border-[#004ac6] shadow-sm'
                      : 'bg-white border-[#c3c6d7]/30 hover:bg-[#f2f3ff]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-white text-[#004ac6] text-xs font-bold shadow-xs">
                        {preset.emoji} {preset.name}
                      </span>
                      <span className="text-[11px] text-[#434655]">
                        {preset.startTime} ~ {preset.endTime} ({pHours}시간)
                      </span>
                    </div>
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#004ac6] flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </div>
                    ) : preset.isNightBonus ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#ffdadb] text-[#ad0033] text-[10px] font-bold">
                        야간할증
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-[#6ffbbe]/40 text-[#00714d] text-[10px] font-bold">
                        주휴포함
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-baseline justify-between pt-1 border-t border-[#c3c6d7]/20">
                    <span className="text-[11px] text-[#434655]">
                      {preset.breakMinutes > 0 ? `휴게 ${preset.breakMinutes}분 공제` : '실근무 기준'}
                    </span>
                    <span
                      className={`text-base font-bold ${
                        isSelected ? 'text-[#004ac6]' : 'text-[#131b2e]'
                      }`}
                    >
                      {formatKRW(pWage)}원
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Time Adjustment Card */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#131b2e]">근무 시간 직접 조정</span>
              <span className="text-xs font-semibold text-[#004ac6]">
                실근무 {Math.floor(workedHours)}시간 {shiftTimeCalc.workedMinutes % 60}분
              </span>
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#f2f3ff] p-3 rounded-xl">
                <span className="text-[11px] font-medium text-[#434655]">출근 시각</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="text-lg font-bold bg-transparent text-[#131b2e] w-full focus:outline-none"
                  />
                  <span className="material-symbols-outlined text-[#737686] text-[20px]">schedule</span>
                </div>
              </div>

              <div className="bg-[#f2f3ff] p-3 rounded-xl">
                <span className="text-[11px] font-medium text-[#434655]">퇴근 시각</span>
                <div className="flex items-center justify-between mt-1">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="text-lg font-bold bg-transparent text-[#131b2e] w-full focus:outline-none"
                  />
                  <span className="material-symbols-outlined text-[#737686] text-[20px]">schedule</span>
                </div>
              </div>
            </div>

            {/* Break Time Stepper */}
            <div className="flex items-center justify-between bg-[#f2f3ff] p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#737686] text-[20px]">coffee</span>
                <div>
                  <div className="text-xs font-bold text-[#131b2e]">휴게 시간 차감</div>
                  <div className="text-[11px] text-[#434655]">법정 기본 30분 적용 중</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBreakMinutes((prev) => Math.max(0, prev - 15))}
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#131b2e] active:scale-95 shadow-xs font-bold"
                  type="button"
                >
                  -
                </button>
                <span className="text-sm font-bold px-2 text-[#131b2e] min-w-[48px] text-center">
                  {breakMinutes}분
                </span>
                <button
                  onClick={() => setBreakMinutes((prev) => prev + 15)}
                  className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#131b2e] active:scale-95 shadow-xs font-bold"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Overtime (추가근무 / 연장근로) Card */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    overtimeHours > 0 ? 'bg-[#ffeed9] text-[#b35300]' : 'bg-[#f2f3ff] text-[#004ac6]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">more_time</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5 flex-wrap">
                    <span>추가근무 (연장근로)</span>
                    {overtimeHours > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#ffeed9] text-[#b35300] text-[10px] font-extrabold">
                        +{overtimeHours}시간 적용중
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#434655]">
                    기본 근무 외 추가로 일한 시간을 설정하세요
                  </div>
                </div>
              </div>

              {/* Stepper controls */}
              <div className="flex items-center gap-1.5 bg-[#f2f3ff] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOvertimeHours((prev) => Math.max(0, Math.round((prev - 0.5) * 10) / 10))}
                  disabled={overtimeHours <= 0}
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#131b2e] active:scale-95 shadow-xs font-bold disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="0.5시간 감소"
                >
                  -
                </button>
                <div className="flex items-baseline px-2 min-w-[58px] justify-center text-center">
                  <span className={`text-sm font-extrabold ${overtimeHours > 0 ? 'text-[#b35300]' : 'text-[#131b2e]'}`}>
                    {overtimeHours}
                  </span>
                  <span className="text-[11px] text-[#737686] font-medium ml-0.5">시간</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOvertimeHours((prev) => Math.min(24, Math.round((prev + 0.5) * 10) / 10))}
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#131b2e] active:scale-95 shadow-xs font-bold cursor-pointer"
                  title="0.5시간 추가"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Overtime Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#eaedff]">
              <span className="text-[11px] font-medium text-[#737686] shrink-0 mr-0.5">빠른 설정:</span>
              {[
                { label: '없음 (0h)', val: 0 },
                { label: '+30분 (0.5h)', val: 0.5 },
                { label: '+1시간', val: 1 },
                { label: '+1.5시간', val: 1.5 },
                { label: '+2시간', val: 2 },
                { label: '+3시간', val: 3 },
              ].map((chip) => {
                const isSelected = overtimeHours === chip.val;
                return (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => setOvertimeHours(chip.val)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? chip.val > 0
                          ? 'bg-[#b35300] text-white shadow-xs'
                          : 'bg-[#004ac6] text-white shadow-xs'
                        : 'bg-[#f2f3ff] text-[#434655] hover:bg-[#eaedff]'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Overtime Pay Multiplier & Live Breakdown (shown when overtimeHours > 0) */}
            {overtimeHours > 0 && (
              <div className="mt-1 p-3 rounded-xl bg-[#fff8f2] border border-[#ffdbb8] flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#131b2e]">법정 연장가산수당 (1.5배)</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#ffdbb8] text-[#8f4200] text-[10px] font-bold">
                        근로기준법 기준
                      </span>
                    </div>
                    <span className="text-[11px] text-[#633f17]">
                      {hasOvertimeBonus
                        ? `통상시급의 150% 적용 (${formatKRW(Math.round(hourlyWage * 1.5))}원/시간)`
                        : `기본시급 100% 적용 (${formatKRW(hourlyWage)}원/시간)`}
                    </span>
                  </div>

                  <button
                    onClick={() => setHasOvertimeBonus(!hasOvertimeBonus)}
                    className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                      hasOvertimeBonus ? 'bg-[#b35300]' : 'bg-[#e2e7ff]'
                    }`}
                    type="button"
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        hasOvertimeBonus ? 'ml-auto' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#ffebd6] text-xs">
                  <span className="text-[#633f17] font-medium">추가근무 수당 합산액</span>
                  <span className="text-sm font-black text-[#b35300]">
                    +{formatKRW(Math.round(overtimeHours * hourlyWage * (hasOvertimeBonus ? 1.5 : 1.0)))}원
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Allowances Toggles Card */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3">
            <span className="text-sm font-bold text-[#131b2e]">추가 수당 설정</span>

            {/* Toggle 1: 주휴수당 */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#131b2e]">주휴수당 자동 산정</span>
                  <span className="px-1.5 py-0.2 bg-[#6ffbbe]/40 text-[#00714d] text-[10px] font-bold rounded">
                    적용권장
                  </span>
                </div>
                <span className="text-[11px] text-[#434655]">이번 주 누적 15시간 이상 충족 중</span>
              </div>
              <button
                onClick={() => setHasWeeklyHolidayPay(!hasWeeklyHolidayPay)}
                className={`w-12 h-7 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                  hasWeeklyHolidayPay ? 'bg-[#004ac6]' : 'bg-[#e2e7ff]'
                }`}
                type="button"
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    hasWeeklyHolidayPay ? 'ml-auto' : ''
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: 야간/연장 가산 */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#131b2e]">연장·야간 가산수당</span>
                <span className="text-[11px] text-[#434655]">22시 이후 또는 8시간 초과 1.5배</span>
              </div>
              <button
                onClick={() => setHasNightBonus(!hasNightBonus)}
                className={`w-12 h-7 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                  hasNightBonus ? 'bg-[#004ac6]' : 'bg-[#e2e7ff]'
                }`}
                type="button"
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    hasNightBonus ? 'ml-auto' : ''
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: 대타 근무 */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#131b2e]">대타 긴급 근무</span>
                <span className="text-[11px] text-[#434655]">동료 요청 보너스 시급 (1.2배)</span>
              </div>
              <button
                onClick={() => setHasSubstituteBonus(!hasSubstituteBonus)}
                className={`w-12 h-7 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                  hasSubstituteBonus ? 'bg-[#004ac6]' : 'bg-[#e2e7ff]'
                }`}
                type="button"
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    hasSubstituteBonus ? 'ml-auto' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Leave / Holiday Form Card */
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#eaedff]">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#ffdadb] text-[#ad0033] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">event_busy</span>
              </div>
              <div>
                <div className="text-sm font-bold text-[#131b2e]">휴무 / 연차 상세 등록</div>
                <div className="text-[11px] text-[#434655]">휴가 유형을 선택하거나 직접 입력하세요</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#6ffbbe]/40 text-[#00714d] text-[10px] font-bold">
              캘린더 자동연동
            </span>
          </div>

          {/* Leave Type Chips */}
          <div>
            <label className="block text-xs font-bold text-[#434655] mb-1.5">
              휴무 및 연차 유형 선택
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  '연차',
                  '오전 반차',
                  '오후 반차',
                  '유급 병가',
                  '무급 휴무',
                  '경조사 휴가',
                  '직접 입력',
                ] as LeaveType[]
              ).map((type) => {
                const isSelected = selectedLeaveType === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedLeaveType(type);
                      if (type === '연차') {
                        setIsPaidLeave(true);
                        setRecognizedHours(8);
                        setCustomLeaveTitle('정기 연차 휴가');
                      } else if (type === '오전 반차' || type === '오후 반차') {
                        setIsPaidLeave(true);
                        setRecognizedHours(4);
                        setCustomLeaveTitle(type);
                      } else if (type === '무급 휴무') {
                        setIsPaidLeave(false);
                        setRecognizedHours(0);
                        setCustomLeaveTitle('개인 휴무');
                      } else if (type === '유급 병가') {
                        setIsPaidLeave(true);
                        setRecognizedHours(8);
                        setCustomLeaveTitle('병가 유급 휴가');
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-[#004ac6] text-white shadow-xs'
                        : 'bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff]'
                    }`}
                    type="button"
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Form Box */}
          <div className="p-3 bg-[#f2f3ff] rounded-xl flex flex-col gap-2.5 border border-[#c3c6d7]/30">
            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">휴무명 직접 입력</label>
              <input
                value={customLeaveTitle}
                onChange={(e) => setCustomLeaveTitle(e.target.value)}
                placeholder="휴무 / 휴가 명칭을 입력하세요"
                className="w-full bg-white rounded-xl px-3 py-2 text-sm text-[#131b2e] border border-[#c3c6d7]/30 focus:border-[#004ac6] focus:outline-none"
              />
            </div>

            {/* Paid / Hours Configuration */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#c3c6d7]/20">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e]">유급 적용</span>
                  <span className="text-[10px] text-[#006c49]">시급 100% 보전</span>
                </div>
                <button
                  onClick={() => setIsPaidLeave(!isPaidLeave)}
                  className={`w-10 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                    isPaidLeave ? 'bg-[#004ac6]' : 'bg-[#e2e7ff]'
                  }`}
                  type="button"
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                      isPaidLeave ? 'ml-auto' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#c3c6d7]/20">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#434655]">인정 시간</span>
                  <span className="text-sm font-bold text-[#131b2e]">{recognizedHours}시간</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRecognizedHours((prev) => Math.max(0, prev - 1))}
                    className="w-6 h-6 rounded bg-[#f2f3ff] flex items-center justify-center font-bold text-xs"
                    type="button"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setRecognizedHours((prev) => prev + 1)}
                    className="w-6 h-6 rounded bg-[#f2f3ff] flex items-center justify-center font-bold text-xs"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Reason Memo */}
            <div>
              <label className="block text-xs font-medium text-[#434655] mb-1">사유 메모 (선택)</label>
              <input
                value={leaveMemo}
                onChange={(e) => setLeaveMemo(e.target.value)}
                placeholder="사유나 전달사항을 간단히 적어보세요"
                className="w-full bg-white rounded-xl px-3 py-2 text-xs text-[#131b2e] border border-[#c3c6d7]/30 focus:border-[#004ac6] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Action Trigger Wrapper */}
      <div className="pt-2 sticky bottom-18 md:bottom-4 z-20">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-14 bg-[#004ac6] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.985] active:bg-[#003ea8] transition-all cursor-pointer"
          type="button"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          )}
          <span>
            {formatKRW(estimatedPay)}원 {activeTabMode === 'work' ? '근무 등록 완료' : '휴무 등록 완료'}
          </span>
          <span className="text-xs opacity-80">(1초 즉시 저장)</span>
        </button>
      </div>
    </div>
  );
};
