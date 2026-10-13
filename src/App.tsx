/**
 * ShiftMate - Smart Shift Scheduling & Wage Calculation
 * Main Application Component
 */

import React from 'react';
import { ShiftProvider, useShift } from './context/ShiftContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CalendarView } from './components/CalendarView';
import { AddShiftView } from './components/AddShiftView';
import { PayrollView } from './components/PayrollView';
import { SettingsView } from './components/SettingsView';
import { PresetModal } from './components/PresetModal';
import { PdfExportModal } from './components/PdfExportModal';
import { WorkplaceModal } from './components/WorkplaceModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { ProfileModal } from './components/ProfileModal';
import { TermsModal } from './components/TermsModal';

const MainLayout: React.FC = () => {
  const { activeTab, toastMessage } = useShift();

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col antialiased selection:bg-[#dbe1ff] selection:text-[#00174b]">
      {/* Top Application Bar */}
      <Header />

      {/* Main Screen Content */}
      <main className="flex-1 w-full pt-2">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'add-shift' && <AddShiftView />}
        {activeTab === 'payroll-summary' && <PayrollView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals & Overlays */}
      <PresetModal />
      <PdfExportModal />
      <WorkplaceModal />
      <PwaInstallModal />
      <ProfileModal />
      <TermsModal />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="px-4 py-2.5 rounded-full bg-[#283044] text-[#eef0ff] text-xs font-semibold shadow-xl flex items-center gap-2 border border-white/10">
            <span className="material-symbols-outlined text-[#6ffbbe] text-[18px]">
              check_circle
            </span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ShiftProvider>
      <MainLayout />
    </ShiftProvider>
  );
}
