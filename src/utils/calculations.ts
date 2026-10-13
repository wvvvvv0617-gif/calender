/**
 * Payroll, Work Hours & Allowance Calculation Utilities
 * Based on Korean Labor Standards Act (근로기준법)
 */

import {
  ShiftRecord,
  ShiftCalculation,
  MonthlyPayrollSummary,
  TaxOption,
  HolidayPayOption,
  PaydayOption,
  MinimumWageRate,
} from '../types';

export function formatKRW(amount: number): string {
  return Math.round(amount).toLocaleString('ko-KR');
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns current month formatted as YYYY-MM
 */
export function getCurrentMonthString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Calculates dynamic payday countdown (D-Day, D-1, etc.)
 */
export function calculatePaydayDDay(paydayOption: PaydayOption): {
  daysLeft: number;
  dDayText: string;
  paydayFormatted: string;
} {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDate = today.getDate();

  const targetDay =
    typeof paydayOption === 'number'
      ? paydayOption
      : new Date(currentYear, currentMonth + 1, 0).getDate();

  let targetDate = new Date(currentYear, currentMonth, targetDay);
  const todayMidnight = new Date(currentYear, currentMonth, currentDate);

  // If today's date has passed the payday this month, target next month
  if (targetDate.getTime() < todayMidnight.getTime()) {
    const nextMonthLastDay = new Date(currentYear, currentMonth + 2, 0).getDate();
    const nextTargetDay = typeof paydayOption === 'number' ? paydayOption : nextMonthLastDay;
    targetDate = new Date(currentYear, currentMonth + 1, nextTargetDay);
  }

  const diffTime = targetDate.getTime() - todayMidnight.getTime();
  const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dDayText = daysLeft === 0 ? 'D-Day' : `D-${daysLeft}일`;
  const paydayFormatted = `${targetDate.getMonth() + 1}.${String(targetDate.getDate()).padStart(2, '0')}`;

  return {
    daysLeft,
    dDayText,
    paydayFormatted,
  };
}

/**
 * Initial Legal Minimum Wage standards (including current 2026: 10,320 KRW)
 */
export const INITIAL_MINIMUM_WAGES: MinimumWageRate[] = [
  { year: 2026, wage: 10320, label: '2026년 10,320원', isCurrent: true },
  { year: 2025, wage: 10030, label: '2025년 10,030원' },
  { year: 2024, wage: 9860, label: '2024년 9,860원' },
];

/**
 * Parses time string "HH:mm" into minutes from start of day
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, mins] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (mins || 0);
}

/**
 * Formats minutes into "H시간 M분" or "H.H시간"
 */
export function formatMinutesKorean(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/**
 * Calculates net worked minutes between start and end, subtracting break time.
 * Handles overnight shifts (e.g., 18:00 to 02:00).
 */
export function calculateShiftMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number
): {
  totalMinutes: number;
  workedMinutes: number;
  nightMinutes: number;
} {
  let start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);

  if (end <= start) {
    // Crosses midnight
    end += 24 * 60;
  }

  const rawMinutes = end - start;
  const workedMinutes = Math.max(0, rawMinutes - breakMinutes);

  // Calculate night minutes (22:00 [1320m] to 06:00 [360m / 1800m])
  let nightMinutes = 0;
  const nightStart = 22 * 60; // 1320
  const nightEnd = 30 * 60; // 06:00 next day = 1800

  // Check overlap of [start, end] with [1320, 1800]
  const overlapStart = Math.max(start, nightStart);
  const overlapEnd = Math.min(end, nightEnd);
  if (overlapEnd > overlapStart) {
    nightMinutes += overlapEnd - overlapStart;
  }

  // Also check morning 00:00 - 06:00 for shifts that start before 06:00 on day 1
  if (start < 6 * 60) {
    const earlyOverlapEnd = Math.min(end, 6 * 60);
    nightMinutes += Math.max(0, earlyOverlapEnd - start);
  }

  return {
    totalMinutes: rawMinutes,
    workedMinutes,
    nightMinutes,
  };
}

/**
 * Calculates pay breakdown for a single shift record
 */
export function calculateShiftPay(shift: ShiftRecord): ShiftCalculation {
  if (shift.type === 'leave') {
    if (shift.isPaidLeave) {
      const recognizedHours = shift.recognizedHours || 8;
      const basePay = Math.round(recognizedHours * shift.hourlyWage);
      return {
        workedMinutes: recognizedHours * 60,
        workedHours: recognizedHours,
        nightHours: 0,
        basePay,
        nightPay: 0,
        substitutePay: 0,
        totalShiftPay: basePay,
      };
    } else {
      return {
        workedMinutes: 0,
        workedHours: 0,
        nightHours: 0,
        basePay: 0,
        nightPay: 0,
        substitutePay: 0,
        totalShiftPay: 0,
      };
    }
  }

  const { workedMinutes, nightMinutes } = calculateShiftMinutes(
    shift.startTime,
    shift.endTime,
    shift.breakMinutes
  );

  const workedHours = workedMinutes / 60;
  const nightHours = nightMinutes / 60;

  const basePay = Math.round(workedHours * shift.hourlyWage);
  let nightPay = 0;
  let substitutePay = 0;

  // Night overtime bonus: 50% extra for hours between 22:00 and 06:00
  if (shift.hasNightBonus && nightHours > 0) {
    nightPay = Math.round(nightHours * shift.hourlyWage * 0.5);
  }

  // Substitute urgent shift bonus: 20% extra (1.2x total)
  if (shift.hasSubstituteBonus) {
    substitutePay = Math.round(workedHours * shift.hourlyWage * 0.2);
  }

  const totalShiftPay = basePay + nightPay + substitutePay;

  return {
    workedMinutes,
    workedHours,
    nightHours,
    basePay,
    nightPay,
    substitutePay,
    totalShiftPay,
  };
}

/**
 * Groups shifts by calendar week for a given month and computes weekly holiday allowance
 */
export function calculateMonthlyPayroll(
  shifts: ShiftRecord[],
  targetYearMonth: string, // "YYYY-MM"
  taxOption: TaxOption = 'freelance',
  holidayPayOption: HolidayPayOption = 'auto',
  defaultHourlyWage: number = 10320
): MonthlyPayrollSummary {
  // Filter shifts for the target month
  const monthShifts = shifts.filter((s) => s.date.startsWith(targetYearMonth));

  let totalWorkedHours = 0;
  let totalWorkDays = 0;
  let basePay = 0;
  let nightOvertimePay = 0;
  let substitutePay = 0;

  // Track weekly hours for 4 primary weeks (by week index 0..3)
  const weeklyHours = [0, 0, 0, 0];

  monthShifts.forEach((shift) => {
    const calc = calculateShiftPay(shift);
    if (shift.type === 'work' || shift.isPaidLeave) {
      totalWorkedHours += calc.workedHours;
      if (shift.type === 'work') {
        totalWorkDays += 1;
      }
      basePay += calc.basePay;
      nightOvertimePay += calc.nightPay;
      substitutePay += calc.substitutePay;

      // Determine week number from day of month
      const day = parseInt(shift.date.split('-')[2], 10);
      const weekIdx = Math.min(3, Math.floor((day - 1) / 7));
      weeklyHours[weekIdx] += calc.workedHours;
    }
  });

  // Calculate Weekly Holiday Allowance (주휴수당)
  // Qualified when weekly work hours >= 15 hours
  // Formula: (weeklyHours / 40) * 8 * wage (capped at 8 hours)
  let weeklyHolidayPay = 0;
  const weeklyHolidayEarned = [false, false, false, false];

  if (holidayPayOption === 'auto') {
    weeklyHours.forEach((hours, idx) => {
      if (hours >= 15) {
        weeklyHolidayEarned[idx] = true;
        const holidayHours = Math.min(8, (hours / 40) * 8);
        weeklyHolidayPay += Math.round(holidayHours * defaultHourlyWage);
      }
    });
  }

  const grossPay = basePay + weeklyHolidayPay + nightOvertimePay + substitutePay;

  // Deductions calculation
  let incomeTax = 0;
  let localIncomeTax = 0;
  let nationalPension = 0;
  let healthInsurance = 0;
  let longTermCare = 0;
  let employmentInsurance = 0;
  let totalDeductions = 0;

  if (taxOption === 'freelance') {
    // 3.0% National Income Tax + 0.3% Local Income Tax (10% of National)
    incomeTax = Math.floor(grossPay * 0.03);
    localIncomeTax = Math.floor(incomeTax * 0.1);
    totalDeductions = incomeTax + localIncomeTax;
  } else if (taxOption === 'insurance') {
    // 4 Major Social Insurances (~9.4%)
    nationalPension = Math.floor(grossPay * 0.045);
    healthInsurance = Math.floor(grossPay * 0.03545);
    longTermCare = Math.floor(healthInsurance * 0.1295);
    employmentInsurance = Math.floor(grossPay * 0.009);
    totalDeductions = nationalPension + healthInsurance + longTermCare + employmentInsurance;
  } else {
    // None
    totalDeductions = 0;
  }

  const netPay = Math.max(0, grossPay - totalDeductions);
  const effectiveHourlyRate =
    totalWorkedHours > 0 ? Math.round(netPay / totalWorkedHours) : defaultHourlyWage;

  return {
    totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
    totalWorkDays,
    basePay,
    weeklyHolidayPay,
    weeklyHours: weeklyHours.map((h) => Math.round(h * 10) / 10),
    weeklyHolidayEarned,
    nightOvertimePay,
    substitutePay,
    grossPay,
    incomeTax,
    localIncomeTax,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    totalDeductions,
    netPay,
    effectiveHourlyRate,
  };
}
