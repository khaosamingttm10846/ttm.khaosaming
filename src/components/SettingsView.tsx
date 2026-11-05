import React from 'react';
import {
  Settings,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Trash2,
  CheckCircle2,
  Hospital,
  Leaf,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { downloadServiceTemplate, downloadFinancialTemplate } from '../utils/exportImport';

interface SettingsViewProps {
  onOpenImport: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenImport }) => {
  const { currentUser, isAdmin, signInWithGoogle, logout } = useAuth();
  const { services, finances, seedSampleData, clearAllDemoData } = useData();

  const handleClearData = async () => {
    if (window.confirm('คำเตือน: คุณต้องการลบข้อมูลทั้งหมดที่บันทึกไว้ใน Firebase หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      await clearAllDemoData();
      alert('ลบข้อมูลเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              การตั้งค่าและจัดการข้อมูลระบบ
            </h2>
            <p className="text-xs text-slate-500">
              กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลเขาสมิง จ.ตราด
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database & Authentication Status */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              สถานะการเชื่อมต่อฐานข้อมูล SQL Database
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">PostgreSQL Relational DB</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                เชื่อมต่อแล้ว (Connected)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">การเข้าสู่ระบบ:</span>
                <span className="font-semibold text-slate-800">
                  {currentUser ? 'เข้าสู่ระบบแล้ว' : 'ยังไม่ได้เข้าสู่ระบบ'}
                </span>
              </div>
              {currentUser ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">บัญชี Gmail:</span>
                    <span className="font-bold text-emerald-800">{currentUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">สิทธิ์ผู้ใช้งาน:</span>
                    <span className="font-semibold text-indigo-700">
                      {isAdmin ? 'ผู้ดูแลระบบ (Admin - khaosamingttm@gmail.com)' : 'เจ้าหน้าที่โรงพยาบาล (Staff)'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full mt-2 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-all cursor-pointer"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="w-full mt-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition-all cursor-pointer shadow-xs"
                >
                  เข้าสู่ระบบด้วย Google (Gmail)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Excel & CSV Templates */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              ดาวน์โหลดไฟล์ต้นแบบ (Excel Templates)
            </h3>
          </div>

          <p className="text-xs text-slate-500">
            ดาวน์โหลดไฟล์ตัวอย่าง Template เพื่อนำไปกรอกข้อมูลผู้ป่วย หรือบันทึกบัญชี ก่อนนำเข้าสู่ระบบ:
          </p>

          <div className="space-y-2.5">
            <button
              onClick={downloadServiceTemplate}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <div className="text-left">
                  <div className="font-semibold text-slate-800 group-hover:text-emerald-800">
                    แบบฟอร์มนำเข้าข้อมูลบริการผู้ป่วย (.xlsx)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ประกอบด้วย HN, ชื่อ-สกุล, เพศ, อายุ, สิทธิ, หัตถการ
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-700 shrink-0" />
            </button>

            <button
              onClick={downloadFinancialTemplate}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 text-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                <div className="text-left">
                  <div className="font-semibold text-slate-800 group-hover:text-teal-800">
                    แบบฟอร์มนำเข้ารายรับ-รายจ่าย (.xlsx)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ประกอบด้วย วันที่, รายรับ/รายจ่าย, หมวดหมู่, จำนวนเงิน
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-teal-700 shrink-0" />
            </button>

            <button
              onClick={onOpenImport}
              className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>เปิดหน้าต่างนำเข้าไฟล์ EXCEL หรือ CSV</span>
            </button>
          </div>
        </div>

        {/* Database Quick Actions / Seed Demo Data */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              ข้อมูลตัวอย่างและการจัดการ
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl space-y-2">
              <span className="font-semibold text-amber-900 block">
                โหลดชุดข้อมูลตัวอย่าง รพ.เขาสมิง
              </span>
              <p className="text-amber-800/80 leading-relaxed">
                สร้างสถิติบริการผู้ป่วยตัวอย่าง 12 รายการ และรายการบัญชี 10 รายการ เพื่อทดลองดูผลกราฟวิเคราะห์และรายงาน
              </p>
              <button
                onClick={seedSampleData}
                className="mt-1 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-all cursor-pointer shadow-xs"
              >
                โหลดข้อมูลตัวอย่างทันที
              </button>
            </div>

            <div className="pt-2 flex justify-between items-center text-slate-500">
              <span>ข้อมูลปัจจุบันในระบบ:</span>
              <span className="font-bold text-slate-800">
                บริการ {services.length} รายการ | บัญชี {finances.length} รายการ
              </span>
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={handleClearData}
                  className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ล้างข้อมูลบริการทั้งหมดใน Firebase</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Organization Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <Hospital className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              ข้อมูลหน่วยงาน
            </h3>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="font-bold text-slate-900 text-sm">
              กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก
            </div>
            <div className="text-emerald-800 font-semibold">
              โรงพยาบาลเขาสมิง สำนักงานสาธารณสุขจังหวัดตราด
            </div>
            <p className="pt-1 text-slate-500 leading-relaxed">
              ให้บริการตรวจวินิจฉัย บำบัดรักษา ฟื้นฟูสภาพด้วยการแพทย์แผนไทย นวดไทยเพื่อการบำบัด ประคบสมุนไพร อบไอน้ำสมุนไพร ฟื้นฟูมารดาหลังคลอด และจำหน่ายยาสมุนไพรในบัญชียาหลักแห่งชาติ
            </p>
            <div className="pt-2 text-[11px] text-slate-400">
              อีเมลระบบ: khaosamingttm@gmail.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
