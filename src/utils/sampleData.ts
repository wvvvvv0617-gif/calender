import { Workplace, Preset, ShiftRecord } from '../types';

export const DEFAULT_WORKPLACE: Workplace = {
  id: 'wp_sora',
  name: '카페 소라 (강남역점)',
  role: '매니저 · 서비스직',
  icon: '☕️',
  hourlyWage: 10320, // 2026 minimum wage standard
};

export const WORKPLACE_ICON_CATEGORIES = [
  {
    category: '연구 · 학술 · IT',
    icons: [
      { icon: '🔬', label: '연구소/실험실' },
      { icon: '🧪', label: '바이오/화학' },
      { icon: '💻', label: 'IT/개발' },
      { icon: '📊', label: '데이터분석' },
      { icon: '🏥', label: '병원/의료' },
      { icon: '🎓', label: '대학원/학술' },
      { icon: '🧬', label: '생명공학' },
      { icon: '🤖', label: 'AI/로봇' },
      { icon: '📐', label: '엔지니어링' },
    ],
  },
  {
    category: '서비스 · 매장 · 유통',
    icons: [
      { icon: '☕️', label: '카페' },
      { icon: '🥖', label: '베이커리' },
      { icon: '🏪', label: '편의점' },
      { icon: '🍔', label: '패스트푸드' },
      { icon: '🍴', label: '식당/요식업' },
      { icon: '📚', label: '학원/과외' },
      { icon: '👗', label: '쇼핑몰' },
      { icon: '🏢', label: '일반사무' },
      { icon: '🎨', label: '디자인/예술' },
      { icon: '📦', label: '물류/배송' },
    ],
  },
];

export const ALL_WORKPLACE_ICONS = WORKPLACE_ICON_CATEGORIES.flatMap((c) => c.icons);

export const INITIAL_PRESETS: Preset[] = [
  {
    id: 'preset_lab',
    name: '연구실 주간',
    iconName: 'science',
    emoji: '🔬',
    badge: '오픈',
    badgeTheme: 'blue',
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    hourlyRateType: 'default',
    showInQuickBar: true,
  },
  {
    id: 'preset_open',
    name: '평일 오픈',
    iconName: 'wb_sunny',
    emoji: '☕️',
    badge: '오픈',
    badgeTheme: 'blue',
    startTime: '09:00',
    endTime: '14:00',
    breakMinutes: 30,
    hourlyRateType: 'default',
    showInQuickBar: true,
  },
  {
    id: 'preset_middle',
    name: '평일 미들',
    iconName: 'routine',
    emoji: '🥪',
    badge: '미들',
    badgeTheme: 'amber',
    startTime: '13:00',
    endTime: '19:00',
    breakMinutes: 30,
    hourlyRateType: 'default',
    showInQuickBar: true,
  },
  {
    id: 'preset_close',
    name: '평일 마감',
    iconName: 'dark_mode',
    emoji: '🧁',
    badge: '마감',
    badgeTheme: 'indigo',
    startTime: '18:00',
    endTime: '23:30',
    breakMinutes: 30,
    hourlyRateType: 'default',
    isNightBonus: true,
    showInQuickBar: true,
  },
  {
    id: 'preset_weekend',
    name: '주말 알바 풀타임',
    iconName: 'all_inclusive',
    emoji: '⚡️',
    badge: '풀타임',
    badgeTheme: 'emerald',
    startTime: '10:00',
    endTime: '18:00',
    breakMinutes: 60,
    hourlyRateType: 'default',
    showInQuickBar: true,
  },
  {
    id: 'preset_off',
    name: '정기 휴무일',
    iconName: 'beach_access',
    emoji: '🏖',
    badge: '휴무',
    badgeTheme: 'rose',
    startTime: '00:00',
    endTime: '00:00',
    breakMinutes: 0,
    hourlyRateType: 'default',
    showInQuickBar: true,
  },
];

/**
 * Creates dynamic sample shifts for the target year and month (defaulting to current year-month e.g. 2026-10)
 */
export function generateSampleShiftsForMonth(yearMonth: string = '2026-10'): ShiftRecord[] {
  const [y, m] = yearMonth.split('-');
  const days = [
    { day: '01', presetId: 'preset_open', name: '오픈 근무', start: '09:00', end: '14:00', break: 0, type: 'work' as const },
    { day: '02', presetId: 'preset_middle', name: '미들 근무', start: '13:00', end: '19:00', break: 0, type: 'work' as const },
    { day: '05', presetId: 'preset_weekend', name: '주말 풀타임', start: '10:00', end: '18:00', break: 60, type: 'work' as const },
    { day: '07', presetId: 'preset_open', name: '오픈 근무', start: '09:00', end: '14:00', break: 0, type: 'work' as const },
    { day: '08', presetId: 'preset_middle', name: '미들 근무', start: '13:00', end: '19:00', break: 0, type: 'work' as const },
    { day: '09', presetId: 'preset_close', name: '마감 근무', start: '18:00', end: '23:30', break: 0, type: 'work' as const, isNight: true },
    { day: '12', presetId: 'preset_open', name: '오픈 5h', start: '09:00', end: '14:00', break: 0, type: 'work' as const },
    { day: '13', presetId: 'preset_lab', name: '연구실 주간 8h', start: '09:00', end: '18:00', break: 60, type: 'work' as const },
    { day: '14', presetId: 'preset_open', name: '오픈 5h', start: '09:00', end: '14:00', break: 0, type: 'work' as const },
    { day: '15', presetId: 'preset_middle', name: '미들 6h', start: '13:00', end: '19:00', break: 0, type: 'work' as const },
    { day: '16', presetId: 'preset_off', name: '휴무', start: '00:00', end: '00:00', break: 0, type: 'leave' as const, leaveType: '무급 휴무' },
    { day: '19', presetId: 'preset_open', name: '오픈 5h', start: '09:00', end: '14:00', break: 0, type: 'work' as const },
    { day: '20', presetId: 'preset_middle', name: '미들 6h', start: '13:00', end: '19:00', break: 0, type: 'work' as const },
    { day: '21', presetId: 'preset_off', name: '개인휴가', start: '00:00', end: '00:00', break: 0, type: 'leave' as const, leaveType: '연차', isPaid: true },
    { day: '22', presetId: 'preset_close', name: '마감 6.5h', start: '17:00', end: '23:30', break: 0, type: 'work' as const, isNight: true },
    { day: '23', presetId: 'preset_close', name: '마감 7h', start: '16:30', end: '23:30', break: 0, type: 'work' as const, isNight: true },
    { day: '26', presetId: 'preset_open', name: '오픈 5h', start: '09:00', end: '14:00', break: 0, type: 'work' as const },
    { day: '27', presetId: 'preset_middle', name: '미들 6h', start: '13:00', end: '19:00', break: 0, type: 'work' as const },
    { day: '28', presetId: 'preset_open', name: '오픈 5h', start: '09:00', end: '14:00', break: 0, type: 'work' as const },
    { day: '29', presetId: 'preset_close', name: '마감 6.5h', start: '17:00', end: '23:30', break: 0, type: 'work' as const, isNight: true },
    { day: '30', presetId: 'preset_middle', name: '미들 6h', start: '13:00', end: '19:00', break: 0, type: 'work' as const },
  ];

  return days.map((d) => ({
    id: `shift_${y}${m}${d.day}`,
    date: `${y}-${m}-${d.day}`,
    workplaceId: 'wp_sora',
    type: d.type,
    presetId: d.presetId,
    name: d.name,
    startTime: d.start,
    endTime: d.end,
    breakMinutes: d.break,
    hourlyWage: 10320,
    status: 'completed',
    hasWeeklyHolidayPay: true,
    hasNightBonus: !!d.isNight,
    hasSubstituteBonus: false,
    leaveType: (d.leaveType as ShiftRecord['leaveType']) || undefined,
    isPaidLeave: !!d.isPaid,
    recognizedHours: d.isPaid ? 8 : undefined,
  }));
}
