import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Calendar,
  Sparkles,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Database,
  Leaf,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar, NavigationMenu } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ServicesTableView } from './components/ServicesTableView';
import { FinancesView } from './components/FinancesView';
import { SettingsView } from './components/SettingsView';
import { FinancialFormModal } from './components/FinancialFormModal';
import { ImportExportModal } from './components/ImportExportModal';
import { PrintReportModal } from './components/PrintReportModal';
import { FinancialRecord } from './types';

function AppContent() {
  const { currentUser, isAdmin, signInWithGoogle } = useAuth();
  const { services, finances } = useData();

  // Navigation State
  const [currentMenu, setCurrentMenu] = useState<NavigationMenu>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals State
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<FinancialRecord | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleOpenNewFinance = () => {
    setEditingFinance(null);
    setIsFinancialModalOpen(true);
  };

  const handleEditFinance = (record: FinancialRecord) => {
    setEditingFinance(record);
    setIsFinancialModalOpen(true);
  };

  // Page titles
  const pageMeta: Record<NavigationMenu, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'แดชบอร์ดสรุปผลและกราฟวิเคราะห์ข้อมูล',
      subtitle: 'สถิติผู้มารับบริการแพทย์แผนไทย แยกตามเพศ อายุ สิทธิการรักษา และหัตถการ',
    },
    services: {
      title: 'รายงานผู้รับบริการ & ทะเบียนหัตถการ',
      subtitle: 'จัดการ ค้นหา และบันทึกประวัติการให้บริการผู้ป่วย โรงพยาบาลเขาสมิง',
    },
    finances: {
      title: 'บัญชีรายรับ-รายจ่าย ประจำเดือน',
      subtitle: 'ระบบบริหารการเงินและงบประมาณกองทุนการแพทย์แผนไทย',
    },
    settings: {
      title: 'การตั้งค่าและจัดการข้อมูลระบบ',
      subtitle: 'สถานะฐานข้อมูล Firebase, นำเข้า Excel/CSV และการสำรองข้อมูล',
    },
  };

  const todayThai = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f5f9f8] flex flex-col font-sans text-slate-900 antialiased selection:bg-teal-500 selection:text-white">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={(menu) => setCurrentMenu(menu)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenNewFinance={handleOpenNewFinance}
        onOpenPrintReport={() => setIsPrintModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Wrapper (Shifted by 18rem on desktop) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Navbar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-teal-100/90 sticky top-0 z-30 shadow-xs no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            {/* Mobile Hamburger & Page Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-xl text-teal-900 hover:text-cyan-700 hover:bg-teal-50 lg:hidden cursor-pointer"
                title="เปิดเมนู"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                  {pageMeta[currentMenu].title}
                </h1>
                <p className="text-xs text-teal-800/80 font-medium hidden sm:block">
                  {pageMeta[currentMenu].subtitle}
                </p>
              </div>
            </div>

            {/* Right Status & Date Badges */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Date Badge */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-teal-950 bg-teal-50/80 px-3 py-1.5 rounded-xl border border-teal-200/70 font-semibold shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span>{todayThai}</span>
              </div>

              {/* Cloud SQL / Database Online Badge */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-teal-900 bg-linear-to-r from-teal-50 to-cyan-50 px-2.5 py-1 rounded-xl border border-teal-300/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <span>Cloud SQL พร้อมใช้งาน</span>
              </div>

              {/* Import Excel Shortcut */}
              <button
                onClick={() => setIsImportModalOpen(true)}
                title="นำเข้าหรือส่งออก Excel / CSV"
                className="flex items-center gap-1.5 bg-teal-50/70 hover:bg-teal-100/80 text-teal-800 border border-teal-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">นำเข้า Excel</span>
              </button>

              {/* Login CTA if not signed in */}
              {!currentUser && (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1.5 bg-linear-to-r from-teal-700 via-cyan-700 to-teal-700 hover:from-teal-600 hover:to-cyan-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-teal-950/20 ring-1 ring-cyan-400/30 transition-all cursor-pointer"
                >
                  <span>เข้าสู่ระบบด้วย Gmail</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentMenu === 'dashboard' && (
            <DashboardView
              services={services}
              finances={finances}
              onOpenPrintReport={() => setIsPrintModalOpen(true)}
            />
          )}

          {currentMenu === 'services' && (
            <ServicesTableView
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}

          {currentMenu === 'finances' && (
            <FinancesView
              onOpenNewFinance={handleOpenNewFinance}
              onEditFinance={handleEditFinance}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          )}

          {currentMenu === 'settings' && (
            <SettingsView onOpenImport={() => setIsImportModalOpen(true)} />
          )}
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-teal-100/90 bg-white/50 text-center text-xs text-teal-900/70 font-medium no-print">
          กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลเขาสมิง จังหวัดตราด © {new Date().getFullYear() + 543}
        </footer>
      </div>

      {/* Modals */}
      <FinancialFormModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        recordToEdit={editingFinance}
      />

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        services={services}
        finances={finances}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
