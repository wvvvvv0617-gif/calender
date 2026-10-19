import React, { useState } from 'react';
import { useShift } from '../context/ShiftContext';
import { formatKRW, calculateShiftPay } from '../utils/calculations';

export const PdfExportModal: React.FC = () => {
  const {
    isPdfModalOpen,
    closePdfModal,
    pdfExportType,
    openPdfModal,
    currentMonth,
    shifts,
    activeWorkplace,
    currentMonthlySummary,
    taxOption,
    showToast,
    userName,
  } = useShift();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  // Option to toggle between showing pay amounts vs only showing worked days/hours
  const [includePayInfo, setIncludePayInfo] = useState<boolean>(true);

  if (!isPdfModalOpen) return null;

  const [year, month] = currentMonth.split('-');
  const monthShifts = shifts
    .filter((s) => s.date.startsWith(currentMonth))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Generate self-contained standalone HTML document for download & reliable printing
  const generateDocumentHtml = () => {
    const isTimesheet = !includePayInfo || pdfExportType === 'timesheet';
    const title = !includePayInfo
      ? `${year}년 ${month}월 근무 확인서 (출퇴근 기록표)`
      : isTimesheet
      ? `${year}년 ${month}월 근무표 및 출퇴근 확인서`
      : `${year}년 ${month}월 급여명세서`;

    const shiftRowsHtml = monthShifts
      .map((s) => {
        const calc = calculateShiftPay(s);
        const typeBadge =
          s.type === 'leave'
            ? `<span style="background:#ffdadb;color:#ad0033;padding:2px 6px;border-radius:4px;font-weight:bold;font-size:11px;">${s.leaveType || '휴무'}</span>`
            : `<span style="background:#dbe1ff;color:#004ac6;padding:2px 6px;border-radius:4px;font-weight:bold;font-size:11px;">${s.name}</span>`;

        const otBadge =
          s.overtimeHours && s.overtimeHours > 0
            ? `<span style="background:#ffeed9;color:#b35300;padding:2px 5px;border-radius:4px;font-size:10px;margin-left:4px;font-weight:bold;">+${s.overtimeHours}h 연장</span>`
            : '';

        const workHourText =
          s.overtimeHours && s.overtimeHours > 0
            ? `${calc.workedHours}시간<br><small style="color:#b35300;font-size:10px;">(기본 ${calc.regularHours}h + 연장 ${s.overtimeHours}h)</small>`
            : `${calc.workedHours}시간`;

        const payCell = includePayInfo
          ? `<td style="padding:8px 10px;border-bottom:1px solid #eaedff;text-align:right;font-weight:bold;color:#131b2e;">${formatKRW(calc.totalShiftPay)}원</td>`
          : '';

        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eaedff;">${s.date}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eaedff;">${typeBadge}${otBadge}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eaedff;color:#434655;">${s.type === 'work' ? `${s.startTime} ~ ${s.endTime}` : '-'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eaedff;text-align:center;color:#434655;">${s.breakMinutes}분</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eaedff;text-align:right;font-weight:bold;">${workHourText}</td>
          ${payCell}
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title} - ShiftMate</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", sans-serif;
      color: #131b2e;
      background: #faf8ff;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header-bar {
      border-bottom: 2px solid #131b2e;
      padding-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .badge {
      font-size: 11px;
      font-weight: bold;
      color: #004ac6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      margin: 4px 0;
      font-size: 24px;
      font-weight: 900;
      color: #131b2e;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 12px;
    }
    th {
      background: #f2f3ff;
      color: #434655;
      font-weight: 700;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #c3c6d7;
    }
    .summary-card {
      background: #f2f3ff;
      padding: 16px;
      border-radius: 12px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      font-size: 14px;
    }
    .net-box {
      background: #004ac6;
      color: #ffffff;
      padding: 20px;
      border-radius: 12px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .net-amount {
      font-size: 26px;
      font-weight: 900;
    }
    .signatures {
      margin-top: 36px;
      padding-top: 24px;
      border-top: 1px solid #c3c6d7;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      text-align: center;
    }
    .sig-box {
      background: #f2f3ff;
      padding: 16px;
      border-radius: 10px;
      font-size: 12px;
    }
    .action-bar {
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #dbe1ff;
      padding: 12px 18px;
      border-radius: 12px;
    }
    .btn-print {
      background: #004ac6;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .container { box-shadow: none; padding: 0; }
      .action-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="action-bar">
      <span style="font-size:13px;font-weight:bold;color:#004ac6;">
        💡 ShiftMate 인쇄 및 PDF 저장 안내: 브라우저 메뉴에서 [인쇄] 또는 [PDF로 저장]을 선택하세요.
      </span>
      <button class="btn-print" onclick="window.print()">🖨️ 지금 인쇄 / PDF 저장</button>
    </div>

    <div class="header-bar">
      <div>
        <div class="badge">ShiftMate Verified Official Payroll Report</div>
        <h1>${title}</h1>
        <div style="font-size:12px;color:#434655;margin-top:4px;">
          정산 대상 기간: ${year}년 ${month}월 1일 ~ ${year}년 ${month}월 말일
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:bold;font-size:15px;">${activeWorkplace.name}</div>
        <div style="font-size:12px;color:#434655;">근무자: ${userName} (${activeWorkplace.role})</div>
        ${
          includePayInfo
            ? `<div style="font-size:12px;color:#434655;">기본시급: ${formatKRW(activeWorkplace.hourlyWage)}원</div>`
            : `<div style="font-size:12px;color:#004ac6;font-weight:bold;">총 출근: ${currentMonthlySummary.totalWorkDays}일 (${currentMonthlySummary.totalWorkedHours}h)</div>`
        }
      </div>
    </div>

    ${
      isTimesheet
        ? `
      <table>
        <thead>
          <tr>
            <th>근무일자</th>
            <th>구분</th>
            <th>출퇴근 시간</th>
            <th style="text-align:center;">휴게시간</th>
            <th style="text-align:right;">실근무</th>
            ${includePayInfo ? '<th style="text-align:right;">일 정산액</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${shiftRowsHtml}
        </tbody>
      </table>

      <div class="summary-card">
        <span>총 출근 일수: ${currentMonthlySummary.totalWorkDays}일</span>
        <span>총 실근로: ${currentMonthlySummary.totalWorkedHours}시간${
          currentMonthlySummary.totalOvertimeHours > 0
            ? ` (연장 ${currentMonthlySummary.totalOvertimeHours}h 포함)`
            : ''
        }</span>
        ${
          includePayInfo
            ? `<span style="color:#004ac6;font-size:16px;">총 예상 수령액: ${formatKRW(currentMonthlySummary.netPay)}원</span>`
            : `<span style="color:#006c49;font-size:13px;font-weight:bold;">✓ 출퇴근 근무 확인 완료</span>`
        }
      </div>
      `
        : `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div style="background:#f2f3ff;padding:16px;border-radius:12px;">
          <div style="color:#004ac6;font-weight:bold;font-size:13px;margin-bottom:10px;border-bottom:1px solid #c3c6d7;padding-bottom:6px;">지급 내역 (세전)</div>
          <div style="font-size:13px;line-height:2;">
            <div style="display:flex;justify-content:space-between;"><span>기본급여</span><b>${formatKRW(currentMonthlySummary.basePay)}원</b></div>
            ${
              currentMonthlySummary.overtimePay > 0
                ? `<div style="display:flex;justify-content:space-between;color:#b35300;"><span>추가근무(연장 ${currentMonthlySummary.totalOvertimeHours}h)</span><b>+${formatKRW(currentMonthlySummary.overtimePay)}원</b></div>`
                : ''
            }
            <div style="display:flex;justify-content:space-between;color:#006c49;"><span>주휴수당 (4주)</span><b>+${formatKRW(currentMonthlySummary.weeklyHolidayPay)}원</b></div>
            <div style="display:flex;justify-content:space-between;"><span>야간 가산수당</span><b>+${formatKRW(currentMonthlySummary.nightOvertimePay)}원</b></div>
            <div style="border-top:1px solid #c3c6d7;margin-top:8px;padding-top:6px;display:flex;justify-content:space-between;font-weight:bold;">
              <span>총 지급 소계</span><span>${formatKRW(currentMonthlySummary.grossPay)}원</span>
            </div>
          </div>
        </div>

        <div style="background:#f2f3ff;padding:16px;border-radius:12px;">
          <div style="color:#ad0033;font-weight:bold;font-size:13px;margin-bottom:10px;border-bottom:1px solid #c3c6d7;padding-bottom:6px;">공제 내역 (${taxOption === 'freelance' ? '3.3% 원천징수' : '4대 사회보험'})</div>
          <div style="font-size:13px;line-height:2;">
            ${
              taxOption === 'freelance'
                ? `
              <div style="display:flex;justify-content:space-between;color:#ad0033;"><span>사업소득세 (3.0%)</span><b>-${formatKRW(currentMonthlySummary.incomeTax)}원</b></div>
              <div style="display:flex;justify-content:space-between;color:#ad0033;"><span>지방소득세 (0.3%)</span><b>-${formatKRW(currentMonthlySummary.localIncomeTax)}원</b></div>
              `
                : `
              <div style="display:flex;justify-content:space-between;color:#ad0033;"><span>국민연금 (4.5%)</span><b>-${formatKRW(currentMonthlySummary.nationalPension)}원</b></div>
              <div style="display:flex;justify-content:space-between;color:#ad0033;"><span>건강보험 (3.545%)</span><b>-${formatKRW(currentMonthlySummary.healthInsurance)}원</b></div>
              `
            }
            <div style="border-top:1px solid #c3c6d7;margin-top:8px;padding-top:6px;display:flex;justify-content:space-between;font-weight:bold;color:#ad0033;">
              <span>총 공제 합계</span><span>-${formatKRW(currentMonthlySummary.totalDeductions)}원</span>
            </div>
          </div>
        </div>
      </div>

      <div class="net-box">
        <div>
          <div style="font-size:12px;opacity:0.9;">실 수령액 (차인지급액)</div>
          <div class="net-amount">${formatKRW(currentMonthlySummary.netPay)}원</div>
        </div>
        <div style="text-align:right;font-size:13px;opacity:0.9;">
          <div>지급일: 매월 10일</div>
          <div>실효 시급: ${formatKRW(currentMonthlySummary.effectiveHourlyRate)}원</div>
        </div>
      </div>
      `
    }

    <div class="signatures">
      <div class="sig-box">
        <div style="color:#737686;">근로자 확인</div>
        <div style="height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;margin-top:8px;">
          ${userName} (인 또는 서명)
        </div>
      </div>
      <div class="sig-box">
        <div style="color:#737686;">팀장확인</div>
        <div style="height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;margin-top:8px;">
          ${activeWorkplace.name} (인 또는 서명)
        </div>
      </div>
    </div>

    <div style="margin-top:24px;font-size:11px;color:#737686;text-align:center;">
      대한민국 근로기준법 제48조(임금대장 및 임금명세서 교부 의무) 기준 작성본
    </div>
  </div>
</body>
</html>`;
  };

  // Download document as standalone HTML file
  const handleDownloadFile = () => {
    try {
      const htmlContent = generateDocumentHtml();
      const filename = !includePayInfo
        ? `ShiftMate_근무확인서(근무일만)_${year}년_${month}월_${activeWorkplace.name.replace(/\s+/g, '_')}.html`
        : pdfExportType === 'timesheet'
        ? `ShiftMate_근무확인서(급여포함)_${year}년_${month}월_${activeWorkplace.name.replace(/\s+/g, '_')}.html`
        : `ShiftMate_급여명세서_${year}년_${month}월_${activeWorkplace.name.replace(/\s+/g, '_')}.html`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(filename);
      showToast(`'${filename}' 파일이 기기에 다운로드되었습니다!`);
    } catch (err) {
      console.error(err);
      showToast('파일 생성 중 오류가 발생했습니다. 브라우저 설정을 확인해주세요.');
    }
  };

  // Handle direct print with reliable fallback
  const handlePrint = () => {
    // Check if running inside an iframe (such as AI Studio preview)
    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    if (inIframe) {
      // In sandboxed iframe environments, window.print() is often blocked by browser security
      // Therefore, automatically trigger download AND attempt opening in new tab
      handleDownloadFile();
      showToast('안내: 미리보기(iframe) 환경에서는 인쇄창 대신 전용 파일로 즉시 다운로드되었습니다.');
    } else {
      try {
        window.print();
      } catch {
        // Fallback to file download
        handleDownloadFile();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#c3c6d7]/30">
        {/* Header (hidden in print) */}
        <div className="p-4 border-b border-[#eaedff] flex items-center justify-between no-print bg-[#f2f3ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ad0033] text-[24px]">picture_as_pdf</span>
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">
                {!includePayInfo
                  ? `${year}년 ${month}월 근무 확인서 (출퇴근 기록표)`
                  : pdfExportType === 'timesheet'
                  ? `${year}년 ${month}월 근무표 및 출퇴근 확인서`
                  : `${year}년 ${month}월 급여명세서 (실수령액 요약)`}
              </h2>
              <span className="text-[11px] text-[#434655]">
                {!includePayInfo
                  ? '급여 금액이 제외된 출퇴근 일자 및 실근무시간 증빙 문서입니다.'
                  : '파일 다운로드 또는 인쇄 대화상자에서 PDF 저장이 가능합니다.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {includePayInfo ? (
              <button
                onClick={() => openPdfModal(pdfExportType === 'timesheet' ? 'payslip' : 'timesheet')}
                className="px-2.5 py-1 rounded-xl bg-white text-[#004ac6] text-xs font-bold shadow-xs border border-[#004ac6]/20 cursor-pointer active:scale-95 transition-all"
              >
                {pdfExportType === 'timesheet' ? '명세서 서식 보기' : '근무표 서식 보기'}
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-white text-[#006c49] text-xs font-bold border border-[#6cf8bb]">
                근무일 증빙 서식
              </span>
            )}
            <button
              onClick={closePdfModal}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#737686] hover:bg-[#eaedff] cursor-pointer"
              aria-label="닫기"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Output Mode Switcher: 일한 날만(급여 미표시) vs 급여까지 같이 표시 */}
        <div className="bg-[#eff2ff] px-4 py-2.5 border-b border-[#004ac6]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#131b2e]">
            <span className="material-symbols-outlined text-[18px] text-[#004ac6]">tune</span>
            <span>출력 옵션 선택:</span>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-2xs border border-[#c3c6d7]/40 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setIncludePayInfo(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                !includePayInfo
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">event_available</span>
              <span>일한 날만 (급여 미표시)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIncludePayInfo(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                includePayInfo
                  ? 'bg-[#004ac6] text-white shadow-xs'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">payments</span>
              <span>급여까지 같이 표시</span>
            </button>
          </div>
        </div>

        {/* Informative notification banner explaining download vs print */}
        <div className="bg-[#eaedff] px-4 py-2 text-xs text-[#004ac6] flex items-center justify-between gap-2 border-b border-[#004ac6]/15 no-print">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[16px] shrink-0">info</span>
            <span>
              스튜디오나 모바일 환경에서는 <strong>[파일로 다운로드]</strong>를 누르면 즉시 저장되며, 저장된 파일을 열어 PDF로 저장할 수 있습니다.
            </span>
          </div>
          {downloadSuccess && (
            <span className="text-[11px] font-bold text-[#006c49] shrink-0">
              ✓ 다운로드 완료
            </span>
          )}
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#131b2e]" id="printable-export-area">
          {/* Header of Report */}
          <div className="border-b-2 border-[#131b2e] pb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-[#004ac6] uppercase tracking-wider">
                ShiftMate Verified Payroll Report
              </div>
              <h1 className="text-xl md:text-2xl font-black text-[#131b2e] mt-0.5">
                {!includePayInfo
                  ? '출퇴근 근무 확인서 (근무일·시간 증빙)'
                  : pdfExportType === 'timesheet'
                  ? '출퇴근 근무 확인서'
                  : '월별 급여 명세서'}
              </h1>
              <div className="text-xs text-[#434655] mt-1">
                정산 기간: {year}년 {month}월 1일 ~ {year}년 {month}월 말일
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-[#131b2e]">{activeWorkplace.name}</div>
              <div className="text-xs text-[#434655]">
                근무자: {userName} ({activeWorkplace.role})
              </div>
              {includePayInfo ? (
                <div className="text-xs text-[#434655]">
                  기본시급: {formatKRW(activeWorkplace.hourlyWage)}원
                </div>
              ) : (
                <div className="text-xs font-bold text-[#004ac6]">
                  총 출근: {currentMonthlySummary.totalWorkDays}일 ({currentMonthlySummary.totalWorkedHours}시간)
                </div>
              )}
            </div>
          </div>

          {/* Timesheet Table View (Shown when !includePayInfo or pdfExportType === 'timesheet') */}
          {!includePayInfo || pdfExportType === 'timesheet' ? (
            <div className="space-y-4">
              {!includePayInfo && (
                <div className="px-3 py-1.5 rounded-lg bg-[#e8f5e9] border border-[#a5d6a7] text-xs font-bold text-[#2e7d32] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                  <span>급여 미포함 모드: 일한 날짜와 근무 시간만 표시되는 증빙용 서식입니다.</span>
                </div>
              )}

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f3ff] text-[#434655] border-b border-[#c3c6d7]">
                    <th className="py-2 px-2.5 font-bold">근무일자</th>
                    <th className="py-2 px-2.5 font-bold">구분</th>
                    <th className="py-2 px-2.5 font-bold">출퇴근 시간</th>
                    <th className="py-2 px-2.5 font-bold text-center">휴게시간</th>
                    <th className="py-2 px-2.5 font-bold text-right">실근무시간</th>
                    {includePayInfo && (
                      <th className="py-2 px-2.5 font-bold text-right">일 정산액</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaedff]">
                  {monthShifts.length > 0 ? (
                    monthShifts.map((s) => {
                      const calc = calculateShiftPay(s);
                      return (
                        <tr key={s.id} className="hover:bg-[#faf8ff]">
                          <td className="py-2 px-2.5 font-medium">{s.date}</td>
                          <td className="py-2 px-2.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                  s.type === 'leave'
                                    ? 'bg-[#ffdadb] text-[#ad0033]'
                                    : 'bg-[#dbe1ff] text-[#004ac6]'
                                }`}
                              >
                                {s.name}
                              </span>
                              {s.overtimeHours && s.overtimeHours > 0 ? (
                                <span className="px-1.5 py-0.2 rounded font-extrabold text-[9px] bg-[#ffeed9] text-[#b35300] border border-[#ffdbb8]">
                                  +{s.overtimeHours}h 연장
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-2 px-2.5 text-[#434655]">
                            {s.type === 'work' ? `${s.startTime} ~ ${s.endTime}` : '-'}
                          </td>
                          <td className="py-2 px-2.5 text-center text-[#434655]">
                            {s.breakMinutes}분
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold">
                            <div>{calc.workedHours}시간</div>
                            {s.overtimeHours && s.overtimeHours > 0 ? (
                              <div className="text-[10px] text-[#b35300] font-normal">
                                (연장 {s.overtimeHours}h)
                              </div>
                            ) : null}
                          </td>
                          {includePayInfo && (
                            <td className="py-2 px-2.5 text-right font-bold text-[#131b2e]">
                              {formatKRW(calc.totalShiftPay)}원
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={includePayInfo ? 6 : 5} className="py-6 text-center text-[#737686] text-xs">
                        해당 월에 등록된 근무 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Timesheet Summary Totals */}
              <div className="bg-[#f2f3ff] p-4 rounded-xl flex items-center justify-between text-xs font-bold border border-[#c3c6d7]/30 flex-wrap gap-2">
                <span>총 출근 일수: {currentMonthlySummary.totalWorkDays}일</span>
                <span>
                  총 실근로: {currentMonthlySummary.totalWorkedHours}시간
                  {currentMonthlySummary.totalOvertimeHours > 0
                    ? ` (연장 ${currentMonthlySummary.totalOvertimeHours}h 포함)`
                    : ''}
                </span>
                {includePayInfo ? (
                  <span className="text-sm text-[#004ac6]">
                    총 예상 수령액: {formatKRW(currentMonthlySummary.netPay)}원
                  </span>
                ) : (
                  <span className="text-xs text-[#006c49] font-bold flex items-center gap-1 bg-[#6cf8bb]/30 px-2.5 py-1 rounded-lg">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>출퇴근 근무 확인 완료</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Payslip Table View */
            <div className="space-y-4">
              {/* Earnings & Deductions Dual Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="p-3.5 rounded-xl border border-[#c3c6d7]/30 bg-[#f2f3ff]">
                  <div className="text-xs font-bold text-[#004ac6] border-b border-[#c3c6d7]/30 pb-1.5 mb-2">
                    지급 내역 (세전)
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#434655]">기본급여</span>
                      <span className="font-bold">{formatKRW(currentMonthlySummary.basePay)}원</span>
                    </div>
                    {currentMonthlySummary.overtimePay > 0 && (
                      <div className="flex justify-between text-[#b35300]">
                        <span>추가근무(연장 {currentMonthlySummary.totalOvertimeHours}h)</span>
                        <span className="font-bold">
                          +{formatKRW(currentMonthlySummary.overtimePay)}원
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#434655]">주휴수당 (4주 충족)</span>
                      <span className="font-bold text-[#006c49]">
                        +{formatKRW(currentMonthlySummary.weeklyHolidayPay)}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#434655]">야간 가산수당</span>
                      <span className="font-bold">
                        +{formatKRW(currentMonthlySummary.nightOvertimePay)}원
                      </span>
                    </div>
                    <div className="border-t border-[#c3c6d7]/30 pt-1.5 flex justify-between font-bold text-[#131b2e]">
                      <span>총 지급 소계</span>
                      <span>{formatKRW(currentMonthlySummary.grossPay)}원</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-3.5 rounded-xl border border-[#c3c6d7]/30 bg-[#f2f3ff]">
                  <div className="text-xs font-bold text-[#ad0033] border-b border-[#c3c6d7]/30 pb-1.5 mb-2">
                    공제 내역 ({taxOption === 'freelance' ? '3.3% 원천징수' : '4대 사회보험'})
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {taxOption === 'freelance' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#434655]">원천징수 사업소득세 (3.0%)</span>
                          <span className="font-bold text-[#ad0033]">
                            -{formatKRW(currentMonthlySummary.incomeTax)}원
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#434655]">지방소득세 (0.3%)</span>
                          <span className="font-bold text-[#ad0033]">
                            -{formatKRW(currentMonthlySummary.localIncomeTax)}원
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#434655]">국민연금 (4.5%)</span>
                          <span className="font-bold text-[#ad0033]">
                            -{formatKRW(currentMonthlySummary.nationalPension)}원
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#434655]">건강보험 (3.545%)</span>
                          <span className="font-bold text-[#ad0033]">
                            -{formatKRW(currentMonthlySummary.healthInsurance)}원
                          </span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-[#c3c6d7]/30 pt-1.5 flex justify-between font-bold text-[#ad0033]">
                      <span>총 공제 합계</span>
                      <span>-{formatKRW(currentMonthlySummary.totalDeductions)}원</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Grand Box */}
              <div className="p-4 rounded-xl bg-[#004ac6] text-white flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold opacity-90">실 수령액 (차인지급액)</span>
                  <div className="text-2xl font-extrabold tracking-tight">
                    {formatKRW(currentMonthlySummary.netPay)}원
                  </div>
                </div>
                <div className="text-right text-xs opacity-90">
                  <div>지급예정일: 매월 10일</div>
                  <div>실효 시급: {formatKRW(currentMonthlySummary.effectiveHourlyRate)}원</div>
                </div>
              </div>
            </div>
          )}

          {/* Employer & Worker Signatures (Print compliant) */}
          <div className="pt-6 border-t border-[#c3c6d7] grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#f2f3ff] rounded-xl text-center">
              <span className="text-[#737686] block">근로자 확인</span>
              <div className="h-8 flex items-center justify-center font-bold text-[#131b2e]">
                {userName} (인 또는 서명)
              </div>
            </div>
            <div className="p-3 bg-[#f2f3ff] rounded-xl text-center">
              <span className="text-[#737686] block">팀장확인</span>
              <div className="h-8 flex items-center justify-center font-bold text-[#131b2e]">
                {activeWorkplace.name} (인 또는 서명)
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (hidden in print) */}
        <div className="p-4 border-t border-[#eaedff] flex items-center justify-between no-print bg-[#f2f3ff] flex-wrap gap-2">
          <span className="text-xs text-[#737686]">
            근로기준법 제48조(임금대장 및 임금명세서 교부) 기준
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={closePdfModal}
              className="px-3.5 py-2 rounded-xl bg-white text-xs font-semibold text-[#131b2e] border border-[#c3c6d7]/30 hover:bg-[#eaedff] active:scale-95 transition-all cursor-pointer"
            >
              닫기
            </button>

            {/* Direct File Download Button (Guaranteed to work in iframe & mobile) */}
            <button
              onClick={handleDownloadFile}
              className="px-4 py-2 rounded-xl bg-[#eaedff] text-[#004ac6] text-xs font-bold shadow-xs hover:bg-[#dbe1ff] active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer border border-[#004ac6]/20"
              title="HTML 인쇄용 문서 파일로 직접 다운로드"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>파일로 다운로드</span>
            </button>

            {/* Print / Save to PDF Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-md hover:bg-[#003ea8] active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
              title="인쇄 대화상자 열기 (PDF로 저장)"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>인쇄 및 PDF로 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
