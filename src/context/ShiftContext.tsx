/**
 * ShiftMate Global React Context with LocalStorage Persistence
 * Updated with Notification Read State, Modal Modes, Period Clear, and Terms Modal
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Workplace,
  Preset,
  ShiftRecord,
  TaxOption,
  HolidayPayOption,
  PaydayOption,
  MonthlyPayrollSummary,
  MinimumWageRate,
} from '../types';
import {
  DEFAULT_WORKPLACE,
  INITIAL_PRESETS,
  generateSampleShiftsForMonth,
} from '../utils/sampleData';
import {
  calculateMonthlyPayroll,
  getTodayDateString,
  getCurrentMonthString,
  INITIAL_MINIMUM_WAGES,
} from '../utils/calculations';
import {
  requestPersistentStorage,
  saveSnapshotToIndexedDB,
  loadSnapshotFromIndexedDB,
  downloadBackupFile,
} from '../utils/storageBackup';

interface ShiftContextType {
  // Navigation
  activeTab: 'calendar' | 'add-shift' | 'payroll-summary' | 'settings';
  setActiveTab: (tab: 'calendar' | 'add-shift' | 'payroll-summary' | 'settings') => void;

  // Workplaces
  workplaces: Workplace[];
  activeWorkplaceId: string;
  activeWorkplace: Workplace;
  updateWorkplace: (updated: Partial<Workplace>) => void;
  addNewWorkplace: (wp: Omit<Workplace, 'id'>) => void;
  deleteWorkplace: (id: string) => boolean;
  setActiveWorkplaceId: (id: string) => void;

  // Presets
  presets: Preset[];
  addPreset: (preset: Omit<Preset, 'id'>) => void;
  updatePreset: (id: string, updated: Partial<Preset>) => void;
  deletePreset: (id: string) => void;

  // Shifts
  shifts: ShiftRecord[];
  addShift: (shift: Omit<ShiftRecord, 'id'>) => void;
  updateShift: (id: string, updated: Partial<ShiftRecord>) => void;
  deleteShift: (id: string) => void;
  deleteShiftByDate: (date: string) => void;
  stampPresetOnDate: (date: string, presetId: string) => void;
  removeShiftFromDate: (date: string) => void;

  // Dates & Calendar (Today by default!)
  todayDate: string;
  selectedDate: string; // "YYYY-MM-DD"
  setSelectedDate: (date: string) => void;
  currentMonth: string; // "YYYY-MM"
  setCurrentMonth: (month: string) => void;
  goToToday: () => void;

  // Rules & Calculations
  taxOption: TaxOption;
  setTaxOption: (tax: TaxOption) => void;
  holidayPayOption: HolidayPayOption;
  setHolidayPayOption: (rule: HolidayPayOption) => void;
  paydayOption: PaydayOption;
  setPaydayOption: (day: PaydayOption) => void;

  // Dynamic Minimum Wages
  minimumWages: MinimumWageRate[];
  addMinimumWageRate: (rate: MinimumWageRate) => void;

  // Quick Stamp Feature (Default OFF as requested!)
  quickStampPresetId: string | null;
  setQuickStampPresetId: (id: string | null) => void;
  isQuickStampActive: boolean;
  setIsQuickStampActive: (active: boolean) => void;

  // User Profile
  profileImage: string | null;
  userName: string;
  updateProfileImage: (img: string | null) => void;
  resetToDefaultProfile: () => void;
  updateUserName: (name: string) => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;

  // Notifications
  readNotificationIds: string[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (ids: string[]) => void;

  // Modals & Sheets
  isPresetModalOpen: boolean;
  editingPreset: Preset | null;
  openPresetModal: (preset?: Preset) => void;
  closePresetModal: () => void;

  isPdfModalOpen: boolean;
  pdfExportType: 'timesheet' | 'payslip';
  openPdfModal: (type: 'timesheet' | 'payslip') => void;
  closePdfModal: () => void;

  workplaceModalMode: 'edit' | 'create';
  isWorkplaceModalOpen: boolean;
  openWorkplaceModal: (mode?: 'edit' | 'create') => void;
  closeWorkplaceModal: () => void;

  isTermsModalOpen: boolean;
  openTermsModal: () => void;
  closeTermsModal: () => void;

  isPwaModalOpen: boolean;
  openPwaModal: () => void;
  closePwaModal: () => void;
  triggerPwaInstall: () => void;
  isInstallable: boolean;
  isInstalled: boolean;

  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Derived Payroll Summary
  currentMonthlySummary: MonthlyPayrollSummary;

  // Calendar Day Order
  weekStartsOn: 'sun' | 'mon';
  setWeekStartsOn: (val: 'sun' | 'mon') => void;

  // Data Actions & Backup
  loadSampleData: () => void;
  clearAllShifts: () => void;
  clearShiftsByPeriod: (period: 'month' | 'year' | 'all') => number;
  exportAppData: () => void;
  importAppData: (jsonData: string) => boolean;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WORKPLACES: 'shiftmate_workplaces_v2',
  ACTIVE_WORKPLACE: 'shiftmate_active_wp_v2',
  PRESETS: 'shiftmate_presets_v2',
  SHIFTS: 'shiftmate_shifts_v2',
  RULES: 'shiftmate_rules_v2',
  MIN_WAGES: 'shiftmate_min_wages_v2',
  PROFILE_IMAGE: 'shiftmate_profile_image_v2',
  USER_NAME: 'shiftmate_username_v2',
  USER_NAME_BACKUP: 'shiftmate_username_backup',
  READ_NOTIFS: 'shiftmate_read_notifications_v2',
  WEEK_STARTS_ON: 'shiftmate_week_starts_on_v2',
};

export const ShiftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const todayDate = useMemo(() => getTodayDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [currentMonth, setCurrentMonth] = useState<string>(() => getCurrentMonthString());

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'calendar' | 'add-shift' | 'payroll-summary' | 'settings'
  >('calendar');

  // Calendar Day Order ('sun': 일~토, 'mon': 월~일)
  const [weekStartsOn, setWeekStartsOnState] = useState<'sun' | 'mon'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEEK_STARTS_ON);
      return saved === 'mon' ? 'mon' : 'sun';
    } catch {
      return 'sun';
    }
  });

  const setWeekStartsOn = (val: 'sun' | 'mon') => {
    setWeekStartsOnState(val);
    try {
      localStorage.setItem(STORAGE_KEYS.WEEK_STARTS_ON, val);
    } catch (e) {
      console.error(e);
    }
  };

  // User Profile State with Dual Backup Key
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE) || null;
    } catch {
      return null;
    }
  });

  const [userName, setUserName] = useState<string>(() => {
    try {
      const primary = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      if (primary && primary.trim()) return primary.trim();
      const backup = localStorage.getItem(STORAGE_KEYS.USER_NAME_BACKUP);
      if (backup && backup.trim()) return backup.trim();
      return '근무자';
    } catch {
      return '근무자';
    }
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Notifications State (with LocalStorage persistence)
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.READ_NOTIFS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markNotificationAsRead = (id: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEYS.READ_NOTIFS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const markAllNotificationsAsRead = (ids: string[]) => {
    setReadNotificationIds((prev) => {
      const updated = Array.from(new Set([...prev, ...ids]));
      try {
        localStorage.setItem(STORAGE_KEYS.READ_NOTIFS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Workplaces State
  const [workplaces, setWorkplaces] = useState<Workplace[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORKPLACES);
      return saved ? JSON.parse(saved) : [DEFAULT_WORKPLACE];
    } catch {
      return [DEFAULT_WORKPLACE];
    }
  });

  const [activeWorkplaceId, setActiveWorkplaceId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKPLACE);
      return saved || DEFAULT_WORKPLACE.id;
    } catch {
      return DEFAULT_WORKPLACE.id;
    }
  });

  // Presets State
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
      return saved ? JSON.parse(saved) : INITIAL_PRESETS;
    } catch {
      return INITIAL_PRESETS;
    }
  });

  // Shifts State
  const [shifts, setShifts] = useState<ShiftRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Minimum Wages State (Dynamic)
  const [minimumWages, setMinimumWages] = useState<MinimumWageRate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MIN_WAGES);
      return saved ? JSON.parse(saved) : INITIAL_MINIMUM_WAGES;
    } catch {
      return INITIAL_MINIMUM_WAGES;
    }
  });

  // Rules & Options State
  const [taxOption, setTaxOption] = useState<TaxOption>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.taxOption || 'freelance';
      }
    } catch {
      // fallback
    }
    return 'freelance';
  });

  const [holidayPayOption, setHolidayPayOption] = useState<HolidayPayOption>('auto');
  const [paydayOption, setPaydayOption] = useState<PaydayOption>(10);

  // Quick Stamp Mode: DEFAULT OFF AS REQUESTED!
  const [quickStampPresetId, setQuickStampPresetId] = useState<string | null>('preset_lab');
  const [isQuickStampActive, setIsQuickStampActive] = useState<boolean>(false);

  // Modals
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfExportType, setPdfExportType] = useState<'timesheet' | 'payslip'>('timesheet');

  const [workplaceModalMode, setWorkplaceModalMode] = useState<'edit' | 'create'>('edit');
  const [isWorkplaceModalOpen, setIsWorkplaceModalOpen] = useState(false);

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect standalone PWA mode (already installed on homescreen)
    const checkStandalone = () => {
      if (typeof window === 'undefined') return;
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      showToast('🎉 ShiftMate가 홈 화면에 성공적으로 설치되었습니다!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult && choiceResult.outcome === 'accepted') {
          showToast('앱이 기기에 성공적으로 설치되었습니다!');
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
      });
    } else {
      setIsPwaModalOpen(true);
    }
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Persist Profile
  const updateProfileImage = (img: string | null) => {
    setProfileImage(img);
    try {
      if (img) {
        localStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, img);
      } else {
        localStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetToDefaultProfile = () => {
    updateProfileImage(null);
    showToast('기본 프로필로 초기화되었습니다.');
  };

  const updateUserName = (name: string) => {
    const trimmed = name.trim();
    const finalName = trimmed || '근무자';
    setUserName(finalName);
    try {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, finalName);
      localStorage.setItem(STORAGE_KEYS.USER_NAME_BACKUP, finalName);
    } catch (e) {
      console.error(e);
    }
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  // Persist to LocalStorage synchronously
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKPLACES, JSON.stringify(workplaces));
    } catch (e) {
      console.error(e);
    }
  }, [workplaces]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKPLACE, activeWorkplaceId);
    } catch (e) {
      console.error(e);
    }
  }, [activeWorkplaceId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.error(e);
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
    } catch (e) {
      console.error(e);
    }
  }, [shifts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MIN_WAGES, JSON.stringify(minimumWages));
    } catch (e) {
      console.error(e);
    }
  }, [minimumWages]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.RULES,
        JSON.stringify({ taxOption, holidayPayOption, paydayOption })
      );
    } catch (e) {
      console.error(e);
    }
  }, [taxOption, holidayPayOption, paydayOption]);

  // Request browser persistent storage on mount
  useEffect(() => {
    requestPersistentStorage();
  }, []);

  // Save IndexedDB offline snapshot whenever core state updates
  useEffect(() => {
    saveSnapshotToIndexedDB({
      workplaces,
      activeWorkplaceId,
      presets,
      shifts,
      minimumWages,
      userName,
      profileImage,
      taxOption,
      holidayPayOption,
      paydayOption,
      weekStartsOn,
    });
  }, [
    workplaces,
    activeWorkplaceId,
    presets,
    shifts,
    minimumWages,
    userName,
    profileImage,
    taxOption,
    holidayPayOption,
    paydayOption,
    weekStartsOn,
  ]);

  // If localStorage was cleared (e.g. by Chrome history wipe), auto-restore from IndexedDB snapshot
  useEffect(() => {
    const tryAutoRestore = async () => {
      try {
        const storedShifts = localStorage.getItem(STORAGE_KEYS.SHIFTS);
        const storedUserName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
        if (!storedShifts && (!storedUserName || storedUserName === '근무자')) {
          const snapshot = await loadSnapshotFromIndexedDB();
          if (snapshot) {
            if (snapshot.userName && snapshot.userName !== '근무자') {
              setUserName(snapshot.userName);
              localStorage.setItem(STORAGE_KEYS.USER_NAME, snapshot.userName);
              localStorage.setItem(STORAGE_KEYS.USER_NAME_BACKUP, snapshot.userName);
            }
            if (Array.isArray(snapshot.workplaces) && snapshot.workplaces.length > 0) {
              setWorkplaces(snapshot.workplaces);
              localStorage.setItem(STORAGE_KEYS.WORKPLACES, JSON.stringify(snapshot.workplaces));
            }
            if (Array.isArray(snapshot.shifts) && snapshot.shifts.length > 0) {
              setShifts(snapshot.shifts);
              localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(snapshot.shifts));
            }
            if (Array.isArray(snapshot.presets) && snapshot.presets.length > 0) {
              setPresets(snapshot.presets);
              localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(snapshot.presets));
            }
            if (snapshot.weekStartsOn) {
              setWeekStartsOnState(snapshot.weekStartsOn);
              localStorage.setItem(STORAGE_KEYS.WEEK_STARTS_ON, snapshot.weekStartsOn);
            }
            showToast('🔄 오프라인 안전 저장소에서 이전 근무 기록을 복원했습니다.');
          }
        }
      } catch (e) {
        console.warn('Auto restore check failed:', e);
      }
    };
    tryAutoRestore();
  }, []);

  const activeWorkplace = useMemo(() => {
    return workplaces.find((w) => w.id === activeWorkplaceId) || workplaces[0] || DEFAULT_WORKPLACE;
  }, [workplaces, activeWorkplaceId]);

  const goToToday = () => {
    const today = getTodayDateString();
    setSelectedDate(today);
    setCurrentMonth(getCurrentMonthString());
    showToast(`오늘 날짜 (${today})로 이동했습니다.`);
  };

  // Workplace actions
  const updateWorkplace = (updated: Partial<Workplace>) => {
    setWorkplaces((prev) =>
      prev.map((w) => (w.id === activeWorkplaceId ? { ...w, ...updated } : w))
    );
  };

  const addNewWorkplace = (wp: Omit<Workplace, 'id'>) => {
    const newId = `wp_${Date.now()}`;
    const newWp: Workplace = { ...wp, id: newId };
    setWorkplaces((prev) => [...prev, newWp]);
    setActiveWorkplaceId(newId);
    showToast(`새 근무처 '${newWp.name}'이(가) 등록되었습니다.`);
  };

  const deleteWorkplace = (id: string): boolean => {
    if (workplaces.length <= 1) {
      showToast('⚠️ 최소 1개의 근무처는 등록되어 있어야 하므로 삭제할 수 없습니다.');
      return false;
    }
    const target = workplaces.find((w) => w.id === id);
    const targetName = target ? target.name : '근무처';

    const remaining = workplaces.filter((w) => w.id !== id);
    setWorkplaces(remaining);

    // If currently selected workplace was deleted, switch active to the first remaining one
    if (activeWorkplaceId === id) {
      setActiveWorkplaceId(remaining[0].id);
    }

    // Clean up shifts tied to this deleted workplace
    setShifts((prev) => prev.filter((s) => s.workplaceId !== id));

    showToast(`'${targetName}' 근무처가 삭제되었습니다.`);
    return true;
  };

  // Preset actions
  const addPreset = (preset: Omit<Preset, 'id'>) => {
    const newId = `preset_${Date.now()}`;
    const newPreset: Preset = { ...preset, id: newId };
    setPresets((prev) => [...prev, newPreset]);
    showToast(`'${newPreset.name}' 프리셋이 추가되었습니다.`);
  };

  const updatePreset = (id: string, updated: Partial<Preset>) => {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    showToast('프리셋 정보가 수정되었습니다.');
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    showToast('프리셋이 삭제되었습니다.');
  };

  // Shift actions
  const addShift = (shift: Omit<ShiftRecord, 'id'>) => {
    const newId = `shift_${Date.now()}`;
    const newShift: ShiftRecord = { ...shift, id: newId };
    setShifts((prev) => {
      // Overwrite if shift exists on the same date
      const filtered = prev.filter((s) => s.date !== newShift.date);
      const updated = [...filtered, newShift];
      try {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setSelectedDate(newShift.date);
    showToast(`${newShift.date} 근무가 등록되었습니다.`);
  };

  const updateShift = (id: string, updated: Partial<ShiftRecord>) => {
    setShifts((prev) => {
      const updatedList = prev.map((s) => (s.id === id ? { ...s, ...updated } : s));
      try {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updatedList));
      } catch (e) {
        console.error(e);
      }
      return updatedList;
    });
    showToast('근무 기록이 업데이트되었습니다.');
  };

  const deleteShift = (id: string) => {
    setShifts((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    showToast('근무 기록이 삭제되었습니다.');
  };

  const deleteShiftByDate = (date: string) => {
    setShifts((prev) => {
      const updated = prev.filter((s) => s.date !== date);
      try {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const removeShiftFromDate = (date: string) => {
    deleteShiftByDate(date);
    showToast(`${date} 근무가 삭제되었습니다.`);
  };

  // Dynamic Minimum Wage Actions
  const addMinimumWageRate = (rate: MinimumWageRate) => {
    setMinimumWages((prev) => {
      const exists = prev.some((r) => r.year === rate.year);
      const updated = exists
        ? prev.map((r) => (r.year === rate.year ? rate : r))
        : [rate, ...prev].sort((a, b) => b.year - a.year);
      try {
        localStorage.setItem(STORAGE_KEYS.MIN_WAGES, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    showToast(`${rate.year}년 최저시급(${rate.wage.toLocaleString()}원)이 추가되었습니다.`);
  };

  // Stamp preset on specific date
  const stampPresetOnDate = (date: string, presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    const wage =
      preset.hourlyRateType === 'custom' && preset.customHourlyWage
        ? preset.customHourlyWage
        : activeWorkplace.hourlyWage;

    const isLeave = preset.badge === '휴무';

    const newRecord: ShiftRecord = {
      id: `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date,
      workplaceId: activeWorkplaceId,
      type: isLeave ? 'leave' : 'work',
      presetId: preset.id,
      name: preset.name,
      startTime: preset.startTime,
      endTime: preset.endTime,
      breakMinutes: preset.breakMinutes,
      hourlyWage: wage,
      status: 'completed',
      hasWeeklyHolidayPay: true,
      hasNightBonus: !!preset.isNightBonus,
      hasSubstituteBonus: false,
      badgeTheme: preset.badgeTheme,
      colorTheme: preset.colorTheme || preset.badgeTheme,
      leaveType: isLeave ? '무급 휴무' : undefined,
      isPaidLeave: false,
    };

    setShifts((prev) => {
      const filtered = prev.filter((s) => s.date !== date);
      const updated = [...filtered, newRecord];
      try {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setSelectedDate(date);
    showToast(`${date.slice(5)} ${preset.name} 스탬프 적용 완료!`);
  };

  // Modal actions
  const openPresetModal = (preset?: Preset) => {
    setEditingPreset(preset || null);
    setIsPresetModalOpen(true);
  };

  const closePresetModal = () => {
    setEditingPreset(null);
    setIsPresetModalOpen(false);
  };

  const openPdfModal = (type: 'timesheet' | 'payslip') => {
    setPdfExportType(type);
    setIsPdfModalOpen(true);
  };

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
  };

  const openWorkplaceModal = (mode: 'edit' | 'create' = 'edit') => {
    setWorkplaceModalMode(mode);
    setIsWorkplaceModalOpen(true);
  };

  const closeWorkplaceModal = () => {
    setIsWorkplaceModalOpen(false);
  };

  const openTermsModal = () => {
    setIsTermsModalOpen(true);
  };

  const closeTermsModal = () => {
    setIsTermsModalOpen(false);
  };

  const openPwaModal = () => {
    setIsPwaModalOpen(true);
  };

  const closePwaModal = () => {
    setIsPwaModalOpen(false);
  };

  // Sample data actions
  const loadSampleData = () => {
    const sampleShifts = generateSampleShiftsForMonth(currentMonth);
    setShifts(sampleShifts);
    showToast(`${currentMonth} 샘플 근무 데이터가 로드되었습니다.`);
  };

  const clearAllShifts = () => {
    setShifts([]);
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    showToast('모든 근무 기록이 초기화되었습니다.');
  };

  // Clear shifts by period ('month' | 'year' | 'all')
  const clearShiftsByPeriod = (period: 'month' | 'year' | 'all'): number => {
    let removedCount = 0;
    setShifts((prev) => {
      let filtered: ShiftRecord[] = [];
      if (period === 'month') {
        const removed = prev.filter((s) => s.date.startsWith(currentMonth));
        removedCount = removed.length;
        filtered = prev.filter((s) => !s.date.startsWith(currentMonth));
      } else if (period === 'year') {
        const yearStr = currentMonth.split('-')[0] || todayDate.split('-')[0];
        const removed = prev.filter((s) => s.date.startsWith(yearStr));
        removedCount = removed.length;
        filtered = prev.filter((s) => !s.date.startsWith(yearStr));
      } else {
        removedCount = prev.length;
        filtered = [];
      }
      try {
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(filtered));
      } catch (e) {
        console.error(e);
      }
      return filtered;
    });
    return removedCount;
  };

  // Derived calculations for current selected month
  const currentMonthlySummary = useMemo(() => {
    return calculateMonthlyPayroll(
      shifts,
      currentMonth,
      taxOption,
      holidayPayOption,
      activeWorkplace.hourlyWage
    );
  }, [shifts, currentMonth, taxOption, holidayPayOption, activeWorkplace.hourlyWage]);

  // Export complete app data as backup JSON file
  const exportAppData = () => {
    try {
      const dataToExport = {
        app: 'ShiftMate',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        userName,
        profileImage,
        workplaces,
        activeWorkplaceId,
        presets,
        shifts,
        minimumWages,
        taxOption,
        holidayPayOption,
        paydayOption,
        weekStartsOn,
      };
      downloadBackupFile(dataToExport, `ShiftMate_백업_${userName}`);
      showToast('✅ 모든 데이터가 백업 파일(.json)로 안전하게 다운로드되었습니다.');
    } catch (e) {
      console.error(e);
      showToast('⚠️ 백업 파일 생성 중 오류가 발생했습니다.');
    }
  };

  // Import complete app data from backup JSON file
  const importAppData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed || typeof parsed !== 'object') {
        showToast('⚠️ 올바른 백업 파일(JSON) 형식이 아닙니다.');
        return false;
      }

      if (parsed.userName) {
        setUserName(parsed.userName);
        localStorage.setItem(STORAGE_KEYS.USER_NAME, parsed.userName);
        localStorage.setItem(STORAGE_KEYS.USER_NAME_BACKUP, parsed.userName);
      }
      if (parsed.profileImage !== undefined) {
        setProfileImage(parsed.profileImage);
        if (parsed.profileImage) {
          localStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, parsed.profileImage);
        } else {
          localStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE);
        }
      }
      if (Array.isArray(parsed.workplaces) && parsed.workplaces.length > 0) {
        setWorkplaces(parsed.workplaces);
        localStorage.setItem(STORAGE_KEYS.WORKPLACES, JSON.stringify(parsed.workplaces));
      }
      if (parsed.activeWorkplaceId) {
        setActiveWorkplaceId(parsed.activeWorkplaceId);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKPLACE, parsed.activeWorkplaceId);
      }
      if (Array.isArray(parsed.presets) && parsed.presets.length > 0) {
        setPresets(parsed.presets);
        localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(parsed.presets));
      }
      if (Array.isArray(parsed.shifts)) {
        setShifts(parsed.shifts);
        localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(parsed.shifts));
      }
      if (Array.isArray(parsed.minimumWages) && parsed.minimumWages.length > 0) {
        setMinimumWages(parsed.minimumWages);
        localStorage.setItem(STORAGE_KEYS.MIN_WAGES, JSON.stringify(parsed.minimumWages));
      }
      if (parsed.taxOption) setTaxOption(parsed.taxOption);
      if (parsed.holidayPayOption) setHolidayPayOption(parsed.holidayPayOption);
      if (parsed.paydayOption) setPaydayOption(parsed.paydayOption);
      if (parsed.weekStartsOn) {
        setWeekStartsOnState(parsed.weekStartsOn);
        localStorage.setItem(STORAGE_KEYS.WEEK_STARTS_ON, parsed.weekStartsOn);
      }

      showToast('🎉 백업 파일의 모든 근무 데이터와 설정이 완벽하게 복원되었습니다!');
      return true;
    } catch (e) {
      console.error(e);
      showToast('⚠️ 백업 파일을 불러오는 중 오류가 발생했습니다.');
      return false;
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        activeTab,
        setActiveTab,
        workplaces,
        activeWorkplaceId,
        activeWorkplace,
        updateWorkplace,
        addNewWorkplace,
        deleteWorkplace,
        setActiveWorkplaceId,
        presets,
        addPreset,
        updatePreset,
        deletePreset,
        shifts,
        addShift,
        updateShift,
        deleteShift,
        deleteShiftByDate,
        stampPresetOnDate,
        removeShiftFromDate,
        todayDate,
        selectedDate,
        setSelectedDate,
        currentMonth,
        setCurrentMonth,
        goToToday,
        taxOption,
        setTaxOption,
        holidayPayOption,
        setHolidayPayOption,
        paydayOption,
        setPaydayOption,
        minimumWages,
        addMinimumWageRate,
        quickStampPresetId,
        setQuickStampPresetId,
        isQuickStampActive,
        setIsQuickStampActive,
        profileImage,
        userName,
        updateProfileImage,
        resetToDefaultProfile,
        updateUserName,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
        readNotificationIds,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        isPresetModalOpen,
        editingPreset,
        openPresetModal,
        closePresetModal,
        isPdfModalOpen,
        pdfExportType,
        openPdfModal,
        closePdfModal,
        workplaceModalMode,
        isWorkplaceModalOpen,
        openWorkplaceModal,
        closeWorkplaceModal,
        isTermsModalOpen,
        openTermsModal,
        closeTermsModal,
        isPwaModalOpen,
        openPwaModal,
        closePwaModal,
        triggerPwaInstall,
        isInstallable,
        isInstalled,
        toastMessage,
        showToast,
        currentMonthlySummary,
        loadSampleData,
        clearAllShifts,
        clearShiftsByPeriod,
        weekStartsOn,
        setWeekStartsOn,
        exportAppData,
        importAppData,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export function useShift(): ShiftContextType {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
