# ShiftMate (시프트메이트) Implementation Plan

An intelligent shift management, calendar scheduling, and automated wage calculation web application tailored for part-time, hourly, and shift workers in Korea. Built with modern K-fintech aesthetics (inspired by Toss and ShiftMate), featuring automatic statutory holiday allowance (주휴수당), night shift wage calculation, instant one-touch preset stamping, interactive payroll breakdown (3.3% withholding tax vs. 4 major insurances), and exportable PDF timesheets and pay stubs.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the Phase 1 clarification:
> - **Initial Shift State**: Empty state initialized for custom shift entry, with a convenient option to populate sample cafe data or start fresh anytime.
> - **Default Payroll Method**: 3.3% freelancer business income withholding tax with automatic statutory weekly holiday allowance (주휴수당: 15+ hours/week).
> - **Screen Form Factor**: Fluid responsive layout that natively matches the mobile mockup ergonomics on phones ($375\text{px} \sim 430\text{px}$) while gracefully expanding into a multi-column desktop dashboard on wide screens (`lg:` and `xl:`).

---

## 1. Overview & Core Concept

- **What It Does**: ShiftMate simplifies the complex calculations of hourly work, overtime, statutory allowances, and shift logging. Workers can tap once to stamp shifts (Open, Middle, Close, Weekend Full-time, Day-off) directly onto calendar dates, adjust hours and breaks in real time, view accurate real-time net earnings forecasts with visual savings goals, and configure wage rules with legal minimum wage shortcuts (2024: 9,860 KRW, 2025: 10,030 KRW).
- **Target Audience**: Hourly employees, part-time cafe/convenience store/restaurant workers (아르바이트), freelancers, and small business shifts.
- **Key Value**:
  1. **Instant Shift Logging**: One-touch preset stamping and quick date transitions.
  2. **Accurate Legal Calculations**: Automatic weekly holiday allowance (주휴수당), night premium (22:00~06:00 1.5×), substitute shift bonus (1.2×), and tax deductions.
  3. **Visual Transparency**: Clean Toss-style hero balance cards, breakdown charts, and PDF reporting.

---

## 2. User Experience & Visual Design

### Key User Flows & Screen Tabs
1. **캘린더 (Calendar & Daily Log)**:
   - Monthly net pay forecast card with D-Day payday countdown, total hours, weekly holiday pay, and deduction breakdown.
   - Month switcher (`2024년 10월`, prev/next) and view switcher (월간 / 주간 / 목록).
   - Interactive calendar grid with shift chips, status indicators, and quick-stamp click/drag mode.
   - Selected date detailed view drawer (e.g. 10월 24일 (목) 오픈 근무 5h, 51,500원).
   - Bottom quick preset stamp bar ("원터치 퀵 등록 & 드래그 배정" with Open, Middle, Close, Day-Off chips).
   - PDF timesheet export trigger.
2. **근무 등록 (Add Shift / Registration)**:
   - Segmented toggle: 근무 등록 (Work) vs 휴무 등록 (Day-Off / Leave).
   - Workplace selector & hourly rate quick chip with 2024 (9,860 KRW) & 2025 (10,030 KRW) minimum wage buttons.
   - Date picker with -1 day / +1 day buttons and "오늘 스케줄" indicator.
   - "자주 쓰는 프리셋 원터치" card list (Open, Close with night bonus, Weekend Full-time).
   - Detailed time adjustment: Clock-in/Clock-out pickers, 15/30-minute unpaid break stepper.
   - Allowance toggles: 주휴수당 자동 산정 (recommended if $\ge 15\text{h}$), 연장·야간 가산수당 (1.5×), 대타 긴급 근무 (1.2×).
   - Vacation / Leave registration block: Leave type chips (연차, 반차, 유급병가, 무급휴무, 경조사), paid status toggle, recognized hours stepper, and reason memo.
   - Sticky primary submit button with immediate haptic/visual feedback ("51,500원 근무 등록 완료").
3. **급여 정산 (Payroll Summary)**:
   - Hero net pay card with interactive toggle: **3.3% 사업소득세** vs **4대 보험 (~9.4%)**.
   - Key metrics bento: 출근 일수, 총 근무 시간, 실효 시급.
   - Active workplace coffee banner.
   - Itemized earnings breakdown: 기본급여 (progress bar), 주휴수당 (weekly fulfillment badges for 1~4 weeks), 야간·연장 가산수당, 총 지급 소계.
   - Deductions breakdown: 원천징수 소득세 + 지방소득세 vs 국민연금/건강보험/장기요양/고용보험.
   - Comparison callout: "4대보험 가입 시 차이점은?".
   - Shift history accordion list with filter and expand capability.
   - Savings goal card: "도쿄 여행 저축 목표 74% 달성" progress bar.
   - Actions: PDF 급여명세서 내보내기, 점주님께 공유, 계산 검증 요청.
4. **설정 (Settings & Workplace Rules)**:
   - Active workplaces list with workplace icon picker (☕️ 카페, 🥖 베이커리, 🏪 편의점, 🍔 패스트푸드, 📚 학원, 👗 쇼핑몰, 🏢 일반사무, 🎨 기타) and inline name/role editing.
   - Hourly wage configuration with minimum wage fast-apply buttons.
   - Payday selection (1일, 5일, 10일, 15일, 25일, 말일) and calculation period.
   - 주휴수당 산정 방식 radio selection (자동 계산 vs 미적용).
   - 세금 공제 기본값 (3.3% vs 4대보험 vs 없음).
   - 근무 템플릿 프리셋 관리 (추가, 수정, 삭제).
   - 스마트 알림 설정 (근무 시작 30분 전 알림, 급여일 D-3 알림).
   - 데이터 백업 및 내보내기 (클라우드 백업, CSV 다운로드, PDF 출력, 샘플 데이터 로드/초기화).
5. **근무 프리셋 추가 / 수정 모달 (Add Preset Bottom Sheet)**:
   - 근무 일정 vs 휴무/연차 toggle.
   - Preset title with suggestion chips (☕️ 평일 오픈, 🥪 주말 미들, 🌙 마감 풀타임, 📦 물류 입고).
   - Tag badge & color theme picker (오픈, 미들, 마감, 풀타임, 휴무).
   - Work time picker with +30m, +1h, night close fast buttons.
   - Unpaid break stepper (- / + 15m).
   - Hourly wage option (workplace default vs custom input) with real-time 1-shift wage estimation.
   - Quickbar visibility & pin toggles.

### Visual Identity & Theme
- **Color Palette**:
  - `primary`: `#004ac6` / `#2563eb` (Royal Blue)
  - `surface-container-lowest`: `#ffffff`
  - `surface-container-low`: `#f2f3ff`
  - `surface`: `#faf8ff`
  - `secondary`: `#006c49` / `#10b981` (Emerald / Mint for net income and bonuses)
  - `tertiary`: `#ad0033` / `#f43f5e` (Crimson / Rose for deductions, leaves, and night shifts)
  - `on-surface`: `#131b2e` (Deep slate for crisp readability)
- **Typography**: Inter / Pretendard with tabular numeric figures (`tnum`) for monetary alignment.
- **Layout Posture**: Fluid responsive container with sticky top app bar and fixed bottom navigation on mobile; expands to a clean, multi-column dashboard layout on desktop.

---

## 3. Key Product Decisions & Trade-Offs

- **Local Storage State Persistence**:
  - *Chosen Approach*: React state synchronized with `localStorage`, providing immediate persistence across page reloads without requiring remote authentication.
  - *Why*: Allows instant offline usability, zero latency, and persistent testing.
- **Accurate Korean Labor Standard Payroll Calculations**:
  - *Chosen Approach*:
    - **기본급**: $\text{실근무시간} \times \text{기본시급}$
    - **주휴수당**: 주당 총 근로시간이 15시간 이상일 때 $(\text{주 근로시간} / 40) \times 8 \times \text{시급}$ (주 최대 8시간 한도)
    - **야간가산수당**: 22:00 ~ 06:00 근무 시간분에 대해 0.5× 추가 가산 (총 1.5×)
    - **3.3% 원천징수**: 국세 3.0% + 지방소득세 0.3%
    - **4대 보험**: 국민연금 4.5% + 건강보험 3.545% + 장기요양 (건보의 12.95%) + 고용보험 0.9%
  - *Why*: Part-time workers in Korea rely on ShiftMate specifically because Korean labor regulations require nuanced weekly overtime and holiday calculations.
- **PDF Export via Native Print / Clean Printable Layout**:
  - *Chosen Approach*: High-fidelity printable timesheet and pay stub dialog with auto-print and downloadable data representation.
  - *Why*: Part-time workers frequently need to submit timesheets to cafe owners or store managers for payroll verification.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       ShiftMate App                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   App Header & Store Switcher         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────── ShiftMateContext ───────────────────┐  │
│  │ • Current Workplace (아이콘, 이름, 직무, 시급, 정산규칙)    │  │
│  │ • Shift Records (날짜, 시간, 휴게, 프리셋, 수당, 상태)      │  │
│  │ • Presets (명칭, 시간, 컬러, 배지, 시급)                 │  │
│  │ • Tax Settings (3.3% vs 4대보험, 주휴수당 여부, 급여일)   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│   Active Tab Navigation:                                    │
│   ├─ 1. [CalendarView]    Monthly stats, grid, quick stamp  │
│   ├─ 2. [AddShiftView]    Shift & Leave registration forms  │
│   ├─ 3. [PayrollView]     Net pay hero, earnings, deductions│
│   └─ 4. [SettingsView]    Workplace, wages, backups, rules  │
│                                                             │
│   Modals & Overlays:                                        │
│   ├─ [PresetModal]        Add/edit shift templates          │
│   ├─ [WorkplaceModal]     Edit store info & icon picker     │
│   └─ [PdfExportModal]     Printable timesheet & pay slip    │
└─────────────────────────────────────────────────────────────┘
```

### Data Models
```typescript
export interface Workplace {
  id: string;
  name: string;
  role: string;
  icon: string;
  hourlyWage: number;
}

export interface Preset {
  id: string;
  name: string;
  icon: string;
  badge: '오픈' | '미들' | '마감' | '풀타임' | '휴무';
  badgeColor: string;
  startTime: string; // '09:00'
  endTime: string;   // '14:00'
  breakMinutes: number;
  hourlyRateType: 'default' | 'custom';
  customHourlyWage?: number;
  isNightBonus?: boolean;
  isHolidayPayIncluded?: boolean;
}

export interface ShiftRecord {
  id: string;
  date: string; // 'YYYY-MM-DD'
  workplaceId: string;
  type: 'work' | 'leave';
  presetId?: string;
  name: string;
  startTime?: string;
  endTime?: string;
  breakMinutes: number;
  hourlyWage: number;
  status: 'completed' | 'scheduled';
  hasWeeklyHolidayPay: boolean;
  hasNightBonus: boolean;
  hasSubstituteBonus: boolean;
  leaveType?: '연차' | '오전반차' | '오후반차' | '유급병가' | '무급휴무' | '경조사' | '기타';
  isPaidLeave?: boolean;
  recognizedHours?: number;
  memo?: string;
}
```
