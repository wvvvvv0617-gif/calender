/**
 * ShiftMate Types & Data Models
 */

export interface Workplace {
  id: string;
  name: string;
  role: string;
  icon: string;
  hourlyWage: number;
}

export type PresetBadge = '오픈' | '미들' | '마감' | '풀타임' | '휴무';

export type PresetBadgeTheme =
  | 'blue'
  | 'amber'
  | 'indigo'
  | 'emerald'
  | 'rose'
  | 'purple'
  | 'teal';

export interface Preset {
  id: string;
  name: string;
  iconName: string; // Material symbol or emoji
  emoji?: string;
  badge: PresetBadge;
  badgeTheme: PresetBadgeTheme;
  colorTheme?: PresetBadgeTheme;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "14:00"
  breakMinutes: number;
  hourlyRateType: 'default' | 'custom';
  customHourlyWage?: number;
  isNightBonus?: boolean;
  isHolidayPayIncluded?: boolean;
  showInQuickBar?: boolean;
}

export type ShiftType = 'work' | 'leave';

export type LeaveType =
  | '연차'
  | '오전 반차'
  | '오후 반차'
  | '유급 병가'
  | '무급 휴무'
  | '경조사 휴가'
  | '직접 입력';

export interface ShiftRecord {
  id: string;
  date: string; // "YYYY-MM-DD"
  workplaceId: string;
  type: ShiftType;
  presetId?: string;
  name: string;
  startTime: string; // "09:00"
  endTime: string;   // "14:00"
  breakMinutes: number;
  hourlyWage: number;
  status: 'completed' | 'scheduled';
  hasWeeklyHolidayPay: boolean;
  hasNightBonus: boolean;
  hasSubstituteBonus: boolean;
  // Overtime work (추가근무)
  overtimeHours?: number; // 추가근무 시간 (단위: 시간, e.g. 0.5, 1, 1.5, 2)
  hasOvertimeBonus?: boolean; // 추가근무 1.5배 가산수당 적용 여부 (기본 true)
  badgeTheme?: PresetBadgeTheme;
  colorTheme?: PresetBadgeTheme;
  // Leave specifics
  leaveType?: LeaveType;
  isPaidLeave?: boolean;
  recognizedHours?: number;
  memo?: string;
}

export interface MinimumWageRate {
  year: number;
  wage: number;
  label?: string;
  isCurrent?: boolean;
}

export type TaxOption = 'freelance' | 'insurance' | 'none';
export type HolidayPayOption = 'auto' | 'none';
export type PaydayOption = 1 | 5 | 10 | 15 | 25 | 'last';

export interface ShiftCalculation {
  workedMinutes: number;
  workedHours: number; // total worked hours including overtime
  regularHours: number; // regular scheduled hours
  overtimeHours: number; // additional overtime hours
  nightHours: number;
  basePay: number;
  nightPay: number;
  substitutePay: number;
  overtimePay: number;
  totalShiftPay: number;
}

export interface MonthlyPayrollSummary {
  totalWorkedHours: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalWorkDays: number;
  basePay: number;
  weeklyHolidayPay: number;
  weeklyHours: number[]; // Hours worked in week 1..4
  weeklyHolidayEarned: boolean[]; // Whether weekly holiday pay met for week 1..4
  nightOvertimePay: number;
  overtimePay: number;
  substitutePay: number;
  grossPay: number;
  // Deductions
  incomeTax: number;       // 3.0% for freelance, or 0
  localIncomeTax: number;  // 0.3% for freelance, or 0
  nationalPension: number; // 4.5% for insurance
  healthInsurance: number; // 3.545% for insurance
  longTermCare: number;    // 12.95% of health insurance
  employmentInsurance: number; // 0.9% for insurance
  totalDeductions: number;
  netPay: number;
  effectiveHourlyRate: number;
}
