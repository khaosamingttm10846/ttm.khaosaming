import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  ServiceRecord,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
  formatCurrency,
  formatThaiDate,
  COVERAGE_TYPE_OPTIONS,
  PROCEDURE_TYPE_OPTIONS,
  GENDER_OPTIONS,
  AGE_GROUP_OPTIONS,
} from '../types';
import { useData } from '../context/DataContext';
import { exportServicesToExcel } from '../utils/exportImport';

interface ServicesTableViewProps {
  onOpenImport: () => void;
}

export const ServicesTableView: React.FC<ServicesTableViewProps> = ({
  onOpenImport,
}) => {
  const { services, deleteServiceRecord } = useData();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterCoverage, setFilterCoverage] = useState<string>('all');
  const [filterProcedure, setFilterProcedure] = useState<string>('all');

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    services.forEach((s) => s.year && years.add(s.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [services]);

  // Filtered List
  const filteredList = useMemo(() => {
    return services.filter((item) => {
      if (filterYear !== 'all' && item.year !== filterYear) return false;
      if (filterMonth !== 'all' && item.month !== filterMonth) return false;
      if (filterGender !== 'all' && item.gender !== filterGender) return false;
      if (filterCoverage !== 'all' && item.coverageType !== filterCoverage) return false;
      if (filterProcedure !== 'all' && item.procedureType !== filterProcedure) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchHn = item.hn.toLowerCase().includes(q);
        const matchName = item.patientName.toLowerCase().includes(q);
        const matchDiag = (item.diagnosis || '').toLowerCase().includes(q);
        const matchPractitioner = (item.practitionerName || '').toLowerCase().includes(q);
        return matchHn || matchName || matchDiag || matchPractitioner;
      }

      return true;
    });
  }, [services, filterYear, filterMonth, filterGender, filterCoverage, filterProcedure, searchTerm]);

  // Aggregate stats of filtered view
  const totalVisits = filteredList.length;
  const totalFees = filteredList.reduce((acc, curr) => acc + (curr.fee || 0), 0);

  const handleExport = () => {
    exportServicesToExcel(filteredList, `ทะเบียนบริการแพทย์แผนไทย_รพ_เขาสมิง_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`ยืนยันการลบข้อมูลบริการของ "${name}" หรือไม่?`)) {
      await deleteServiceRecord(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Action Bar */}
      <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 shadow-xs border border-teal-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-linear-to-br from-teal-700 via-cyan-700 to-teal-800 text-cyan-200 rounded-xl shadow-xs border border-cyan-400/30">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                รายงานผู้รับบริการ &amp; ทะเบียนข้อมูลหัตถการ
              </h2>
            </div>
            <p className="text-xs text-teal-800/80 mt-1 font-medium">
              บันทึก ค้นหา และติดตามประวัติผู้มารับบริการการแพทย์แผนไทย โรงพยาบาลเขาสมิง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 bg-linear-to-r from-teal-700 via-cyan-700 to-teal-700 hover:from-teal-600 hover:to-cyan-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-950/20 ring-1 ring-cyan-400/30 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-cyan-300" />
              <span>+ นำเข้าข้อมูล Excel / CSV</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-teal-50/80 hover:bg-teal-100 text-teal-850 border border-teal-200/90 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>ส่งออก Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 pt-4 border-t border-teal-100/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Search box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-teal-700/60 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหา HN, ชื่อผู้ป่วย, อาการ หรือการวินิจฉัย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-teal-50/40 border border-teal-200/80 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
          </div>

          {/* Year */}
          <div>
            <select
              aria-label="เลือกปี พ.ศ."
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">ทุกปี พ.ศ.</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr + 543}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <select
              aria-label="เลือกเดือน"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">ทุกเดือน</option>
              {THAI_MONTHS.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <select
              aria-label="เลือกเพศ"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">ทุกเพศ</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  เพศ{g}
                </option>
              ))}
            </select>
          </div>

          {/* Coverage */}
          <div>
            <select
              aria-label="เลือกสิทธิการรักษา"
              value={filterCoverage}
              onChange={(e) => setFilterCoverage(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 truncate"
            >
              <option value="all">ทุกสิทธิการรักษา</option>
              {COVERAGE_TYPE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Badges */}
        <div className="mt-3 flex items-center justify-between text-xs text-teal-800/80 font-medium">
          <div>
            แสดงผล <strong className="text-slate-900 font-bold">{totalVisits}</strong> รายการ | มูลค่ารวม{' '}
            <strong className="text-teal-700 font-black">{formatCurrency(totalFees)}</strong>
          </div>
          {(searchTerm || filterYear !== 'all' || filterMonth !== 'all' || filterGender !== 'all' || filterCoverage !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterYear('all');
                setFilterMonth('all');
                setFilterGender('all');
                setFilterCoverage('all');
                setFilterProcedure('all');
              }}
              className="text-cyan-800 hover:text-cyan-950 hover:underline font-bold cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Table Component */}
      <div className="bg-white/95 backdrop-blur-xs rounded-2xl shadow-xs border border-teal-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-teal-950/5 border-b border-teal-100 text-teal-950 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-3 w-28">วันที่รับบริการ</th>
                <th className="py-3 px-3 w-24">HN</th>
                <th className="py-3 px-3 min-w-[150px]">ชื่อ-สกุล ผู้ป่วย</th>
                <th className="py-3 px-2 w-16 text-center">เพศ</th>
                <th className="py-3 px-2 w-16 text-center">อายุ</th>
                <th className="py-3 px-3 min-w-[120px]">สิทธิการรักษา</th>
                <th className="py-3 px-3 min-w-[180px]">ประเภทหัตถการ</th>
                <th className="py-3 px-3 min-w-[180px]">การวินิจฉัย/อาการ</th>
                <th className="py-3 px-3 w-24 text-right">ค่าบริการ</th>
                <th className="py-3 px-3 w-20 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">ไม่พบข้อมูลบริการตามเงื่อนไขที่เลือก</p>
                    <p className="text-xs text-slate-400 mt-1">
                      สามารถคลิก "นำเข้าข้อมูล Excel / CSV" เพื่อนำเข้าประวัติผู้รับบริการเข้าสู่ระบบ
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  let genderBadge = 'bg-pink-100 text-pink-800';
                  if (item.gender === 'ชาย') genderBadge = 'bg-sky-100 text-sky-800';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                        {formatThaiDate(item.serviceDate)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        {item.hn}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {item.patientName}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${genderBadge}`}>
                          {item.gender}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-medium">
                        {item.age} ปี
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-800 font-medium block truncate max-w-[130px]">
                          {item.coverageType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
                          {item.procedureType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 line-clamp-1 max-w-[200px]" title={item.diagnosis}>
                        {item.diagnosis || '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.fee || 0)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(item.id, item.patientName)}
                          title="ลบข้อมูลรายการนี้"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
