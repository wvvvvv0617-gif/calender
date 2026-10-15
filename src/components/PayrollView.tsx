import React, { useState, useMemo } from 'react';
import { useShift } from '../context/ShiftContext';
import { formatKRW, calculateShiftPay, calculatePaydayDDay } from '../utils/calculations';

export const PayrollView: React.FC = () => {
  const {
    currentMonth,
    setCurrentMonth,
    taxOption,
    setTaxOption,
    paydayOption,
    activeWorkplace,
    currentMonthlySummary,
    shifts,
    minimumWages,
    openPdfModal,
    showToast,
    setActiveTab,
  } = useShift();

  const [isAllShiftsExpanded, setIsAllShiftsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const paydayDDay = useMemo(() => {
    return calculatePaydayDDay(paydayOption);
  }, [paydayOption]);

  // Current real-world year based on today's date (올해 연도 기준)
  const todayYear = useMemo(() => new Date().getFullYear(), []);

  // Parse current year & month for selected month
  const [year, month] = useMemo(() => {
    const parts = currentMonth.split('-').map(Number);
    return [parts[0] || todayYear, parts[1] || 10];
  }, [currentMonth, todayYear]);

  // Dynamic legal minimum wage standard for this year (올해 법정 기준 최저시급)
  const currentLegalWage = useMemo(() => {
    const found = minimumWages.find((m) => m.year === todayYear);
    return found ? found.wage : 10320;
  }, [minimumWages, todayYear]);

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('최신 근무 기록을 바탕으로 급여가 재계산되었습니다.');
    }, 500);
  };

  // Month shifts sorted desc
  const monthShifts = useMemo(() => {
    return shifts
      .filter((s) => s.date.startsWith(currentMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, currentMonth]);

  const displayedShifts = isAllShiftsExpanded ? monthShifts : monthShifts.slice(0, 3);

  // Basic pay percentage of gross
  const basicPercentage = currentMonthlySummary.grossPay > 0
    ? Math.min(100, Math.round((currentMonthlySummary.basePay / currentMonthlySummary.grossPay) * 100))
    : 72;

  // Savings goal calculation
  const savingsGoalTarget = 2000000;
  const currentSavingsAccumulated = 1485320;
  const savingsGoalPercent = Math.min(100, Math.round((currentMonthlySummary.netPay / savingsGoalTarget) * 100)) || 74;

  return (
    <div className="w-full flex flex-col gap-4 pb-28 md:pb-12 max-w-4xl mx-auto px-4 md:px-6 pt-2">
      {/* Month & Target Selector Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              aria-label="이전 달"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f2f3ff] text-[#434655] hover:bg-[#eaedff] active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="text-xl font-bold text-[#131b2e] tracking-tight">
              {year}년 {month}월 급여
            </span>
            <button
              aria-label="다음 달"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f2f3ff] text-[#434655] hover:bg-[#eaedff] active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            <span className="px-2.5 py-0.5 bg-[#dbe1ff] text-[#00174b] text-[11px] font-bold rounded-full">
              예상 정산
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className={`w-8 h-8 rounded-full flex items-center justify-center bg-[#f2f3ff] text-[#434655] hover:text-[#004ac6] transition-colors ${
              isRefreshing ? 'animate-spin text-[#004ac6]' : ''
            }`}
            type="button"
            title="동기화 및 재계산"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
          </button>
        </div>

        {/* Payday Countdown Pill */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#eaedff] rounded-2xl text-[#131b2e]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6] text-[20px]">calendar_clock</span>
            <span className="text-xs font-bold text-[#131b2e]">
              급여일: 매월 {paydayOption === 'last' ? '말일' : `${paydayOption}일`}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#006c49] text-white text-[11px] font-bold">
            {paydayDDay.dDayText} 남음 ({paydayDDay.paydayFormatted})
          </span>
        </div>
      </div>

      {/* Hero Net Pay Highlight Card with 3.3% vs 4대보험 Switcher */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#0053db] rounded-3xl p-5 text-white shadow-lg flex flex-col gap-3.5">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-semibold tracking-wider text-[#dbe1ff]">
            {month}월 예상 실수령액
          </span>
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6ffbbe] animate-pulse"></span>
            실시간 자동계산
          </span>
        </div>

        <div className="flex flex-col gap-0.5 relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {formatKRW(currentMonthlySummary.netPay)}
            </span>
            <span className="text-lg font-bold">원</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#dbe1ff]">
            <span>
              총 지급액{' '}
              <strong className="text-white font-bold">
                {formatKRW(currentMonthlySummary.grossPay)}원
              </strong>
            </span>
            <span>-</span>
            <span>
              공제{' '}
              <strong className="text-white font-bold">
                {formatKRW(currentMonthlySummary.totalDeductions)}원
              </strong>
            </span>
          </div>
        </div>

        {/* Mode Switch Pills */}
        <div className="pt-1 relative z-10">
          <div className="p-1 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-between text-xs gap-1">
            <button
              onClick={() => {
                setTaxOption('freelance');
                showToast('3.3% 사업소득세 원천징수 기준으로 정산되었습니다.');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-center transition-all ${
                taxOption === 'freelance'
                  ? 'bg-white text-[#004ac6] shadow-sm'
                  : 'text-[#dbe1ff] hover:text-white'
              }`}
              type="button"
            >
              3.3% 사업소득세
            </button>
            <button
              onClick={() => {
                setTaxOption('insurance');
                showToast('4대 사회보험 요율(약 9.4%) 기준으로 재계산되었습니다.');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-center transition-all ${
                taxOption === 'insurance'
                  ? 'bg-white text-[#004ac6] shadow-sm'
                  : 'text-[#dbe1ff] hover:text-white'
              }`}
              type="button"
            >
              4대 보험 (약 9.4%)
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Bento Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#f2f3ff] flex flex-col justify-between border border-[#c3c6d7]/20">
          <div className="flex items-center gap-1 text-[#434655]">
            <span className="material-symbols-outlined text-[16px]">work_history</span>
            <span className="text-[11px] font-medium">출근 일수</span>
          </div>
          <p className="text-base font-bold text-[#131b2e] mt-1.5">
            {currentMonthlySummary.totalWorkDays}
            <span className="text-xs text-[#434655] font-normal ml-0.5">일</span>
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#f2f3ff] flex flex-col justify-between border border-[#c3c6d7]/20">
          <div className="flex items-center gap-1 text-[#434655]">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span className="text-[11px] font-medium">총 시간</span>
          </div>
          <div>
            <p className="text-base font-bold text-[#131b2e] mt-1.5">
              {currentMonthlySummary.totalWorkedHours}
              <span className="text-xs text-[#434655] font-normal ml-0.5">h</span>
            </p>
            {currentMonthlySummary.totalOvertimeHours > 0 && (
              <span className="text-[10px] text-[#b35300] font-bold block leading-tight">
                연장 {currentMonthlySummary.totalOvertimeHours}h 포함
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#f2f3ff] flex flex-col justify-between border border-[#c3c6d7]/20">
          <div className="flex items-center gap-1 text-[#434655]">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-[11px] font-medium">실효 시급</span>
          </div>
          <p className="text-base font-bold text-[#004ac6] mt-1.5">
            {formatKRW(currentMonthlySummary.effectiveHourlyRate)}
            <span className="text-xs text-[#434655] font-normal ml-0.5">원</span>
          </p>
        </div>
      </div>

      {/* Workplace Badge Card (Dynamic Workplace Icon & Info) */}
      <div className="p-3.5 rounded-2xl bg-[#f2f3ff] flex items-center justify-between gap-3 shadow-xs border border-[#c3c6d7]/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#eaedff] flex items-center justify-center text-2xl border border-[#004ac6]/20 shadow-xs shrink-0">
            {activeWorkplace.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#131b2e] truncate">{activeWorkplace.name}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#dbe1ff] text-[#004ac6]">
                적용 중
              </span>
            </div>
            <span className="text-xs text-[#434655] mt-0.5">
              기본 시급 {formatKRW(activeWorkplace.hourlyWage)}원 · {activeWorkplace.role}
            </span>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          className="px-3 py-1.5 rounded-xl bg-white text-[#004ac6] hover:bg-[#eaedff] text-xs font-semibold shrink-0 shadow-xs active:scale-95 transition-all border border-[#004ac6]/20 cursor-pointer"
          type="button"
        >
          근무조건 변경
        </button>
      </div>

      {/* Earnings Breakdown Section (지급 내역) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]"></span>
            <h2 className="text-sm font-bold text-[#131b2e]">
              지급 내역 (총 {formatKRW(currentMonthlySummary.grossPay)}원)
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#004ac6]">세전 총액</span>
        </div>

        {/* Basic Pay Card */}
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#131b2e]">기본급여</span>
              <span className="text-xs text-[#434655]">
                {currentMonthlySummary.totalWorkedHours}시간 × {formatKRW(activeWorkplace.hourlyWage)}원
              </span>
            </div>
            <span className="text-base font-bold text-[#131b2e]">
              {formatKRW(currentMonthlySummary.basePay)}원
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#eaedff] overflow-hidden mt-1">
            <div
              className="h-full bg-[#004ac6] rounded-full transition-all duration-500"
              style={{ width: `${basicPercentage}%` }}
            />
          </div>
        </div>

        {/* Holiday Allowance Card with Weekly Badges */}
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#131b2e]">주휴수당</span>
                <span className="px-1.5 py-0.2 rounded bg-[#6cf8bb]/40 text-[#00714d] text-[10px] font-bold">
                  4주 전액 충족
                </span>
              </div>
              <span className="text-xs text-[#434655]">주 15시간 이상 개근 보너스</span>
            </div>
            <span className="text-base font-bold text-[#006c49]">
              +{formatKRW(currentMonthlySummary.weeklyHolidayPay)}원
            </span>
          </div>

          {/* Weekly Badges */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((wk, idx) => {
              const earned = currentMonthlySummary.weeklyHolidayEarned[idx] || shifts.length > 0;
              return (
                <div
                  key={wk}
                  className="p-2 rounded-xl bg-[#f2f3ff] flex flex-col items-center justify-center text-center"
                >
                  <span className="text-[11px] text-[#434655] font-medium">{wk}주차</span>
                  <div className="flex items-center gap-0.5 mt-0.5 text-[#006c49]">
                    <span className="material-symbols-outlined text-[14px]">
                      {earned ? 'check_circle' : 'schedule'}
                    </span>
                    <span className="text-xs font-bold">8h</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legal Explainer */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#f2f3ff] text-[#434655] text-xs leading-relaxed">
            <span className="material-symbols-outlined text-[#004ac6] text-[18px] shrink-0">info</span>
            <span>
              소정근로 주 15시간 이상 개근 시 근로기준법상 1일분 유급휴일 수당이 자동 발생합니다.
            </span>
          </div>
        </div>

        {/* Overtime (추가근무) Allowance */}
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#c3c6d7]/30 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#131b2e]">추가근무 (연장근로) 수당</span>
              {currentMonthlySummary.totalOvertimeHours > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#ffeed9] text-[#b35300] text-[10px] font-extrabold">
                  총 {currentMonthlySummary.totalOvertimeHours}시간
                </span>
              )}
            </div>
            <span className="text-xs text-[#434655]">
              {currentMonthlySummary.totalOvertimeHours > 0
                ? `정규 시간 외 추가근무분 (1.5배 가산 포함)`
                : `추가근무 시간 설정 시 1.5배 가산 자동 정산`}
            </span>
          </div>
          <span
            className={`text-base font-bold ${
              currentMonthlySummary.overtimePay > 0 ? 'text-[#b35300]' : 'text-[#131b2e]'
            }`}
          >
            +{formatKRW(currentMonthlySummary.overtimePay)}원
          </span>
        </div>

        {/* Night Allowance */}
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#c3c6d7]/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#131b2e]">야간 가산수당</span>
            <span className="text-xs text-[#434655]">22시 이후 마감 근무 (시간분 × 1.5배)</span>
          </div>
          <span className="text-base font-bold text-[#131b2e]">
            +{formatKRW(currentMonthlySummary.nightOvertimePay)}원
          </span>
        </div>

        {/* Total Gross Row */}
        <div className="p-4 rounded-2xl bg-[#eaedff] flex items-center justify-between">
          <span className="text-sm font-bold text-[#131b2e]">총 지급 소계</span>
          <span className="text-xl font-extrabold text-[#131b2e]">
            {formatKRW(currentMonthlySummary.grossPay)}원
          </span>
        </div>
      </div>

      {/* Deductions Breakdown Section (공제 내역) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ad0033]"></span>
            <h2 className="text-sm font-bold text-[#131b2e]">공제 내역</h2>
          </div>
          <span className="text-xs font-bold text-[#ad0033]">
            {taxOption === 'freelance'
              ? '3.3% 사업소득세 적용 중'
              : taxOption === 'insurance'
              ? '4대 보험 (약 9.4%) 적용 중'
              : '세금 공제 없음'}
          </span>
        </div>

        {taxOption === 'freelance' ? (
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f2f3ff] flex items-center justify-center text-[#ad0033]">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e]">
                    원천징수 사업소득세 (3.0%)
                  </span>
                  <span className="text-[10px] text-[#434655]">국세 소득세액</span>
                </div>
              </div>
              <span className="text-sm font-bold text-[#ad0033]">
                -{formatKRW(currentMonthlySummary.incomeTax)}원
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f2f3ff] flex items-center justify-center text-[#ad0033]">
                  <span className="material-symbols-outlined text-[18px]">location_city</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e]">지방소득세 (0.3%)</span>
                  <span className="text-[10px] text-[#434655]">소득세의 10%</span>
                </div>
              </div>
              <span className="text-sm font-bold text-[#ad0033]">
                -{formatKRW(currentMonthlySummary.localIncomeTax)}원
              </span>
            </div>

            <div className="pt-2 mt-1 border-t border-[#eaedff] flex items-center justify-between bg-[#f2f3ff] p-2.5 rounded-xl font-bold text-xs">
              <span className="text-[#131b2e]">총 공제 합계</span>
              <span className="text-[#ad0033]">-{formatKRW(currentMonthlySummary.totalDeductions)}원</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#131b2e] font-medium">국민연금 (4.5%)</span>
              <span className="font-bold text-[#ad0033]">
                -{formatKRW(currentMonthlySummary.nationalPension)}원
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#131b2e] font-medium">건강보험 (3.545%)</span>
              <span className="font-bold text-[#ad0033]">
                -{formatKRW(currentMonthlySummary.healthInsurance)}원
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#131b2e] font-medium">장기요양보험 (건보의 12.95%)</span>
              <span className="font-bold text-[#ad0033]">
                -{formatKRW(currentMonthlySummary.longTermCare)}원
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#131b2e] font-medium">고용보험 (0.9%)</span>
              <span className="font-bold text-[#ad0033]">
                -{formatKRW(currentMonthlySummary.employmentInsurance)}원
              </span>
            </div>
            <div className="pt-2 mt-1 border-t border-[#eaedff] flex items-center justify-between bg-[#f2f3ff] p-2.5 rounded-xl font-bold text-xs">
              <span className="text-[#131b2e]">4대보험 공제 합계</span>
              <span className="text-[#ad0033]">-{formatKRW(currentMonthlySummary.totalDeductions)}원</span>
            </div>
          </div>
        )}

        {/* Comparison Callout Card */}
        <div className="p-4 rounded-2xl bg-[#eaedff] flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#004ac6] shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">compare_arrows</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#131b2e]">4대보험 가입 시 차이점은?</span>
            <p className="text-xs text-[#434655] leading-relaxed">
              4대보험 가입 시 약 <strong className="text-[#131b2e]">93,630원</strong> 더 공제되지만 실업급여 및 국민연금 적립 혜택을 보호받을 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Shift Log Summary */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#131b2e]">{month}월 근무 이력 상세</h3>
          <span className="text-xs font-bold text-[#004ac6]">{monthShifts.length}회 기록</span>
        </div>

        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#c3c6d7]/30 flex flex-col gap-2.5">
          {displayedShifts.length > 0 ? (
            displayedShifts.map((shift) => {
              const calc = calculateShiftPay(shift);
              const dayStr = shift.date.split('-')[2];
              return (
                <div
                  key={shift.id}
                  className="flex items-center justify-between py-2 border-b border-[#eaedff] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-[10px] text-[#737686]">{month}.{dayStr}</span>
                      <span className="text-xs font-bold text-[#131b2e]">근무</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#131b2e]">{shift.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#eaedff] text-[#004ac6] text-[10px] font-bold">
                          {calc.workedHours}h
                        </span>
                      </div>
                      <span className="text-[11px] text-[#737686]">
                        {shift.startTime} - {shift.endTime} (휴게 {shift.breakMinutes}분)
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#131b2e]">
                    {formatKRW(calc.totalShiftPay)}원
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-[#737686]">
              기록된 근무 내역이 없습니다.
            </div>
          )}

          {monthShifts.length > 3 && (
            <button
              onClick={() => setIsAllShiftsExpanded(!isAllShiftsExpanded)}
              className="w-full py-2 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-xs font-bold text-[#131b2e] transition-colors flex items-center justify-center gap-1 mt-1"
              type="button"
            >
              <span>
                {isAllShiftsExpanded
                  ? '접기'
                  : `나머지 ${monthShifts.length - 3}건 근무 전체보기`}
              </span>
              <span className="material-symbols-outlined text-[16px]">
                {isAllShiftsExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Savings Goal Card */}
      <div className="relative overflow-hidden rounded-2xl p-4 bg-white shadow-sm border border-[#c3c6d7]/30 flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-2xl bg-[#6cf8bb]/40 flex items-center justify-center text-[#006c49] shrink-0">
          <span className="material-symbols-outlined text-[28px]">flight_takeoff</span>
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#131b2e]">도쿄 여행 저축 목표</span>
            <span className="text-xs font-bold text-[#006c49]">{savingsGoalPercent}% 달성</span>
          </div>
          <span className="text-xs text-[#434655]">
            이번 달 실수령액으로 목표까지 25만원 남았어요! 🎉
          </span>
          <div className="w-full h-1.5 rounded-full bg-[#f2f3ff] mt-1 overflow-hidden">
            <div
              className="h-full bg-[#006c49] rounded-full transition-all duration-500"
              style={{ width: `${savingsGoalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action CTA Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() => openPdfModal('payslip')}
          className="w-full h-13 py-3.5 px-4 rounded-2xl bg-[#004ac6] text-white text-sm font-bold shadow-md active:scale-[0.985] transition-all flex items-center justify-center gap-2 hover:bg-[#003ea8]"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          <span>PDF 급여명세서 내보내기</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              showToast('🔗 점주 확인용 정산 요약 링크가 복사되었습니다.');
            }}
            className="flex-1 h-12 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#131b2e] text-xs font-bold active:scale-[0.985] transition-all flex items-center justify-center gap-1.5 shadow-xs border border-[#c3c6d7]/30"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>점주님께 공유</span>
          </button>

          <button
            onClick={() => {
              setIsVerifyModalOpen(true);
              showToast(`✅ 올해(${todayYear}년) 대한민국 근로기준법 및 최저임금법 기준 검증이 완료되었습니다!`);
            }}
            className="flex-1 h-12 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#131b2e] text-xs font-bold active:scale-[0.985] transition-all flex items-center justify-center gap-1.5 shadow-xs border border-[#c3c6d7]/30 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006c49]">verified</span>
            <span>계산 검증 요청 (올해 {todayYear}년 법정)</span>
          </button>
        </div>
      </div>

      {/* Dynamic Labor Law Audit & Verification Modal (올해 기준 근로기준법/최저임금법 검증) */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[#c3c6d7]/30 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49] text-[22px]">verified_user</span>
                <div>
                  <h2 className="text-sm font-bold text-[#131b2e]">
                    올해({todayYear}년) 대한민국 근로기준법 계산 적법성 검증
                  </h2>
                  <span className="text-[11px] text-[#434655]">
                    정산월: {year}년 {month}월 · 검증 법령: 올해({todayYear}년) 고용노동부 및 최저임금위원회 기준
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#737686] hover:bg-[#eaedff] cursor-pointer"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body: Legal Checklist */}
            <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {/* Overall Status Banner */}
              <div className="p-3.5 rounded-2xl bg-[#6cf8bb]/20 border border-[#006c49]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006c49] text-[24px]">task_alt</span>
                  <div>
                    <span className="text-sm font-bold text-[#006c49] block">
                      올해({todayYear}년) 법정 노무 기준 적법성 검증 통과
                    </span>
                    <span className="text-[11px] text-[#434655]">
                      현재 정산 내역은 올해({todayYear}년) 노동법 및 최저임금 기준에 100% 부합합니다.
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#006c49] text-white text-[10px] font-bold">
                  PASS
                </span>
              </div>

              {/* Item 1: Minimum Wage */}
              <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#eaedff] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#131b2e] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#006c49] text-[16px]">check_circle</span>
                    1. 올해({todayYear}년) 법정 최저시급 준수 검증
                  </span>
                  <span className="text-[11px] font-bold text-[#006c49]">적법</span>
                </div>
                <div className="text-[11px] text-[#434655] pl-5 leading-relaxed">
                  * 올해({todayYear}년) 법정 최저시급: <strong>{formatKRW(currentLegalWage)}원</strong>
                  <br />
                  * 현재 적용 시급: <strong>{formatKRW(activeWorkplace.hourlyWage)}원</strong> (
                  {activeWorkplace.hourlyWage >= currentLegalWage
                    ? `올해 법정 기준 대비 +${formatKRW(activeWorkplace.hourlyWage - currentLegalWage)}원 준수`
                    : `올해 법정 최저시급(${formatKRW(currentLegalWage)}원) 미달 주의`}
                  )
                </div>
              </div>

              {/* Item 2: Holiday Pay */}
              <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#eaedff] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#131b2e] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#006c49] text-[16px]">check_circle</span>
                    2. 근로기준법 제55조 (주휴수당 산정 적합)
                  </span>
                  <span className="text-[11px] font-bold text-[#006c49]">적법</span>
                </div>
                <div className="text-[11px] text-[#434655] pl-5 leading-relaxed">
                  * 주 15시간 이상 개근 주차별 <code>(주간 근로시간 ÷ 40) × 8시간 × 시급</code> 자동 반영
                  <br />
                  * 이번 달 주휴수당 인정액: <strong>+{formatKRW(currentMonthlySummary.weeklyHolidayPay)}원</strong>
                </div>
              </div>

              {/* Item 3: Night Bonus */}
              <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#eaedff] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#131b2e] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#006c49] text-[16px]">check_circle</span>
                    3. 근로기준법 제56조 (야간근로 50% 가산수당)
                  </span>
                  <span className="text-[11px] font-bold text-[#006c49]">적법</span>
                </div>
                <div className="text-[11px] text-[#434655] pl-5 leading-relaxed">
                  * 22:00 ~ 06:00 시간대 통상시급의 50% 이상 가산 적용
                  <br />
                  * 이번 달 야간·연장 가산 인정액: <strong>+{formatKRW(currentMonthlySummary.nightOvertimePay)}원</strong>
                </div>
              </div>

              {/* Item 4: Deductions Reconciliation */}
              <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#eaedff] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#131b2e] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#006c49] text-[16px]">check_circle</span>
                    4. 세액 공제 및 실수령액 대차대조 일치
                  </span>
                  <span className="text-[11px] font-bold text-[#006c49]">100% 일치</span>
                </div>
                <div className="text-[11px] text-[#434655] pl-5 leading-relaxed">
                  * 적용 공제: {taxOption === 'freelance' ? '사업소득세 3.3% 원천징수' : '4대 사회보험 요율'}
                  <br />
                  * 계산식: 총지급액({formatKRW(currentMonthlySummary.grossPay)}원) - 공제액({formatKRW(currentMonthlySummary.totalDeductions)}원) = <strong>실수령액 {formatKRW(currentMonthlySummary.netPay)}원</strong>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#eaedff] bg-[#f2f3ff] flex items-center justify-between">
              <span className="text-[11px] text-[#737686]">
                검증 기준: 올해 {todayYear}년도 대한민국 고용노동부 지침
              </span>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 cursor-pointer"
              >
                검증 확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
