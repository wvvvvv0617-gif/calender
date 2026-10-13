import React, { useState } from 'react';
import { useShift } from '../context/ShiftContext';

export const TermsModal: React.FC = () => {
  const { isTermsModalOpen, closeTermsModal } = useShift();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'labor'>('terms');

  if (!isTermsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl max-h-[88vh] rounded-3xl shadow-2xl overflow-hidden border border-[#c3c6d7]/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6] text-[22px]">policy</span>
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">ShiftMate 이용약관 및 정책</h2>
              <span className="text-[11px] text-[#434655]">근로기준법 기반 정산 및 개인정보 보호 안내</span>
            </div>
          </div>
          <button
            onClick={closeTermsModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737686] hover:bg-[#eaedff] cursor-pointer"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Segmented Switcher */}
        <div className="p-3 bg-[#faf8ff] border-b border-[#eaedff] flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            서비스 이용약관
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            개인정보 처리방침
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('labor')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'labor'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            2026 노무 산정 기준
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-[#131b2e] space-y-4 leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#004ac6]">제1조 (목적)</h3>
              <p className="text-[#434655]">
                본 약관은 ShiftMate(이하 &ldquo;서비스&rdquo;)가 제공하는 연구원 및 단시간·교대근무자 전용 스마트 근무 스케줄 관리 및 자동 급여·주휴수당 산정 도구의 이용 조건과 절차를 규정함을 목적으로 합니다.
              </p>

              <h3 className="font-bold text-sm text-[#004ac6]">제2조 (서비스의 성격 및 책임의 한계)</h3>
              <p className="text-[#434655]">
                1. 본 서비스는 대한민국 근로기준법 및 최저임금법의 표준 산정식을 기반으로 근무 시간, 주휴수당, 야간가산수당, 소득세 원천징수액을 자동으로 계산하는 편의 도구입니다.
                <br />
                2. 서비스에서 제공하는 예상 실수령액 및 정산표는 사용자가 입력한 기준 시급과 시간에 따른 참고용 시뮬레이션이며, 사업장별 개별 단체협약·취업규칙·비과세 수당 적용에 따라 실제 급여 명세와 일부 차이가 발생할 수 있습니다.
              </p>

              <h3 className="font-bold text-sm text-[#004ac6]">제3조 (사용자의 의무)</h3>
              <p className="text-[#434655]">
                사용자는 본인의 근무 일정 및 기본시급, 공제 옵션(3.3% 원천징수 또는 4대 보험)을 정확하게 입력하여 관리할 책임이 있습니다.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#006c49]">제1조 (100% 로컬 브라우저 저장 원칙)</h3>
              <div className="p-3 rounded-xl bg-[#6cf8bb]/15 border border-[#006c49]/20 text-[#006c49] font-medium">
                🔒 ShiftMate는 회원의 소중한 근무 기록과 급여 내역, 프로필 이미지를 일체 외부 상업용 서버나 제3자 데이터베이스로 전송·수집하지 않습니다.
              </div>
              <p className="text-[#434655]">
                모든 근무 데이터, 프로필 사진(Base64), 근무지 설정은 사용자의 스마트폰 또는 PC 브라우저 내 로컬 스토리지(LocalStorage)에만 안전하게 보관됩니다.
              </p>

              <h3 className="font-bold text-sm text-[#006c49]">제2조 (데이터 보존 및 삭제 권리)</h3>
              <p className="text-[#434655]">
                1. 사용자는 언제든지 [프로필 &gt; 근무 기록 초기화] 메뉴를 통해 이번 달, 올 해 또는 모든 근무 데이터를 영구적으로 파기할 수 있습니다.
                <br />
                2. 브라우저 캐시 삭제 시 데이터가 소실될 수 있으므로, 중요한 정산 내역은 설정 탭의 [엑셀 CSV 다운] 및 [문서 파일 다운로드]를 통해 주기적으로 백업하는 것을 권장합니다.
              </p>
            </div>
          )}

          {activeTab === 'labor' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#ad0033]">2026년 법정 기준 요율 안내</h3>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7]/30">
                  <div className="font-bold text-[#004ac6]">1. 2026년 법정 최저시급</div>
                  <div className="text-[#434655] mt-0.5">
                    시간당 <strong>10,320원</strong> (최저임금위원회 고시 기준 준수)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7]/30">
                  <div className="font-bold text-[#006c49]">2. 주휴수당 (근로기준법 제55조)</div>
                  <div className="text-[#434655] mt-0.5">
                    1주 15시간 이상 소정근로일 개근 시 유급휴일 부여:
                    <br />
                    <code>(1주 실근무시간 ÷ 40시간) × 8시간 × 시급</code>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7]/30">
                  <div className="font-bold text-[#7038a8]">3. 야간근로 가산수당 (근로기준법 제56조)</div>
                  <div className="text-[#434655] mt-0.5">
                    오후 10시(22:00)부터 익일 오전 6시(06:00) 사이 근로는 통상임금의 <strong>50% 이상</strong> 가산
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7]/30">
                  <div className="font-bold text-[#ad0033]">4. 원천징수 세액 공제 옵션</div>
                  <div className="text-[#434655] mt-0.5">
                    * 3.3% 프리랜서: 사업소득세 3.0% + 지방소득세 0.3%
                    <br />
                    * 4대 보험 적용: 국민연금 4.5% + 건강보험 3.545% + 고용보험 0.9%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#f2f3ff] border-t border-[#eaedff] flex items-center justify-between">
          <span className="text-[11px] text-[#737686]">
            ShiftMate v2.6 · 대한민국 근로기준법 준수
          </span>
          <button
            type="button"
            onClick={closeTermsModal}
            className="px-5 py-2 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
