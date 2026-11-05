import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Table,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  importServicesFile,
  importFinancesFile,
  downloadServiceTemplate,
  downloadFinancialTemplate,
  exportServicesToExcel,
  exportFinancesToExcel,
} from '../utils/exportImport';
import { useData } from '../context/DataContext';
import { ServiceRecord, FinancialRecord, formatCurrency, formatThaiDate } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { services, finances, importServicesBatch, importFinancesBatch } = useData();

  const [activeTab, setActiveTab] = useState<'services' | 'finances'>('services');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedServices, setParsedServices] = useState<Omit<ServiceRecord, 'id'>[]>([]);
  const [parsedFinances, setParsedFinances] = useState<Omit<FinancialRecord, 'id'>[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setStatusMsg(null);
    setParsing(true);

    try {
      if (activeTab === 'services') {
        const rows = await importServicesFile(file);
        setParsedServices(rows);
        setStatusMsg({
          type: 'success',
          text: `อ่านไฟล์สำเร็จ พบข้อมูลบริการผู้ป่วย ${rows.length} รายการ พร้อมนำเข้า`,
        });
      } else {
        const rows = await importFinancesFile(file);
        setParsedFinances(rows);
        setStatusMsg({
          type: 'success',
          text: `อ่านไฟล์สำเร็จ พบรายการรายรับ-รายจ่าย ${rows.length} รายการ พร้อมนำเข้า`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ .xlsx หรือ .csv ที่ถูกต้อง',
      });
      setParsedServices([]);
      setParsedFinances([]);
    } finally {
      setParsing(false);
    }
  };

  const handleCommitImport = async () => {
    setImporting(true);
    setStatusMsg(null);
    try {
      if (activeTab === 'services') {
        if (!parsedServices.length) return;
        const count = await importServicesBatch(parsedServices);
        setStatusMsg({
          type: 'success',
          text: `นำเข้าข้อมูลผู้รับบริการ ${count} รายการ สู่ระบบ Firebase สำเร็จเรียบร้อย!`,
        });
        setParsedServices([]);
        setSelectedFile(null);
      } else {
        if (!parsedFinances.length) return;
        const count = await importFinancesBatch(parsedFinances);
        setStatusMsg({
          type: 'success',
          text: `นำเข้ารายการบัญชี ${count} รายการ สู่ระบบ Firebase สำเร็จเรียบร้อย!`,
        });
        setParsedFinances([]);
        setSelectedFile(null);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสู่ Firebase',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleSwitchTab = (tab: 'services' | 'finances') => {
    setActiveTab(tab);
    setSelectedFile(null);
    setParsedServices([]);
    setParsedFinances([]);
    setStatusMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-700/80 rounded-xl text-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                ศูนย์นำเข้าและส่งออกข้อมูล (Import &amp; Export)
              </h3>
              <p className="text-xs text-emerald-200/90 font-light">
                รองรับไฟล์ EXCEL (.xlsx, .xls) และ CSV พร้อมตัวอย่างแบบฟอร์ม
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-emerald-800/80 rounded-lg text-emerald-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => handleSwitchTab('services')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. นำเข้าข้อมูลบริการผู้ป่วย
            </button>
            <button
              onClick={() => handleSwitchTab('finances')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'finances'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. นำเข้ารายรับ-รายจ่าย
            </button>
          </div>

          {/* Template Download Shortcut */}
          <button
            onClick={activeTab === 'services' ? downloadServiceTemplate : downloadFinancialTemplate}
            className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด Template</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Dropzone / Upload Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 hover:bg-emerald-50/20">
            <input
              type="file"
              id="excel-file-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="excel-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
              </span>
              <p className="text-xs text-slate-500">
                รองรับไฟล์ Microsoft Excel (.xlsx, .xls) และ Comma Separated (.csv)
              </p>
              {selectedFile && (
                <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
                  ไฟล์ที่เลือก: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </label>
          </div>

          {/* Preview of Parsed Rows */}
          {activeTab === 'services' && parsedServices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  ตัวอย่างข้อมูลก่อนบันทึก (แสดง 5 แถวแรกจากทั้งหมด {parsedServices.length} แถว):
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  ตรวจความถูกต้องเรียบร้อย
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">วันที่</th>
                      <th className="p-2">HN</th>
                      <th className="p-2">ชื่อผู้ป่วย</th>
                      <th className="p-2">เพศ</th>
                      <th className="p-2">อายุ</th>
                      <th className="p-2">สิทธิ</th>
                      <th className="p-2">หัตถการ</th>
                      <th className="p-2 text-right">ค่าบริการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedServices.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2 whitespace-nowrap">{row.serviceDate}</td>
                        <td className="p-2 font-mono font-bold text-emerald-800">{row.hn}</td>
                        <td className="p-2 font-medium">{row.patientName}</td>
                        <td className="p-2">{row.gender}</td>
                        <td className="p-2">{row.age} ปี</td>
                        <td className="p-2 truncate max-w-[100px]">{row.coverageType}</td>
                        <td className="p-2 truncate max-w-[140px]">{row.procedureType}</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(row.fee || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleCommitImport}
                disabled={importing}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{importing ? 'กำลังบันทึกลง Firebase...' : `ยืนยันนำเข้า ${parsedServices.length} รายการ สู่ Firebase`}</span>
              </button>
            </div>
          )}

          {activeTab === 'finances' && parsedFinances.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  ตัวอย่างข้อมูลก่อนบันทึก (แสดง 5 แถวแรกจากทั้งหมด {parsedFinances.length} แถว):
                </span>
                <span className="text-[11px] text-teal-700 font-semibold">
                  ตรวจความถูกต้องเรียบร้อย
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">วันที่</th>
                      <th className="p-2">ประเภท</th>
                      <th className="p-2">หมวดหมู่</th>
                      <th className="p-2">รายการ</th>
                      <th className="p-2 text-right">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedFinances.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2 whitespace-nowrap">{row.date}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {row.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </span>
                        </td>
                        <td className="p-2 truncate max-w-[120px]">{row.category}</td>
                        <td className="p-2 font-medium truncate max-w-[180px]">{row.title}</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleCommitImport}
                disabled={importing}
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{importing ? 'กำลังบันทึกลง Firebase...' : `ยืนยันนำเข้า ${parsedFinances.length} รายการ สู่ Firebase`}</span>
              </button>
            </div>
          )}

          {/* Direct Excel Export Section */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              หรือต้องการส่งออกข้อมูลปัจจุบันที่มีอยู่ใน Firebase ออกเป็น Excel:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => exportServicesToExcel(services)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-xs font-semibold text-slate-800 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>ส่งออกข้อมูลบริการทั้งหมด ({services.length} ราย)</span>
                </div>
                <Download className="w-3.5 h-3.5 text-emerald-700" />
              </button>

              <button
                onClick={() => exportFinancesToExcel(finances)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-xs font-semibold text-slate-800 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                  <span>ส่งออกข้อมูลบัญชีทั้งหมด ({finances.length} รายการ)</span>
                </div>
                <Download className="w-3.5 h-3.5 text-teal-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
