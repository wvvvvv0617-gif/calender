/**
 * Korean Statutory Public Holidays (대한민국 법정공휴일 및 대체공휴일)
 * Supports dynamic lookup, weekend substitute holiday calculation, and monthly list
 */

export interface HolidayInfo {
  name: string;
  isHoliday: boolean;
  isSubstitute?: boolean;
}

// Year-specific Lunar, Election & Designated Public Holidays
const YEAR_SPECIFIC_HOLIDAYS: Record<string, string> = {
  // 2024
  '2024-02-09': '설날 연휴',
  '2024-02-10': '설날',
  '2024-02-11': '설날 연휴',
  '2024-02-12': '대체공휴일 (설날)',
  '2024-04-10': '제22대 국회의원선거',
  '2024-05-06': '대체공휴일 (어린이날)',
  '2024-05-15': '부처님오신날',
  '2024-09-16': '추석 연휴',
  '2024-09-17': '추석',
  '2024-09-18': '추석 연휴',
  '2024-10-01': '임시공휴일 (국군의 날)',

  // 2025
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-03-03': '대체공휴일 (삼일절)',
  '2025-05-05': '어린이날',
  '2025-05-06': '부처님오신날',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일 (추석)',

  // 2026 (Current App Year)
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-02': '대체공휴일 (삼일절)',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-05-25': '대체공휴일 (부처님오신날)',
  '2026-06-03': '제9회 전국동시지방선거',
  '2026-08-17': '대체공휴일 (광복절)',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-09-28': '대체공휴일 (추석)',
  '2026-10-03': '개천절',
  '2026-10-05': '대체공휴일 (개천절)',
  '2026-10-09': '한글날',
  '2026-12-25': '성탄절',

  // 2027
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일 (설날)',
  '2027-03-03': '제21대 대통령선거',
  '2027-05-13': '부처님오신날',
  '2027-09-14': '추석 연휴',
  '2027-09-15': '추석',
  '2027-09-16': '추석 연휴',
  '2027-10-04': '대체공휴일 (개천절)',
  '2027-10-11': '대체공휴일 (한글날)',

  // 2028
  '2028-01-26': '설날 연휴',
  '2028-01-27': '설날',
  '2028-01-28': '설날 연휴',
  '2028-04-12': '제23대 국회의원선거',
  '2028-05-02': '부처님오신날',
  '2028-10-02': '추석 연휴',
  '2028-10-03': '개천절 / 추석',
  '2028-10-04': '추석 연휴',
  '2028-10-05': '대체공휴일 (추석)',

  // 2029
  '2029-02-12': '설날 연휴',
  '2029-02-13': '설날',
  '2029-02-14': '설날 연휴',
  '2029-05-20': '부처님오신날',
  '2029-05-21': '대체공휴일 (부처님오신날)',
  '2029-09-21': '추석 연휴',
  '2029-09-22': '추석',
  '2029-09-23': '추석 연휴',
  '2029-09-24': '대체공휴일 (추석)',

  // 2030
  '2030-02-02': '설날 연휴',
  '2030-02-03': '설날',
  '2030-02-04': '설날 연휴',
  '2030-05-09': '부처님오신날',
  '2030-10-11': '추석 연휴',
  '2030-10-12': '추석',
  '2030-10-13': '추석 연휴',
  '2030-10-14': '대체공휴일 (추석)',
};

// Fixed Solar Public Holidays (Statutory every year)
const FIXED_SOLAR_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};

// Fixed Holidays eligible for Alternative Substitute Holiday (대체공휴일 적용 대상)
const SUBSTITUTE_ELIGIBLE_FIXED: Record<string, string> = {
  '03-01': '삼일절',
  '05-05': '어린이날',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절',
};

/**
 * Returns holiday name and info for a date string "YYYY-MM-DD"
 */
export function getKoreanHoliday(dateStr: string): HolidayInfo | null {
  if (!dateStr || dateStr.length < 10) return null;

  // 1. Check exact year-specific holidays first (including Lunar, Elections, Pre-defined Substitutes)
  if (YEAR_SPECIFIC_HOLIDAYS[dateStr]) {
    const name = YEAR_SPECIFIC_HOLIDAYS[dateStr];
    return {
      name,
      isHoliday: true,
      isSubstitute: name.includes('대체'),
    };
  }

  // 2. Check recurring fixed solar holidays (MM-DD)
  const monthDay = dateStr.slice(5);
  if (FIXED_SOLAR_HOLIDAYS[monthDay]) {
    return {
      name: FIXED_SOLAR_HOLIDAYS[monthDay],
      isHoliday: true,
      isSubstitute: false,
    };
  }

  // 3. Dynamic Substitute Holiday calculation for any year
  // (If 3.1, 5.5, 8.15, 10.3, 10.9, 12.25 falls on Saturday or Sunday, Monday is substitute)
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const y = Number(yearStr);
  const m = Number(monthStr);
  const d = Number(dayStr);
  const currentDate = new Date(y, m - 1, d);
  const dayOfWeek = currentDate.getDay(); // 0: Sun, 1: Mon, ...

  // Only Mondays can be dynamic substitute holidays for weekend-falling holidays
  if (dayOfWeek === 1) {
    // Check if yesterday (Sunday) was an eligible fixed holiday
    const sunDate = new Date(y, m - 1, d - 1);
    const sunMD = `${String(sunDate.getMonth() + 1).padStart(2, '0')}-${String(sunDate.getDate()).padStart(2, '0')}`;
    if (SUBSTITUTE_ELIGIBLE_FIXED[sunMD]) {
      return {
        name: `대체공휴일 (${SUBSTITUTE_ELIGIBLE_FIXED[sunMD]})`,
        isHoliday: true,
        isSubstitute: true,
      };
    }

    // Check if 2 days ago (Saturday) was an eligible fixed holiday
    const satDate = new Date(y, m - 1, d - 2);
    const satMD = `${String(satDate.getMonth() + 1).padStart(2, '0')}-${String(satDate.getDate()).padStart(2, '0')}`;
    if (SUBSTITUTE_ELIGIBLE_FIXED[satMD]) {
      return {
        name: `대체공휴일 (${SUBSTITUTE_ELIGIBLE_FIXED[satMD]})`,
        isHoliday: true,
        isSubstitute: true,
      };
    }
  }

  return null;
}

export function isKoreanHoliday(dateStr: string): boolean {
  return getKoreanHoliday(dateStr) !== null;
}

/**
 * Returns all holidays in a given year and month
 */
export function getHolidaysForMonth(
  year: number,
  month: number
): Array<{ dateStr: string; name: string; day: number; isSubstitute?: boolean }> {
  const holidays: Array<{ dateStr: string; name: string; day: number; isSubstitute?: boolean }> = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const h = getKoreanHoliday(dateStr);
    if (h) {
      holidays.push({
        dateStr,
        name: h.name,
        day: d,
        isSubstitute: h.isSubstitute,
      });
    }
  }

  return holidays;
}
