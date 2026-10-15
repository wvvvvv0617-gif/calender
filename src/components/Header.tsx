import React, { useState } from 'react';
import { useShift } from '../context/ShiftContext';
import { Workplace } from '../types';
import { useLongPress } from '../utils/useLongPress';
import { DeleteWorkplaceModal } from './DeleteWorkplaceModal';

interface NotifItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
}

const NOTIFICATIONS_LIST: NotifItem[] = [
  {
    id: 'notif_shift_30m',
    icon: 'alarm',
    title: '근무 시작 30분 전 알림',
    desc: '오늘 연구/근무 스케줄 리마인더와 출근 탭 알림이 작동 중입니다.',
    color: 'text-[#004ac6]',
  },
  {
    id: 'notif_payday_d1',
    icon: 'celebration',
    title: '급여일 D-1 정산 알림',
    desc: '지급일 1일 전 확정 실수령액과 명세서 요약 확인이 설정되었습니다.',
    color: 'text-[#006c49]',
  },
];

interface WorkplaceDropdownItemProps {
  wp: Workplace;
  isActive: boolean;
  onSelect: () => void;
  onLongPressDelete: (wp: Workplace) => void;
}

const WorkplaceDropdownItem: React.FC<WorkplaceDropdownItemProps> = ({
  wp,
  isActive,
  onSelect,
  onLongPressDelete,
}) => {
  const bind = useLongPress({
    threshold: 480,
    onLongPress: () => {
      onLongPressDelete(wp);
    },
    onClick: () => {
      onSelect();
    },
  });

  return (
    <div
      {...bind}
      className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer select-none active:scale-[0.98] ${
        isActive
          ? 'bg-[#eaedff] text-[#004ac6] font-semibold ring-1 ring-[#004ac6]/30'
          : 'hover:bg-[#f2f3ff] text-[#131b2e]'
      }`}
      title="터치하여 선택 · 꾹(길게) 누르면 삭제"
    >
      <div className="flex items-center gap-2 truncate">
        <span className="text-base shrink-0">{wp.icon}</span>
        <div className="min-w-0">
          <span className="text-xs truncate block font-medium">{wp.name}</span>
          <span className="text-[10px] text-[#737686] block">
            {wp.role} · {wp.hourlyWage.toLocaleString()}원
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isActive && (
          <span className="material-symbols-outlined text-[16px] text-[#004ac6]">
            check
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLongPressDelete(wp);
          }}
          className="opacity-60 hover:opacity-100 p-1 rounded-lg hover:bg-[#ffdad6] text-[#737686] hover:text-[#ba1a1a] transition-all"
          title="근무처 삭제 (길게 눌러도 삭제 가능)"
          aria-label={`${wp.name} 삭제`}
        >
          <span className="material-symbols-outlined text-[15px]">delete</span>
        </button>
      </div>
    </div>
  );
};

export const Header: React.FC = () => {
  const {
    activeWorkplace,
    workplaces,
    setActiveWorkplaceId,
    openWorkplaceModal,
    activeTab,
    setActiveTab,
    openPwaModal,
    triggerPwaInstall,
    isInstallable,
    isInstalled,
    showToast,
    profileImage,
    openProfileModal,
    userName,
    readNotificationIds,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useShift();

  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [wpToDelete, setWpToDelete] = useState<Workplace | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenDelete = (wp: Workplace) => {
    setWpToDelete(wp);
    setIsDeleteModalOpen(true);
  };

  // Unread notifications check
  const unreadNotifs = NOTIFICATIONS_LIST.filter(
    (n) => !readNotificationIds.includes(n.id)
  );
  const hasUnread = unreadNotifs.length > 0;

  const handleOpenNotif = () => {
    setIsNotifOpen(!isNotifOpen);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(NOTIFICATIONS_LIST.map((n) => n.id));
    showToast('모든 알림을 읽음 처리했습니다.');
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-[#faf8ff]/90 backdrop-blur-xl border-b border-[#c3c6d7]/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 md:gap-3">
        {/* Left: Brand Logo & Store Selector */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div
            className="flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => setActiveTab('calendar')}
            title="캘린더 홈"
          >
            <img
              alt="ShiftMate Logo"
              className="h-7 sm:h-8 w-auto object-contain shrink-0 rounded-md"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGVvfQ-ogoFmu1BuA6gi68GDcv7UVHkfsyGZacWfbct5NFV49E1Ra1Ba8MBd5X_8mE97rm3bvIu4xClF99ySyN_a1cO2lIvNqYSfZY6MElg37KN-XTIv9n4O945Y8_G0PwbYUEU-68EaUVcK0cFWfjOafTPE9xFOXAy7CZggPE8VAojTrrVaHgaift7PtATTk29lj_IJhaE9uQSeQB23RuRF_ugnJAdhLD5rMKd8o8Z2EY-FfC5phEBA"
            />
          </div>

          {/* Store Switcher Dropdown Anchor */}
          <div className="relative min-w-0">
            <button
              onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
              className="flex items-center gap-1 min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] active:scale-95 transition-all truncate text-left border border-[#c3c6d7]/20 cursor-pointer"
              type="button"
            >
              <span className="text-[14px] sm:text-[15px] font-semibold text-[#131b2e] truncate max-w-[130px] sm:max-w-[200px]">
                {activeWorkplace.icon} {activeWorkplace.name}
              </span>
              <span className="material-symbols-outlined text-[#737686] text-[18px] shrink-0">
                arrow_drop_down
              </span>
            </button>

            {/* Store Dropdown Menu */}
            {isStoreDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsStoreDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-[#c3c6d7]/30 p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#737686] uppercase tracking-wider flex items-center justify-between border-b border-[#eaedff]">
                    <span>근무처 목록</span>
                    <span className="text-[10px] text-[#004ac6] font-semibold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">touch_app</span>
                      <span>꾹 눌러서 삭제</span>
                    </span>
                  </div>
                  <div className="space-y-1 max-h-56 overflow-y-auto pt-1">
                    {workplaces.map((wp) => (
                      <WorkplaceDropdownItem
                        key={wp.id}
                        wp={wp}
                        isActive={wp.id === activeWorkplace.id}
                        onSelect={() => {
                          setActiveWorkplaceId(wp.id);
                          setIsStoreDropdownOpen(false);
                          showToast(`'${wp.name}' 근무처로 변경되었습니다.`);
                        }}
                        onLongPressDelete={handleOpenDelete}
                      />
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#eaedff] flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setIsStoreDropdownOpen(false);
                        openWorkplaceModal('create');
                      }}
                      className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#004ac6] bg-[#dbe1ff]/50 hover:bg-[#dbe1ff] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      <span>새로운 연구실 / 근무처 추가</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsStoreDropdownOpen(false);
                        openWorkplaceModal('edit');
                      }}
                      className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#434655] hover:bg-[#f2f3ff] transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>현재 근무지 정보/아이콘 편집</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center: Desktop & Tablet Fold Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#eaedff] p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>캘린더</span>
          </button>
          <button
            onClick={() => setActiveTab('add-shift')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'add-shift'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>근무 등록</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll-summary')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payroll-summary'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>급여 정산</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>설정</span>
          </button>
        </nav>

        {/* Right: Download App, Notifications & Profile */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* PWA Install & Shortcut Button */}
          {isInstalled ? (
            <button
              onClick={openPwaModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#6cf8bb]/30 text-[#006c49] border border-[#006c49]/20 text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
              type="button"
              title="ShiftMate PWA 앱으로 실행 중입니다 (클릭 시 바로가기 관리)"
            >
              <span className="material-symbols-outlined text-[16px] text-[#006c49]">check_circle</span>
              <span className="text-[11px] sm:text-xs">앱 실행 중</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (isInstallable) {
                  triggerPwaInstall();
                } else {
                  openPwaModal();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#004ac6] text-white hover:bg-[#003ea8] text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
              type="button"
              title="스마트폰 홈화면에 앱 설치 및 사이트 바로 접속"
            >
              <span className="material-symbols-outlined text-[16px]">install_mobile</span>
              <span className="text-[11px] sm:text-xs">{isInstallable ? '앱 설치하기' : '홈화면 설치'}</span>
            </button>
          )}

          {/* Notifications button with Red Dot disappearing on read */}
          <div className="relative">
            <button
              aria-label="알림"
              onClick={handleOpenNotif}
              className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-[#131b2e] hover:bg-[#eaedff] active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {hasUnread && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ad0033] ring-2 ring-[#faf8ff] animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#c3c6d7]/30 p-3 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#eaedff]">
                    <span className="text-xs font-bold text-[#131b2e]">스마트 알림 리마인더</span>
                    <div className="flex items-center gap-1.5">
                      {hasUnread ? (
                        <>
                          <span className="text-[10px] text-[#ad0033] font-bold">
                            {unreadNotifs.length}건 미확인
                          </span>
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-[#004ac6] font-bold hover:underline cursor-pointer"
                          >
                            모두 읽음
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#006c49] font-bold">
                          ✓ 모두 확인됨
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    {NOTIFICATIONS_LIST.map((n) => {
                      const isRead = readNotificationIds.includes(n.id);
                      return (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                            isRead
                              ? 'bg-[#faf8ff] border-transparent opacity-75'
                              : 'bg-[#f2f3ff] border-[#004ac6]/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-1 text-[11px] font-bold ${n.color}`}>
                              <span className="material-symbols-outlined text-[15px]">{n.icon}</span>
                              <span>{n.title}</span>
                            </div>
                            {!isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]"></span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#434655] mt-1 leading-snug">
                            {n.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Avatar */}
          <div
            className="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            onClick={openProfileModal}
            title={`${userName} 프로필 설정 (사진 업로드 / 초기화)`}
          >
            {profileImage ? (
              <img
                alt={userName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-[#004ac6]/30 hover:ring-[#004ac6] shadow-xs"
                src={profileImage}
              />
            ) : (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#eaedff] hover:bg-[#dbe1ff] text-[#004ac6] ring-2 ring-[#004ac6]/20 hover:ring-[#004ac6] flex items-center justify-center shadow-xs transition-all"
                title="기본 프로필 (클릭하여 사진 변경)"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">person</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workplace Long-Press Delete Confirmation Modal */}
      <DeleteWorkplaceModal
        workplace={wpToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </header>
  );
};
