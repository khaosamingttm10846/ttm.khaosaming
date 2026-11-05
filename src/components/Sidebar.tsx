import React from 'react';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  Leaf,
  LogOut,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  PlusCircle,
  Database,
  ChevronRight,
  Hospital,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export type NavigationMenu = 'dashboard' | 'services' | 'finances' | 'settings';

interface SidebarProps {
  currentMenu: NavigationMenu;
  onSelectMenu: (menu: NavigationMenu) => void;
  onOpenImport: () => void;
  onOpenNewFinance: () => void;
  onOpenPrintReport: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  onOpenImport,
  onOpenNewFinance,
  onOpenPrintReport,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, isAdmin, signInWithGoogle, logout } = useAuth();
  const { services, finances, seedSampleData } = useData();

  const menuItems = [
    {
      id: 'dashboard' as NavigationMenu,
      label: 'แดชบอร์ดสรุปผล',
      sublabel: 'วิเคราะห์สถิติรายปี-รายเดือน',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'services' as NavigationMenu,
      label: 'รายงานผู้ป่วย',
      sublabel: 'ทะเบียนผู้รับบริการแพทย์แผนไทย',
      icon: Users,
      badge: services.length > 0 ? services.length : null,
    },
    {
      id: 'finances' as NavigationMenu,
      label: 'บัญชีรายรับรายจ่าย',
      sublabel: 'บันทึกรายรับ-รายจ่ายประจำเดือน',
      icon: DollarSign,
      badge: finances.length > 0 ? finances.length : null,
    },
    {
      id: 'settings' as NavigationMenu,
      label: 'ตั้งค่า & ข้อมูล',
      sublabel: 'นำเข้า Excel / Firebase / สำรองข้อมูล',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-linear-to-b from-[#031d20] via-[#05282e] to-[#02181d] text-slate-200 z-50 flex flex-col border-r border-teal-900/40 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-teal-900/50 bg-linear-to-b from-[#053238] to-[#032227] relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-950/50 border border-cyan-300/40">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide text-white">
                  รพ.เขาสมิง
                </span>
                <span className="bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  จ.ตราด
                </span>
              </div>
              <h2 className="text-xs font-semibold text-cyan-300 line-clamp-1 mt-0.5">
                กลุ่มงานการแพทย์แผนไทย
              </h2>
              <p className="text-[10px] text-teal-200/70 font-light">
                และการแพทย์ทางเลือก
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-3 border-b border-teal-900/40 grid grid-cols-2 gap-2 bg-[#02161a]/60">
          <button
            onClick={() => {
              onOpenImport();
              onCloseMobile();
            }}
            className="flex items-center justify-center gap-1.5 bg-linear-to-r from-teal-700 to-cyan-700 hover:from-teal-600 hover:to-cyan-600 text-white p-2 rounded-xl text-xs font-medium transition-all shadow-xs border border-teal-400/30 cursor-pointer"
            title="นำเข้าไฟล์ Excel หรือ CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-200" />
            <span>นำเข้า Excel</span>
          </button>
          <button
            onClick={() => {
              onOpenNewFinance();
              onCloseMobile();
            }}
            className="flex items-center justify-center gap-1.5 bg-linear-to-r from-cyan-800 to-teal-800 hover:from-cyan-700 hover:to-teal-700 text-white p-2 rounded-xl text-xs font-medium transition-all shadow-xs border border-cyan-500/30 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-300" />
            <span>ลงบัญชี</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            เมนูหลัก
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMenu === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectMenu(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-linear-to-r from-teal-600 via-cyan-700 to-teal-700 text-white font-semibold shadow-lg shadow-teal-950/60 ring-1 ring-cyan-400/40'
                    : 'text-teal-100/70 hover:bg-[#062b32]/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-cyan-100 ring-1 ring-white/30'
                        : 'bg-[#02181d] text-teal-300 group-hover:text-cyan-200 group-hover:bg-[#08333b]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-tight">
                      {item.label}
                    </div>
                    <div
                      className={`text-[11px] ${
                        isActive ? 'text-cyan-100/90' : 'text-teal-200/50'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-400/50 shadow-inner'
                        : 'bg-[#031d22] text-teal-300 border border-teal-800/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Report Print */}
          <div className="pt-4 px-3">
            <button
              onClick={() => {
                onOpenPrintReport();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-cyan-500/40 bg-linear-to-r from-teal-900/50 to-cyan-900/50 hover:from-teal-800/70 hover:to-cyan-800/70 text-cyan-100 hover:text-white text-xs transition-all cursor-pointer shadow-xs"
              title="พิมพ์รายงานสรุปผลการดำเนินงานแบบรายไตรมาส (Quarterly Performance Report)"
            >
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-300" />
                <span className="font-medium">รายงานผลงานรายไตรมาส</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>

          {/* Seed demo data prompt if empty */}
          {services.length < 5 && (
            <div className="pt-3 px-3">
              <button
                onClick={() => {
                  seedSampleData();
                }}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>โหลดข้อมูลตัวอย่าง รพ.เขาสมิง</span>
              </button>
            </div>
          )}
        </div>

        {/* User Account / Google Auth Footer */}
        <div className="p-3 border-t border-teal-900/40 bg-[#021417]/95">
          {currentUser ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#042025] border border-teal-800/50 shadow-inner">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-9 h-9 rounded-full border border-cyan-400/40 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-teal-600 to-cyan-700 flex items-center justify-center font-bold text-white shrink-0">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-cyan-300 truncate">
                    <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{isAdmin ? 'Admin (khaosamingttm)' : 'เจ้าหน้าที่ รพ.'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                title="ออกจากระบบ"
                className="p-1.5 text-teal-300 hover:text-rose-400 hover:bg-teal-900/40 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-slate-100 p-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

          <div className="mt-2 text-center text-[10px] text-teal-400/60">
            ระบบเชื่อมต่อ Cloud SQL & Google Sync
          </div>
        </div>
      </aside>
    </>
  );
};
