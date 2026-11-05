import React from 'react';
import {
  Activity,
  BarChart3,
  DollarSign,
  Users,
  FileSpreadsheet,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  Leaf,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export type ActiveTab = 'dashboard' | 'finances' | 'services' | 'import-export';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewService: () => void;
  onOpenNewFinance: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewService,
  onOpenNewFinance,
}) => {
  const { currentUser, isAdmin, signInWithGoogle, logout } = useAuth();
  const { services, finances, seedSampleData } = useData();

  return (
    <header className="bg-white border-b border-emerald-900/10 shadow-xs sticky top-0 z-30 no-print">
      {/* Top Banner Bar */}
      <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center shadow-inner text-emerald-200">
              <Leaf className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg tracking-wide text-white">
                  กลุ่มงานการแพทย์แผนไทย โรงพยาบาลเขาสมิง
                </h1>
                <span className="bg-emerald-600/70 text-emerald-100 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-400/30">
                  จ.ตราด
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 font-light hidden sm:block">
                ระบบสารสนเทศและแดชบอร์ดวิเคราะห์สถิติบริการการแพทย์แผนไทย &amp; บัญชีรายรับ-รายจ่าย
              </p>
            </div>
          </div>

          {/* User Auth and Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-emerald-950/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-emerald-600/40 text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Staff'}
                    className="w-7 h-7 rounded-full border border-emerald-400/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <div className="text-white font-medium truncate max-w-[140px]">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                    <span>{isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่ (Staff)'}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="ออกจากระบบ"
                  className="ml-1 p-1.5 hover:bg-emerald-800/80 rounded-md text-emerald-200 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>เข้าสู่ระบบด้วย Gmail</span>
              </button>
            )}

            {/* Quick Seed Data Button for convenience */}
            {services.length < 5 && currentUser && (
              <button
                onClick={seedSampleData}
                title="โหลดชุดข้อมูลตัวอย่าง รพ.เขาสมิง"
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">โหลดข้อมูลตัวอย่าง</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-2 border-b border-gray-100">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>แดชบอร์ดสรุปผล &amp; กราฟวิเคราะห์</span>
            </button>

            <button
              onClick={() => setActiveTab('finances')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'finances'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>รายรับ-รายจ่าย ประจำเดือน</span>
              {finances.length > 0 && (
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {finances.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ทะเบียนผู้รับบริการ</span>
              {services.length > 0 && (
                <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {services.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('import-export')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'import-export'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>นำเข้า / ดาวน์โหลด Excel &amp; PDF</span>
            </button>
          </nav>

          {/* Quick Record Add Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onOpenNewService}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>บันทึกบริการผู้ป่วย</span>
            </button>

            <button
              onClick={onOpenNewFinance}
              className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>บันทึกรายรับ-จ่าย</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
