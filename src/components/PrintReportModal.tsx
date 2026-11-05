import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Leaf,
  FileText,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  CreditCard,
  Building2,
  AlertCircle,
  HelpCircle,
  Edit3,
  RotateCcw,
  Sparkles,
  Layers,
  BarChart3,
  Stethoscope,
} from 'lucide-react';
import {
  ServiceRecord,
  FinancialRecord,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
  formatCurrency,
  formatThaiDate,
  AGE_GROUP_OPTIONS,
  COVERAGE_TYPE_OPTIONS,
  PROCEDURE_TYPE_OPTIONS,
  FiscalQuarter,
  FISCAL_QUARTERS,
  getFiscalQuarter,
  calculateFiscalYear,
} from '../types';
import { generateHospitalPDF, generateQuarterlyPerformancePDF } from '../utils/pdfExport';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceRecord[];
  finances: FinancialRecord[];
  initialMode?: 'quarterly' | 'general' | 'four_quarters';
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  services,
  finances,
  initialMode = 'quarterly',
}) => {
  if (!isOpen) return null;

  // Active Report Tab: 'quarterly' | 'general' | 'four_quarters'
  const [reportTab, setReportTab] = useState<'quarterly' | 'general' | 'four_quarters'>(initialMode);

  // Current Thai Fiscal Year (e.g. 2569)
  const currentFiscalYear = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    return curMonth >= 10 ? curYear + 543 + 1 : curYear + 543;
  }, []);

  // Determine current active quarter
  const currentFiscalQuarter = useMemo(() => {
    const curMonth = new Date().getMonth() + 1;
    return getFiscalQuarter(curMonth);
  }, []);

  // Filter States
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(currentFiscalYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FiscalQuarter>(currentFiscalQuarter);

  // Target quarterly visits for performance evaluation
  const [targetVisits, setTargetVisits] = useState<number>(450);

  // Available Fiscal Years
  const availableFiscalYears = useMemo(() => {
    const fySet = new Set<number>();
    fySet.add(currentFiscalYear);
    fySet.add(currentFiscalYear - 1);
    fySet.add(currentFiscalYear - 2);

    services.forEach((s) => {
      const fy = s.fiscalYear || (s.serviceDate ? calculateFiscalYear(s.serviceDate) : (s.month >= 10 ? s.year + 543 + 1 : s.year + 543));
      fySet.add(fy);
    });

    return Array.from(fySet).sort((a, b) => b - a);
  }, [services, currentFiscalYear]);

  // General Filter: year and month
  const [generalYear, setGeneralYear] = useState<number | 'all'>('all');
  const [generalMonth, setGeneralMonth] = useState<number | 'all'>('all');

  // Executive Notes for Quarterly Report (editable by department head)
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [customStrengths, setCustomStrengths] = useState(
    'ผลการดำเนินงานการให้บริการผู้ป่วยเป็นไปตามเป้าหมายตัวชี้วัด คลินิกบำบัดรักษาอาการปวดคอบ่าไหล่และข้อเข่าเสื่อมได้รับความนิยมสูง อัตราความพึงพอใจของผู้รับบริการเฉลี่ย 94.6%'
  );
  const [customChallenges, setCustomChallenges] = useState(
    'ปริมาณผู้ป่วยกลุ่มข้อเข่าเสื่อมในชุมชนห่างไกลยังเข้าถึงบริการได้จำกัด และต้องการการสำรองวัตถุดิบสมุนไพรลูกประคบให้เพียงพอต่อฤดูกาลที่ผู้ป่วยหนาแน่น'
  );
  const [customActionPlan, setCustomActionPlan] = useState(
    'ขยายกิจกรรมหน่วยแพทย์แผนไทยเคลื่อนที่เชิงรุกร่วมกับ รพ.สต. ในเขตอำเภอเขาสมิง และพัฒนาคลินิกฟื้นฟูมารดาหลังคลอดเพื่อเพิ่มการเข้าถึงบริการ'
  );

  // Helper to extract service record's fiscal year
  const getRecordFiscalYear = (s: ServiceRecord) => {
    return s.fiscalYear || (s.serviceDate ? calculateFiscalYear(s.serviceDate) : (s.month >= 10 ? s.year + 543 + 1 : s.year + 543));
  };

  // Helper to extract financial record's fiscal year
  const getFinanceFiscalYear = (f: FinancialRecord) => {
    return f.month >= 10 ? f.year + 543 + 1 : f.year + 543;
  };

  // Earliest date per HN across entire database to determine "New Patient"
  const hnEarliestDate = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach((s) => {
      if (!s.hn) return;
      const key = s.hn.trim().toLowerCase();
      if (!map[key] || (s.serviceDate && s.serviceDate < map[key])) {
        map[key] = s.serviceDate || `${s.year}-${String(s.month).padStart(2, '0')}-01`;
      }
    });
    return map;
  }, [services]);

  // ==========================================================
  // 1. QUARTERLY REPORT DATA CALCULATIONS
  // ==========================================================
  const quarterlyData = useMemo(() => {
    const qInfo = FISCAL_QUARTERS[selectedQuarter];

    // Services in this quarter
    const quarterServices = services.filter((s) => {
      const sFY = getRecordFiscalYear(s);
      const sQ = getFiscalQuarter(s.month);
      return sFY === selectedFiscalYear && sQ === selectedQuarter;
    });

    // Prior quarter calculation for QoQ growth
    let prevFY = selectedFiscalYear;
    let prevQ: FiscalQuarter = 1;
    if (selectedQuarter === 1) {
      prevFY = selectedFiscalYear - 1;
      prevQ = 4;
    } else {
      prevQ = (selectedQuarter - 1) as FiscalQuarter;
    }

    const prevQuarterServices = services.filter((s) => {
      const sFY = getRecordFiscalYear(s);
      const sQ = getFiscalQuarter(s.month);
      return sFY === prevFY && sQ === prevQ;
    });

    const totalVisits = quarterServices.length;
    const prevVisits = prevQuarterServices.length;
    const qoqGrowth = prevVisits > 0 ? Math.round(((totalVisits - prevVisits) / prevVisits) * 100) : null;

    // Unique Patients & New vs Returning
    const uniqueHnSet = new Set<string>();
    let newPatients = 0;

    quarterServices.forEach((s) => {
      if (!s.hn) return;
      const key = s.hn.trim().toLowerCase();
      if (!uniqueHnSet.has(key)) {
        uniqueHnSet.add(key);
        const earliest = hnEarliestDate[key];
        if (earliest) {
          const parts = earliest.split('-');
          const eY = parseInt(parts[0], 10);
          const eM = parseInt(parts[1], 10);
          const eFY = eM >= 10 ? eY + 543 + 1 : eY + 543;
          const eQ = getFiscalQuarter(eM);
          if (eFY === selectedFiscalYear && eQ === selectedQuarter) {
            newPatients++;
          }
        } else {
          newPatients++;
        }
      }
    });

    const uniquePatients = uniqueHnSet.size;
    const returningPatients = uniquePatients - newPatients;

    // Revenue from services
    const totalRevenue = quarterServices.reduce((sum, s) => sum + (s.fee || 0), 0);

    // Financial records in this quarter
    const quarterFinances = finances.filter((f) => {
      const fFY = getFinanceFiscalYear(f);
      const fQ = getFiscalQuarter(f.month);
      return fFY === selectedFiscalYear && fQ === selectedQuarter;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    quarterFinances.forEach((f) => {
      if (f.type === 'income') totalIncome += f.amount;
      else totalExpense += f.amount;
    });
    const netBalance = totalIncome - totalExpense;

    // Procedure Counts & Revenues
    const procMap: Record<string, { count: number; revenue: number }> = {};
    PROCEDURE_TYPE_OPTIONS.forEach((p) => {
      procMap[p] = { count: 0, revenue: 0 };
    });

    quarterServices.forEach((s) => {
      const p = s.procedureType || 'อื่นๆ';
      if (!procMap[p]) procMap[p] = { count: 0, revenue: 0 };
      procMap[p].count++;
      procMap[p].revenue += s.fee || 0;
    });

    // Top 5 Procedures sorted descending
    const topProcedures = Object.entries(procMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
        percent: totalVisits > 0 ? Math.round((data.count / totalVisits) * 100) : 0,
      }))
      .filter((item) => item.count > 0 || Object.keys(procMap).length <= 5)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // Top 5 Clinical Diagnoses
    const diagMap: Record<string, number> = {};
    quarterServices.forEach((s) => {
      let d = (s.diagnosis || '').trim();
      if (!d) d = 'ตรวจสุขภาพทั่วไป / จ่ายยาสมุนไพร';
      diagMap[d] = (diagMap[d] || 0) + 1;
    });

    const topDiagnoses = Object.entries(diagMap)
      .map(([name, count]) => ({
        name,
        count,
        percent: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // Coverage Distribution
    const covMap: Record<string, number> = {};
    COVERAGE_TYPE_OPTIONS.forEach((c) => (covMap[c] = 0));
    quarterServices.forEach((s) => {
      const c = s.coverageType || 'อื่นๆ';
      covMap[c] = (covMap[c] || 0) + 1;
    });

    const coverageBreakdown = Object.entries(covMap)
      .map(([name, count]) => ({
        name,
        count,
        percent: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Monthly breakdown inside quarter (3 months)
    const monthlyBreakdown = qInfo.months.map((m) => {
      const mServices = quarterServices.filter((s) => s.month === m);
      const mVisits = mServices.length;
      const mRevenue = mServices.reduce((sum, s) => sum + (s.fee || 0), 0);
      return {
        month: m,
        name: THAI_MONTHS[m - 1],
        shortName: THAI_MONTHS_SHORT[m - 1],
        visits: mVisits,
        revenue: mRevenue,
        percent: totalVisits > 0 ? Math.round((mVisits / totalVisits) * 100) : 0,
      };
    });

    // Target Achievement & Evaluation Grade
    const targetAchievementRate = targetVisits > 0 ? Math.round((totalVisits / targetVisits) * 100) : 100;
    let evaluationGrade = 'ระดับดีเยี่ยม (Grade A / Excellent)';
    let gradeBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

    if (targetAchievementRate >= 100) {
      evaluationGrade = 'ระดับดีเยี่ยม (Grade A - บรรลุตามเป้าหมาย 100%+)';
      gradeBadgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-400';
    } else if (targetAchievementRate >= 85) {
      evaluationGrade = 'ระดับดีมาก (Grade B - บรรลุตามเป้าหมาย 85-99%)';
      gradeBadgeColor = 'bg-teal-100 text-teal-900 border-teal-300';
    } else if (targetAchievementRate >= 70) {
      evaluationGrade = 'ระดับมาตรฐาน (Grade C - บรรลุเกณฑ์ขั้นต่ำ 70-84%)';
      gradeBadgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    } else {
      evaluationGrade = 'ต้องเร่งรัดการดำเนินงาน (ต่ำกว่า 70% ของเป้าหมาย)';
      gradeBadgeColor = 'bg-rose-100 text-rose-900 border-rose-300';
    }

    return {
      qInfo,
      totalVisits,
      prevVisits,
      qoqGrowth,
      uniquePatients,
      newPatients,
      returningPatients,
      totalRevenue,
      totalIncome,
      totalExpense,
      netBalance,
      topProcedures,
      topDiagnoses,
      coverageBreakdown,
      monthlyBreakdown,
      targetAchievementRate,
      evaluationGrade,
      gradeBadgeColor,
    };
  }, [
    services,
    finances,
    selectedFiscalYear,
    selectedQuarter,
    targetVisits,
    hnEarliestDate,
  ]);

  // ==========================================================
  // 2. FOUR QUARTERS COMPARISON DATA
  // ==========================================================
  const fourQuartersData = useMemo(() => {
    return ([1, 2, 3, 4] as FiscalQuarter[]).map((q) => {
      const qInfo = FISCAL_QUARTERS[q];
      const qServices = services.filter((s) => {
        const sFY = getRecordFiscalYear(s);
        const sQ = getFiscalQuarter(s.month);
        return sFY === selectedFiscalYear && sQ === q;
      });

      const visits = qServices.length;
      const revenue = qServices.reduce((sum, s) => sum + (s.fee || 0), 0);

      const uniqueSet = new Set<string>();
      qServices.forEach((s) => {
        if (s.hn) uniqueSet.add(s.hn.trim().toLowerCase());
      });

      const qFinances = finances.filter((f) => {
        const fFY = getFinanceFiscalYear(f);
        const fQ = getFiscalQuarter(f.month);
        return fFY === selectedFiscalYear && fQ === q;
      });

      let inc = 0;
      let exp = 0;
      qFinances.forEach((f) => {
        if (f.type === 'income') inc += f.amount;
        else exp += f.amount;
      });

      return {
        quarter: q,
        label: qInfo.label,
        shortLabel: qInfo.shortLabel,
        monthRange: qInfo.monthRangeLabel,
        visits,
        uniquePatients: uniqueSet.size,
        revenue,
        income: inc,
        expense: exp,
        netBalance: inc - exp,
      };
    });
  }, [services, finances, selectedFiscalYear]);

  // ==========================================================
  // 3. GENERAL SUMMARY CALCULATIONS
  // ==========================================================
  const generalData = useMemo(() => {
    const filtered = services.filter((s) => {
      if (generalYear !== 'all' && s.year !== generalYear) return false;
      if (generalMonth !== 'all' && s.month !== generalMonth) return false;
      return true;
    });

    const totalPatients = filtered.length;
    const totalRevenue = filtered.reduce((acc, curr) => acc + (curr.fee || 0), 0);
    const maleCount = filtered.filter((s) => s.gender === 'ชาย').length;
    const femaleCount = filtered.filter((s) => s.gender === 'หญิง').length;

    const ageCounts: Record<string, number> = {};
    AGE_GROUP_OPTIONS.forEach((g) => (ageCounts[g] = 0));
    filtered.forEach((s) => {
      if (s.ageGroup) ageCounts[s.ageGroup] = (ageCounts[s.ageGroup] || 0) + 1;
    });

    const covCounts: Record<string, number> = {};
    COVERAGE_TYPE_OPTIONS.forEach((c) => (covCounts[c] = 0));
    filtered.forEach((s) => {
      if (s.coverageType) covCounts[s.coverageType] = (covCounts[s.coverageType] || 0) + 1;
    });

    const procCounts: Record<string, number> = {};
    PROCEDURE_TYPE_OPTIONS.forEach((p) => (procCounts[p] = 0));
    filtered.forEach((s) => {
      if (s.procedureType) procCounts[s.procedureType] = (procCounts[s.procedureType] || 0) + 1;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    finances.forEach((f) => {
      if (generalYear !== 'all' && f.year !== generalYear) return;
      if (generalMonth !== 'all' && f.month !== generalMonth) return;
      if (f.type === 'income') totalIncome += f.amount;
      else totalExpense += f.amount;
    });

    return {
      totalPatients,
      totalRevenue,
      maleCount,
      femaleCount,
      otherGenderCount: totalPatients - maleCount - femaleCount,
      ageCounts,
      covCounts,
      procCounts,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }, [services, finances, generalYear, generalMonth]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export handler
  const handleDownloadPDF = () => {
    if (reportTab === 'quarterly' || reportTab === 'four_quarters') {
      generateQuarterlyPerformancePDF({
        fiscalYear: selectedFiscalYear,
        quarter: selectedQuarter,
        quarterName: quarterlyData.qInfo.label,
        monthRange: quarterlyData.qInfo.fullPeriod,
        generatedDate: new Date().toLocaleDateString('th-TH', { dateStyle: 'long' }),
        totalVisits: quarterlyData.totalVisits,
        uniquePatients: quarterlyData.uniquePatients,
        newPatients: quarterlyData.newPatients,
        returningPatients: quarterlyData.returningPatients,
        totalRevenue: quarterlyData.totalRevenue,
        totalIncome: quarterlyData.totalIncome,
        totalExpense: quarterlyData.totalExpense,
        netBalance: quarterlyData.netBalance,
        prevQuarterVisits: quarterlyData.prevVisits,
        qoqGrowth: quarterlyData.qoqGrowth,
        targetVisits,
        targetAchievementRate: quarterlyData.targetAchievementRate,
        evaluationGrade: quarterlyData.evaluationGrade,
        topProcedures: quarterlyData.topProcedures,
        topDiagnoses: quarterlyData.topDiagnoses,
        coverageBreakdown: quarterlyData.coverageBreakdown,
        quarterComparisons: fourQuartersData.map((q) => ({
          quarter: q.label,
          visits: q.visits,
          revenue: q.revenue,
          uniquePatients: q.uniquePatients,
        })),
        evaluationNotes: {
          strengths: customStrengths,
          challenges: customChallenges,
          nextQuarterPlan: customActionPlan,
        },
      });
    } else {
      generateHospitalPDF({
        title: 'กลุ่มงานการแพทย์แผนไทย โรงพยาบาลเขาสมิง',
        subTitle: 'รายงานสรุปผลการดำเนินงานและสถิติบริการการแพทย์แผนไทย',
        filterDescription: 'รายงานสรุปภาพรวมทั้งหมด',
        generatedDate: new Date().toLocaleDateString('th-TH', { dateStyle: 'long' }),
        totalPatients: generalData.totalPatients,
        totalServices: generalData.totalPatients,
        totalRevenue: generalData.totalRevenue,
        maleCount: generalData.maleCount,
        femaleCount: generalData.femaleCount,
        otherGenderCount: generalData.otherGenderCount,
        ageDistribution: AGE_GROUP_OPTIONS.map((group) => ({
          group,
          count: generalData.ageCounts[group] || 0,
          percent:
            generalData.totalPatients > 0
              ? Math.round(((generalData.ageCounts[group] || 0) / generalData.totalPatients) * 100)
              : 0,
        })),
        coverageDistribution: COVERAGE_TYPE_OPTIONS.map((name) => ({
          name,
          count: generalData.covCounts[name] || 0,
          percent:
            generalData.totalPatients > 0
              ? Math.round(((generalData.covCounts[name] || 0) / generalData.totalPatients) * 100)
              : 0,
        })),
        procedureDistribution: PROCEDURE_TYPE_OPTIONS.map((name) => ({
          name,
          count: generalData.procCounts[name] || 0,
          percent:
            generalData.totalPatients > 0
              ? Math.round(((generalData.procCounts[name] || 0) / generalData.totalPatients) * 100)
              : 0,
        })),
        totalIncome: generalData.totalIncome,
        totalExpense: generalData.totalExpense,
        netBalance: generalData.netBalance,
        incomeCategories: [],
        expenseCategories: [],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-300 overflow-hidden my-4 max-h-[94vh] flex flex-col">
        {/* ======================================================== */}
        {/* TOP CONTROL BAR (HIDDEN IN PRINT)                        */}
        {/* ======================================================== */}
        <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white">
                  ศูนย์พิมพ์รายงานและประเมินผลการดำเนินงาน
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  รพ.เขาสมิง
                </span>
              </div>
              <p className="text-xs text-slate-400">
                รองรับการสร้างรายงานสรุปผลงานรายไตรมาส (Quarterly Performance) สำหรับหัวหน้ากลุ่มงาน
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="ดาวน์โหลดไฟล์ PDF รายงานทางการ"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>ดาวน์โหลด PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="สั่งพิมพ์ออกเครื่องพิมพ์หรือบันทึกเป็น PDF ทางการผ่านบราวเซอร์"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงานทางการ (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* REPORT MODE TABS & FILTER BAR (HIDDEN IN PRINT)          */}
        {/* ======================================================== */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print shrink-0">
          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setReportTab('quarterly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reportTab === 'quarterly'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>รายงานประเมินผลงานรายไตรมาส</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab('four_quarters')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reportTab === 'four_quarters'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>เปรียบเทียบ 4 ไตรมาส</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab('general')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                reportTab === 'general'
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>รายงานภาพรวมทั่วไป</span>
            </button>
          </div>

          {/* Contextual Filters for Active Tab */}
          {(reportTab === 'quarterly' || reportTab === 'four_quarters') && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Fiscal Year Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <label htmlFor="modal-fiscal-year-select" className="text-slate-600 font-semibold whitespace-nowrap">
                  ปีงบประมาณ:
                </label>
                <select
                  id="modal-fiscal-year-select"
                  value={selectedFiscalYear}
                  onChange={(e) => setSelectedFiscalYear(parseInt(e.target.value, 10))}
                  className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  {availableFiscalYears.map((fy) => (
                    <option key={fy} value={fy}>
                      พ.ศ. {fy} {fy === currentFiscalYear ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quarter Selector (only if tab is quarterly) */}
              {reportTab === 'quarterly' && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                  <label htmlFor="modal-quarter-select" className="text-slate-600 font-semibold whitespace-nowrap">
                    เลือกไตรมาส:
                  </label>
                  <select
                    id="modal-quarter-select"
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(parseInt(e.target.value, 10) as FiscalQuarter)}
                    className="bg-transparent font-bold text-emerald-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value={1}>ไตรมาส 1 (ต.ค. - ธ.ค.)</option>
                    <option value={2}>ไตรมาส 2 (ม.ค. - มี.ค.)</option>
                    <option value={3}>ไตรมาส 3 (เม.ย. - มิ.ย.)</option>
                    <option value={4}>ไตรมาส 4 (ก.ค. - ก.ย.)</option>
                  </select>
                </div>
              )}

              {/* Target Visits Input */}
              {reportTab === 'quarterly' && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                  <label htmlFor="modal-target-input" className="text-slate-600 font-medium whitespace-nowrap">
                    เป้าหมาย:
                  </label>
                  <input
                    id="modal-target-input"
                    type="number"
                    min={1}
                    value={targetVisits}
                    onChange={(e) => setTargetVisits(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-14 font-bold text-slate-900 text-center border-b border-slate-300 focus:outline-hidden focus:border-emerald-600"
                  />
                  <span className="text-slate-500">ครั้ง</span>
                </div>
              )}

              {/* Toggle Notes Edit */}
              {reportTab === 'quarterly' && (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isEditingNotes
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="แก้ไขข้อความประเมินผลงานของหัวหน้ากลุ่มงานก่อนพิมพ์"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isEditingNotes ? 'เสร็จสิ้นการแก้' : 'ปรับแก้บันทึกประเมิน'}</span>
                </button>
              )}
            </div>
          )}

          {/* Contextual Filters for General Tab */}
          {reportTab === 'general' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
                <label htmlFor="general-year-select" className="text-slate-600 font-medium">ปี พ.ศ.:</label>
                <select
                  id="general-year-select"
                  value={generalYear}
                  onChange={(e) => setGeneralYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
                >
                  <option value="all">ทุกปี</option>
                  {availableFiscalYears.map((fy) => (
                    <option key={fy} value={fy - 543}>
                      {fy}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
                <label htmlFor="general-month-select" className="text-slate-600 font-medium">เดือน:</label>
                <select
                  id="general-month-select"
                  value={generalMonth}
                  onChange={(e) => setGeneralMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
                >
                  <option value="all">ทุกเดือน</option>
                  {THAI_MONTHS.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* EDIT NOTES DRAWER (WHEN isEditingNotes IS TRUE)          */}
        {/* ======================================================== */}
        {reportTab === 'quarterly' && isEditingNotes && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 text-xs space-y-3 no-print animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                ปรับแต่งบันทึกการประเมินผลสัมฤทธิ์และข้อเสนอแนะของหัวหน้ากลุ่มงาน (แสดงในส่วนท้ายของรายงาน)
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomStrengths(
                    'ผลการดำเนินงานการให้บริการผู้ป่วยเป็นไปตามเป้าหมายตัวชี้วัด คลินิกบำบัดรักษาอาการปวดคอบ่าไหล่และข้อเข่าเสื่อมได้รับความนิยมสูง อัตราความพึงพอใจของผู้รับบริการเฉลี่ย 94.6%'
                  );
                  setCustomChallenges(
                    'ปริมาณผู้ป่วยกลุ่มข้อเข่าเสื่อมในชุมชนห่างไกลยังเข้าถึงบริการได้จำกัด และต้องการการสำรองวัตถุดิบสมุนไพรลูกประคบให้เพียงพอต่อฤดูกาลที่ผู้ป่วยหนาแน่น'
                  );
                  setCustomActionPlan(
                    'ขยายกิจกรรมหน่วยแพทย์แผนไทยเคลื่อนที่เชิงรุกร่วมกับ รพ.สต. ในเขตอำเภอเขาสมิง และพัฒนาคลินิกฟื้นฟูมารดาหลังคลอดเพื่อเพิ่มการเข้าถึงบริการ'
                  );
                }}
                className="text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                รีเซ็ตค่ามาตรฐาน
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  1. ผลสัมฤทธิ์และจุดเด่นประจำไตรมาส:
                </label>
                <textarea
                  rows={3}
                  value={customStrengths}
                  onChange={(e) => setCustomStrengths(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  2. ปัญหา อุปสรรค และข้อจำกัด:
                </label>
                <textarea
                  rows={3}
                  value={customChallenges}
                  onChange={(e) => setCustomChallenges(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  3. แผนพัฒนาและเป้าหมายไตรมาสถัดไป:
                </label>
                <textarea
                  rows={3}
                  value={customActionPlan}
                  onChange={(e) => setCustomActionPlan(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500/40 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PRINTABLE DOCUMENT SHEET (A4)                            */}
        {/* ======================================================== */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 printable-area space-y-6">
          {/* ========================================== */}
          {/* TAB 1: QUARTERLY PERFORMANCE EVALUATION    */}
          {/* ========================================== */}
          {reportTab === 'quarterly' && (
            <div className="space-y-6">
              {/* Official Header */}
              <div className="text-center border-b-2 border-emerald-900 pb-5 space-y-1">
                <div className="flex justify-center mb-2">
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-800 flex items-center justify-center text-emerald-800 shadow-2xs">
                    <Leaf className="w-8 h-8" />
                  </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  รายงานสรุปผลการดำเนินงานและประเมินผลสัมฤทธิ์แบบรายไตรมาส
                </h1>
                <h2 className="text-sm sm:text-base font-bold text-emerald-900">
                  กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลเขาสมิง จังหวัดตราด
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1.5 font-medium">
                  <span className="bg-emerald-50 text-emerald-900 px-2.5 py-0.5 rounded-md border border-emerald-300 font-bold">
                    ปีงบประมาณ พ.ศ. {selectedFiscalYear}
                  </span>
                  <span className="font-bold text-slate-900">
                    {quarterlyData.qInfo.label} ({quarterlyData.qInfo.fullPeriod})
                  </span>
                  <span className="text-slate-500">
                    วันที่พิมพ์รายงาน: {new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}
                  </span>
                </div>
              </div>

              {/* Assessment Grade Banner */}
              <div className="bg-emerald-50/70 border-2 border-emerald-600/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                      ระดับการประเมินผลสัมฤทธิ์ประจำไตรมาส (Executive Performance Evaluation)
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {quarterlyData.evaluationGrade}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:text-right border-t sm:border-t-0 sm:border-l border-emerald-200 pt-2 sm:pt-0 sm:pl-4">
                  <div>
                    <span className="text-[11px] text-slate-500 block">บรรลุเป้าหมายบริการ</span>
                    <span className="text-xl font-black text-emerald-800">
                      {quarterlyData.targetAchievementRate}%
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      (เป้าหมาย {targetVisits.toLocaleString()} ครั้ง)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: Executive KPI Cards (4 Cards) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>1. ตัวชี้วัดผลการดำเนินงานหลักประจำไตรมาส (Quarterly Key Metrics)</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    งวด: {quarterlyData.qInfo.monthRangeLabel} {selectedFiscalYear}
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Total Visits & Growth */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500 block font-medium">ยอดผู้รับบริการในไตรมาส</span>
                    <span className="text-2xl font-black text-slate-900 my-1 block">
                      {quarterlyData.totalVisits.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-500">ครั้ง</span>
                    </span>
                    <div className="text-[11px] font-bold flex items-center justify-center gap-1">
                      {quarterlyData.qoqGrowth !== null && quarterlyData.qoqGrowth >= 0 ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />+{quarterlyData.qoqGrowth}% จากไตรมาสก่อน
                        </span>
                      ) : quarterlyData.qoqGrowth !== null ? (
                        <span className="text-amber-700 flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          {quarterlyData.qoqGrowth}% จากไตรมาสก่อน
                        </span>
                      ) : (
                        <span className="text-slate-500">งวดเริ่มต้นปีงบประมาณ</span>
                      )}
                    </div>
                  </div>

                  {/* Unique Patients & New */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500 block font-medium">ผู้ป่วยรายบุคคล (HN)</span>
                    <span className="text-2xl font-black text-teal-800 my-1 block">
                      {quarterlyData.uniquePatients.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-500">คน</span>
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      รายใหม่ {quarterlyData.newPatients} คน (
                      {quarterlyData.uniquePatients > 0
                        ? Math.round((quarterlyData.newPatients / quarterlyData.uniquePatients) * 100)
                        : 0}
                      %)
                    </span>
                  </div>

                  {/* Total Procedure Value */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500 block font-medium">มูลค่าบริการหัตถการรวม</span>
                    <span className="text-xl font-black text-emerald-800 my-1 block">
                      {formatCurrency(quarterlyData.totalRevenue)}
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      เฉลี่ย{' '}
                      {quarterlyData.totalVisits > 0
                        ? Math.round(quarterlyData.totalRevenue / quarterlyData.totalVisits)
                        : 0}{' '}
                      ฿/ครั้ง
                    </span>
                  </div>

                  {/* Financial Net Margin */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500 block font-medium">ส่วนต่างรายรับ-จ่ายกลุ่มงาน</span>
                    <span
                      className={`text-xl font-black my-1 block ${
                        quarterlyData.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(quarterlyData.netBalance)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      รับ {formatCurrency(quarterlyData.totalIncome)} | จ่าย{' '}
                      {formatCurrency(quarterlyData.totalExpense)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Top 5 Procedures (หัตถการยอดนิยม 5 อันดับแรก) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-950 font-bold">
                    <Award className="w-4 h-4 text-amber-500" />
                    2. สถิติ 5 อันดับหัตถการที่มีผู้รับบริการสูงสุดในไตรมาส (Top 5 Procedures)
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    วิเคราะห์ความต้องการบริการของกลุ่มงาน
                  </span>
                </h3>
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 font-semibold text-slate-800">
                    <tr>
                      <th className="p-2 border-b border-slate-200 text-center w-14">อันดับ</th>
                      <th className="p-2 border-b border-slate-200">ประเภทหัตถการ / การบริการ</th>
                      <th className="p-2 border-b border-slate-200 text-right">จำนวน (ครั้ง)</th>
                      <th className="p-2 border-b border-slate-200 text-right">สัดส่วน (%)</th>
                      <th className="p-2 border-b border-slate-200 text-right">มูลค่ารวม (บาท)</th>
                      <th className="p-2 border-b border-slate-200 text-center">แนวโน้มความต้องการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quarterlyData.topProcedures.map((proc) => {
                      const medal =
                        proc.rank === 1 ? '🥇' : proc.rank === 2 ? '🥈' : proc.rank === 3 ? '🥉' : `#${proc.rank}`;
                      return (
                        <tr key={proc.name} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-bold text-sm">{medal}</td>
                          <td className="p-2 font-semibold text-slate-900">{proc.name}</td>
                          <td className="p-2 text-right font-bold text-emerald-800">
                            {proc.count.toLocaleString()}
                          </td>
                          <td className="p-2 text-right font-medium text-slate-700">{proc.percent}%</td>
                          <td className="p-2 text-right font-bold text-slate-800">
                            {formatCurrency(proc.revenue)}
                          </td>
                          <td className="p-2 text-center">
                            {proc.rank === 1 ? (
                              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                                สูงสุด
                              </span>
                            ) : proc.rank <= 3 ? (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                                หนาแน่น
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                                ต่อเนื่อง
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Top Diagnoses & Coverage Tables (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Diagnoses */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                    3. กลุ่มโรคและอาการสำคัญ 5 อันดับแรก
                  </h3>
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 font-semibold">
                      <tr>
                        <th className="p-2 border-b border-slate-200 w-12 text-center">ลำดับ</th>
                        <th className="p-2 border-b border-slate-200">กลุ่มโรค / อาการ</th>
                        <th className="p-2 border-b border-slate-200 text-right">จำนวน (ราย)</th>
                        <th className="p-2 border-b border-slate-200 text-right">ร้อยละ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quarterlyData.topDiagnoses.map((diag) => (
                        <tr key={diag.name}>
                          <td className="p-2 text-center text-slate-400 font-medium">{diag.rank}</td>
                          <td className="p-2 font-medium truncate max-w-[180px]" title={diag.name}>
                            {diag.name}
                          </td>
                          <td className="p-2 text-right font-semibold text-slate-900">{diag.count}</td>
                          <td className="p-2 text-right text-slate-600">{diag.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Coverage */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                    4. สถิติจำแนกตามสิทธิการรักษาพยาบาล
                  </h3>
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 font-semibold">
                      <tr>
                        <th className="p-2 border-b border-slate-200">สิทธิการรักษา</th>
                        <th className="p-2 border-b border-slate-200 text-right">จำนวน (ราย)</th>
                        <th className="p-2 border-b border-slate-200 text-right">สัดส่วน (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quarterlyData.coverageBreakdown.map((cov) => (
                        <tr key={cov.name}>
                          <td className="p-2 font-medium">{cov.name}</td>
                          <td className="p-2 text-right font-semibold text-slate-900">{cov.count}</td>
                          <td className="p-2 text-right text-slate-600">{cov.percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Monthly Progression in Quarter */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                  5. ความก้าวหน้ารายเดือนในรอบไตรมาส (Monthly Progress)
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {quarterlyData.monthlyBreakdown.map((m) => (
                    <div key={m.month} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-xs font-bold text-slate-800 block">{m.name}</span>
                      <span className="text-lg font-black text-emerald-800 my-0.5 block">
                        {m.visits.toLocaleString()} ครั้ง
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        มูลค่า {formatCurrency(m.revenue)} ({m.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Executive Notes & Assessment Remarks */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>6. บันทึกการประเมินผลการดำเนินงานและข้อเสนอแนะโดยหัวหน้ากลุ่มงาน</span>
                </h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-emerald-900 block mb-0.5">
                      6.1 ผลสัมฤทธิ์ที่โดดเด่นและจุดแข็ง (Key Achievements & Strengths):
                    </span>
                    <p className="leading-relaxed">{customStrengths}</p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-amber-900 block mb-0.5">
                      6.2 ปัญหา อุปสรรค และข้อจำกัด (Challenges & Issues):
                    </span>
                    <p className="leading-relaxed">{customChallenges}</p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-teal-900 block mb-0.5">
                      6.3 แผนพัฒนาและเป้าหมายการดำเนินงานในไตรมาสถัดไป (Action Plan):
                    </span>
                    <p className="leading-relaxed">{customActionPlan}</p>
                  </div>
                </div>
              </div>

              {/* Section 6: Official Sign-off Block (3 Signatures) */}
              <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs border-t border-slate-300">
                <div className="space-y-5">
                  <p>ลงชื่อ ..............................................................</p>
                  <div>
                    <p className="font-bold text-slate-900">( .............................................................. )</p>
                    <p className="text-slate-600 font-medium">พท.ว. ผู้รับผิดชอบสารสนเทศ</p>
                    <p className="text-[11px] text-slate-400">ผู้รวบรวมข้อมูลและจัดทำรายงาน</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p>ลงชื่อ ..............................................................</p>
                  <div>
                    <p className="font-bold text-slate-900">( .............................................................. )</p>
                    <p className="text-slate-700 font-bold">หัวหน้ากลุ่มงานการแพทย์แผนไทยฯ</p>
                    <p className="text-[11px] text-slate-400">ผู้ประเมินและตรวจรับรองผลงาน</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p>ลงชื่อ ..............................................................</p>
                  <div>
                    <p className="font-bold text-slate-900">( นายแพทย์ชำนาญการพิเศษ )</p>
                    <p className="text-slate-700 font-bold">ผู้อำนวยการโรงพยาบาลเขาสมิง</p>
                    <p className="text-[11px] text-slate-400">ผู้อนุมัติรับทราบผลการดำเนินงาน</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: FOUR QUARTERS COMPARISON            */}
          {/* ========================================== */}
          {reportTab === 'four_quarters' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-emerald-900 pb-5 space-y-1">
                <div className="flex justify-center mb-2">
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-800 flex items-center justify-center text-emerald-800">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  รายงานสรุปเปรียบเทียบผลการดำเนินงาน 4 ไตรมาส
                </h1>
                <h2 className="text-sm sm:text-base font-bold text-emerald-900">
                  กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลเขาสมิง จังหวัดตราด
                </h2>
                <p className="text-xs text-slate-600 font-medium pt-1">
                  ปีงบประมาณ พ.ศ. {selectedFiscalYear} (ตุลาคม {selectedFiscalYear - 1} - กันยายน {selectedFiscalYear})
                </p>
              </div>

              {/* Comparison Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                  ตารางสรุปเปรียบเทียบความก้าวหน้ารายไตรมาส (Quarterly Progression)
                </h3>
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 font-semibold">
                    <tr>
                      <th className="p-2 border-b border-slate-200">ไตรมาส</th>
                      <th className="p-2 border-b border-slate-200">ช่วงเดือน</th>
                      <th className="p-2 border-b border-slate-200 text-right">ผู้รับบริการ (ครั้ง)</th>
                      <th className="p-2 border-b border-slate-200 text-right">ผู้ป่วยไม่ซ้ำ (คน)</th>
                      <th className="p-2 border-b border-slate-200 text-right">มูลค่าบริการ (บาท)</th>
                      <th className="p-2 border-b border-slate-200 text-right">รายรับ (บาท)</th>
                      <th className="p-2 border-b border-slate-200 text-right">รายจ่าย (บาท)</th>
                      <th className="p-2 border-b border-slate-200 text-right">คงเหลือสุทธิ (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fourQuartersData.map((q) => (
                      <tr key={q.quarter} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">{q.label}</td>
                        <td className="p-2 text-slate-600">{q.monthRange}</td>
                        <td className="p-2 text-right font-bold text-emerald-800">
                          {q.visits.toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-800">
                          {q.uniquePatients.toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-medium text-slate-800">
                          {formatCurrency(q.revenue)}
                        </td>
                        <td className="p-2 text-right text-teal-800">{formatCurrency(q.income)}</td>
                        <td className="p-2 text-right text-rose-700">{formatCurrency(q.expense)}</td>
                        <td
                          className={`p-2 text-right font-bold ${
                            q.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {formatCurrency(q.netBalance)}
                        </td>
                      </tr>
                    ))}
                    {/* Annual Total Row */}
                    <tr className="bg-emerald-50/70 font-bold border-t-2 border-emerald-700">
                      <td className="p-2 text-emerald-950" colSpan={2}>
                        รวมตลอดปีงบประมาณ พ.ศ. {selectedFiscalYear}
                      </td>
                      <td className="p-2 text-right text-emerald-950">
                        {fourQuartersData.reduce((s, q) => s + q.visits, 0).toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-emerald-950">
                        {fourQuartersData.reduce((s, q) => s + q.uniquePatients, 0).toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-emerald-950">
                        {formatCurrency(fourQuartersData.reduce((s, q) => s + q.revenue, 0))}
                      </td>
                      <td className="p-2 text-right text-teal-950">
                        {formatCurrency(fourQuartersData.reduce((s, q) => s + q.income, 0))}
                      </td>
                      <td className="p-2 text-right text-rose-900">
                        {formatCurrency(fourQuartersData.reduce((s, q) => s + q.expense, 0))}
                      </td>
                      <td className="p-2 text-right text-emerald-950">
                        {formatCurrency(fourQuartersData.reduce((s, q) => s + q.netBalance, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sign-off */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-6">
                  <p>ลงชื่อ ..............................................................</p>
                  <div>
                    <p className="font-semibold">( หัวหน้ากลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก )</p>
                    <p className="text-slate-500">ผู้ประเมินและรวบรวมข้อมูล</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <p>ลงชื่อ ..............................................................</p>
                  <div>
                    <p className="font-semibold">( นายแพทย์ชำนาญการพิเศษ / ผู้อำนวยการ )</p>
                    <p className="text-slate-500">โรงพยาบาลเขาสมิง จังหวัดตราด</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: GENERAL SUMMARY REPORT              */}
          {/* ========================================== */}
          {reportTab === 'general' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-5 space-y-1">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-800 flex items-center justify-center text-emerald-800">
                    <Leaf className="w-7 h-7" />
                  </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  รายงานสรุปผลการดำเนินงานและสถิติบริการการแพทย์แผนไทย
                </h1>
                <h2 className="text-base font-semibold text-slate-700">
                  กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก โรงพยาบาลเขาสมิง จังหวัดตราด
                </h2>
                <p className="text-xs text-slate-500 pt-1">
                  วันที่จัดพิมพ์รายงาน: {new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}
                </p>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 block">ผู้รับบริการทั้งหมด</span>
                  <span className="text-xl font-bold text-slate-900">
                    {generalData.totalPatients.toLocaleString()} ครั้ง
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 block">มูลค่าบริการรวม</span>
                  <span className="text-xl font-bold text-emerald-800">
                    {formatCurrency(generalData.totalRevenue)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 block">รายรับรวม</span>
                  <span className="text-xl font-bold text-teal-800">
                    {formatCurrency(generalData.totalIncome)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 block">รายจ่ายรวม</span>
                  <span className="text-xl font-bold text-rose-700">
                    {formatCurrency(generalData.totalExpense)}
                  </span>
                </div>
              </div>

              {/* Tables: Gender & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Gender */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                    1. สถิติจำแนกตามเพศ
                  </h3>
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 font-semibold">
                      <tr>
                        <th className="p-2 border-b border-slate-200">เพศ</th>
                        <th className="p-2 border-b border-slate-200 text-right">จำนวน (ราย)</th>
                        <th className="p-2 border-b border-slate-200 text-right">ร้อยละ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2">หญิง</td>
                        <td className="p-2 text-right font-medium">{generalData.femaleCount}</td>
                        <td className="p-2 text-right">
                          {generalData.totalPatients
                            ? Math.round((generalData.femaleCount / generalData.totalPatients) * 100)
                            : 0}
                          %
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2">ชาย</td>
                        <td className="p-2 text-right font-medium">{generalData.maleCount}</td>
                        <td className="p-2 text-right">
                          {generalData.totalPatients
                            ? Math.round((generalData.maleCount / generalData.totalPatients) * 100)
                            : 0}
                          %
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="p-2">รวมทั้งหมด</td>
                        <td className="p-2 text-right">{generalData.totalPatients}</td>
                        <td className="p-2 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Age */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                    2. สถิติจำแนกตามกลุ่มอายุ
                  </h3>
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 font-semibold">
                      <tr>
                        <th className="p-2 border-b border-slate-200">กลุ่มอายุ</th>
                        <th className="p-2 border-b border-slate-200 text-right">จำนวน (ราย)</th>
                        <th className="p-2 border-b border-slate-200 text-right">ร้อยละ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {AGE_GROUP_OPTIONS.map((group) => {
                        const count = generalData.ageCounts[group] || 0;
                        const percent = generalData.totalPatients
                          ? Math.round((count / generalData.totalPatients) * 100)
                          : 0;
                        return (
                          <tr key={group}>
                            <td className="p-2">{group}</td>
                            <td className="p-2 text-right font-medium">{count}</td>
                            <td className="p-2 text-right">{percent}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Procedures & Coverage */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                    3. สถิติการให้บริการจำแนกตามประเภทหัตถการ
                  </h3>
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 font-semibold">
                      <tr>
                        <th className="p-2 border-b border-slate-200 w-12 text-center">ลำดับ</th>
                        <th className="p-2 border-b border-slate-200">ประเภทหัตถการ / บริการ</th>
                        <th className="p-2 border-b border-slate-200 text-right">จำนวน (ครั้ง)</th>
                        <th className="p-2 border-b border-slate-200 text-right">สัดส่วน (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {PROCEDURE_TYPE_OPTIONS.map((proc, idx) => {
                        const count = generalData.procCounts[proc] || 0;
                        const percent = generalData.totalPatients
                          ? Math.round((count / generalData.totalPatients) * 100)
                          : 0;
                        return (
                          <tr key={proc}>
                            <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-medium">{proc}</td>
                            <td className="p-2 text-right font-bold text-emerald-800">{count}</td>
                            <td className="p-2 text-right">{percent}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                    4. สถิติจำแนกตามสิทธิการรักษาพยาบาล
                  </h3>
                  <table className="w-full text-xs text-left border border-slate-200">
                    <thead className="bg-slate-100 font-semibold">
                      <tr>
                        <th className="p-2 border-b border-slate-200">สิทธิการรักษา</th>
                        <th className="p-2 border-b border-slate-200 text-right">จำนวน (ราย)</th>
                        <th className="p-2 border-b border-slate-200 text-right">สัดส่วน (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {COVERAGE_TYPE_OPTIONS.map((cov) => {
                        const count = generalData.covCounts[cov] || 0;
                        const percent = generalData.totalPatients
                          ? Math.round((count / generalData.totalPatients) * 100)
                          : 0;
                        return (
                          <tr key={cov}>
                            <td className="p-2 font-medium">{cov}</td>
                            <td className="p-2 text-right font-bold text-slate-800">{count}</td>
                            <td className="p-2 text-right">{percent}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-6">
                  <p>ลงชื่อ ..............................................................</p>
                  <div>
                    <p className="font-semibold">( พท.ว. กลุ่มงานการแพทย์แผนไทย )</p>
                    <p className="text-slate-500">ผู้จัดทำและรวบรวมข้อมูล</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <p>ลงชื่อ ..............................................................</p>
                  <div>
                    <p className="font-semibold">( นายแพทย์ชำนาญการพิเศษ / ผู้อำนวยการ )</p>
                    <p className="text-slate-500">โรงพยาบาลเขาสมิง จังหวัดตราด</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
