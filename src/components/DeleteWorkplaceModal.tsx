import React from 'react';
import { Workplace } from '../types';
import { useShift } from '../context/ShiftContext';

interface DeleteWorkplaceModalProps {
  workplace: Workplace | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteWorkplaceModal: React.FC<DeleteWorkplaceModalProps> = ({
  workplace,
  isOpen,
  onClose,
}) => {
  const { workplaces, shifts, deleteWorkplace } = useShift();

  if (!isOpen || !workplace) return null;

  const isOnlyOne = workplaces.length <= 1;
  const workplaceShifts = shifts.filter((s) => s.workplaceId === workplace.id);

  const handleDelete = () => {
    deleteWorkplace(workplace.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-[#c3c6d7]/30 p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-14 h-14 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center text-3xl mb-3 shadow-xs">
            {isOnlyOne ? '⚠️' : '🗑️'}
          </div>
          <h3 className="text-base font-bold text-[#131b2e]">
            {isOnlyOne ? '근무처 삭제 불가' : '근무처 삭제 확인'}
          </h3>
          <p className="text-xs text-[#434655] mt-1 leading-relaxed">
            {isOnlyOne ? (
              <span>
                ShiftMate에는 <strong>최소 1개 이상의 근무처</strong>가 유지되어야 합니다.
                <br />
                삭제 대신 정보를 수정하시거나, 다른 근무처를 먼저 추가한 후 삭제해주세요.
              </span>
            ) : (
              <span>
                <strong>꾹 누르신 &lsquo;{workplace.name}&rsquo;</strong> 근무처를 정말 삭제하시겠습니까?
              </span>
            )}
          </p>
        </div>

        {/* Workplace Details Card */}
        <div className="p-3 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-xs">
            {workplace.icon}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="text-xs font-bold text-[#131b2e] truncate">{workplace.name}</div>
            <div className="text-[11px] text-[#434655]">
              {workplace.role} · 시급 {workplace.hourlyWage.toLocaleString()}원
            </div>
            {!isOnlyOne && (
              <div className="text-[10px] text-[#ad0033] font-semibold mt-0.5">
                등록된 근무 일정: {workplaceShifts.length}건
              </div>
            )}
          </div>
        </div>

        {!isOnlyOne && (
          <div className="p-2.5 rounded-xl bg-[#fff2f2] text-[#ad0033] text-[11px] border border-[#ffdad6] space-y-0.5 text-left">
            <div className="font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>주의 사항</span>
            </div>
            <p className="text-[10.5px] leading-tight text-[#92002a]">
              삭제 시 해당 근무처에 배정된 모든 스케줄과 급여 계산 내역이 함께 삭제됩니다.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isOnlyOne ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 transition-all cursor-pointer"
            >
              확인
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#434655] text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>근무처 삭제</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
