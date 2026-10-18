import React, { useState, useEffect } from 'react';
import { useShift } from '../context/ShiftContext';
import { WORKPLACE_ICON_CATEGORIES } from '../utils/sampleData';

export const WorkplaceModal: React.FC = () => {
  const {
    isWorkplaceModalOpen,
    closeWorkplaceModal,
    workplaceModalMode,
    activeWorkplace,
    workplaces,
    deleteWorkplace,
    updateWorkplace,
    addNewWorkplace,
    showToast,
  } = useShift();

  const isCreate = workplaceModalMode === 'create';

  const [icon, setIcon] = useState('🔬');
  const [name, setName] = useState('');
  const [role, setRole] = useState('연구원');
  const [wage, setWage] = useState(10320);
  const [customEmoji, setCustomEmoji] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (isCreate) {
      setIcon('🔬');
      setName('');
      setRole('연구원');
      setWage(10320);
      setCustomEmoji('');
    } else {
      setIcon(activeWorkplace.icon);
      setName(activeWorkplace.name);
      setRole(activeWorkplace.role);
      setWage(activeWorkplace.hourlyWage);
      setCustomEmoji('');
    }
  }, [isCreate, activeWorkplace, isWorkplaceModalOpen]);

  if (!isWorkplaceModalOpen) return null;

  const handleSave = () => {
    const finalName = name.trim();
    if (!finalName) {
      showToast('근무처 이름을 입력해주세요.');
      return;
    }

    const finalIcon = customEmoji.trim() || icon || '🔬';
    const finalRole = role.trim() || '연구원';
    const finalWage = Number(wage) || 10320;

    if (isCreate) {
      addNewWorkplace({
        name: finalName,
        role: finalRole,
        icon: finalIcon,
        hourlyWage: finalWage,
      });
    } else {
      updateWorkplace({
        icon: finalIcon,
        name: finalName,
        role: finalRole,
        hourlyWage: finalWage,
      });
      showToast('근무지 정보가 성공적으로 수정되었습니다.');
    }
    closeWorkplaceModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[#c3c6d7]/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6] text-[22px]">
              {isCreate ? 'add_business' : 'storefront'}
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">
                {isCreate ? '새로운 연구실 / 근무처 등록' : '근무지 정보 및 아이콘 편집'}
              </h2>
              <span className="text-[11px] text-[#434655]">
                {isCreate ? '새 근무처를 등록하면 즉시 선택되어 적용됩니다.' : '현재 선택된 근무처 정보 수정'}
              </span>
            </div>
          </div>
          <button
            onClick={closeWorkplaceModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737686] hover:bg-[#eaedff] cursor-pointer"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Representative Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#131b2e]">
                대표 아이콘 선택 (선택된 아이콘: <span className="text-base">{customEmoji.trim() || icon}</span>)
              </label>
            </div>
            <div className="space-y-3">
              {WORKPLACE_ICON_CATEGORIES.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <span className="text-[11px] font-bold text-[#004ac6] block">{cat.category}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {cat.icons.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setIcon(item.icon);
                          setCustomEmoji('');
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs flex items-center justify-start gap-2 transition-all cursor-pointer min-w-0 ${
                          icon === item.icon && !customEmoji
                            ? 'bg-[#dbe1ff] border border-[#004ac6] text-[#004ac6] font-bold shadow-xs'
                            : 'bg-[#f2f3ff] hover:bg-[#eaedff] text-[#434655]'
                        }`}
                      >
                        <span className="text-lg shrink-0">{item.icon}</span>
                        <span className="text-[12px] font-medium break-keep leading-tight text-left">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-[#434655] font-semibold shrink-0">직접 이모지 입력:</span>
                <input
                  type="text"
                  placeholder="예: 🔬, 🧪, 👨‍🔬, 💻"
                  value={customEmoji}
                  onChange={(e) => {
                    setCustomEmoji(e.target.value);
                    if (e.target.value.trim()) setIcon(e.target.value.trim());
                  }}
                  className="w-28 px-2.5 py-1 text-xs border rounded-lg bg-[#f2f3ff]"
                />
              </div>
            </div>
          </div>

          {/* Workplace Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#131b2e]">
              근무처 이름 <span className="text-[#ad0033]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 첨단바이오연구소, 인공지능 연구실, 스타벅스 강남점"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f3ff] text-sm text-[#131b2e] border border-[#c3c6d7]/30 focus:border-[#004ac6] focus:bg-white outline-none"
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#131b2e]">담당 직무 및 포지션</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="예: 석사과정 연구원 / 연구보조원 / 서비스 파트"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f3ff] text-sm text-[#131b2e] border border-[#c3c6d7]/30 focus:border-[#004ac6] focus:bg-white outline-none"
            />
          </div>

          {/* Wage */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#131b2e]">기본 시급</label>
              <button
                type="button"
                onClick={() => setWage(10320)}
                className="text-[11px] font-bold text-[#004ac6] hover:underline cursor-pointer"
              >
                2026년 법정 최저시급(10,320원) 적용
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                value={wage}
                onChange={(e) => setWage(Number(e.target.value) || 0)}
                className="w-full px-3.5 pr-8 py-2.5 rounded-xl bg-[#f2f3ff] text-sm font-bold text-[#131b2e] border border-[#c3c6d7]/30 focus:border-[#004ac6] focus:bg-white outline-none"
              />
              <span className="absolute right-3 text-xs text-[#737686] font-semibold">원</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#eaedff] flex items-center justify-between gap-2 bg-[#f2f3ff]">
          {!isCreate && workplaces.length > 1 ? (
            isConfirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#ba1a1a]">정말 삭제할까요?</span>
                <button
                  type="button"
                  onClick={() => {
                    deleteWorkplace(activeWorkplace.id);
                    closeWorkplaceModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  <span>삭제 확인</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-white text-[#737686] text-xs font-semibold hover:bg-[#eaedff] cursor-pointer"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                title="현재 근무처 삭제"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>근무처 삭제</span>
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={closeWorkplaceModal}
              className="px-4 py-2 rounded-xl bg-white text-xs font-semibold text-[#131b2e] border border-[#c3c6d7]/30 hover:bg-[#eaedff] cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-md hover:bg-[#003ea8] active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isCreate ? 'add' : 'check'}
              </span>
              <span>{isCreate ? '새 근무처 등록하기' : '저장 완료'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
