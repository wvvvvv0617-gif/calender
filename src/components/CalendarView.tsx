import React, { useState, useMemo, useRef } from 'react';
import { useShift } from '../context/ShiftContext';
import { formatKRW, calculateShiftPay, calculatePaydayDDay } from '../utils/calculations';
import { getKoreanHoliday, getHolidaysForMonth } from '../utils/holidays';
import { getShiftColorPalette, PRESET_COLOR_PALETTES } from '../utils/themeColors';

export const CalendarView: React.FC = () => {
  const {
    shifts,
    presets,
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    activeWorkplace,
    currentMonthlySummary,
    stampPresetOnDate,
    deleteShiftByDate,
    todayDate,
    goToToday,
    paydayOption,
    quickStampPresetId,
    setQuickStampPresetId,
    isQuickStampActive,
    setIsQuickStampActive,
    openPresetModal,
    openPdfModal,
    setActiveTab,
    showToast,
    loadSampleData,
  } = useShift();

  const [calendarViewMode, setCalendarViewMode] = useState<'monthly' | 'weekly' | 'list'>('monthly');
  const [listFilter, setListFilter] = useState<'all' | 'work' | 'leave'>('all');
  const [draggedPresetId, setDraggedPresetId] = useState<string | null>(null);
  const [draggedFromDate, setDraggedFromDate] = useState<string | null>(null);

  // Map of presets for quick theme resolution
  const presetMap = useMemo(() => {
    const map = new Map<string, (typeof presets)[0]>();
    presets.forEach((p) => map.set(p.id, p));
    return map;
  }, [presets]);

  // Long press timer ref for mobile touch deletion
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic D-Day for Payday
  const paydayDDay = useMemo(() => {
    return calculatePaydayDDay(paydayOption);
  }, [paydayOption]);

  // Parse current year & month
  const [year, month] = useMemo(() => {
    const parts = currentMonth.split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [currentMonth]);

  // Holidays in current selected month
  const monthHolidays = useMemo(() => {
    return getHolidaysForMonth(year, month);
  }, [year, month]);

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setCurrentMonth(formatted);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setCurrentMonth(formatted);
  };

  // Calendar days calculation (starts Monday)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      dayOfWeek: number;
    }> = [];

    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      days.push({
        dateStr: `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNumber: d,
        isCurrentMonth: false,
        dayOfWeek: (startDayOfWeek - 1 - i) % 7,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(year, month - 1, d).getDay();
      const adjustedDow = dow === 0 ? 6 : dow - 1;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        dayOfWeek: adjustedDow,
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextM = month === 12 ? 1 : month + 1;
        const nextY = month === 12 ? year + 1 : year;
        days.push({
          dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
          dayNumber: i,
          isCurrentMonth: false,
          dayOfWeek: days.length % 7,
        });
      }
    }

    return days;
  }, [year, month]);

  // Lookup shift for a date
  const shiftMap = useMemo(() => {
    const map = new Map<string, (typeof shifts)[0]>();
    shifts.forEach((s) => {
      map.set(s.date, s);
    });
    return map;
  }, [shifts]);

  // Selected shift details
  const selectedShift = useMemo(() => {
    return shiftMap.get(selectedDate);
  }, [shiftMap, selectedDate]);

  const selectedShiftCalc = useMemo(() => {
    if (!selectedShift) return null;
    return calculateShiftPay(selectedShift);
  }, [selectedShift]);

  const selectedDateFormatted = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${m}월 ${d}일 (${dayNames[dateObj.getDay()]})`;
  }, [selectedDate]);

  // Selected Date Holiday check
  const selectedDateHoliday = useMemo(() => {
    return getKoreanHoliday(selectedDate);
  }, [selectedDate]);

  // Selected Date Color Palette (matches preset color)
  const selectedDatePalette = useMemo(() => {
    return getShiftColorPalette(selectedShift, presetMap);
  }, [selectedShift, presetMap]);

  const activeQuickPreset = useMemo(() => {
    return presets.find((p) => p.id === quickStampPresetId) || presets[0];
  }, [presets, quickStampPresetId]);

  // --- WEEKLY VIEW LOGIC ---
  const [weekRefDateStr, setWeekRefDateStr] = useState<string>(selectedDate || todayDate);

  React.useEffect(() => {
    if (selectedDate) {
      setWeekRefDateStr(selectedDate);
    }
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    const [refY, refM, refD] = weekRefDateStr.split('-').map(Number);
    const targetDate = new Date(refY, refM - 1, refD);
    const dayOfWeek = targetDate.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() - daysFromMonday);

    const days: Array<{
      dateStr: string;
      dateNumber: number;
      monthNumber: number;
      yearNumber: number;
      dayOfWeek: number;
      dayName: string;
    }> = [];

    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dateNum = d.getDate();
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;

      days.push({
        dateStr,
        dateNumber: dateNum,
        monthNumber: m,
        yearNumber: y,
        dayOfWeek: i,
        dayName: dayNames[i],
      });
    }

    return days;
  }, [weekRefDateStr]);

  const handlePrevWeek = () => {
    const [refY, refM, refD] = weekRefDateStr.split('-').map(Number);
    const d = new Date(refY, refM - 1, refD - 7);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setWeekRefDateStr(dateStr);
    setSelectedDate(dateStr);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextWeek = () => {
    const [refY, refM, refD] = weekRefDateStr.split('-').map(Number);
    const d = new Date(refY, refM - 1, refD + 7);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setWeekRefDateStr(dateStr);
    setSelectedDate(dateStr);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleGoToThisWeek = () => {
    setWeekRefDateStr(todayDate);
    setSelectedDate(todayDate);
    setCurrentMonth(todayDate.slice(0, 7));
  };

  const weeklyStats = useMemo(() => {
    let totalWorkedHours = 0;
    let totalPay = 0;
    let workDaysCount = 0;

    weekDays.forEach((wd) => {
      const shift = shiftMap.get(wd.dateStr);
      if (shift && shift.type === 'work') {
        const calc = calculateShiftPay(shift);
        totalWorkedHours += calc.workedHours;
        totalPay += calc.totalShiftPay;
        workDaysCount += 1;
      }
    });

    const isHolidayPayEligible = totalWorkedHours >= 15;
    const estimatedWeeklyHolidayPay = isHolidayPayEligible
      ? Math.round(Math.min(totalWorkedHours / 40, 1) * 8 * activeWorkplace.hourlyWage)
      : 0;

    return {
      totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
      totalPay,
      workDaysCount,
      isHolidayPayEligible,
      estimatedWeeklyHolidayPay,
    };
  }, [weekDays, shiftMap, activeWorkplace.hourlyWage]);

  // --- LIST VIEW LOGIC ---
  const monthShifts = useMemo(() => {
    return shifts
      .filter((s) => s.date.startsWith(currentMonth))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, currentMonth]);

  const filteredMonthShifts = useMemo(() => {
    if (listFilter === 'work') {
      return monthShifts.filter((s) => s.type === 'work');
    }
    if (listFilter === 'leave') {
      return monthShifts.filter((s) => s.type === 'leave');
    }
    return monthShifts;
  }, [monthShifts, listFilter]);

  // Click handler for day cell
  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);

    if (isQuickStampActive && quickStampPresetId) {
      stampPresetOnDate(dateStr, quickStampPresetId);
    }
  };

  // Right-click context menu deletion handler
  const handleContextMenu = (e: React.MouseEvent, dateStr: string) => {
    e.preventDefault();
    const existing = shiftMap.get(dateStr);
    if (existing) {
      deleteShiftByDate(dateStr);
      showToast(`${dateStr} 근무가 삭제되었습니다.`);
    }
  };

  // Mobile long-press deletion handler
  const handleTouchStart = (dateStr: string) => {
    longPressTimerRef.current = setTimeout(() => {
      const existing = shiftMap.get(dateStr);
      if (existing) {
        if (window.navigator?.vibrate) {
          window.navigator.vibrate(50);
        }
        deleteShiftByDate(dateStr);
        showToast(`${dateStr} 근무가 롱터치로 삭제되었습니다.`);
      }
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, dateStr: string) => {
    setDraggedFromDate(dateStr);
    e.dataTransfer.setData('text/plain', dateStr);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dateStr: string) => {
    if (draggedPresetId) {
      if (draggedPresetId === 'DELETE_TOOL') {
        deleteShiftByDate(dateStr);
      } else {
        stampPresetOnDate(dateStr, draggedPresetId);
      }
      setDraggedPresetId(null);
    } else if (draggedFromDate && draggedFromDate !== dateStr) {
      const sourceShift = shiftMap.get(draggedFromDate);
      if (sourceShift) {
        stampPresetOnDate(dateStr, sourceShift.presetId || presets[0].id);
        deleteShiftByDate(draggedFromDate);
      }
      setDraggedFromDate(null);
    }
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedFromDate) {
      deleteShiftByDate(draggedFromDate);
      setDraggedFromDate(null);
      showToast('휴지통으로 드래그하여 근무가 삭제되었습니다.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-28 md:pb-12 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-2">
      {/* Auto-Save & Empty State Helpful Prompt */}
      {shifts.length === 0 && (
        <div className="p-3.5 rounded-2xl bg-[#eaedff] border border-[#004ac6]/20 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#004ac6] text-[22px]">info</span>
            <div className="text-xs text-[#131b2e]">
              <span className="font-bold">현재 등록된 근무가 없습니다.</span> 날짜를 클릭하거나 프리셋을 드래그하여 근무를 추가하세요. (모든 데이터는 실시간 자동 저장됩니다)
            </div>
          </div>
          <button
            onClick={loadSampleData}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            샘플 데이터 로드
          </button>
        </div>
      )}

      {/* 1. Monthly Financial Summary Card */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[#004ac6]/10 blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#434655]">{month}월 예상 수령액</span>
            <button
              aria-label="급여 상세 안내"
              onClick={() => setActiveTab('payroll-summary')}
              className="text-[#737686] hover:text-[#004ac6] transition-colors flex items-center cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">help</span>
            </button>
          </div>
          <div className="inline-flex items-center gap-1 bg-[#eaedff] px-2.5 py-0.5 rounded-full text-[#004ac6] font-bold text-xs">
            <span className="material-symbols-outlined text-[14px]">event_available</span>
            <span>급여일 {paydayDDay.dDayText} ({paydayDDay.paydayFormatted})</span>
          </div>
        </div>

        {/* Main Amount Display */}
        <div className="flex flex-col gap-0.5 relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-extrabold text-[#004ac6] tracking-tight">
              {formatKRW(currentMonthlySummary.netPay)}
            </span>
            <span className="text-lg font-bold text-[#131b2e]">원</span>
          </div>
          <div className="flex items-center gap-1 text-[#006c49] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>2026 최저시급({formatKRW(activeWorkplace.hourlyWage)}원) 및 주휴수당 자동 산정 중</span>
          </div>
        </div>

        {/* Micro Stats Bento Grid (Responsive on Galaxy Fold & Tablets) */}
        <div className="grid grid-cols-3 gap-2 pt-1 relative z-10">
          <div className="bg-[#f2f3ff] rounded-xl p-2.5 flex flex-col">
            <span className="text-[11px] font-medium text-[#434655]">총 근무</span>
            <span className="text-sm font-bold text-[#131b2e] mt-0.5">
              {currentMonthlySummary.totalWorkedHours}시간
            </span>
          </div>
          <div className="bg-[#6ffbbe]/25 rounded-xl p-2.5 flex flex-col">
            <span className="text-[11px] font-bold text-[#006c49]">주휴수당(4주)</span>
            <span className="text-sm font-bold text-[#006c49] mt-0.5">
              +{formatKRW(currentMonthlySummary.weeklyHolidayPay)}원
            </span>
          </div>
          <div className="bg-[#ffdad6]/40 rounded-xl p-2.5 flex flex-col">
            <span className="text-[11px] font-bold text-[#ad0033]">공제액</span>
            <span className="text-sm font-bold text-[#ad0033] mt-0.5">
              -{formatKRW(currentMonthlySummary.totalDeductions)}원
            </span>
          </div>
        </div>
      </section>

      {/* 2. Month/Week Navigation & Segmented View Controls */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {calendarViewMode === 'weekly' ? (
            <div className="flex items-center gap-2">
              <button
                aria-label="이전 주"
                onClick={handlePrevWeek}
                className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-90 transition-all flex items-center justify-center text-[#131b2e] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <h2 className="text-lg md:text-xl font-bold text-[#131b2e] tracking-tight">
                {weekDays[0].monthNumber}.{weekDays[0].dateNumber} ~ {weekDays[6].monthNumber}.{weekDays[6].dateNumber} 주간
              </h2>
              <button
                aria-label="다음 주"
                onClick={handleNextWeek}
                className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-90 transition-all flex items-center justify-center text-[#131b2e] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <button
                onClick={handleGoToThisWeek}
                className="px-2.5 py-1 rounded-full bg-[#eaedff] hover:bg-[#dbe1ff] text-[#004ac6] text-xs font-bold transition-all shadow-xs active:scale-95 ml-1 cursor-pointer"
                title="이번 주 날짜로 이동"
              >
                이번 주
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                aria-label="이전 달"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-90 transition-all flex items-center justify-center text-[#131b2e] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <h2 className="text-xl font-bold text-[#131b2e] tracking-tight">
                {year}년 {month}월
              </h2>
              <button
                aria-label="다음 달"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-90 transition-all flex items-center justify-center text-[#131b2e] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-full bg-[#eaedff] hover:bg-[#dbe1ff] text-[#004ac6] text-xs font-bold transition-all shadow-xs active:scale-95 ml-1 cursor-pointer"
                title="오늘 날짜로 이동"
              >
                오늘
              </button>
            </div>
          )}

          {/* PDF Export & View Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              aria-label="이번 달 근무기록 PDF 내보내기"
              onClick={() => openPdfModal('timesheet')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#dbe1ff]/60 hover:bg-[#dbe1ff] text-[#004ac6] text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span>인쇄/PDF</span>
            </button>

            {/* Segmented Switcher for Monthly / Weekly / List */}
            <div className="flex items-center bg-[#eaedff] rounded-full p-0.5 text-xs font-semibold">
              <button
                onClick={() => setCalendarViewMode('monthly')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  calendarViewMode === 'monthly'
                    ? 'bg-white text-[#004ac6] shadow-xs font-bold'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
                type="button"
              >
                월간
              </button>
              <button
                onClick={() => setCalendarViewMode('weekly')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  calendarViewMode === 'weekly'
                    ? 'bg-white text-[#004ac6] shadow-xs font-bold'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
                type="button"
              >
                주간
              </button>
              <button
                onClick={() => setCalendarViewMode('list')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  calendarViewMode === 'list'
                    ? 'bg-white text-[#004ac6] shadow-xs font-bold'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
                type="button"
              >
                목록
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CALENDAR CONTENT: CONDITIONALLY RENDERED BASED ON VIEW MODE */}

      {/* VIEW A: MONTHLY VIEW (Full 7-Column Grid with Red Holidays and Preset-matching Selected Color) */}
      {calendarViewMode === 'monthly' && (
        <section className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#c3c6d7]/30 flex flex-col">
          {/* Quick Stamp Mode Banner */}
          <div className="mb-3 px-3 py-2 rounded-xl bg-[#dbe1ff]/50 border border-[#004ac6]/20 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[#004ac6] font-bold">
              <span className="material-symbols-outlined text-[18px]">touch_app</span>
              <span>
                스탬프 모드:{' '}
                <button
                  onClick={() => setIsQuickStampActive(!isQuickStampActive)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    isQuickStampActive ? 'bg-[#004ac6] text-white' : 'bg-[#737686] text-white'
                  }`}
                >
                  {isQuickStampActive ? 'ON' : 'OFF'}
                </button>
              </span>
              {activeQuickPreset && (
                <span className="px-2 py-0.5 rounded bg-[#004ac6]/10 text-[#004ac6] text-[11px] font-semibold">
                  {activeQuickPreset.name} ({activeQuickPreset.startTime}-{activeQuickPreset.endTime})
                </span>
              )}
            </div>
            <span className="text-[#434655] text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#ad0033]">delete</span>
              <span>우클릭 또는 꾹 누르면 삭제 · 하단 휴지통으로 드래그 삭제</span>
            </span>
          </div>

          {/* Monthly Public Holidays Summary Banner (공휴일 요약 표시) */}
          {monthHolidays.length > 0 && (
            <div className="mb-2.5 px-3 py-2 rounded-xl bg-[#fff5f5] border border-[#ffcdd2]/70 flex items-center gap-2 text-xs flex-wrap">
              <span className="font-extrabold text-[#b30026] flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#b30026] animate-pulse"></span>
                이달의 법정공휴일:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {monthHolidays.map((h) => (
                  <button
                    key={h.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(h.dateStr)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedDate === h.dateStr
                        ? 'bg-[#b30026] text-white shadow-xs'
                        : 'bg-white text-[#b30026] hover:bg-[#ffebee] border border-[#ffcdd2]'
                    }`}
                  >
                    <span>{month}.{h.day}</span>
                    <span>{h.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 text-center pb-2 text-xs font-semibold text-[#434655]">
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span className="text-[#004ac6]">토</span>
            <span className="text-[#b30026]">일</span>
          </div>

          {/* Calendar 7-Column Grid */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 sm:gap-x-1.5 text-center" id="calendarGrid">
            {calendarDays.map((cell) => {
              const shift = shiftMap.get(cell.dateStr);
              const isSelected = selectedDate === cell.dateStr;
              const isToday = todayDate === cell.dateStr;
              const isWeekendSat = cell.dayOfWeek === 5;
              const isWeekendSun = cell.dayOfWeek === 6;

              // Public Holiday Check (User Requested: 빨간색 & 공휴일명 표기)
              const holiday = getKoreanHoliday(cell.dateStr);
              const isHoliday = !!holiday;

              // Shift theme palette
              const palette = getShiftColorPalette(shift, presetMap);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => handleDayClick(cell.dateStr)}
                  onContextMenu={(e) => handleContextMenu(e, cell.dateStr)}
                  onTouchStart={() => handleTouchStart(cell.dateStr)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(cell.dateStr)}
                  draggable={!!shift}
                  onDragStart={(e) => handleDragStart(e, cell.dateStr)}
                  title={
                    holiday
                      ? `법정 공휴일: ${holiday.name}${shift ? ` · ${shift.name}` : ''}`
                      : shift
                      ? `${shift.name} (우클릭 또는 꾹 눌러서 삭제)`
                      : '탭하여 근무 등록'
                  }
                  style={
                    isSelected
                      ? {
                          borderColor: isHoliday
                            ? '#b30026'
                            : shift
                            ? palette.hex
                            : '#004ac6',
                          backgroundColor: isHoliday
                            ? '#ffebee80'
                            : shift
                            ? palette.softBgHex + '33'
                            : '#dbe1ff40',
                        }
                      : undefined
                  }
                  className={`flex flex-col items-center py-1.5 px-0.5 rounded-xl transition-all min-h-[70px] sm:min-h-[76px] md:min-h-[82px] relative cursor-pointer select-none border ${
                    !cell.isCurrentMonth ? 'opacity-35' : ''
                  } ${
                    isSelected
                      ? 'border-2 shadow-sm scale-[1.02]'
                      : isToday
                      ? isHoliday
                        ? 'bg-[#ffebee]/70 border-[#b30026]/40'
                        : 'bg-[#eaedff] border-[#004ac6]/30'
                      : isHoliday
                      ? 'bg-[#fff5f5] hover:bg-[#ffebee]/60 border-[#ffcdd2]/50'
                      : 'hover:bg-[#f2f3ff] border-transparent'
                  }`}
                >
                  {/* Date Number Badge (공휴일 & 일요일 빨간색 표기) */}
                  <div className="flex items-center gap-0.5">
                    <span
                      style={
                        isSelected
                          ? {
                              backgroundColor: isHoliday
                                ? '#b30026'
                                : shift
                                ? palette.hex
                                : '#004ac6',
                              color: '#ffffff',
                            }
                          : undefined
                      }
                      className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                        isSelected
                          ? 'shadow-xs font-black'
                          : isToday
                          ? isHoliday
                            ? 'ring-2 ring-[#b30026] text-[#b30026] font-black bg-[#ffebee]'
                            : 'ring-2 ring-[#004ac6] text-[#004ac6] font-black'
                          : isHoliday || isWeekendSun
                          ? 'text-[#b30026] font-black'
                          : isWeekendSat
                          ? 'text-[#004ac6]'
                          : 'text-[#131b2e]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {isToday && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isHoliday ? 'bg-[#b30026]' : 'bg-[#004ac6]'}`}></span>
                    )}
                  </div>

                  {/* Public Holiday Tag Badge (날짜 아래에 어떤 공휴일인지 빨간색으로 표기) */}
                  {holiday && (
                    <div className="w-full flex justify-center px-0.5 my-0.5">
                      <span
                        className="text-[10px] sm:text-[11px] leading-tight font-black text-[#b30026] bg-[#ffebee] border border-[#ffcdd2] px-1 py-0.5 rounded text-center truncate max-w-full shadow-2xs tracking-tighter block"
                        title={holiday.name}
                      >
                        {holiday.name}
                      </span>
                    </div>
                  )}

                  {/* Shift Tag Chip */}
                  {shift && (
                    <div className="mt-1 w-full px-0.5 relative group">
                      <span
                        className="block truncate px-1 py-0.5 rounded font-bold text-[10px] leading-tight"
                        style={{
                          backgroundColor: palette.softBgHex,
                          color: palette.hex,
                        }}
                      >
                        {shift.type === 'leave' ? shift.leaveType || '휴무' : shift.name}
                      </span>

                      {/* Quick Delete overlay X icon on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteShiftByDate(cell.dateStr);
                          showToast(`${cell.dateStr} 근무가 삭제되었습니다.`);
                        }}
                        className="hidden md:group-hover:flex absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ad0033] text-white items-center justify-center text-[10px] shadow-xs cursor-pointer"
                        title="근무 삭제"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* VIEW B: WEEKLY VIEW (7 Days Detailed Schedule Cards) */}
      {calendarViewMode === 'weekly' && (
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3">
          {/* Weekly Summary Bar */}
          <div className="p-3.5 rounded-xl bg-[#eaedff] border border-[#004ac6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">date_range</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#131b2e]">
                  이번 주 근무 요약: {weeklyStats.workDaysCount}일 출근 · {weeklyStats.totalWorkedHours}시간
                </span>
                <span className="text-[11px] text-[#434655]">
                  주간 예상 급여: <strong className="text-[#004ac6]">{formatKRW(weeklyStats.totalPay)}원</strong>
                </span>
              </div>
            </div>

            {/* Weekly Holiday Pay Badge */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {weeklyStats.isHolidayPayEligible ? (
                <span className="px-2.5 py-1 rounded-lg bg-[#6ffbbe]/40 text-[#00714d] text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  <span>주 15시간 충족 (주휴수당 +{formatKRW(weeklyStats.estimatedWeeklyHolidayPay)}원)</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] text-[#737686] text-xs font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">hourglass_empty</span>
                  <span>주 15시간 미만 (현재 {weeklyStats.totalWorkedHours}h / 15h)</span>
                </span>
              )}
            </div>
          </div>

          {/* 7 Days List / Cards for the Week */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 pt-1">
            {weekDays.map((day) => {
              const shift = shiftMap.get(day.dateStr);
              const isSelected = selectedDate === day.dateStr;
              const isToday = todayDate === day.dateStr;
              const isSat = day.dayOfWeek === 5;
              const isSun = day.dayOfWeek === 6;
              const holiday = getKoreanHoliday(day.dateStr);
              const isHoliday = !!holiday;
              const shiftCalc = shift ? calculateShiftPay(shift) : null;
              const palette = getShiftColorPalette(shift, presetMap);

              return (
                <div
                  key={day.dateStr}
                  onClick={() => handleDayClick(day.dateStr)}
                  onContextMenu={(e) => handleContextMenu(e, day.dateStr)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(day.dateStr)}
                  style={
                    isSelected
                      ? {
                          borderColor: isHoliday ? '#b30026' : shift ? palette.hex : '#004ac6',
                          backgroundColor: isHoliday ? '#ffebee80' : shift ? palette.softBgHex + '33' : '#dbe1ff33',
                        }
                      : undefined
                  }
                  className={`flex flex-col rounded-2xl p-3 border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'shadow-sm ring-2 ring-[#004ac6]/20'
                      : isToday
                      ? isHoliday
                        ? 'bg-[#ffebee]/60 border-[#b30026]/40'
                        : 'bg-[#eaedff]/60 border-[#004ac6]/40'
                      : isHoliday
                      ? 'bg-[#fff5f5] hover:bg-[#ffebee]/50 border-[#ffcdd2]/60'
                      : 'bg-[#faf8ff] hover:bg-[#f2f3ff] border-[#c3c6d7]/30'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#c3c6d7]/20 flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-extrabold ${
                          isHoliday || isSun ? 'text-[#b30026]' : isSat ? 'text-[#004ac6]' : 'text-[#131b2e]'
                        }`}
                      >
                        {day.dayName}요일
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isHoliday || isSun ? 'text-[#b30026]' : 'text-[#737686]'
                        }`}
                      >
                        {day.monthNumber}.{day.dateNumber}
                      </span>
                    </div>

                    {isToday && (
                      <span className={`px-1.5 py-0.2 rounded text-white text-[9px] font-bold ${isHoliday ? 'bg-[#b30026]' : 'bg-[#004ac6]'}`}>
                        오늘
                      </span>
                    )}

                    {/* Weekly Public Holiday Badge */}
                    {holiday && (
                      <div className="w-full mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-[#ffebee] border border-[#ffcdd2] text-[#b30026] text-[10px] font-extrabold block truncate">
                          🔴 {holiday.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Day Shift Content */}
                  <div className="mt-2.5 flex-1 flex flex-col justify-between min-h-[70px]">
                    {shift ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 rounded-lg text-xs font-bold truncate"
                            style={{
                              backgroundColor: palette.softBgHex,
                              color: palette.hex,
                            }}
                          >
                            {shift.name}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteShiftByDate(day.dateStr);
                              showToast(`${day.dateStr} 근무가 삭제되었습니다.`);
                            }}
                            className="w-5 h-5 rounded-full hover:bg-[#ffdad6] text-[#ad0033] flex items-center justify-center transition-colors cursor-pointer"
                            title="삭제"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>

                        {shift.type === 'work' ? (
                          <>
                            <span className="text-[11px] text-[#434655]">
                              {shift.startTime} ~ {shift.endTime}
                            </span>
                            <div className="flex items-center justify-between pt-1 border-t border-[#eaedff]">
                              <span className="text-[10px] text-[#737686]">
                                {shiftCalc?.workedHours}시간
                              </span>
                              <span className="text-xs font-extrabold text-[#004ac6]">
                                {formatKRW(shiftCalc?.totalShiftPay || 0)}원
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[11px] text-[#ad0033] font-semibold">
                            {shift.leaveType || '휴무 일정'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setSelectedDate(day.dateStr);
                          if (isQuickStampActive && quickStampPresetId) {
                            stampPresetOnDate(day.dateStr, quickStampPresetId);
                          } else {
                            setActiveTab('add-shift');
                          }
                        }}
                        className="h-full flex flex-col items-center justify-center py-3 text-center border border-dashed border-[#c3c6d7]/50 rounded-xl hover:bg-white transition-all text-[#737686] hover:text-[#004ac6]"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span className="text-[10px] font-semibold mt-0.5">근무 추가</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* VIEW C: LIST VIEW (Chronological Shift Table) */}
      {calendarViewMode === 'list' && (
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3">
          {/* Filter Pills & Month Totals */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#eaedff]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setListFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  listFilter === 'all'
                    ? 'bg-[#004ac6] text-white shadow-xs'
                    : 'bg-[#f2f3ff] text-[#434655] hover:bg-[#eaedff]'
                }`}
              >
                전체 ({monthShifts.length})
              </button>
              <button
                type="button"
                onClick={() => setListFilter('work')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  listFilter === 'work'
                    ? 'bg-[#004ac6] text-white shadow-xs'
                    : 'bg-[#f2f3ff] text-[#434655] hover:bg-[#eaedff]'
                }`}
              >
                출근 근무 ({monthShifts.filter((s) => s.type === 'work').length})
              </button>
              <button
                type="button"
                onClick={() => setListFilter('leave')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  listFilter === 'leave'
                    ? 'bg-[#004ac6] text-white shadow-xs'
                    : 'bg-[#f2f3ff] text-[#434655] hover:bg-[#eaedff]'
                }`}
              >
                휴무·연차 ({monthShifts.filter((s) => s.type === 'leave').length})
              </button>
            </div>

            <div className="text-xs text-[#737686]">
              총 {monthShifts.length}건 기록 · 실근로 {currentMonthlySummary.totalWorkedHours}시간
            </div>
          </div>

          {/* List Items */}
          <div className="flex flex-col gap-2">
            {filteredMonthShifts.length > 0 ? (
              filteredMonthShifts.map((shift) => {
                const shiftCalc = calculateShiftPay(shift);
                const [y, m, d] = shift.date.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                const dayName = dayNames[dateObj.getDay()];
                const isSat = dateObj.getDay() === 6;
                const isSun = dateObj.getDay() === 0;
                const holiday = getKoreanHoliday(shift.date);
                const palette = getShiftColorPalette(shift, presetMap);

                return (
                  <div
                    key={shift.id}
                    onClick={() => setSelectedDate(shift.date)}
                    className="p-3 rounded-xl bg-[#faf8ff] hover:bg-[#f2f3ff] border border-[#eaedff] flex items-center justify-between gap-3 transition-all cursor-pointer"
                  >
                    {/* Left: Date & Type */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-[#c3c6d7]/30 flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <span className="text-[10px] text-[#737686]">{m}월</span>
                        <span
                          className={`text-sm font-extrabold ${
                            holiday || isSun ? 'text-[#b30026]' : isSat ? 'text-[#004ac6]' : 'text-[#131b2e]'
                          }`}
                        >
                          {d} ({dayName})
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold"
                            style={{
                              backgroundColor: palette.softBgHex,
                              color: palette.hex,
                            }}
                          >
                            {shift.name}
                          </span>
                          {holiday && (
                            <span className="px-2 py-0.5 rounded bg-[#ffebee] border border-[#ffcdd2] text-[#b30026] text-[10px] font-extrabold">
                              🔴 {holiday.name}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[#131b2e] truncate">
                            {activeWorkplace.name}
                          </span>
                        </div>

                        <div className="text-xs text-[#434655] mt-1 flex items-center gap-2">
                          {shift.type === 'work' ? (
                            <>
                              <span>
                                {shift.startTime} ~ {shift.endTime} (휴게 {shift.breakMinutes}분)
                              </span>
                              <span>·</span>
                              <span className="font-semibold text-[#131b2e]">
                                {shiftCalc.workedHours}시간 근무
                              </span>
                            </>
                          ) : (
                            <span className="text-[#ad0033] font-medium">
                              {shift.leaveType || '휴무 일정'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Calculated Amount & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-[#737686] block">일 정산액</span>
                        <span className="text-sm md:text-base font-extrabold text-[#004ac6]">
                          {formatKRW(shiftCalc.totalShiftPay)}원
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(shift.date);
                            setActiveTab('add-shift');
                          }}
                          className="w-8 h-8 rounded-full bg-white hover:bg-[#eaedff] text-[#004ac6] flex items-center justify-center border border-[#c3c6d7]/30 shadow-xs cursor-pointer active:scale-90"
                          title="수정"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteShiftByDate(shift.date);
                            showToast(`${shift.date} 근무가 삭제되었습니다.`);
                          }}
                          className="w-8 h-8 rounded-full bg-white hover:bg-[#ffdad6] text-[#ad0033] flex items-center justify-center border border-[#c3c6d7]/30 shadow-xs cursor-pointer active:scale-90"
                          title="삭제"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]/50 flex flex-col items-center justify-center gap-2 text-[#737686]">
                <span className="material-symbols-outlined text-[32px] text-[#c3c6d7]">event_busy</span>
                <span className="text-xs font-semibold">해당 조건의 등록된 근무가 없습니다.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('add-shift')}
                  className="mt-1 px-4 py-1.5 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                >
                  + 새 근무 등록
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Selected Date Details Card (Matched to Preset Color Theme & Holiday Highlight) */}
      <section
        style={{
          borderColor: selectedShift
            ? selectedDatePalette.hex + '40'
            : selectedDateHoliday
            ? '#b3002650'
            : '#c3c6d740',
        }}
        className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col gap-2.5 relative transition-all"
      >
        {/* Public Holiday Banner if Selected Date is a holiday */}
        {selectedDateHoliday && (
          <div className="p-3 rounded-xl bg-[#ffebee] border border-[#ffcdd2] flex items-center justify-between text-xs text-[#b30026] font-bold animate-in fade-in flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-[#b30026]">celebration</span>
              <span className="text-sm font-extrabold">법정 공휴일: {selectedDateHoliday.name}</span>
            </div>
            <span className="text-[11px] font-semibold text-[#b30026] px-2 py-0.5 rounded bg-white/80 border border-[#ffcdd2]">
              휴일근로 가산수당(1.5배) 규정 적용 대상
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Color-matched Selected Date Badge */}
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
              style={{
                backgroundColor: selectedDateHoliday
                  ? '#b30026'
                  : selectedShift
                  ? selectedDatePalette.hex
                  : '#004ac6',
              }}
            >
              선택일
            </span>
            <span className="text-base font-bold text-[#131b2e]">{selectedDateFormatted} 근무 상세</span>
          </div>

          <div className="flex items-center gap-1.5">
            {selectedShift && (
              <button
                onClick={() => {
                  deleteShiftByDate(selectedDate);
                  showToast(`${selectedDate} 근무가 삭제되었습니다.`);
                }}
                className="flex items-center gap-1 text-xs text-[#ad0033] hover:bg-[#ffdad6]/40 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                title="해당 날짜 근무 삭제"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>삭제</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('add-shift')}
              className="text-[#434655] hover:text-[#004ac6] transition-colors flex items-center gap-0.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#f2f3ff] cursor-pointer"
              type="button"
            >
              <span>{selectedShift ? '편집' : '등록'}</span>
              <span className="material-symbols-outlined text-[15px]">edit</span>
            </button>
          </div>
        </div>

        {/* Shift Details Box (Styled with the preset theme color!) */}
        {selectedShift ? (
          <div
            style={{
              backgroundColor: selectedDatePalette.softBgHex + '25',
              borderColor: selectedDatePalette.hex + '30',
            }}
            className="rounded-xl p-3.5 flex flex-col gap-2 border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ color: selectedDatePalette.hex }}
                >
                  {selectedShift.type === 'leave'
                    ? 'beach_access'
                    : selectedShift.name.includes('연구')
                    ? 'science'
                    : 'local_cafe'}
                </span>
                <span className="text-sm font-bold text-[#131b2e]">
                  {activeWorkplace.name} · {selectedShift.name}
                </span>
              </div>
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{
                  backgroundColor: selectedDatePalette.softBgHex,
                  color: selectedDatePalette.hex,
                }}
              >
                {selectedShift.status === 'completed' ? '출근 완료' : '예정'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#434655] pt-0.5">
              <span>
                시간: {selectedShift.startTime} ~ {selectedShift.endTime} (
                {selectedShiftCalc?.workedHours || 0}시간)
              </span>
              <span>기본시급: {formatKRW(selectedShift.hourlyWage)}원</span>
            </div>

            {/* Wage Highlight Row */}
            <div className="flex items-center justify-between pt-2 mt-1 bg-white rounded-lg px-3 py-2 border border-[#eaedff]">
              <span className="text-xs font-medium text-[#434655]">일 예상 급여</span>
              <span
                className="text-base font-extrabold"
                style={{ color: selectedDatePalette.hex }}
              >
                {formatKRW(selectedShiftCalc?.totalShiftPay || 0)}원
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#f2f3ff] rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs text-[#737686]">등록된 근무나 휴무 일정이 없습니다.</span>
            <button
              onClick={() => setActiveTab('add-shift')}
              className="px-3 py-1.5 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              + 근무 등록
            </button>
          </div>
        )}
      </section>

      {/* 5. Timesheet Document Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#c3c6d7]/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#dbe1ff]/60 text-[#004ac6] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">description</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-[#131b2e] truncate">
              {month}월 근무표 및 출퇴근 확인서
            </span>
            <span className="text-xs text-[#434655] truncate">
              총 {currentMonthlySummary.totalWorkedHours}시간 · 세무·급여 증빙용 문서/PDF
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openPdfModal('timesheet')}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#004ac6]/90 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>PDF/문서 저장</span>
        </button>
      </div>

      {/* 6. Sticky Quick Preset Action Bar + Trash Drop Zone */}
      <div className="sticky bottom-18 md:bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl flex flex-col gap-2 border border-[#eaedff]">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1 text-[#004ac6] text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>원터치 퀵 등록 & 드래그 배정</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-[10px] font-bold">
              선택일: {selectedDate.slice(5)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openPresetModal()}
              className="text-[#004ac6] hover:underline text-xs font-bold flex items-center gap-0.5 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>새 프리셋</span>
            </button>
          </div>
        </div>

        {/* Tip Box with Delete Shortcut Guidance */}
        <div className="px-2.5 py-1.5 rounded-lg bg-[#f2f3ff] flex items-center justify-between gap-1 text-[11px] text-[#434655] leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#004ac6] text-[15px] shrink-0">lightbulb</span>
            <span>
              <strong className="text-[#131b2e] font-semibold">삭제 팁:</strong> 날짜를 <strong>마우스 우클릭</strong>하거나 <strong>꾹 누르면</strong> 삭제되며, 카드를 오른쪽 <strong>휴지통</strong>으로 드래그해도 삭제됩니다!
            </span>
          </div>
          <span className="material-symbols-outlined text-[#737686] text-[14px] shrink-0">drag_indicator</span>
        </div>

        {/* Horizontal Quick Preset Chips + Trash Can Drop Zone */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-0.5">
          {presets.map((preset) => {
            const isSelectedForStamp = quickStampPresetId === preset.id;
            const presetPal = PRESET_COLOR_PALETTES[preset.colorTheme || preset.badgeTheme] || PRESET_COLOR_PALETTES.blue;
            return (
              <button
                key={preset.id}
                draggable
                onDragStart={() => setDraggedPresetId(preset.id)}
                onClick={() => {
                  setQuickStampPresetId(preset.id);
                  setIsQuickStampActive(true);
                  stampPresetOnDate(selectedDate, preset.id);
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-left cursor-grab active:scale-95 transition-all ${
                  isSelectedForStamp
                    ? 'bg-white border-2 shadow-xs ring-2'
                    : 'bg-[#f2f3ff] hover:bg-[#eaedff] border border-transparent'
                }`}
                style={
                  isSelectedForStamp
                    ? {
                        borderColor: presetPal.hex,
                        boxShadow: `0 0 0 2px ${presetPal.hex}25`,
                      }
                    : undefined
                }
                type="button"
              >
                <div
                  className="flex items-center"
                  style={{ color: presetPal.hex }}
                >
                  <span className="material-symbols-outlined text-[15px] text-[#737686] opacity-60">
                    drag_indicator
                  </span>
                  <span className="material-symbols-outlined text-[18px] ml-0.5">
                    {isSelectedForStamp ? 'check_circle' : 'add_circle'}
                  </span>
                </div>
                <div className="flex flex-col pr-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[#131b2e]">{preset.name}</span>
                    {isSelectedForStamp && (
                      <span
                        className="text-[9px] px-1 rounded text-white font-bold"
                        style={{ backgroundColor: presetPal.hex }}
                      >
                        활성
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#434655]">
                    {preset.startTime}-{preset.endTime}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Dedicated Trash / Remove Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleTrashDrop}
            onClick={() => {
              deleteShiftByDate(selectedDate);
              showToast(`${selectedDate} 근무가 삭제되었습니다.`);
            }}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ffdad6]/50 hover:bg-[#ffdad6] text-[#ad0033] border border-[#ad0033]/30 cursor-pointer active:scale-95 transition-all"
            title="여기로 근무를 드래그하거나 클릭하여 선택일 근무 삭제"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold">드래그 삭제</span>
              <span className="text-[10px] text-[#ad0033]/80">휴지통에 드롭</span>
            </div>
          </div>

          <button
            onClick={() => openPresetModal()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[#c3c6d7] hover:bg-[#eaedff] text-[#004ac6] active:scale-95 transition-all text-left cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle_outline</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#004ac6]">새 프리셋 추가</span>
              <span className="text-[10px] text-[#434655]">시간/색상 설정</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
