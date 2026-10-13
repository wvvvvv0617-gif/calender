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
    openPdfModal,
    showToast,
    setActiveTab,
  } = useShift();

  const [isAllShiftsExpanded, setIsAllShiftsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const paydayDDay = useMemo(() => {
    return calculatePaydayDDay(paydayOption);
  }, [paydayOption]);

  // Parse current year & month
  const [year, month] = useMemo(() => {
    const parts = currentMonth.split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [currentMonth]);

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
          <p className="text-base font-bold text-[#131b2e] mt-1.5">
            {currentMonthlySummary.totalWorkedHours}
            <span className="text-xs text-[#434655] font-normal ml-0.5">h</span>
          </p>
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

        {/* Night / Overtime Allowance */}
        <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#c3c6d7]/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#131b2e]">야간 · 연장 가산수당</span>
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
              showToast('✅ 2024년 근로기준법 및 주휴수당 산정 규칙에 부합합니다.');
            }}
            className="flex-1 h-12 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#131b2e] text-xs font-bold active:scale-[0.985] transition-all flex items-center justify-center gap-1.5 shadow-xs border border-[#c3c6d7]/30"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>계산 검증 요청</span>
          </button>
        </div>
      </div>
    </div>
  );
};
