import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
    weekStartsOn,
    setWeekStartsOn,
    openDataSafetyModal,
    hasPendingDriveBackup,
    isGoogleDriveConnected,
    hasUsedDriveBefore,
    saveToDriveWithConfirm,
  } = useShift();

  const [calendarViewMode, setCalendarViewMode] = useState<'monthly' | 'weekly' | 'list'>('monthly');
  const [listFilter, setListFilter] = useState<'all' | 'work' | 'leave'>('all');
  const [draggedPresetId, setDraggedPresetId] = useState<string | null>(null);
  const [draggedFromDate, setDraggedFromDate] = useState<string | null>(null);
  const [isQuickBarOpen, setIsQuickBarOpen] = useState<boolean>(true);

  const handleExitQuickStamp = (toastText?: string) => {
    setIsQuickStampActive(false);
    setQuickStampPresetId(null);
    if (toastText) showToast(toastText);
    if (hasPendingDriveBackup && (isGoogleDriveConnected || hasUsedDriveBefore)) {
      saveToDriveWithConfirm();
    }
  };

  // Map of presets for quick theme resolution
  const presetMap = useMemo(() => {
    const map = new Map<string, (typeof presets)[0]>();
    presets.forEach((p) => map.set(p.id, p));
    return map;
  }, [presets]);

  // Pending shift deletion confirmation state (prevents accidental deletions)
  const [pendingDeleteDate, setPendingDeleteDate] = useState<string | null>(null);

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

  // Calendar days calculation (supports Sunday-start or Monday-start)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const rawFirstDow = firstDay.getDay();
    const startDayOffset = weekStartsOn === 'mon' ? (rawFirstDow + 6) % 7 : rawFirstDow;

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      dayOfWeek: number;
    }> = [];

    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(prevY, prevM - 1, d).getDay();
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        dayOfWeek: dow,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(year, month - 1, d).getDay();
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        dayOfWeek: dow,
      });
    }

    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextM = month === 12 ? 1 : month + 1;
        const nextY = month === 12 ? year + 1 : year;
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dow = new Date(nextY, nextM - 1, i).getDay();
        days.push({
          dateStr,
          dayNumber: i,
          isCurrentMonth: false,
          dayOfWeek: dow,
        });
      }
    }

    return days;
  }, [year, month, weekStartsOn]);

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
    const rawDow = targetDate.getDay(); // 0 is Sunday, 6 is Saturday
    const offset = weekStartsOn === 'mon' ? (rawDow + 6) % 7 : rawDow;

    const startDate = new Date(targetDate);
    startDate.setDate(targetDate.getDate() - offset);

    const days: Array<{
      dateStr: string;
      dateNumber: number;
      monthNumber: number;
      yearNumber: number;
      dayOfWeek: number;
      dayName: string;
    }> = [];

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dateNum = d.getDate();
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
      const dow = d.getDay();

      days.push({
        dateStr,
        dateNumber: dateNum,
        monthNumber: m,
        yearNumber: y,
        dayOfWeek: dow,
        dayName: dayNames[dow],
      });
    }

    return days;
  }, [weekRefDateStr, weekStartsOn]);

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

  // Detect coarse/touch pointers so HTML5 drag-and-drop never hijacks mobile touch scrolling
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia?.('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    );
  }, []);

  // 4-second strictly drag/scroll-safe long-press delete state
  // 1) Recognizes stationary hold after 300ms (no flicker during normal tap/scroll)
  // 2) Requires 4 full seconds (4000ms) AFTER recognition (total 4300ms) with ZERO drag or scroll
  // 3) Disabled completely while Quick Stamp mode is active so stamping + dragging never deletes
  const LONG_PRESS_RECOGNIZE_MS = 300;
  const LONG_PRESS_HOLD_MS = 4000;
  const LONG_PRESS_TOTAL_MS = LONG_PRESS_RECOGNIZE_MS + LONG_PRESS_HOLD_MS;
  const LONG_PRESS_MOVE_PX = 5;
  const LONG_PRESS_SCROLL_PX = 1;
  const LONG_PRESS_RECT_DRIFT_PX = 1.5;
  const RECENT_SCROLL_COOLDOWN_MS = 500;

  const getCurrentScrollMetrics = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return { x: 0, y: 0, docTop: 0, docLeft: 0, vvTop: 0, vvLeft: 0 };
    }
    const scrollingEl = document.scrollingElement || document.documentElement;
    return {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0,
      docTop: (scrollingEl?.scrollTop || 0) + (document.body?.scrollTop || 0),
      docLeft: (scrollingEl?.scrollLeft || 0) + (document.body?.scrollLeft || 0),
      vvTop: window.visualViewport?.offsetTop ?? 0,
      vvLeft: window.visualViewport?.offsetLeft ?? 0,
    };
  }, []);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollEventCounterRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const touchTrackRef = useRef<{
    dateStr: string;
    targetEl: HTMLElement | null;
    touchIdentifier: number | null;
    startClientX: number;
    startClientY: number;
    startPageX: number;
    startPageY: number;
    startRectTop: number;
    startRectLeft: number;
    startScrollX: number;
    startScrollY: number;
    startDocTop: number;
    startDocLeft: number;
    startVvTop: number;
    startVvLeft: number;
    startScrollEpoch: number;
    startedAt: number;
    cancelled: boolean;
    isTouch: boolean;
  } | null>(null);
  const suppressClickRef = useRef<boolean>(false);
  const lastTouchTimeRef = useRef<number>(0);
  const [pressingInfo, setPressingInfo] = useState<{
    dateStr: string;
    progress: number;
    remainingSec: number;
  } | null>(null);

  const pressingDateStr = pressingInfo?.dateStr ?? null;

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressWatchdogRef.current) {
      clearInterval(longPressWatchdogRef.current);
      longPressWatchdogRef.current = null;
    }
    if (touchTrackRef.current) {
      touchTrackRef.current.cancelled = true;
      touchTrackRef.current = null;
    }
    setPressingInfo(null);
  }, []);

  const hasViewportOrElementMoved = useCallback(
    (state: NonNullable<typeof touchTrackRef.current>) => {
      if (state.cancelled) return true;
      if (scrollEventCounterRef.current !== state.startScrollEpoch) return true;

      const cur = getCurrentScrollMetrics();
      if (
        Math.abs(cur.x - state.startScrollX) > LONG_PRESS_SCROLL_PX ||
        Math.abs(cur.y - state.startScrollY) > LONG_PRESS_SCROLL_PX ||
        Math.abs(cur.docTop - state.startDocTop) > LONG_PRESS_SCROLL_PX ||
        Math.abs(cur.docLeft - state.startDocLeft) > LONG_PRESS_SCROLL_PX ||
        Math.abs(cur.vvTop - state.startVvTop) > LONG_PRESS_SCROLL_PX ||
        Math.abs(cur.vvLeft - state.startVvLeft) > LONG_PRESS_SCROLL_PX
      ) {
        return true;
      }

      if (state.targetEl && state.targetEl.isConnected) {
        const rect = state.targetEl.getBoundingClientRect();
        if (
          Math.abs(rect.top - state.startRectTop) > LONG_PRESS_RECT_DRIFT_PX ||
          Math.abs(rect.left - state.startRectLeft) > LONG_PRESS_RECT_DRIFT_PX
        ) {
          return true;
        }
      }

      return false;
    },
    [getCurrentScrollMetrics]
  );

  // Global capture listeners: cancel immediately on ANY scroll, wheel, drag, pointer/touch movement, or OS cancel
  useEffect(() => {
    const handleAnyScroll = () => {
      scrollEventCounterRef.current += 1;
      lastScrollTimeRef.current = Date.now();
      if (touchTrackRef.current || longPressTimerRef.current || longPressWatchdogRef.current) {
        cancelLongPress();
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const state = touchTrackRef.current;
      if (!state || !state.isTouch) return;
      if (e.touches.length !== 1) {
        cancelLongPress();
        return;
      }
      const touch = e.touches[0];
      if (state.touchIdentifier !== null && touch.identifier !== state.touchIdentifier) {
        cancelLongPress();
        return;
      }
      const dxClient = Math.abs(touch.clientX - state.startClientX);
      const dyClient = Math.abs(touch.clientY - state.startClientY);
      const dxPage = Math.abs(touch.pageX - state.startPageX);
      const dyPage = Math.abs(touch.pageY - state.startPageY);
      if (
        dxClient > LONG_PRESS_MOVE_PX ||
        dyClient > LONG_PRESS_MOVE_PX ||
        dxPage > LONG_PRESS_MOVE_PX ||
        dyPage > LONG_PRESS_MOVE_PX ||
        hasViewportOrElementMoved(state)
      ) {
        lastScrollTimeRef.current = Date.now();
        cancelLongPress();
      }
    };

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const state = touchTrackRef.current;
      if (!state) return;
      const dxClient = Math.abs(e.clientX - state.startClientX);
      const dyClient = Math.abs(e.clientY - state.startClientY);
      const dxPage = Math.abs(e.pageX - state.startPageX);
      const dyPage = Math.abs(e.pageY - state.startPageY);
      if (
        dxClient > LONG_PRESS_MOVE_PX ||
        dyClient > LONG_PRESS_MOVE_PX ||
        dxPage > LONG_PRESS_MOVE_PX ||
        dyPage > LONG_PRESS_MOVE_PX ||
        hasViewportOrElementMoved(state)
      ) {
        cancelLongPress();
      }
    };

    const handleGlobalCancel = () => {
      if (touchTrackRef.current || longPressTimerRef.current || longPressWatchdogRef.current) {
        cancelLongPress();
      }
    };

    window.addEventListener('scroll', handleAnyScroll, { capture: true, passive: true });
    document.addEventListener('scroll', handleAnyScroll, { capture: true, passive: true });
    window.addEventListener('wheel', handleAnyScroll, { passive: true });
    window.addEventListener('touchmove', handleGlobalTouchMove, { capture: true, passive: true });
    window.addEventListener('pointermove', handleGlobalPointerMove, { capture: true, passive: true });
    window.addEventListener('pointercancel', handleGlobalCancel, { capture: true, passive: true });
    window.addEventListener('touchcancel', handleGlobalCancel, { capture: true, passive: true });
    window.addEventListener('touchend', handleGlobalCancel, { capture: true, passive: true });
    window.addEventListener('dragstart', handleGlobalCancel, { capture: true });
    window.addEventListener('blur', handleGlobalCancel);
    document.addEventListener('visibilitychange', handleGlobalCancel);

    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener('scroll', handleAnyScroll);
    vv?.addEventListener('resize', handleAnyScroll);

    return () => {
      window.removeEventListener('scroll', handleAnyScroll, true);
      document.removeEventListener('scroll', handleAnyScroll, true);
      window.removeEventListener('wheel', handleAnyScroll);
      window.removeEventListener('touchmove', handleGlobalTouchMove, true);
      window.removeEventListener('pointermove', handleGlobalPointerMove, true);
      window.removeEventListener('pointercancel', handleGlobalCancel, true);
      window.removeEventListener('touchcancel', handleGlobalCancel, true);
      window.removeEventListener('touchend', handleGlobalCancel, true);
      window.removeEventListener('dragstart', handleGlobalCancel, true);
      window.removeEventListener('blur', handleGlobalCancel);
      document.removeEventListener('visibilitychange', handleGlobalCancel);
      vv?.removeEventListener('scroll', handleAnyScroll);
      vv?.removeEventListener('resize', handleAnyScroll);
      cancelLongPress();
    };
  }, [cancelLongPress, hasViewportOrElementMoved]);

  // Cancel any in-progress long-press if Quick Stamp mode turns ON
  useEffect(() => {
    if (isQuickStampActive) {
      cancelLongPress();
    }
  }, [isQuickStampActive, cancelLongPress]);

  // Request confirmation before deleting a shift (prevents accidental deletion during touch/scroll)
  const requestDeleteShift = useCallback(
    (dateStr: string) => {
      const existing = shiftMap.get(dateStr);
      if (!existing) {
        showToast('선택한 날짜에 삭제할 근무 기록이 없습니다.');
        return;
      }
      setPendingDeleteDate(dateStr);
    },
    [shiftMap, showToast]
  );

  const startCellLongPress = useCallback(
    (
      dateStr: string,
      targetEl: HTMLElement | null,
      clientX: number,
      clientY: number,
      pageX: number,
      pageY: number,
      isTouch: boolean,
      touchIdentifier: number | null
    ) => {
      cancelLongPress();

      // Never allow long-press delete while Quick Stamp mode is active, if no shift exists,
      // or right after the user finished scrolling/dragging
      if (isQuickStampActive) return;
      if (!shiftMap.get(dateStr)) return;
      if (Date.now() - lastScrollTimeRef.current < RECENT_SCROLL_COOLDOWN_MS) return;

      const scrollMetrics = getCurrentScrollMetrics();
      const rect = targetEl ? targetEl.getBoundingClientRect() : { top: 0, left: 0 };

      const state = {
        dateStr,
        targetEl,
        touchIdentifier,
        startClientX: clientX,
        startClientY: clientY,
        startPageX: pageX,
        startPageY: pageY,
        startRectTop: rect.top,
        startRectLeft: rect.left,
        startScrollX: scrollMetrics.x,
        startScrollY: scrollMetrics.y,
        startDocTop: scrollMetrics.docTop,
        startDocLeft: scrollMetrics.docLeft,
        startVvTop: scrollMetrics.vvTop,
        startVvLeft: scrollMetrics.vvLeft,
        startScrollEpoch: scrollEventCounterRef.current,
        startedAt: Date.now(),
        cancelled: false,
        isTouch,
      };
      touchTrackRef.current = state;
      suppressClickRef.current = false;

      // Continuous watchdog every 80ms: detects any scroll/drag/layout shift/rect movement immediately
      // Recognizes stationary hold at 300ms, then counts down 4 full seconds (4 -> 3 -> 2 -> 1)
      longPressWatchdogRef.current = setInterval(() => {
        if (state.cancelled || touchTrackRef.current !== state || hasViewportOrElementMoved(state)) {
          cancelLongPress();
          return;
        }
        const elapsed = Date.now() - state.startedAt;
        if (elapsed >= LONG_PRESS_RECOGNIZE_MS) {
          const holdElapsed = elapsed - LONG_PRESS_RECOGNIZE_MS;
          const progress = Math.min(100, Math.round((holdElapsed / LONG_PRESS_HOLD_MS) * 100));
          const remainingSec = Math.max(1, Math.ceil((LONG_PRESS_HOLD_MS - holdElapsed) / 1000));
          setPressingInfo({ dateStr, progress, remainingSec });
        }
      }, 80);

      // Trigger delete confirmation strictly 4.0 seconds AFTER stationary hold recognition (4.3s total)
      longPressTimerRef.current = setTimeout(() => {
        if (state.cancelled || touchTrackRef.current !== state || hasViewportOrElementMoved(state)) {
          cancelLongPress();
          return;
        }

        cancelLongPress();
        suppressClickRef.current = true;
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(40);
        }
        setSelectedDate(dateStr);
        requestDeleteShift(dateStr);
      }, LONG_PRESS_TOTAL_MS);
    },
    [
      cancelLongPress,
      isQuickStampActive,
      shiftMap,
      getCurrentScrollMetrics,
      hasViewportOrElementMoved,
      setSelectedDate,
      requestDeleteShift,
    ]
  );

  const handleCellTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>, dateStr: string) => {
      lastTouchTimeRef.current = Date.now();
      if (e.touches.length !== 1) {
        cancelLongPress();
        return;
      }
      const touch = e.touches[0];
      startCellLongPress(
        dateStr,
        e.currentTarget,
        touch.clientX,
        touch.clientY,
        touch.pageX,
        touch.pageY,
        true,
        touch.identifier
      );
    },
    [cancelLongPress, startCellLongPress]
  );

  const handleCellTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const state = touchTrackRef.current;
      if (!state || !state.isTouch) return;
      if (e.touches.length !== 1) {
        cancelLongPress();
        return;
      }
      const touch = e.touches[0];
      if (state.touchIdentifier !== null && touch.identifier !== state.touchIdentifier) {
        cancelLongPress();
        return;
      }
      const dxClient = Math.abs(touch.clientX - state.startClientX);
      const dyClient = Math.abs(touch.clientY - state.startClientY);
      const dxPage = Math.abs(touch.pageX - state.startPageX);
      const dyPage = Math.abs(touch.pageY - state.startPageY);
      if (
        dxClient > LONG_PRESS_MOVE_PX ||
        dyClient > LONG_PRESS_MOVE_PX ||
        dxPage > LONG_PRESS_MOVE_PX ||
        dyPage > LONG_PRESS_MOVE_PX ||
        hasViewportOrElementMoved(state)
      ) {
        lastScrollTimeRef.current = Date.now();
        cancelLongPress();
      }
    },
    [cancelLongPress, hasViewportOrElementMoved]
  );

  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, dateStr: string) => {
      if (e.button !== 0) return;
      // Ignore synthetic mouse events fired after mobile touch interactions
      if (isTouchDevice || Date.now() - lastTouchTimeRef.current < 1500) return;
      startCellLongPress(dateStr, e.currentTarget, e.clientX, e.clientY, e.pageX, e.pageY, false, null);
    },
    [isTouchDevice, startCellLongPress]
  );

  const handleCellMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const state = touchTrackRef.current;
      if (!state || state.isTouch) return;
      const dxClient = Math.abs(e.clientX - state.startClientX);
      const dyClient = Math.abs(e.clientY - state.startClientY);
      const dxPage = Math.abs(e.pageX - state.startPageX);
      const dyPage = Math.abs(e.pageY - state.startPageY);
      if (
        dxClient > LONG_PRESS_MOVE_PX ||
        dyClient > LONG_PRESS_MOVE_PX ||
        dxPage > LONG_PRESS_MOVE_PX ||
        dyPage > LONG_PRESS_MOVE_PX ||
        hasViewportOrElementMoved(state)
      ) {
        cancelLongPress();
      }
    },
    [cancelLongPress, hasViewportOrElementMoved]
  );

  // Click handler for day cell
  const handleDayClick = (dateStr: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSelectedDate(dateStr);

    if (isQuickStampActive && quickStampPresetId) {
      stampPresetOnDate(dateStr, quickStampPresetId);
      const targetPreset = presets.find((p) => p.id === quickStampPresetId);
      showToast(`${dateStr}에 '${targetPreset?.name || '근무'}' 등록 완료! (다른 날짜도 연속 등록 가능)`);
    }
  };

  const confirmDeleteShift = () => {
    if (!pendingDeleteDate) return;
    deleteShiftByDate(pendingDeleteDate);
    showToast(`${pendingDeleteDate} 근무가 삭제되었습니다.`);
    setPendingDeleteDate(null);
  };

  // Drag and drop handlers (desktop only — disabled on touch screens so scrolling never drops/deletes shifts)
  const handleDragStart = (e: React.DragEvent, dateStr: string) => {
    if (isTouchDevice) {
      e.preventDefault();
      return;
    }
    cancelLongPress();
    setDraggedFromDate(dateStr);
    e.dataTransfer.setData('text/plain', dateStr);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isTouchDevice) return;
    e.preventDefault();
  };

  const handleDrop = (dateStr: string) => {
    if (isTouchDevice) return;
    if (draggedPresetId) {
      if (draggedPresetId === 'DELETE_TOOL') {
        requestDeleteShift(dateStr);
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
    if (isTouchDevice) return;
    e.preventDefault();
    if (draggedFromDate) {
      const targetDate = draggedFromDate;
      setDraggedFromDate(null);
      requestDeleteShift(targetDate);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 sm:gap-4 pb-24 sm:pb-28 md:pb-12 max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-1 sm:pt-2">
      {/* Auto-Save & Empty State Helpful Prompt with Instant Restore */}
      {shifts.length === 0 && (
        <div className="p-3 sm:p-4 rounded-2xl bg-[#eaedff] border border-[#004ac6]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[#004ac6] text-[20px] shrink-0 mt-0.5">info</span>
            <div className="text-xs text-[#131b2e] leading-relaxed">
              <span className="font-bold">현재 등록된 근무가 없습니다.</span>
              <p className="text-[11px] text-[#434655] mt-0.5">
                데이터가 초기화되었거나 기기를 새로 접속하셨다면 백업으로 1초 만에 복원하실 수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openDataSafetyModal}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#dbe1ff] text-[#004ac6] border border-[#004ac6]/30 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>백업 복원</span>
            </button>
            <button
              onClick={loadSampleData}
              className="px-3 py-1.5 rounded-xl bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              샘플 로드
            </button>
          </div>
        </div>
      )}

      {/* 1. Monthly Financial Summary Card */}
      <section className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-2.5 sm:gap-3 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[#004ac6]/10 blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10 flex-wrap gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1">
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
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={openDataSafetyModal}
              className="inline-flex items-center gap-1 bg-[#6cf8bb]/30 hover:bg-[#6cf8bb]/50 text-[#006c49] border border-[#006c49]/20 px-2 py-0.5 rounded-full font-bold text-[11px] sm:text-xs transition-all active:scale-95 cursor-pointer"
              title="크롬 기록삭제 대비 데이터 백업 및 복원"
            >
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]">shield</span>
              <span>안전보관</span>
            </button>
            <div className="inline-flex items-center gap-1 bg-[#eaedff] px-2 py-0.5 rounded-full text-[#004ac6] font-bold text-[11px] sm:text-xs tabular-nums">
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]">event_available</span>
              <span>급여 {paydayDDay.dDayText} ({paydayDDay.paydayFormatted})</span>
            </div>
          </div>
        </div>

        {/* Main Amount Display */}
        <div className="flex flex-col gap-0.5 relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl min-[380px]:text-3xl md:text-4xl font-extrabold text-[#004ac6] tracking-tight tabular-nums">
              {formatKRW(currentMonthlySummary.netPay)}
            </span>
            <span className="text-base sm:text-lg font-bold text-[#131b2e]">원</span>
          </div>
          <div className="flex items-center gap-1 text-[#006c49] text-[11px] sm:text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px] sm:text-[16px] shrink-0">trending_up</span>
            <span className="truncate tabular-nums">
              시급 {formatKRW(activeWorkplace.hourlyWage)}원 · 주휴수당 자동 산정
            </span>
          </div>
        </div>

        {/* Micro Stats Bento Grid (Responsive on Galaxy Fold & Tablets) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5 relative z-10">
          <div className="bg-[#f2f3ff] rounded-xl p-2 sm:p-2.5 flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-medium text-[#434655] truncate">총 근무</span>
            <span className="text-xs min-[380px]:text-sm font-bold text-[#131b2e] mt-0.5 tabular-nums whitespace-nowrap">
              {currentMonthlySummary.totalWorkedHours}시간
            </span>
          </div>
          <div className="bg-[#6ffbbe]/25 rounded-xl p-2 sm:p-2.5 flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#006c49] truncate">주휴수당</span>
            <span className="text-xs min-[380px]:text-sm font-bold text-[#006c49] mt-0.5 tabular-nums whitespace-nowrap truncate">
              +{formatKRW(currentMonthlySummary.weeklyHolidayPay)}원
            </span>
          </div>
          <div className="bg-[#ffdad6]/40 rounded-xl p-2 sm:p-2.5 flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#ad0033] truncate">공제액</span>
            <span className="text-xs min-[380px]:text-sm font-bold text-[#ad0033] mt-0.5 tabular-nums whitespace-nowrap truncate">
              -{formatKRW(currentMonthlySummary.totalDeductions)}원
            </span>
          </div>
        </div>
      </section>

      {/* 2. Month/Week Navigation & Segmented View Controls */}
      <section className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {calendarViewMode === 'weekly' ? (
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  aria-label="이전 주"
                  onClick={handlePrevWeek}
                  className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-90 transition-all flex items-center justify-center text-[#131b2e] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <h2 className="text-base min-[380px]:text-lg md:text-xl font-bold text-[#131b2e] tracking-tight tabular-nums">
                  {weekDays[0].monthNumber}.{weekDays[0].dateNumber} ~ {weekDays[6].monthNumber}.{weekDays[6].dateNumber}
                </h2>
                <button
                  aria-label="다음 주"
                  onClick={handleNextWeek}
                  className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-90 transition-all flex items-center justify-center text-[#131b2e] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
              <button
                onClick={handleGoToThisWeek}
                className="px-2.5 py-1 rounded-full bg-[#eaedff] hover:bg-[#dbe1ff] text-[#004ac6] text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                title="이번 주 날짜로 이동"
              >
                이번 주
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  aria-label="이전 달"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-90 transition-all flex items-center justify-center text-[#131b2e] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <h2 className="text-lg sm:text-xl font-bold text-[#131b2e] tracking-tight tabular-nums">
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
              </div>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-full bg-[#eaedff] hover:bg-[#dbe1ff] text-[#004ac6] text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                title="오늘 날짜로 이동"
              >
                오늘
              </button>
            </div>
          )}

          {/* PDF Export & View Filter Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-wrap">
            <button
              aria-label="이번 달 근무기록 PDF 내보내기"
              onClick={() => openPdfModal('timesheet')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe1ff]/60 hover:bg-[#dbe1ff] text-[#004ac6] text-[11px] sm:text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
              <span>PDF</span>
            </button>

            {/* Calendar Start Day Toggle (일~토 / 월~일) */}
            <div className="flex items-center bg-[#eaedff] rounded-full p-0.5 text-[11px] sm:text-xs font-semibold">
              <button
                type="button"
                onClick={() => setWeekStartsOn('sun')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                  weekStartsOn === 'sun'
                    ? 'bg-white text-[#004ac6] shadow-xs font-bold'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
                title="일요일부터 시작하는 달력 (일~토)"
              >
                일~토
              </button>
              <button
                type="button"
                onClick={() => setWeekStartsOn('mon')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                  weekStartsOn === 'mon'
                    ? 'bg-white text-[#004ac6] shadow-xs font-bold'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
                title="월요일부터 시작하는 달력 (월~일)"
              >
                월~일
              </button>
            </div>

            {/* Segmented Switcher for Monthly / Weekly / List */}
            <div className="flex items-center bg-[#eaedff] rounded-full p-0.5 text-[11px] sm:text-xs font-semibold">
              <button
                onClick={() => setCalendarViewMode('monthly')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
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
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
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
        <section className="bg-white rounded-2xl p-2 sm:p-4 shadow-sm border border-[#c3c6d7]/30 flex flex-col">
          {/* Quick Stamp Mode Banner */}
          <div className="mb-2 sm:mb-3 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#dbe1ff]/50 border border-[#004ac6]/20 flex items-center justify-between text-xs flex-wrap gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#004ac6] font-bold flex-wrap">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">touch_app</span>
              <span className="text-[11px] sm:text-xs">
                스탬프:{' '}
                <button
                  onClick={() => {
                    if (isQuickStampActive) {
                      handleExitQuickStamp('원터치 등록 모드가 해제되었습니다.');
                    } else {
                      setIsQuickStampActive(true);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all ${
                    isQuickStampActive ? 'bg-[#004ac6] text-white' : 'bg-[#737686] text-white'
                  }`}
                >
                  {isQuickStampActive ? 'ON' : 'OFF'}
                </button>
              </span>
              {activeQuickPreset && (
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#004ac6]/10 text-[#004ac6] text-[10px] sm:text-[11px] font-semibold">
                  {activeQuickPreset.name} ({activeQuickPreset.startTime}-{activeQuickPreset.endTime})
                </span>
              )}
            </div>
            {pressingInfo ? (
              <span className="text-[#ad0033] text-[10px] sm:text-[11px] font-bold flex items-center gap-1 tabular-nums">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">timer</span>
                <span>삭제까지 {pressingInfo.remainingSec}초 (드래그·스크롤 시 즉시 취소)</span>
              </span>
            ) : isQuickStampActive ? (
              <span className="text-[#004ac6] text-[10px] sm:text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">verified_user</span>
                <span>스탬프 모드 중 오삭제 자동 차단</span>
              </span>
            ) : (
              <span className="text-[#434655] text-[10px] sm:text-[11px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px] text-[#004ac6]">shield</span>
                <span className="sm:hidden">4초 꾹 누르기(드래그 시 취소) · [삭제]</span>
                <span className="hidden sm:inline">4초 꾹 누르기 또는 [삭제] 버튼 (드래그·스크롤 시 자동 취소)</span>
              </span>
            )}
          </div>

          {/* Monthly Public Holidays Summary Banner (공휴일 요약 표시) */}
          {monthHolidays.length > 0 && (
            <div className="mb-2 sm:mb-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#fff5f5] border border-[#ffcdd2]/70 flex items-center gap-1.5 sm:gap-2 text-xs flex-wrap">
              <span className="font-extrabold text-[#b30026] flex items-center gap-1 shrink-0 text-[11px] sm:text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b30026]"></span>
                이달의 공휴일:
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {monthHolidays.map((h) => (
                  <button
                    key={h.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(h.dateStr)}
                    className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedDate === h.dateStr
                        ? 'bg-[#b30026] text-white shadow-xs'
                        : 'bg-white text-[#b30026] hover:bg-[#ffebee] border border-[#ffcdd2]'
                    }`}
                  >
                    <span className="tabular-nums">{month}.{h.day}</span>
                    <span>{h.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Week Headers (Starts Sunday or Monday according to weekStartsOn) */}
          <div className="grid grid-cols-7 text-center pb-1.5 sm:pb-2 text-[11px] sm:text-xs font-semibold">
            {weekStartsOn === 'sun' ? (
              <>
                <span className="text-[#b30026]">일</span>
                <span className="text-[#434655]">월</span>
                <span className="text-[#434655]">화</span>
                <span className="text-[#434655]">수</span>
                <span className="text-[#434655]">목</span>
                <span className="text-[#434655]">금</span>
                <span className="text-[#004ac6]">토</span>
              </>
            ) : (
              <>
                <span className="text-[#434655]">월</span>
                <span className="text-[#434655]">화</span>
                <span className="text-[#434655]">수</span>
                <span className="text-[#434655]">목</span>
                <span className="text-[#434655]">금</span>
                <span className="text-[#004ac6]">토</span>
                <span className="text-[#b30026]">일</span>
              </>
            )}
          </div>

          {/* Calendar 7-Column Grid */}
          <div className="grid grid-cols-7 gap-y-1 sm:gap-y-2 gap-x-0.5 sm:gap-x-1.5 text-center" id="calendarGrid">
            {calendarDays.map((cell) => {
              const shift = shiftMap.get(cell.dateStr);
              const isSelected = selectedDate === cell.dateStr;
              const isToday = todayDate === cell.dateStr;
              const isWeekendSun = cell.dayOfWeek === 0;
              const isWeekendSat = cell.dayOfWeek === 6;

              // Public Holiday Check (User Requested: 빨간색 & 공휴일명 표기)
              const holiday = getKoreanHoliday(cell.dateStr);
              const isHoliday = !!holiday;

              // Shift theme palette
              const palette = getShiftColorPalette(shift, presetMap);

              const isPressingDelete = pressingDateStr === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => handleDayClick(cell.dateStr)}
                  onTouchStart={(e) => handleCellTouchStart(e, cell.dateStr)}
                  onTouchMove={handleCellTouchMove}
                  onTouchEnd={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                  onMouseDown={(e) => handleCellMouseDown(e, cell.dateStr)}
                  onMouseMove={handleCellMouseMove}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(cell.dateStr)}
                  draggable={!isTouchDevice && !!shift}
                  onDragStart={(e) => {
                    handleDragStart(e, cell.dateStr);
                  }}
                  title={
                    holiday
                      ? `법정 공휴일: ${holiday.name}${shift ? ` · ${shift.name} (4초 꾹 누르면 삭제)` : ''}`
                      : shift
                      ? `${shift.name} (탭하여 상세 보기 · 4초 꾹 누르면 삭제)`
                      : '탭하여 근무 등록'
                  }
                  style={
                    isSelected && !isPressingDelete
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
                  className={`flex flex-col items-center py-1 sm:py-1.5 px-0.5 rounded-lg sm:rounded-xl transition-all min-h-[58px] sm:min-h-[76px] md:min-h-[82px] relative cursor-pointer select-none border overflow-hidden ${
                    !cell.isCurrentMonth ? 'opacity-35' : ''
                  } ${
                    isPressingDelete
                      ? 'border-2 border-[#ad0033] bg-[#ffdad6]/50 ring-2 ring-[#ad0033]/35 scale-[0.97]'
                      : isSelected
                      ? 'border-2 shadow-sm scale-[1.01] sm:scale-[1.02]'
                      : isToday
                      ? isHoliday
                        ? 'bg-[#ffebee]/70 border-[#b30026]/40'
                        : 'bg-[#eaedff] border-[#004ac6]/30'
                      : isHoliday
                      ? 'bg-[#fff5f5] hover:bg-[#ffebee]/60 border-[#ffcdd2]/50'
                      : 'hover:bg-[#f2f3ff] border-transparent'
                  }`}
                >
                  {/* 3-Second Stationary Long-Press Progress Bar */}
                  {isPressingDelete && pressingInfo && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-[#ad0033] transition-all duration-75 pointer-events-none"
                      style={{ width: `${pressingInfo.progress}%` }}
                    />
                  )}
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
                      className={`text-[11px] sm:text-xs font-bold tabular-nums flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all ${
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
                      <span className={`hidden sm:inline-block w-1.5 h-1.5 rounded-full ${isHoliday ? 'bg-[#b30026]' : 'bg-[#004ac6]'}`}></span>
                    )}
                  </div>

                  {/* Public Holiday Tag Badge (날짜 아래에 어떤 공휴일인지 빨간색으로 표기) */}
                  {holiday && (
                    <div className="w-full flex justify-center px-0.5 mt-0.5">
                      <span
                        className="text-[9px] sm:text-[10px] leading-tight font-black text-[#b30026] bg-[#ffebee] border border-[#ffcdd2] px-0.5 sm:px-1 py-0.2 sm:py-0.5 rounded text-center truncate max-w-full shadow-2xs tracking-tighter block"
                        title={holiday.name}
                      >
                        {holiday.name}
                      </span>
                    </div>
                  )}

                  {/* Shift Tag Chip */}
                  {shift && (
                    <div className="mt-0.5 sm:mt-1 w-full px-0.5 relative group">
                      <span
                        className="block truncate px-0.5 sm:px-1 py-0.5 rounded font-bold text-[9px] sm:text-[10px] leading-tight"
                        style={{
                          backgroundColor: palette.softBgHex,
                          color: palette.hex,
                        }}
                      >
                        {shift.type === 'leave' ? shift.leaveType || '휴무' : shift.name}
                      </span>
                      {shift.overtimeHours && shift.overtimeHours > 0 ? (
                        <span className="mt-0.5 block truncate px-0.5 sm:px-1 py-0.2 rounded font-extrabold text-[8px] sm:text-[9px] leading-tight bg-[#ffeed9] text-[#b35300] border border-[#ffdbb8]/70 text-center tabular-nums">
                          <span className="min-[390px]:hidden">+{shift.overtimeHours}h</span>
                          <span className="hidden min-[390px]:inline">+{shift.overtimeHours}h 연장</span>
                        </span>
                      ) : null}

                      {/* Quick Delete overlay X icon on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteShift(cell.dateStr);
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
              const isSun = day.dayOfWeek === 0;
              const isSat = day.dayOfWeek === 6;
              const holiday = getKoreanHoliday(day.dateStr);
              const isHoliday = !!holiday;
              const shiftCalc = shift ? calculateShiftPay(shift) : null;
              const palette = getShiftColorPalette(shift, presetMap);

              const isPressingDelete = pressingDateStr === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => handleDayClick(day.dateStr)}
                  onTouchStart={(e) => handleCellTouchStart(e, day.dateStr)}
                  onTouchMove={handleCellTouchMove}
                  onTouchEnd={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                  onMouseDown={(e) => handleCellMouseDown(e, day.dateStr)}
                  onMouseMove={handleCellMouseMove}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(day.dateStr)}
                  style={
                    isSelected && !isPressingDelete
                      ? {
                          borderColor: isHoliday ? '#b30026' : shift ? palette.hex : '#004ac6',
                          backgroundColor: isHoliday ? '#ffebee80' : shift ? palette.softBgHex + '33' : '#dbe1ff33',
                        }
                      : undefined
                  }
                  className={`flex flex-col rounded-2xl p-3 border transition-all cursor-pointer relative select-none overflow-hidden ${
                    isPressingDelete
                      ? 'border-2 border-[#ad0033] bg-[#ffdad6]/50 ring-2 ring-[#ad0033]/35 scale-[0.98]'
                      : isSelected
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
                  {/* 4-Second Stationary Long-Press Progress Bar */}
                  {isPressingDelete && pressingInfo && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-[#ad0033] transition-all duration-75 pointer-events-none"
                      style={{ width: `${pressingInfo.progress}%` }}
                    />
                  )}
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
                              requestDeleteShift(day.dateStr);
                            }}
                            className="w-5 h-5 rounded-full hover:bg-[#ffdad6] text-[#ad0033] flex items-center justify-center transition-colors cursor-pointer"
                            title="삭제"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>

                        {shift.type === 'work' ? (
                          <>
                            <div className="flex items-center justify-between text-[11px] text-[#434655]">
                              <span>
                                {shift.startTime} ~ {shift.endTime}
                              </span>
                              {shift.overtimeHours && shift.overtimeHours > 0 ? (
                                <span className="px-1.5 py-0.2 rounded font-extrabold text-[9px] bg-[#ffeed9] text-[#b35300] border border-[#ffdbb8]">
                                  +{shift.overtimeHours}h 연장
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-[#eaedff]">
                              <span className="text-[10px] text-[#737686]">
                                {shift.overtimeHours && shift.overtimeHours > 0
                                  ? `${shiftCalc?.workedHours}시간 (연장 ${shift.overtimeHours}h 포함)`
                                  : `${shiftCalc?.workedHours}시간`}
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
                          {shift.overtimeHours && shift.overtimeHours > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-[#ffeed9] border border-[#ffdbb8] text-[#b35300] text-[10px] font-extrabold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">more_time</span>
                              <span>+{shift.overtimeHours}시간 연장 (+{formatKRW(shiftCalc.overtimePay)}원)</span>
                            </span>
                          ) : null}
                          {holiday && (
                            <span className="px-2 py-0.5 rounded bg-[#ffebee] border border-[#ffcdd2] text-[#b30026] text-[10px] font-extrabold">
                              🔴 {holiday.name}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[#131b2e] truncate">
                            {activeWorkplace.name}
                          </span>
                        </div>

                        <div className="text-xs text-[#434655] mt-1 flex items-center gap-2 flex-wrap">
                          {shift.type === 'work' ? (
                            <>
                              <span>
                                {shift.startTime} ~ {shift.endTime} (휴게 {shift.breakMinutes}분)
                              </span>
                              <span>·</span>
                              <span className="font-semibold text-[#131b2e]">
                                {shift.overtimeHours && shift.overtimeHours > 0
                                  ? `실근무 ${shiftCalc.workedHours}시간 (기본 ${shiftCalc.regularHours}h + 연장 ${shift.overtimeHours}h)`
                                  : `${shiftCalc.workedHours}시간 근무`}
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
                            requestDeleteShift(shift.date);
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

      {/* 4. Quick Preset Action Bar (원터치 퀵 등록 — positioned directly below the Calendar) */}
      <section className="bg-white rounded-2xl p-2.5 sm:p-3.5 shadow-sm flex flex-col gap-1.5 sm:gap-2 border border-[#c3c6d7]/35">
        <div className="flex items-center justify-between gap-1 px-0.5 sm:px-1">
          <div className="flex items-center gap-1 text-[#004ac6] text-[11px] sm:text-xs font-bold min-w-0">
            <span className="material-symbols-outlined text-[15px] sm:text-[16px] shrink-0">bolt</span>
            <span className="truncate">원터치 퀵 등록</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-[10px] font-bold tabular-nums shrink-0">
              {selectedDate.slice(5)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={openDataSafetyModal}
              className="hidden min-[380px]:flex text-[#006c49] bg-[#6cf8bb]/30 hover:bg-[#6cf8bb]/50 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold items-center gap-1 cursor-pointer transition-all active:scale-95"
              type="button"
              title="크롬 기록삭제 대비 데이터 자체 보관 및 복원"
            >
              <span className="material-symbols-outlined text-[14px]">security</span>
              <span className="hidden sm:inline">데이터 안전보관</span>
              <span className="sm:hidden">백업</span>
            </button>
            <button
              onClick={() => openPresetModal()}
              className="text-[#004ac6] hover:underline text-[11px] sm:text-xs font-bold flex items-center gap-0.5 cursor-pointer px-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>새 프리셋</span>
            </button>
            <button
              type="button"
              onClick={() => setIsQuickBarOpen((prev) => !prev)}
              className="w-7 h-7 rounded-lg bg-[#f2f3ff] text-[#434655] hover:bg-[#eaedff] flex items-center justify-center cursor-pointer sm:hidden"
              aria-label={isQuickBarOpen ? '퀵 등록 바 접기' : '퀵 등록 바 펼치기'}
              title={isQuickBarOpen ? '접기' : '펼치기'}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isQuickBarOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        </div>

        {(isQuickBarOpen || isQuickStampActive) && (
          <>
            {/* Dynamic Tip / Active Stamp Banner */}
            {isQuickStampActive && quickStampPresetId ? (
              <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#004ac6] text-white flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#ffe082] shrink-0">touch_app</span>
                  <div className="text-[11px] sm:text-xs font-semibold truncate">
                    <strong>[{presets.find((p) => p.id === quickStampPresetId)?.name || '프리셋'}]</strong> → 달력 날짜를 연속 탭!
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleExitQuickStamp('원터치 등록 모드가 해제되었습니다.')}
                  className="shrink-0 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>완료/해제</span>
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-[#f2f3ff] items-center justify-between gap-1 text-[11px] text-[#434655] leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#004ac6] text-[15px] shrink-0">touch_app</span>
                  <span>
                    <strong className="text-[#131b2e] font-semibold">원터치 등록:</strong> 아래 프리셋을 먼저 누른 후, 달력에서 원하는 날짜를 누르면 적용됩니다.
                  </span>
                </div>
                <span className="material-symbols-outlined text-[#737686] text-[14px] shrink-0">drag_indicator</span>
              </div>
            )}

            {/* Horizontal Quick Preset Chips + Trash Can Drop Zone */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 pt-0.5">
              {presets.map((preset) => {
                const isSelectedForStamp = isQuickStampActive && quickStampPresetId === preset.id;
                const presetPal = PRESET_COLOR_PALETTES[preset.colorTheme || preset.badgeTheme] || PRESET_COLOR_PALETTES.blue;
                return (
                  <button
                    key={preset.id}
                    draggable={!isTouchDevice}
                    onDragStart={(e) => {
                      if (isTouchDevice) {
                        e.preventDefault();
                        return;
                      }
                      setDraggedPresetId(preset.id);
                    }}
                    onClick={() => {
                      if (isQuickStampActive && quickStampPresetId === preset.id) {
                        handleExitQuickStamp(`'${preset.name}' 원터치 등록 모드가 해제되었습니다.`);
                      } else {
                        setQuickStampPresetId(preset.id);
                        setIsQuickStampActive(true);
                        showToast(`'${preset.name}' 선택됨! 달력에서 날짜를 누르면 적용됩니다.`);
                      }
                    }}
                    className={`shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-left cursor-grab active:scale-95 transition-all ${
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
                      <span className="hidden sm:inline material-symbols-outlined text-[15px] text-[#737686] opacity-60">
                        drag_indicator
                      </span>
                      <span className="material-symbols-outlined text-[17px] sm:text-[18px] sm:ml-0.5">
                        {isSelectedForStamp ? 'check_circle' : 'add_circle'}
                      </span>
                    </div>
                    <div className="flex flex-col pr-0.5 sm:pr-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] sm:text-xs font-bold text-[#131b2e]">{preset.name}</span>
                        {isSelectedForStamp && (
                          <span
                            className="text-[9px] px-1 rounded text-white font-bold"
                            style={{ backgroundColor: presetPal.hex }}
                          >
                            활성
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#434655] tabular-nums">
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
                onClick={() => requestDeleteShift(selectedDate)}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#ffdad6]/50 hover:bg-[#ffdad6] text-[#ad0033] border border-[#ad0033]/30 cursor-pointer active:scale-95 transition-all"
                title="선택일 근무 삭제 (확인 창 표시)"
              >
                <span className="material-symbols-outlined text-[17px] sm:text-[18px]">delete</span>
                <div className="flex flex-col">
                  <span className="text-[11px] sm:text-xs font-bold">선택일 삭제</span>
                  <span className="text-[9px] sm:text-[10px] text-[#ad0033]/80">확인 후 삭제</span>
                </div>
              </div>

              <button
                onClick={() => openPresetModal()}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-dashed border-[#c3c6d7] hover:bg-[#eaedff] text-[#004ac6] active:scale-95 transition-all text-left cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px] sm:text-[18px]">add_circle_outline</span>
                <div className="flex flex-col">
                  <span className="text-[11px] sm:text-xs font-bold text-[#004ac6]">새 프리셋</span>
                  <span className="text-[9px] sm:text-[10px] text-[#434655]">시간/색상</span>
                </div>
              </button>
            </div>
          </>
        )}
      </section>

      {/* 5. Selected Date Details Card (근무 상세 — positioned directly below 원터치 퀵 등록) */}
      <section
        style={{
          borderColor: selectedShift
            ? selectedDatePalette.hex + '40'
            : selectedDateHoliday
            ? '#b3002650'
            : '#c3c6d740',
        }}
        className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border flex flex-col gap-2 sm:gap-2.5 relative transition-all"
      >
        {/* Public Holiday Banner if Selected Date is a holiday */}
        {selectedDateHoliday && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#ffebee] border border-[#ffcdd2] flex items-center justify-between text-xs text-[#b30026] font-bold animate-in fade-in flex-wrap gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-[#b30026]">celebration</span>
              <span className="text-xs sm:text-sm font-extrabold">법정 공휴일: {selectedDateHoliday.name}</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#b30026] px-2 py-0.5 rounded bg-white/80 border border-[#ffcdd2]">
              휴일근로 가산(1.5배)
            </span>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Color-matched Selected Date Badge */}
            <span
              className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold text-white shadow-xs shrink-0"
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
            <span className="text-sm sm:text-base font-bold text-[#131b2e] truncate">
              {selectedDateFormatted} 근무 상세
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {selectedShift && (
              <button
                onClick={() => requestDeleteShift(selectedDate)}
                className="flex items-center gap-1 text-xs text-[#ad0033] hover:bg-[#ffdad6]/40 px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                title="해당 날짜 근무 삭제"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>삭제</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('add-shift')}
              className="text-[#434655] hover:text-[#004ac6] transition-colors flex items-center gap-0.5 text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg bg-[#f2f3ff] cursor-pointer"
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
            className="rounded-xl p-3 sm:p-3.5 flex flex-col gap-2 border"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span
                  className="material-symbols-outlined text-[19px] sm:text-[20px] shrink-0"
                  style={{ color: selectedDatePalette.hex }}
                >
                  {selectedShift.type === 'leave'
                    ? 'beach_access'
                    : selectedShift.name.includes('연구')
                    ? 'science'
                    : 'local_cafe'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#131b2e] truncate">
                  {activeWorkplace.name} · {selectedShift.name}
                </span>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-bold shrink-0"
                style={{
                  backgroundColor: selectedDatePalette.softBgHex,
                  color: selectedDatePalette.hex,
                }}
              >
                {selectedShift.status === 'completed' ? '출근 완료' : '예정'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#434655] pt-0.5 flex-wrap gap-1 tabular-nums">
              <span>
                시간: {selectedShift.startTime} ~ {selectedShift.endTime} (
                {selectedShiftCalc?.workedHours || 0}시간
                {selectedShift.overtimeHours && selectedShift.overtimeHours > 0
                  ? ` · 기본 ${selectedShiftCalc?.regularHours}h + 연장 ${selectedShift.overtimeHours}h`
                  : ''}
                )
              </span>
              <span>기본시급: {formatKRW(selectedShift.hourlyWage)}원</span>
            </div>

            {/* Overtime Row in Selected Date Detail */}
            {selectedShift.overtimeHours && selectedShift.overtimeHours > 0 ? (
              <div className="flex items-center justify-between text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#fff8f2] border border-[#ffdbb8] text-[#b35300] gap-2">
                <div className="flex items-center gap-1 font-bold min-w-0">
                  <span className="material-symbols-outlined text-[15px] shrink-0">more_time</span>
                  <span className="truncate">
                    추가근무 {selectedShift.overtimeHours}시간 (
                    {selectedShift.hasOvertimeBonus !== false ? '1.5배 가산' : '일반 시급'})
                  </span>
                </div>
                <span className="font-extrabold text-xs sm:text-sm tabular-nums shrink-0">
                  +{formatKRW(selectedShiftCalc?.overtimePay || 0)}원
                </span>
              </div>
            ) : null}

            {/* Wage Highlight Row */}
            <div className="flex items-center justify-between pt-1.5 mt-0.5 bg-white rounded-lg px-2.5 sm:px-3 py-2 border border-[#eaedff]">
              <span className="text-xs font-medium text-[#434655]">일 예상 급여</span>
              <span
                className="text-sm sm:text-base font-extrabold tabular-nums"
                style={{ color: selectedDatePalette.hex }}
              >
                {formatKRW(selectedShiftCalc?.totalShiftPay || 0)}원
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[#f2f3ff] rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2">
            <span className="text-xs text-[#737686]">등록된 근무나 휴무 일정이 없습니다.</span>
            <button
              onClick={() => setActiveTab('add-shift')}
              className="px-3 py-1.5 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              + 근무 등록
            </button>
          </div>
        )}
      </section>

      {/* 6. Timesheet Document Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#c3c6d7]/30 flex items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#dbe1ff]/60 text-[#004ac6] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">description</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-[#131b2e] truncate">
              {month}월 근무표 및 출퇴근 확인서
            </span>
            <span className="text-[11px] sm:text-xs text-[#434655] truncate tabular-nums">
              총 {currentMonthlySummary.totalWorkedHours}시간 · 세무/급여 증빙 PDF
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openPdfModal('timesheet')}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl bg-[#004ac6] text-white text-[11px] sm:text-xs font-bold shadow-xs hover:bg-[#004ac6]/90 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px] sm:text-[16px]">download</span>
          <span>PDF 저장</span>
        </button>
      </div>

      {/* Shift Delete Confirmation Modal */}
      {pendingDeleteDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setPendingDeleteDate(null)}
        >
          <div
            className="w-full max-w-xs sm:max-w-sm bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ffdad6] text-[#ad0033] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#131b2e]">근무 기록을 삭제할까요?</h3>
                <p className="text-xs text-[#434655] mt-1 leading-relaxed">
                  <strong>{pendingDeleteDate}</strong>의{' '}
                  <strong>{shiftMap.get(pendingDeleteDate)?.name || '근무'}</strong> 기록이 삭제됩니다.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteDate(null)}
                className="flex-1 min-h-[42px] rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#434655] text-xs font-bold cursor-pointer active:scale-95 transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDeleteShift}
                className="flex-1 min-h-[42px] rounded-xl bg-[#ad0033] hover:bg-[#8c0029] text-white text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
