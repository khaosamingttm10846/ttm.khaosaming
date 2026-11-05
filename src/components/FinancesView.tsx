import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  Search,
  Trash2,
  Edit2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Printer,
} from 'lucide-react';
import {
  FinancialRecord,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
  formatCurrency,
  formatThaiDate,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../types';
import { useData } from '../context/DataContext';
import { exportFinancesToExcel } from '../utils/exportImport';

interface FinancesViewProps {
  onOpenNewFinance: () => void;
  onEditFinance: (record: FinancialRecord) => void;
  onOpenImport: () => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  onOpenNewFinance,
  onEditFinance,
  onOpenImport,
}) => {
  const { finances, deleteFinancialRecord } = useData();

  // Filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Available distinct years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    finances.forEach((f) => f.year && years.add(f.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [finances, currentYear]);

  // Filtered transactions
  const filteredFinances = useMemo(() => {
    return finances.filter((item) => {
      if (selectedYear !== 'all' && item.year !== selectedYear) return false;
      if (selectedMonth !== 'all' && item.month !== selectedMonth) return false;
      if (filterType !== 'all' && item.type !== filterType) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchRef = (item.referenceNo || '').toLowerCase().includes(q);
        const matchPay = (item.payerPayee || '').toLowerCase().includes(q);
        return matchTitle || matchCat || matchRef || matchPay;
      }

      return true;
    });
  }, [finances, selectedYear, selectedMonth, filterType, searchTerm]);

  // Financial aggregates
  const financialSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    filteredFinances.forEach((item) => {
      if (item.type === 'income') {
        totalIncome += item.amount;
        incomeByCategory[item.category] = (incomeByCategory[item.category] || 0) + item.amount;
      } else {
        totalExpense += item.amount;
        expenseByCategory[item.category] = (expenseByCategory[item.category] || 0) + item.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netBalance,
      incomeByCategory,
      expenseByCategory,
    };
  }, [filteredFinances]);

  const handleExport = () => {
    const yearLabel = selectedYear === 'all' ? 'ทุกปี' : `ปี_${selectedYear + 543}`;
    const monthLabel = selectedMonth === 'all' ? 'ทุกเดือน' : `เดือน_${THAI_MONTHS[selectedMonth - 1]}`;
    exportFinancesToExcel(filteredFinances, `รายงานรายรับรายจ่าย_แพทย์แผนไทย_รพ_เขาสมิง_${yearLabel}_${monthLabel}.xlsx`);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`ต้องการลบรายการ "${title}" หรือไม่?`)) {
      await deleteFinancialRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar */}
      <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 shadow-xs border border-teal-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-linear-to-br from-teal-700 via-cyan-700 to-teal-800 text-cyan-200 rounded-xl shadow-xs border border-cyan-400/30">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                บัญชีรายรับ-รายจ่าย ประจำเดือน
              </h2>
            </div>
            <p className="text-xs text-teal-800/80 mt-1 font-medium">
              กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลเขาสมิง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 bg-teal-50/70 hover:bg-teal-100 text-teal-800 border border-teal-200/80 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-teal-700" />
              <span>นำเข้า Excel / CSV</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-teal-50/80 hover:bg-teal-100 text-teal-850 border border-teal-200/90 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>ดาวน์โหลด Excel</span>
            </button>

            <button
              onClick={onOpenNewFinance}
              className="flex items-center gap-1.5 bg-linear-to-r from-teal-700 via-cyan-700 to-teal-700 hover:from-teal-600 hover:to-cyan-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-950/20 ring-1 ring-cyan-400/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-cyan-300" />
              <span>+ บันทึกรายรับ-รายจ่าย</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Year */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <label htmlFor="fin-year-select" className="text-slate-600 font-medium">ปี:</label>
              <select
                id="fin-year-select"
                aria-label="เลือกปี พ.ศ."
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="all">ทุกปี</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    พ.ศ. {yr + 543}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <label htmlFor="fin-month-select" className="text-slate-600 font-medium">เดือน:</label>
              <select
                id="fin-month-select"
                aria-label="เลือกเดือน"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="all">ทุกเดือน (ทั้งปี)</option>
                {THAI_MONTHS.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter Buttons */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === 'income'
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                รายรับ
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === 'expense'
                    ? 'bg-rose-700 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                รายจ่าย
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหารายการ, หมวดหมู่, เลขที่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              รายรับรวม (Total Income)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-700">
            {formatCurrency(financialSummary.totalIncome)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {filteredFinances.filter((f) => f.type === 'income').length} รายการรับ
            </span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-rose-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              รายจ่ายรวม (Total Expenses)
            </span>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-600">
            {formatCurrency(financialSummary.totalExpense)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            <span>
              {filteredFinances.filter((f) => f.type === 'expense').length} รายการจ่าย
            </span>
          </div>
        </div>

        {/* Net Balance */}
        <div
          className={`bg-white rounded-2xl p-5 shadow-xs border hover:shadow-md transition-shadow relative overflow-hidden ${
            financialSummary.netBalance >= 0 ? 'border-teal-200' : 'border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              ยอดเงินคงเหลือสุทธิ (Net Balance)
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                financialSummary.netBalance >= 0
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl sm:text-3xl font-black ${
              financialSummary.netBalance >= 0 ? 'text-teal-700' : 'text-amber-600'
            }`}
          >
            {formatCurrency(financialSummary.netBalance)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {financialSummary.netBalance >= 0 ? '✓ ผลประกอบการเป็นบวก (กำไรสุทธิ)' : '⚠ รายจ่ายมากกว่ารายรับ'}
          </div>
        </div>
      </div>

      {/* Category Breakdowns (Income & Expense) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                แยกตามหมวดหมู่รายรับ
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-800">
              {formatCurrency(financialSummary.totalIncome)}
            </span>
          </div>

          <div className="space-y-3">
            {Object.keys(financialSummary.incomeByCategory).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                ยังไม่มีข้อมูลรายรับในช่วงเวลานี้
              </p>
            ) : (
              Object.entries(financialSummary.incomeByCategory).map(([cat, amount]) => {
                const percent =
                  financialSummary.totalIncome > 0
                    ? Math.round((amount / financialSummary.totalIncome) * 100)
                    : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">
                        {cat}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(amount)}
                        </span>
                        <span className="text-slate-400 min-w-[32px] text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                แยกตามหมวดหมู่รายจ่าย
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-700">
              {formatCurrency(financialSummary.totalExpense)}
            </span>
          </div>

          <div className="space-y-3">
            {Object.keys(financialSummary.expenseByCategory).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                ยังไม่มีข้อมูลรายจ่ายในช่วงเวลานี้
              </p>
            ) : (
              Object.entries(financialSummary.expenseByCategory).map(([cat, amount]) => {
                const percent =
                  financialSummary.totalExpense > 0
                    ? Math.round((amount / financialSummary.totalExpense) * 100)
                    : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">
                        {cat}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(amount)}
                        </span>
                        <span className="text-slate-400 min-w-[32px] text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-600 transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            สมุดบันทึกรายการรายรับ-รายจ่าย ({filteredFinances.length} รายการ)
          </h3>
          <span className="text-xs text-slate-500">
            คลิกที่ไอคอนแก้ไขหรือลบเพื่อจัดการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-3 w-28">วันที่</th>
                <th className="py-3 px-3 w-24 text-center">ประเภท</th>
                <th className="py-3 px-3 min-w-[150px]">หมวดหมู่</th>
                <th className="py-3 px-3 min-w-[220px]">รายการ</th>
                <th className="py-3 px-3 w-28 text-right">จำนวนเงิน</th>
                <th className="py-3 px-3 min-w-[120px]">เลขที่เอกสาร</th>
                <th className="py-3 px-3 min-w-[150px]">ผู้รับ/ผู้จ่าย</th>
                <th className="py-3 px-3 w-20 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFinances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">ยังไม่มีรายการบันทึกในเงื่อนไขนี้</p>
                    <p className="text-xs text-slate-400 mt-1">
                      คลิก "+ บันทึกรายรับ-รายจ่าย" หรือ "นำเข้า Excel / CSV"
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFinances.map((item, idx) => {
                  const isIncome = item.type === 'income';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                        {formatThaiDate(item.date)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIncome ? 'รายรับ' : 'รายจ่าย'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {item.category}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {item.title}
                        {item.notes && (
                          <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                            {item.notes}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-black whitespace-nowrap text-sm ${
                          isIncome ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {item.referenceNo || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                        {item.payerPayee || '-'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditFinance(item)}
                            title="แก้ไข"
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            title="ลบ"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
