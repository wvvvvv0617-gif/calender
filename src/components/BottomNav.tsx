import React from 'react';
import { useShift } from '../context/ShiftContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useShift();

  const navItems = [
    {
      id: 'calendar' as const,
      label: '캘린더',
      icon: 'calendar_month',
    },
    {
      id: 'add-shift' as const,
      label: '근무 등록',
      icon: 'add_circle',
    },
    {
      id: 'payroll-summary' as const,
      label: '급여 정산',
      icon: 'payments',
    },
    {
      id: 'settings' as const,
      label: '설정',
      icon: 'settings',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-[#faf8ff]/95 backdrop-blur-xl border-t border-[#c3c6d7]/30 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] md:hidden">
      <div className="flex justify-around items-center h-16 px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-all active:scale-95 ${
                isActive
                  ? 'text-[#004ac6] font-bold'
                  : 'text-[#434655] hover:text-[#131b2e]'
              }`}
              type="button"
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[11px] leading-tight mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
