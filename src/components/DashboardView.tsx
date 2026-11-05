import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Activity,
  CreditCard,
  HeartHandshake,
  Calendar,
  CalendarCheck,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart2,
  BarChart3,
  Layers,
  Award,
  Trophy,
  Stethoscope,
  Coins,
  Wallet,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';
import {
  ServiceRecord,
  FinancialRecord,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
  formatCurrency,
  AGE_GROUP_OPTIONS,
  COVERAGE_TYPE_OPTIONS,
  PROCEDURE_TYPE_OPTIONS,
  calculateFiscalYear,
} from '../types';
import { exportServicesToExcel } from '../utils/exportImport';
import { generateHospitalPDF } from '../utils/pdfExport';
import { CalendarView } from './CalendarView';
import { useData } from '../context/DataContext';

interface DashboardViewProps {
  services: ServiceRecord[];
  finances: FinancialRecord[];
  onOpenPrintReport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  services,
  finances,
  onOpenPrintReport,
}) => {
  const { clinicEvents, addClinicEvent, updateClinicEvent, deleteClinicEvent } = useData();
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'calendar'>('overview');

  // Filters
  const currentYear = new Date().getFullYear();
  // Current Thai Fiscal Year (e.g. 2569)
  const currentFiscalYear = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    return curMonth >= 10 ? curYear + 543 + 1 : curYear + 543;
  }, []);

  // Primary Filter: Fiscal Year (B.E. พ.ศ. เช่น 2569, 2568, 2567 หรือ 'all')
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedCoverage, setSelectedCoverage] = useState<string>('all');
  const [selectedProcedure, setSelectedProcedure] = useState<string>('all');

  // Procedure / Disease Analytics Controls
  const [serviceAnalyticsCategory, setServiceAnalyticsCategory] = useState<'procedure' | 'diagnosis'>('procedure');
  const [serviceAnalyticsChartType, setServiceAnalyticsChartType] = useState<'horizontal-bar' | 'pie'>('horizontal-bar');

  // Available distinct fiscal years (พ.ศ.) from data and historical hospital records
  const availableFiscalYears = useMemo(() => {
    const fySet = new Set<number>();
    fySet.add(currentFiscalYear);
    fySet.add(currentFiscalYear - 1);
    fySet.add(currentFiscalYear - 2);
    fySet.add(currentFiscalYear - 3);

    services.forEach((s) => {
      if (s.fiscalYear) {
        fySet.add(s.fiscalYear);
      } else if (s.serviceDate) {
        fySet.add(calculateFiscalYear(s.serviceDate));
      } else if (s.year) {
        fySet.add(s.year + 543);
      }
    });

    finances.forEach((f) => {
      const fy = f.month >= 10 ? f.year + 543 + 1 : f.year + 543;
      fySet.add(fy);
    });

    return Array.from(fySet).sort((a, b) => b - a);
  }, [services, finances, currentFiscalYear]);

  // Available distinct calendar years from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);
    services.forEach((s) => {
      if (s.year) yearsSet.add(s.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [services, currentYear]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // 1. Fiscal Year (พ.ศ.) Filter
      if (selectedFiscalYear !== 'all') {
        const itemFY = s.fiscalYear || (s.serviceDate ? calculateFiscalYear(s.serviceDate) : s.year + 543);
        if (itemFY !== selectedFiscalYear) return false;
      }

      // 2. Calendar Year filter (if explicitly set and not in fiscal year filter)
      if (selectedYear !== 'all' && selectedFiscalYear === 'all') {
        if (s.year !== selectedYear) return false;
      }

      if (selectedMonth !== 'all' && s.month !== selectedMonth) {
        return false;
      }

      if (selectedCoverage !== 'all' && s.coverageType !== selectedCoverage) {
        return false;
      }

      if (selectedProcedure !== 'all' && s.procedureType !== selectedProcedure) {
        return false;
      }

      return true;
    });
  }, [services, selectedFiscalYear, selectedYear, selectedMonth, selectedCoverage, selectedProcedure]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalPatients = filteredServices.length;
    let totalRevenue = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let otherGenderCount = 0;

    const ageCounts: Record<string, number> = {
      '0-14 ปี': 0,
      '15-24 ปี': 0,
      '25-44 ปี': 0,
      '45-59 ปี': 0,
      '60 ปีขึ้นไป': 0,
    };

    const coverageCounts: Record<string, number> = {};
    const procedureCounts: Record<string, { count: number; revenue: number }> = {};
    const monthlyCounts: number[] = new Array(12).fill(0);

    filteredServices.forEach((s) => {
      totalRevenue += s.fee || 0;

      // Gender
      if (s.gender === 'ชาย') maleCount++;
      else if (s.gender === 'หญิง') femaleCount++;
      else otherGenderCount++;

      // Age Group
      if (s.ageGroup && ageCounts[s.ageGroup] !== undefined) {
        ageCounts[s.ageGroup]++;
      } else {
        // Fallback calculation
        if (s.age <= 14) ageCounts['0-14 ปี']++;
        else if (s.age <= 24) ageCounts['15-24 ปี']++;
        else if (s.age <= 44) ageCounts['25-44 ปี']++;
        else if (s.age <= 59) ageCounts['45-59 ปี']++;
        else ageCounts['60 ปีขึ้นไป']++;
      }

      // Coverage
      const cov = s.coverageType || 'อื่นๆ';
      coverageCounts[cov] = (coverageCounts[cov] || 0) + 1;

      // Procedure
      const proc = s.procedureType || 'อื่นๆ';
      if (!procedureCounts[proc]) {
        procedureCounts[proc] = { count: 0, revenue: 0 };
      }
      procedureCounts[proc].count++;
      procedureCounts[proc].revenue += s.fee || 0;

      // Monthly Trend (1-12)
      if (s.month >= 1 && s.month <= 12) {
        monthlyCounts[s.month - 1]++;
      }
    });

    // Top procedure
    let topProc = { name: '-', count: 0 };
    Object.entries(procedureCounts).forEach(([name, data]) => {
      if (data.count > topProc.count) {
        topProc = { name, count: data.count };
      }
    });

    // Top coverage
    let topCov = { name: '-', count: 0 };
    Object.entries(coverageCounts).forEach(([name, count]) => {
      if (count > topCov.count) {
        topCov = { name, count };
      }
    });

    return {
      totalPatients,
      totalRevenue,
      maleCount,
      femaleCount,
      otherGenderCount,
      ageCounts,
      coverageCounts,
      procedureCounts,
      monthlyCounts,
      topProc,
      topCov,
    };
  }, [filteredServices]);

  // Target/Active Month for Monthly KPIs
  const activeMonth = useMemo(() => {
    if (selectedMonth !== 'all') return selectedMonth;
    if (filteredServices.length > 0 && filteredServices[0].month) return filteredServices[0].month;
    if (services.length > 0 && services[0].month) return services[0].month;
    return new Date().getMonth() + 1;
  }, [selectedMonth, filteredServices, services]);

  const activeYear = useMemo(() => {
    if (selectedFiscalYear !== 'all') {
      // In Thai Fiscal Year (Oct-Sep), Oct-Dec belong to (selectedFiscalYear - 544), Jan-Sep belong to (selectedFiscalYear - 543)
      return activeMonth >= 10 ? selectedFiscalYear - 543 - 1 : selectedFiscalYear - 543;
    }
    if (selectedYear !== 'all') return selectedYear;
    if (filteredServices.length > 0 && filteredServices[0].year) return filteredServices[0].year;
    if (services.length > 0 && services[0].year) return services[0].year;
    return new Date().getFullYear();
  }, [selectedFiscalYear, selectedYear, activeMonth, filteredServices, services]);

  // Calculate Monthly KPIs: Total Visits, Revenue Generated This Month, and New Patients
  const monthlyKpis = useMemo(() => {
    // Current month services
    const currentMonthServices = services.filter(
      (s) => s.year === activeYear && s.month === activeMonth
    );

    // Previous month for growth trend
    const prevMonth = activeMonth === 1 ? 12 : activeMonth - 1;
    const prevYear = activeMonth === 1 ? activeYear - 1 : activeYear;
    const prevMonthServices = services.filter(
      (s) => s.year === prevYear && s.month === prevMonth
    );

    // 1. Total Monthly Visits
    const totalMonthlyVisits = currentMonthServices.length;
    const prevMonthlyVisits = prevMonthServices.length;
    const visitGrowth =
      prevMonthlyVisits > 0
        ? Math.round(((totalMonthlyVisits - prevMonthlyVisits) / prevMonthlyVisits) * 100)
        : null;

    // 2. Revenue Generated This Month (Service charges)
    const serviceRevenueThisMonth = currentMonthServices.reduce((sum, s) => sum + (s.fee || 0), 0);
    const financeIncomeThisMonth = finances
      .filter((f) => f.year === activeYear && f.month === activeMonth && f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);

    const prevServiceRevenue = prevMonthServices.reduce((sum, s) => sum + (s.fee || 0), 0);
    const revenueGrowth =
      prevServiceRevenue > 0
        ? Math.round(((serviceRevenueThisMonth - prevServiceRevenue) / prevServiceRevenue) * 100)
        : null;

    // 3. Number of New Patients this month
    // Map patient HN to earliest service date across the whole system
    const hnEarliestDate: Record<string, string> = {};
    services.forEach((s) => {
      const hnKey = s.hn.trim().toLowerCase();
      if (!hnEarliestDate[hnKey] || (s.serviceDate && s.serviceDate < hnEarliestDate[hnKey])) {
        hnEarliestDate[hnKey] = s.serviceDate;
      }
    });

    const uniqueHnsThisMonth = new Set<string>();
    let newPatientsCount = 0;

    currentMonthServices.forEach((s) => {
      const hnKey = s.hn.trim().toLowerCase();
      if (!uniqueHnsThisMonth.has(hnKey)) {
        uniqueHnsThisMonth.add(hnKey);
        const earliest = hnEarliestDate[hnKey];
        if (earliest) {
          const [eYear, eMonth] = earliest.split('-').map(Number);
          if (eYear === activeYear && eMonth === activeMonth) {
            newPatientsCount++;
          }
        } else {
          newPatientsCount++;
        }
      }
    });

    const returningPatientsCount = uniqueHnsThisMonth.size - newPatientsCount;
    const newPatientsPercent =
      uniqueHnsThisMonth.size > 0
        ? Math.round((newPatientsCount / uniqueHnsThisMonth.size) * 100)
        : 0;

    // 4. Daily average rate (~22 working days)
    const avgDailyVisits =
      totalMonthlyVisits > 0 ? (totalMonthlyVisits / 22).toFixed(1) : '0';

    return {
      monthName: THAI_MONTHS[activeMonth - 1] || `เดือนที่ ${activeMonth}`,
      yearBE: activeYear + 543,
      totalMonthlyVisits,
      visitGrowth,
      serviceRevenueThisMonth,
      financeIncomeThisMonth,
      revenueGrowth,
      newPatientsCount,
      returningPatientsCount,
      newPatientsPercent,
      uniquePatientsCount: uniqueHnsThisMonth.size,
      avgDailyVisits,
    };
  }, [services, finances, activeMonth, activeYear]);

  // 12-Month LineChart Data for Recharts
  const monthlyLineChartData = useMemo(() => {
    // Filter services according to the active filters except the specific month filter
    const yearFiltered = services.filter((item) => {
      if (selectedFiscalYear !== 'all') {
        const itemFY = item.fiscalYear || (item.serviceDate ? calculateFiscalYear(item.serviceDate) : item.year + 543);
        if (itemFY !== selectedFiscalYear) return false;
      } else if (selectedYear !== 'all') {
        if (item.year !== selectedYear) return false;
      }

      if (selectedCoverage !== 'all' && item.coverageType !== selectedCoverage) {
        return false;
      }
      if (selectedProcedure !== 'all' && item.procedureType !== selectedProcedure) {
        return false;
      }
      return true;
    });

    const counts = Array(12).fill(0);
    const revenues = Array(12).fill(0);
    const uniqueHns = Array.from({ length: 12 }, () => new Set<string>());

    yearFiltered.forEach((s) => {
      if (s.month >= 1 && s.month <= 12) {
        const idx = s.month - 1;
        counts[idx]++;
        revenues[idx] += s.fee || 0;
        if (s.hn) uniqueHns[idx].add(s.hn.trim().toLowerCase());
      }
    });

    const totalYearVisits = counts.reduce((a, b) => a + b, 0);

    // When a specific fiscal year is selected, order from October (month 10) to September (month 9)
    // which aligns with Thai fiscal year quarters (Q1: ต.ค.-ธ.ค., Q2: ม.ค.-มี.ค., Q3: เม.ย.-มิ.ย., Q4: ก.ค.-ก.ย.)
    const monthOrder = selectedFiscalYear !== 'all'
      ? [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8] // 0-based index: 9=Oct, 10=Nov, 11=Dec, 0=Jan... 8=Sep
      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    return monthOrder.map((idx, seqIdx) => {
      const monthNum = idx + 1;
      const visits = counts[idx];
      const revenue = revenues[idx];
      const uniquePatients = uniqueHns[idx].size;
      const percent = totalYearVisits > 0 ? Math.round((visits / totalYearVisits) * 100) : 0;
      const quarterNumber = selectedFiscalYear !== 'all' ? Math.floor(seqIdx / 3) + 1 : Math.floor(idx / 3) + 1;

      return {
        monthIndex: idx,
        monthNum,
        monthName: THAI_MONTHS_SHORT[idx],
        fullMonthName: THAI_MONTHS[idx],
        quarter: `ไตรมาส ${quarterNumber}`,
        visits,
        revenue,
        uniquePatients,
        percent,
      };
    });
  }, [services, selectedFiscalYear, selectedYear, selectedCoverage, selectedProcedure]);

  // Statistical highlights for the 12-month line chart
  const lineChartStats = useMemo(() => {
    let peak = monthlyLineChartData[0] || { monthName: '-', fullMonthName: '-', visits: 0, revenue: 0, uniquePatients: 0, percent: 0, monthNum: 1 };
    let low = monthlyLineChartData[0] || { monthName: '-', fullMonthName: '-', visits: 0, revenue: 0, uniquePatients: 0, percent: 0, monthNum: 1 };
    let totalVisits = 0;
    let monthsWithData = 0;

    monthlyLineChartData.forEach((m) => {
      totalVisits += m.visits;
      if (m.visits > peak.visits) {
        peak = m;
      }
      if (m.visits > 0 && (low.visits === 0 || m.visits < low.visits)) {
        low = m;
      }
      if (m.visits > 0) monthsWithData++;
    });

    const avgVisits = Math.round(totalVisits / 12);

    return {
      peak,
      low: low.visits > 0 ? low : null,
      totalVisits,
      avgVisits,
      monthsWithData,
    };
  }, [monthlyLineChartData]);

  // Recharts Custom Tooltip for 12-Month Line Chart
  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPeak = data.visits === lineChartStats.peak.visits && data.visits > 0;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-md min-w-[210px] pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-300 text-sm">{data.fullMonthName}</span>
              {isPeak && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-semibold flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-amber-400" />
                  Peak
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {selectedFiscalYear !== 'all'
                ? `ปีงบฯ พ.ศ. ${selectedFiscalYear}`
                : selectedYear === 'all'
                ? 'ทุกปีงบประมาณ'
                : `พ.ศ. ${selectedYear + 543}`}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">จำนวนผู้รับบริการ:</span>
              <span className="font-black text-emerald-400 text-sm">
                {data.visits.toLocaleString()} <span className="text-xs font-normal text-slate-300">ครั้ง</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">ผู้ป่วยไม่ซ้ำ (HN):</span>
              <span className="font-semibold text-slate-100">
                {data.uniquePatients.toLocaleString()} คน
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">สัดส่วนในรอบปี:</span>
              <span className="font-semibold text-teal-300">
                {data.percent}%
              </span>
            </div>

            {data.revenue > 0 && (
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">ประมาณการมูลค่า:</span>
                <span className="font-bold text-amber-300">
                  {formatCurrency(data.revenue)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 text-center">
            คลิกที่จุดเพื่อกรองดูเฉพาะเดือนนี้
          </div>
        </div>
      );
    }
    return null;
  };

  // Color palette for Procedure and Disease Charts (Luxury Oceanic Blue-Green & Jewel Accents)
  const SERVICE_CHART_COLORS = [
    '#0891b2', // Luminous Cyan
    '#0d9488', // Jewel Teal
    '#0284c7', // Oceanic Blue
    '#059669', // Emerald
    '#06b6d4', // Bright Cyan
    '#14b8a6', // Aquamarine
    '#d97706', // Imperial Amber
    '#6366f1', // Royal Indigo
    '#0f766e', // Deep Teal
    '#026070', // Deep Oceanic
  ];

  // Procedure Breakdown Data for Recharts
  const procedureChartData = useMemo(() => {
    return Object.entries(stats.procedureCounts)
      .map(([name, data]) => {
        let shortName = name;
        if (name === 'นวดไทยเพื่อการบำบัดรักษา') shortName = 'นวดบำบัดรักษา';
        else if (name === 'นวดไทยเพื่อส่งเสริมสุขภาพ/ผ่อนคลาย') shortName = 'นวดส่งเสริมสุขภาพ';
        else if (name === 'การดูแลฟื้นฟูมารดาหลังคลอด/ทับหม้อเกลือ') shortName = 'ฟื้นฟูมารดาหลังคลอด';
        else if (name === 'บริการคลินิกเฉพาะโรค (อัมพฤกษ์/ไมเกรน/ข้อเข่าเสื่อม)') shortName = 'คลินิกเฉพาะโรค';
        else if (name === 'การตรวจวินิจฉัยและจ่ายยาสมุนไพร') shortName = 'ตรวจวินิจฉัย/จ่ายยา';
        else if (name.length > 20) shortName = name.slice(0, 18) + '...';

        return {
          name,
          shortName,
          count: data.count,
          revenue: data.revenue,
          percent: stats.totalPatients > 0 ? Number(((data.count / stats.totalPatients) * 100).toFixed(1)) : 0,
        };
      })
      .filter((item) => item.count > 0 || Object.keys(stats.procedureCounts).length <= 8)
      .sort((a, b) => b.count - a.count);
  }, [stats.procedureCounts, stats.totalPatients]);

  // Executive Top 5 Procedures for Department Head Insight
  const top5Procedures = useMemo(() => {
    return procedureChartData.slice(0, 5).map((proc, idx) => ({
      ...proc,
      rank: idx + 1,
    }));
  }, [procedureChartData]);

  // Diagnosis / Disease Group Data for Recharts
  const diagnosisChartData = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; fullName: string }> = {};

    filteredServices.forEach((s) => {
      let diag = (s.diagnosis || '').trim();
      if (!diag) diag = 'ตรวจสุขภาพทั่วไป / ไม่ระบุกลุ่มโรค';

      // Group into recognizable TTM clinical categories
      let groupName = diag;

      if (diag.includes('ลมปลายปัตฆาต') || diag.includes('คอบ่าไหล่') || diag.includes('สะบัก')) {
        groupName = 'โรคลมปลายปัตฆาต (ปวดคอบ่าไหล่/สะบักจม)';
      } else if (diag.includes('ลมจับโปงแห้ง') || diag.includes('ข้อเข่าเสื่อม')) {
        groupName = 'โรคลมจับโปงแห้งเข่า (ข้อเข่าเสื่อม)';
      } else if (diag.includes('หลังคลอด') || diag.includes('ทับหม้อเกลือ')) {
        groupName = 'การดูแลฟื้นฟูมารดาหลังคลอด (ทับหม้อเกลือ)';
      } else if (diag.includes('อัมพฤกษ์') || diag.includes('อัมพาต') || diag.includes('หลอดเลือดสมอง')) {
        groupName = 'โรคอัมพฤกษ์ / อัมพาต (ฟื้นฟูกล้ามเนื้ออ่อนแรง)';
      } else if (diag.includes('ไมเกรน') || diag.includes('ลมปะกัง') || diag.includes('ปวดศีรษะ')) {
        groupName = 'โรคไมเกรน / ลมปะกัง (ปวดศีรษะเรื้อรัง)';
      } else if (diag.includes('ปวดหลัง') || diag.includes('บั้นเอว') || diag.includes('สลักเพชร')) {
        groupName = 'โรคลมติดประจำบั้นเอว / สลักเพชร (ปวดหลัง)';
      } else if (diag.includes('นิ้วล็อค') || diag.includes('ข้อมือ')) {
        groupName = 'โรคนิ้วล็อค / เส้นเอ็นข้อมืออักเสบ';
      } else if (diag.includes('ลมจับโปงน้ำ')) {
        groupName = 'โรคลมจับโปงน้ำเข่า (ข้อเข่าอักเสบบวม)';
      }

      if (!map[groupName]) {
        map[groupName] = { count: 0, revenue: 0, fullName: groupName };
      }
      map[groupName].count++;
      map[groupName].revenue += s.fee || 0;
    });

    return Object.entries(map)
      .map(([groupName, data]) => {
        let shortName = groupName;
        if (groupName.includes('ลมปลายปัตฆาต')) shortName = 'ลมปลายปัตฆาต (คอบ่า)';
        else if (groupName.includes('ลมจับโปงแห้ง')) shortName = 'ลมจับโปงแห้ง (ข้อเข่า)';
        else if (groupName.includes('ฟื้นฟูมารดา')) shortName = 'ฟื้นฟูมารดาหลังคลอด';
        else if (groupName.includes('อัมพฤกษ์')) shortName = 'อัมพฤกษ์ / อัมพาต';
        else if (groupName.includes('ไมเกรน')) shortName = 'ไมเกรน / ลมปะกัง';
        else if (groupName.includes('ลมติดประจำบั้นเอว')) shortName = 'ลมติดบั้นเอว (ปวดหลัง)';
        else if (shortName.length > 20) shortName = shortName.slice(0, 18) + '...';

        return {
          name: groupName,
          shortName,
          count: data.count,
          revenue: data.revenue,
          percent: filteredServices.length > 0 ? Number(((data.count / filteredServices.length) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 diagnoses
  }, [filteredServices]);

  // Active dataset according to user selection
  const activeAnalyticsData = useMemo(() => {
    return serviceAnalyticsCategory === 'procedure' ? procedureChartData : diagnosisChartData;
  }, [serviceAnalyticsCategory, procedureChartData, diagnosisChartData]);

  // Analytics Highlights
  const topServiceItem = useMemo(() => {
    if (!activeAnalyticsData || activeAnalyticsData.length === 0) return null;
    return activeAnalyticsData[0];
  }, [activeAnalyticsData]);

  const highestRevenueServiceItem = useMemo(() => {
    if (!activeAnalyticsData || activeAnalyticsData.length === 0) return null;
    return [...activeAnalyticsData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [activeAnalyticsData]);

  // Recharts Custom Tooltip for Procedure & Diagnosis Charts
  const renderServiceChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProc = serviceAnalyticsCategory === 'procedure';

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-md min-w-[220px] pointer-events-none">
          <div className="border-b border-slate-700/80 pb-2 mb-2">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
              {isProc ? 'ประเภทหัตถการ' : 'กลุ่มโรค / การวินิจฉัย'}
            </span>
            <h4 className="font-bold text-white text-sm mt-0.5 leading-snug">
              {data.name}
            </h4>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">จำนวนที่ให้บริการ:</span>
              <span className="font-black text-emerald-400 text-sm">
                {data.count.toLocaleString()} <span className="text-xs font-normal text-slate-300">ครั้ง</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">สัดส่วนความนิยม:</span>
              <span className="font-bold text-teal-300">
                {data.percent}%
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">มูลค่าบริการรวม:</span>
              <span className="font-bold text-amber-300">
                {formatCurrency(data.revenue)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Export handlers
  const handleExportExcel = () => {
    const yearLabel = selectedFiscalYear !== 'all'
      ? `ปีงบประมาณ_${selectedFiscalYear}`
      : selectedYear === 'all'
      ? 'ทุกปีงบประมาณ'
      : `ปี_${selectedYear + 543}`;
    const monthLabel = selectedMonth === 'all' ? 'ทุกเดือน' : `เดือน_${THAI_MONTHS[selectedMonth - 1]}`;
    exportServicesToExcel(filteredServices, `สถิติบริการแพทย์แผนไทย_รพ_เขาสมิง_${yearLabel}_${monthLabel}.xlsx`);
  };

  const handleExportPDF = () => {
    const yearLabel = selectedFiscalYear !== 'all'
      ? `ปีงบประมาณ พ.ศ. ${selectedFiscalYear}`
      : selectedYear === 'all'
      ? 'ทุกปี พ.ศ.'
      : `พ.ศ. ${selectedYear + 543}`;
    const monthLabel = selectedMonth === 'all' ? 'ทุกเดือน' : `เดือน${THAI_MONTHS[selectedMonth - 1]}`;

    const ageDistribution = Object.entries(stats.ageCounts).map(([group, count]) => ({
      group,
      count,
      percent: stats.totalPatients > 0 ? Math.round((count / stats.totalPatients) * 100) : 0,
    }));

    const coverageDistribution = Object.entries(stats.coverageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percent: stats.totalPatients > 0 ? Math.round((count / stats.totalPatients) * 100) : 0,
      }));

    const procedureDistribution = Object.entries(stats.procedureCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        count: data.count,
        percent: stats.totalPatients > 0 ? Math.round((data.count / stats.totalPatients) * 100) : 0,
      }));

    // Financial totals for context
    const currentFinances = finances.filter((f) => {
      if (selectedFiscalYear !== 'all') {
        const fy = f.month >= 10 ? f.year + 543 + 1 : f.year + 543;
        if (fy !== selectedFiscalYear) return false;
      } else if (selectedYear !== 'all' && f.year !== selectedYear) {
        return false;
      }
      if (selectedMonth !== 'all' && f.month !== selectedMonth) return false;
      return true;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    currentFinances.forEach((f) => {
      if (f.type === 'income') totalIncome += f.amount;
      else totalExpense += f.amount;
    });

    generateHospitalPDF({
      title: 'กลุ่มงานการแพทย์แผนไทย โรงพยาบาลเขาสมิง',
      subTitle: 'รายงานวิเคราะห์สถิติบริการผู้ป่วยและการดำเนินงาน',
      filterDescription: `${yearLabel} / ${monthLabel} / สิทธิ: ${selectedCoverage === 'all' ? 'ทั้งหมด' : selectedCoverage}`,
      generatedDate: new Date().toLocaleDateString('th-TH', { dateStyle: 'long' }),
      totalPatients: stats.totalPatients,
      totalServices: stats.totalPatients,
      totalRevenue: stats.totalRevenue,
      maleCount: stats.maleCount,
      femaleCount: stats.femaleCount,
      otherGenderCount: stats.otherGenderCount,
      ageDistribution,
      coverageDistribution,
      procedureDistribution,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      incomeCategories: [],
      expenseCategories: [],
    });
  };

  // Gender Percentages
  const malePercent = stats.totalPatients > 0 ? Math.round((stats.maleCount / stats.totalPatients) * 100) : 0;
  const femalePercent = stats.totalPatients > 0 ? Math.round((stats.femaleCount / stats.totalPatients) * 100) : 0;
  const otherPercent = stats.totalPatients > 0 ? 100 - malePercent - femalePercent : 0;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* DASHBOARD VIEW SWITCHER (OVERVIEW vs CLINIC CALENDAR)   */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-teal-100 shadow-xs">
        <div className="flex items-center bg-teal-950/5 p-1 rounded-xl text-xs font-semibold border border-teal-100/60">
          <button
            type="button"
            onClick={() => setActiveDashboardTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeDashboardTab === 'overview'
                ? 'bg-linear-to-r from-teal-700 via-cyan-700 to-teal-700 text-white shadow-md shadow-teal-950/20 font-bold ring-1 ring-cyan-400/30'
                : 'text-teal-900/80 hover:text-cyan-800 hover:bg-teal-100/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-300" />
            <span>กราฟวิเคราะห์ & สถิติภาพรวม</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDashboardTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeDashboardTab === 'calendar'
                ? 'bg-linear-to-r from-teal-700 via-cyan-700 to-teal-700 text-white shadow-md shadow-teal-950/20 font-bold ring-1 ring-cyan-400/30'
                : 'text-teal-900/80 hover:text-cyan-800 hover:bg-teal-100/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-cyan-300" />
            <span>ปฏิทินคลินิก & สถิติรายวัน</span>
            {clinicEvents.length > 0 && (
              <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 shadow-2xs">
                {clinicEvents.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Action Button for Department Head's Quarterly Performance Report */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPrintReport}
            className="flex items-center gap-2 bg-linear-to-r from-[#033036] via-[#05454d] to-[#033036] hover:from-[#043b43] hover:to-[#043b43] text-cyan-100 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-950/30 border border-cyan-400/30 hover:border-cyan-300/60 transition-all cursor-pointer group"
            title="สร้างและพิมพ์รายงานสรุปผลการดำเนินงานแบบรายไตรมาส (Quarterly Performance Report) สำหรับหัวหน้ากลุ่มงาน"
          >
            <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>รายงานผลงานรายไตรมาส (Quarterly Report)</span>
          </button>
        </div>
      </div>

      {/* Conditional: Calendar View vs Overview Analytics */}
      {activeDashboardTab === 'calendar' ? (
        <CalendarView
          services={services}
          finances={finances}
          clinicEvents={clinicEvents}
          onAddClinicEvent={addClinicEvent}
          onUpdateClinicEvent={updateClinicEvent}
          onDeleteClinicEvent={deleteClinicEvent}
        />
      ) : (
        <div className="space-y-6">
          {/* ======================================================== */}
          {/* ======================================================== */}
          {/* 1. Monthly Key Performance Indicators (KPIs) Summary Bar */}
          {/* ======================================================== */}
          <section className="bg-linear-to-r from-[#032427] via-[#05383f] to-[#041c22] rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-teal-700/40 relative overflow-hidden">
            {/* Subtle luxury ambient cyan glow */}
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-cyan-500/15 via-teal-500/5 to-transparent pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-teal-800/60 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-500/30 to-cyan-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-200 shadow-inner">
                  <CalendarCheck className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                      ตัวชี้วัดผลการดำเนินงานหลักประจำเดือน (Monthly KPIs)
                    </h2>
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                      รพ.เขาสมิง
                    </span>
                  </div>
                  <p className="text-xs text-teal-200/80 font-normal">
                    สรุปยอดบริการผู้ป่วย รายรับค่าบริการ และอัตราผู้ป่วยใหม่ประจำงวด
                  </p>
                </div>
              </div>

              {/* Top-Right Fiscal Year Filter Control & Period Indicator */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Fiscal Year (พ.ศ.) Selector at Top-Right */}
                <div className="flex items-center gap-2 bg-[#02181d]/90 hover:bg-[#032227] border border-cyan-500/40 hover:border-cyan-400 px-3 py-1.5 rounded-xl text-xs shadow-md backdrop-blur-md transition-all">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <label htmlFor="top-fiscal-year-select" className="text-cyan-200 font-bold whitespace-nowrap text-xs">
                    ปีงบประมาณ:
                  </label>
                  <select
                    id="top-fiscal-year-select"
                    aria-label="เลือกปีงบประมาณ พ.ศ."
                    value={selectedFiscalYear}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                      setSelectedFiscalYear(val);
                    }}
                    className="bg-teal-900/90 hover:bg-teal-800 text-white font-bold text-xs rounded-lg px-2.5 py-1 border border-teal-600/70 focus:outline-hidden focus:ring-2 focus:ring-cyan-400/50 cursor-pointer transition-all"
                  >
                    <option value="all" className="bg-[#02181d] text-white">ทุกปีงบประมาณ (ทั้งหมด)</option>
                    {availableFiscalYears.map((fy) => (
                      <option key={fy} value={fy} className="bg-[#02181d] text-white">
                        ปีงบฯ พ.ศ. {fy} {fy === currentFiscalYear ? '★ (ปัจจุบัน)' : '(ย้อนหลัง)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Clear Pill when a specific Fiscal Year is selected */}
                {selectedFiscalYear !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedFiscalYear('all')}
                    className="flex items-center gap-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
                    title="คลิกเพื่อยกเลิกการกรองปีงบประมาณและดูสถิติทั้งหมด"
                  >
                    <span>พ.ศ. {selectedFiscalYear}</span>
                    <span className="font-bold text-amber-200 ml-0.5">✕</span>
                  </button>
                )}

                {/* Active Period Pill */}
                <div className="hidden sm:flex items-center gap-1.5 bg-[#021c20]/80 border border-teal-700/50 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                  <span className="text-cyan-400 font-medium">งวดข้อมูล:</span>
                  <span className="font-bold text-cyan-200">
                    {monthlyKpis.monthName} {monthlyKpis.yearBE}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              {/* Card 1: Total Monthly Visits */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4.5 border border-cyan-400/20 hover:border-cyan-400/40 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wider">
                    ยอดผู้รับบริการเดือนนี้
                  </span>
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {monthlyKpis.totalMonthlyVisits.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-cyan-300">ครั้ง/เดือน</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-cyan-200">
                    {monthlyKpis.visitGrowth !== null && monthlyKpis.visitGrowth >= 0 ? (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300" />
                        <span className="font-semibold text-cyan-200">+{monthlyKpis.visitGrowth}%</span>
                        <span className="text-[11px] text-teal-200/70">จากเดือนก่อน</span>
                      </>
                    ) : monthlyKpis.visitGrowth !== null ? (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-amber-300">{monthlyKpis.visitGrowth}%</span>
                        <span className="text-[11px] text-teal-200/70">จากเดือนก่อน</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-cyan-300">ผู้ป่วย {monthlyKpis.uniquePatientsCount} คน</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {monthlyKpis.uniquePatientsCount} ราย
                  </span>
                </div>
              </div>

              {/* Card 2: Revenue Generated This Month */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4.5 border border-teal-400/20 hover:border-teal-400/40 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider">
                    รายรับค่าบริการเดือนนี้
                  </span>
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {formatCurrency(monthlyKpis.serviceRevenueThisMonth)}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-teal-200">
                    {monthlyKpis.revenueGrowth !== null && monthlyKpis.revenueGrowth >= 0 ? (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-teal-300" />
                        <span className="font-semibold text-teal-200">+{monthlyKpis.revenueGrowth}%</span>
                      </>
                    ) : monthlyKpis.revenueGrowth !== null ? (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5 text-amber-300" />
                        <span className="font-semibold text-amber-200">{monthlyKpis.revenueGrowth}%</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-teal-300">เฉลี่ยต่อครั้ง</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-300">
                    เฉลี่ย {monthlyKpis.totalMonthlyVisits > 0 ? Math.round(monthlyKpis.serviceRevenueThisMonth / monthlyKpis.totalMonthlyVisits) : 0} ฿/ครั้ง
                  </span>
                </div>
              </div>

              {/* Card 3: Number of New Patients */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4.5 border border-sky-400/20 hover:border-sky-400/40 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-200 uppercase tracking-wider">
                    ผู้ป่วยรายใหม่เดือนนี้
                  </span>
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    <UserPlus className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {monthlyKpis.newPatientsCount.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-sky-200">รายใหม่</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-sky-200 font-medium">
                    {monthlyKpis.newPatientsPercent}% ของผู้รับบริการ
                  </span>
                  <span className="text-[11px] text-slate-300">
                    ผู้ป่วยเก่า {monthlyKpis.returningPatientsCount} ราย
                  </span>
                </div>
              </div>

              {/* Card 4: Daily Average Rate & Top Clinical Care */}
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-4.5 border border-amber-400/20 hover:border-amber-400/40 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                    อัตราให้บริการเฉลี่ย
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {monthlyKpis.avgDailyVisits}
                  </span>
                  <span className="text-xs font-medium text-amber-200">ราย / วันทำการ</span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-amber-200 truncate max-w-[150px]" title={stats.topProc.name}>
                    นิยมสุด: {stats.topProc.name}
                  </span>
                  <span className="text-[11px] text-amber-300 font-bold">
                    {stats.topProc.count} ครั้ง
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Top Controls & Filter Bar */}
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 shadow-xs border border-teal-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-800 border border-teal-200/60 rounded-xl">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    ตัวกรองรายงานสรุปผล
                  </h2>
                  <p className="text-xs text-teal-800/70">
                    เลือกช่วงเวลา ปี/เดือน หรือประเภทบริการ เพื่อวิเคราะห์สถิติเจาะลึก
                  </p>
                </div>
              </div>

              {/* Filter selects */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Fiscal Year (พ.ศ.) selector */}
                <div className="flex items-center gap-1.5 bg-teal-50/90 border border-teal-300/80 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
                  <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                  <label htmlFor="filter-bar-fiscal-year-select" className="text-teal-950 font-bold whitespace-nowrap">
                    ปีงบประมาณ (พ.ศ.):
                  </label>
                  <select
                    id="filter-bar-fiscal-year-select"
                    aria-label="เลือกปีงบประมาณ พ.ศ."
                    value={selectedFiscalYear}
                    onChange={(e) => setSelectedFiscalYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                    className="bg-transparent font-extrabold text-teal-900 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">ทุกปีงบประมาณ (ทั้งหมด)</option>
                    {availableFiscalYears.map((fy) => (
                      <option key={fy} value={fy}>
                        ปีงบฯ พ.ศ. {fy} {fy === currentFiscalYear ? '★ (ปัจจุบัน)' : '(ย้อนหลัง)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Historical Fiscal Year Pills */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFiscalYear('all')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      selectedFiscalYear === 'all'
                        ? 'bg-linear-to-r from-teal-700 to-cyan-700 text-white font-bold shadow-2xs'
                        : 'bg-teal-50/60 text-teal-900/80 hover:bg-teal-100/70'
                    }`}
                  >
                    ทุกปี
                  </button>
                  {availableFiscalYears.slice(0, 3).map((fy) => (
                    <button
                      key={fy}
                      type="button"
                      onClick={() => setSelectedFiscalYear(fy)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        selectedFiscalYear === fy
                          ? 'bg-linear-to-r from-teal-700 to-cyan-700 text-white font-bold shadow-2xs'
                          : 'bg-teal-50/60 text-teal-900/80 hover:bg-teal-100/70'
                      }`}
                      title={`กรองดูสถิติปีงบประมาณ พ.ศ. ${fy}`}
                    >
                      {fy}
                    </button>
                  ))}
                </div>

            {/* Month selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <label htmlFor="month-select" className="text-slate-600 font-medium">เดือน:</label>
              <select
                id="month-select"
                aria-label="เลือกเดือน"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="all">ทุกเดือน (ทั้งปี)</option>
                {THAI_MONTHS.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Coverage filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <label htmlFor="coverage-select" className="text-slate-600 font-medium">สิทธิ:</label>
              <select
                id="coverage-select"
                aria-label="เลือกสิทธิการรักษา"
                value={selectedCoverage}
                onChange={(e) => setSelectedCoverage(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden max-w-[120px] truncate"
              >
                <option value="all">ทุกสิทธิการรักษา</option>
                {COVERAGE_TYPE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions: Export PDF & Excel */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleExportExcel}
                title="ส่งออก Excel"
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Excel</span>
              </button>

              <button
                onClick={onOpenPrintReport}
                title="พิมพ์รายงานสรุปหรือบันทึก PDF ทางการ"
                className="flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ / PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients Card */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ผู้รับบริการทั้งหมด
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.totalPatients.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-500">ครั้ง/ราย</span>
          </div>
          <div className="mt-3 text-xs text-emerald-700 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>หญิง {stats.femaleCount} ราย ({femalePercent}%) • ชาย {stats.maleCount} ราย</span>
          </div>
        </div>

        {/* Total Service Fees */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              มูลค่าบริการหัตถการรวม
            </span>
            <div className="p-2.5 rounded-xl bg-teal-100 text-teal-800">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {formatCurrency(stats.totalRevenue)}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500 truncate">
            เฉลี่ย {stats.totalPatients ? Math.round(stats.totalRevenue / stats.totalPatients) : 0} ฿ / ครั้งบริการ
          </p>
        </div>

        {/* Top Procedure */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              หัตถการยอดนิยม
            </span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1" title={stats.topProc.name}>
              {stats.topProc.name}
            </h3>
            <p className="text-xs font-medium text-amber-700 mt-1">
              ให้บริการ {stats.topProc.count.toLocaleString()} ครั้ง
              {stats.totalPatients > 0 && ` (${Math.round((stats.topProc.count / stats.totalPatients) * 100)}%)`}
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            คลินิกแพทย์แผนไทย รพ.เขาสมิง
          </div>
        </div>

        {/* Top Coverage */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              สิทธิการรักษาสูงสุด
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-800">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {stats.topCov.name}
            </h3>
            <p className="text-xs font-medium text-indigo-700 mt-1">
              จำนวน {stats.topCov.count.toLocaleString()} ราย
              {stats.totalPatients > 0 && ` (${Math.round((stats.topCov.count / stats.totalPatients) * 100)}%)`}
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            ครอบคลุมผู้รับบริการส่วนใหญ่
          </div>
        </div>
      </div>

      {/* Main Charts Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 0 (FEATURED): กราฟเส้นแนวโน้ม 12 เดือน (Recharts LineChart) */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 shadow-xs border border-teal-100 col-span-1 lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-teal-100/70">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-linear-to-br from-teal-700 via-cyan-700 to-teal-800 text-cyan-200 rounded-xl shadow-xs border border-cyan-400/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    แนวโน้มจำนวนผู้รับบริการการแพทย์แผนไทย ในรอบ 12 เดือน
                  </h3>
                  <span className="text-[10px] font-bold bg-cyan-50 text-cyan-800 px-2.5 py-0.5 rounded-full border border-cyan-200/80 uppercase tracking-wide">
                    LineChart (Recharts)
                  </span>
                </div>
                <p className="text-xs text-teal-800/70 mt-0.5">
                  วิเคราะห์แนวโน้มการเติบโตและช่วงเดือนที่มีผู้ใช้บริการหนาแน่น (Peak Season) รพ.เขาสมิง
                </p>
              </div>
            </div>

            {/* Quick KPI indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Peak Month */}
              <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="text-amber-800 font-medium">ช่วงหนาแน่นสูงสุด:</span>
                <span className="font-bold text-amber-950">
                  {lineChartStats.peak.fullMonthName} ({lineChartStats.peak.visits.toLocaleString()} ครั้ง)
                </span>
              </div>

              {/* Monthly Average */}
              <div className="flex items-center gap-1.5 bg-cyan-50/80 border border-cyan-200 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span className="text-cyan-800 font-medium">เฉลี่ยต่อเดือน:</span>
                <span className="font-bold text-cyan-950">
                  {lineChartStats.avgVisits.toLocaleString()} ราย
                </span>
              </div>

              {/* Fiscal Year Badge */}
              <div className="flex items-center gap-1.5 bg-teal-50/80 border border-teal-300/80 px-3 py-1.5 rounded-xl text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-teal-800 font-medium">ปีงบฯ:</span>
                <span className="font-bold text-teal-950">
                  {selectedFiscalYear === 'all' ? 'ทุกปีงบประมาณ' : `พ.ศ. ${selectedFiscalYear}`}
                </span>
              </div>

              {/* Reset month filter if active */}
              {selectedMonth !== 'all' && (
                <button
                  onClick={() => setSelectedMonth('all')}
                  className="flex items-center gap-1 text-[11px] bg-linear-to-r from-teal-700 to-cyan-700 hover:from-teal-600 hover:to-cyan-600 text-white px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-xs"
                  title="คลิกเพื่อยกเลิกการกรองเดือน"
                >
                  <span>กรอง: {THAI_MONTHS[selectedMonth - 1]}</span>
                  <span className="text-cyan-200 font-bold ml-1">✕</span>
                </button>
              )}
            </div>
          </div>

          {/* Recharts Container */}
          <div className="mt-4 w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyLineChartData}
                margin={{ top: 20, right: 25, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const m = e.activePayload[0].payload.monthNum;
                    setSelectedMonth((prev) => (prev === m ? 'all' : m));
                  }
                }}
              >
                <defs>
                  <linearGradient id="visitsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e2eceb" vertical={false} />

                <XAxis
                  dataKey="monthName"
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, 'dataMax + 4']}
                />

                <Tooltip content={renderCustomTooltip} />

                {/* Average Reference Line */}
                {lineChartStats.avgVisits > 0 && (
                  <ReferenceLine
                    y={lineChartStats.avgVisits}
                    stroke="#0891b2"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `ค่าเฉลี่ย: ${lineChartStats.avgVisits} ครั้ง`,
                      fill: '#0891b2',
                      fontSize: 11,
                      position: 'top',
                    }}
                  />
                )}

                {/* Shaded Area under the Line */}
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="none"
                  fill="url(#visitsAreaGrad)"
                  legendType="none"
                  tooltipType="none"
                />

                {/* Main Line with Custom Peak & Selected Dots */}
                <Line
                  type="monotone"
                  dataKey="visits"
                  name="จำนวนผู้รับบริการ"
                  stroke="#0891b2"
                  strokeWidth={3}
                  activeDot={{
                    r: 8,
                    fill: '#04282e',
                    stroke: '#38bdf8',
                    strokeWidth: 3,
                  }}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isPeak = payload.visits === lineChartStats.peak.visits && payload.visits > 0;
                    const isSelected = selectedMonth === payload.monthNum;

                    if (isPeak) {
                      return (
                        <g key={`dot-peak-${payload.monthNum}`}>
                          <circle cx={cx} cy={cy} r={6.5} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
                          <circle cx={cx} cy={cy} r={10} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="2 2" />
                        </g>
                      );
                    }

                    if (isSelected) {
                      return (
                        <circle
                          key={`dot-sel-${payload.monthNum}`}
                          cx={cx}
                          cy={cy}
                          r={6.5}
                          fill="#0f766e"
                          stroke="#22d3ee"
                          strokeWidth={2.5}
                        />
                      );
                    }

                    return (
                      <circle
                        key={`dot-${payload.monthNum}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#0d9488"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Month Navigator Pills & Legends */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium mr-1">คลิกเลือกเดือน:</span>
              {monthlyLineChartData.map((m) => {
                const isSelected = selectedMonth === m.monthNum;
                const isPeak = m.visits === lineChartStats.peak.visits && m.visits > 0;
                return (
                  <button
                    key={m.monthNum}
                    onClick={() => setSelectedMonth(isSelected ? 'all' : m.monthNum)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs font-bold'
                        : isPeak
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold hover:bg-amber-200'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70 font-medium'
                    }`}
                    title={`${m.fullMonthName}: ${m.visits} ครั้ง ${isPeak ? '(หนาแน่นสูงสุด)' : ''}`}
                  >
                    {m.monthName}
                    {isPeak && ' ★'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-700 inline-block"></span>
                <span>จำนวนผู้รับบริการ (ครั้ง)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>เดือนหนาแน่นสูงสุด (Peak)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-sky-600 inline-block"></span>
                <span>ค่าเฉลี่ยรายเดือน</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 1: สัดส่วนเพศ (Gender Distribution) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                สัดส่วนผู้รับบริการจำแนกตามเพศ
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              รวม {stats.totalPatients} ราย
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-3">
            {/* Donut Chart SVG */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="16"
                />
                {/* Female Arc (Rose/Purple) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#ec4899"
                  strokeWidth="16"
                  strokeDasharray={`${femalePercent * 2.51} 251`}
                  strokeDashoffset="0"
                  className="transition-all duration-700"
                />
                {/* Male Arc (Blue/Cyan) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#0284c7"
                  strokeWidth="16"
                  strokeDasharray={`${malePercent * 2.51} 251`}
                  strokeDashoffset={`-${femalePercent * 2.51}`}
                  className="transition-all duration-700"
                />
                {/* Other Gender Arc */}
                {otherPercent > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#a855f7"
                    strokeWidth="16"
                    strokeDasharray={`${otherPercent * 2.51} 251`}
                    strokeDashoffset={`-${(femalePercent + malePercent) * 2.51}`}
                    className="transition-all duration-700"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 font-medium">เพศหญิง</span>
                <span className="text-xl font-black text-pink-600">{femalePercent}%</span>
                <span className="text-[10px] text-slate-500">{stats.femaleCount} ราย</span>
              </div>
            </div>

            {/* Breakdown Legend Cards */}
            <div className="space-y-3 w-full sm:w-56">
              {/* Female */}
              <div className="p-3 bg-pink-50/70 border border-pink-200/60 rounded-xl">
                <div className="flex items-center justify-between text-xs font-semibold text-pink-900">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500 inline-block"></span>
                    <span>หญิง (Female)</span>
                  </div>
                  <span>{femalePercent}%</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-slate-600 text-xs">
                  <span>จำนวนผู้ป่วย</span>
                  <span className="font-bold text-pink-700">{stats.femaleCount} ราย</span>
                </div>
              </div>

              {/* Male */}
              <div className="p-3 bg-sky-50/70 border border-sky-200/60 rounded-xl">
                <div className="flex items-center justify-between text-xs font-semibold text-sky-900">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
                    <span>ชาย (Male)</span>
                  </div>
                  <span>{malePercent}%</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-slate-600 text-xs">
                  <span>จำนวนผู้ป่วย</span>
                  <span className="font-bold text-sky-700">{stats.maleCount} ราย</span>
                </div>
              </div>

              {/* Others / Not specified */}
              {stats.otherGenderCount > 0 && (
                <div className="p-2.5 bg-purple-50 border border-purple-200/60 rounded-xl">
                  <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
                      <span>อื่นๆ</span>
                    </div>
                    <span>{stats.otherGenderCount} ราย</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CHART 2: กลุ่มอายุ (Age Distribution) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                การกระจายตัวตามกลุ่มอายุ (Age Groups)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              สัดส่วนประชากร
            </span>
          </div>

          <div className="space-y-3.5 py-1">
            {AGE_GROUP_OPTIONS.map((group) => {
              const count = stats.ageCounts[group] || 0;
              const percent = stats.totalPatients > 0 ? Math.round((count / stats.totalPatients) * 100) : 0;
              
              // Color badges per age group
              let barColor = 'bg-emerald-600';
              if (group === '0-14 ปี') barColor = 'bg-amber-500';
              if (group === '15-24 ปี') barColor = 'bg-teal-500';
              if (group === '25-44 ปี') barColor = 'bg-emerald-600';
              if (group === '45-59 ปี') barColor = 'bg-indigo-600';
              if (group === '60 ปีขึ้นไป') barColor = 'bg-purple-600';

              return (
                <div key={group} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{group}</span>
                      {group === '60 ปีขึ้นไป' && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md font-medium">
                          ผู้สูงอายุ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{count} ราย</span>
                      <span className="font-bold text-slate-800 min-w-[32px] text-right">{percent}%</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-700`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>กลุ่มผู้สูงอายุ (60+) มารับบริการมากที่สุด</span>
            <span className="font-semibold text-purple-700">
              {stats.ageCounts['60 ปีขึ้นไป'] || 0} ราย
            </span>
          </div>
        </div>

        {/* CHART 3: สิทธิการรักษา (Healthcare Rights / Coverage) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                สิทธิการรักษาพยาบาล (Coverage Rights)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              จัดกลุ่มตามสิทธิการรักษาพยาบาล
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COVERAGE_TYPE_OPTIONS.map((cov) => {
              const count = stats.coverageCounts[cov] || 0;
              const percent = stats.totalPatients > 0 ? Math.round((count / stats.totalPatients) * 100) : 0;

              return (
                <div key={cov} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 truncate" title={cov}>{cov}</span>
                      <span className="text-xs font-bold text-emerald-800 ml-1">
                        {percent}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {count.toLocaleString()} ราย
                    </p>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden mt-2.5">
                    <div
                      className="h-full rounded-full bg-emerald-700 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EXECUTIVE SUMMARY: หัตถการยอดนิยมสูงสุด 5 อันดับแรก (Top 5 Procedures) */}
      {/* ======================================================== */}
      <div className="bg-linear-to-br from-[#021f24] via-[#04282e] to-[#02191d] rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-teal-800/50 relative overflow-hidden">
        {/* Ambient cyan glow */}
        <div className="absolute right-0 top-0 w-80 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-teal-800/50 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-lg shadow-inner">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  5 อันดับหัตถการยอดนิยมสูงสุด (Top 5 Procedures)
                </h3>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                  สำหรับหัวหน้ากลุ่มงาน
                </span>
              </div>
              <p className="text-xs text-teal-200/80 font-normal mt-0.5">
                สะท้อนความต้องการการรักษาของผู้รับบริการ เพื่อใช้วางแผนอัตรากำลังและเวชภัณฑ์สมุนไพร
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-medium">
              สัดส่วน Top 5 รวมกัน:{' '}
              <span className="font-bold text-cyan-300">
                {top5Procedures.reduce((sum, p) => sum + p.percent, 0).toFixed(1)}%
              </span>{' '}
              ของผู้รับบริการทั้งหมด
            </span>
          </div>
        </div>

        {/* 5 Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
          {top5Procedures.map((proc) => {
            const isFirst = proc.rank === 1;
            const isSecond = proc.rank === 2;
            const isThird = proc.rank === 3;
            const medal = isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${proc.rank}`;
            const badgeBg = isFirst
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : isSecond
              ? 'bg-slate-300/20 text-slate-200 border-slate-300/40'
              : isThird
              ? 'bg-amber-700/20 text-amber-300 border-amber-700/40'
              : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';

            return (
              <div
                key={proc.name}
                className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                  isFirst
                    ? 'bg-[#06343b]/70 border-amber-400/50 shadow-md ring-1 ring-amber-400/25'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-black border ${badgeBg}`}>
                      {medal} อันดับ {proc.rank}
                    </span>
                    <span className="text-xs font-bold text-cyan-300">
                      {proc.percent}%
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-2 min-h-[32px] leading-tight" title={proc.name}>
                    {proc.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">จำนวนให้บริการ:</span>
                    <span className="font-extrabold text-white">
                      {proc.count.toLocaleString()} <span className="text-[10px] font-normal text-slate-300">ครั้ง</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">มูลค่าบริการ:</span>
                    <span className="font-bold text-amber-300 text-[11px]">
                      {formatCurrency(proc.revenue)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-teal-400 via-cyan-400 to-emerald-400"
                      style={{ width: `${Math.min(100, proc.percent * 1.5)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clinical Demand Insight Bar */}
        <div className="mt-4 pt-3 border-t border-teal-800/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>ข้อสังเกตสำหรับหัวหน้ากลุ่มงาน:</strong> หัตถการกลุ่ม{' '}
              <span className="text-cyan-300 font-bold">{top5Procedures[0]?.name || 'การนวดบำบัด'}</span>{' '}
              มีความต้องการสูงสุดอย่างมีนัยสำคัญ ควรจัดสรรผู้ช่วยแพทย์แผนไทยและหมุนเวียนเวรห้องหัตถการให้สอดคล้องกับช่วง Peak Hours
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenPrintReport}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer ml-auto"
          >
            <span>ดูรายงานไตรมาสฉบับเต็ม</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CHART 5: สถิติแยกตามประเภทหัตถการและกลุ่มโรค (Recharts Bar & Pie) */}
      {/* ======================================================== */}
      <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-5 sm:p-6 shadow-xs border border-teal-100">
        {/* Header with Title and Interactive Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-teal-100/70">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-linear-to-br from-teal-700 via-cyan-700 to-teal-800 text-cyan-200 rounded-xl shadow-xs border border-cyan-400/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  สถิติผู้มารับบริการแยกตามประเภทหัตถการและกลุ่มโรค
                </h3>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200/80 uppercase tracking-wide">
                  Recharts Analytics
                </span>
              </div>
              <p className="text-xs text-teal-800/70 mt-0.5">
                วิเคราะห์ความนิยมของบริการแต่ละประเภทและกลุ่มโรคที่พบบ่อย พร้อมสัดส่วนและมูลค่าบริการ รพ.เขาสมิง
              </p>
            </div>
          </div>

          {/* Controls: Dimension Toggle & Chart Type Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dimension Toggle: Procedure vs Diagnosis */}
            <div className="flex items-center bg-teal-950/5 p-1 rounded-xl text-xs font-semibold border border-teal-100/60">
              <button
                type="button"
                onClick={() => setServiceAnalyticsCategory('procedure')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  serviceAnalyticsCategory === 'procedure'
                    ? 'bg-linear-to-r from-teal-700 to-cyan-700 text-white shadow-xs font-bold ring-1 ring-cyan-400/30'
                    : 'text-teal-900/80 hover:text-cyan-800 hover:bg-teal-100/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-300" />
                <span>ประเภทหัตถการ</span>
              </button>
              <button
                type="button"
                onClick={() => setServiceAnalyticsCategory('diagnosis')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  serviceAnalyticsCategory === 'diagnosis'
                    ? 'bg-linear-to-r from-teal-700 to-cyan-700 text-white shadow-xs font-bold ring-1 ring-cyan-400/30'
                    : 'text-teal-900/80 hover:text-cyan-800 hover:bg-teal-100/50'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-cyan-300" />
                <span>กลุ่มโรค/การวินิจฉัย</span>
              </button>
            </div>

            {/* Chart Type Toggle: Horizontal Bar vs Pie */}
            <div className="flex items-center bg-teal-950/5 p-1 rounded-xl text-xs font-semibold border border-teal-100/60">
              <button
                type="button"
                onClick={() => setServiceAnalyticsChartType('horizontal-bar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  serviceAnalyticsChartType === 'horizontal-bar'
                    ? 'bg-white text-teal-950 shadow-xs font-bold'
                    : 'text-teal-900/80 hover:text-cyan-800'
                }`}
                title="แสดงเป็นกราฟแท่งแนวนอน (Horizontal Bar Chart)"
              >
                <BarChart2 className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">กราฟแท่งแนวนอน</span>
              </button>
              <button
                type="button"
                onClick={() => setServiceAnalyticsChartType('pie')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  serviceAnalyticsChartType === 'pie'
                    ? 'bg-white text-teal-950 shadow-xs font-bold'
                    : 'text-teal-900/80 hover:text-cyan-800'
                }`}
                title="แสดงเป็นกราฟวงกลม/โดนัท (Donut / Pie Chart)"
              >
                <PieIcon className="w-3.5 h-3.5 text-cyan-700" />
                <span className="hidden sm:inline">กราฟวงกลม</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Highlights Podium Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
          {/* Top 1 Popular */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                🥇
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                  ยอดนิยมอันดับ 1
                </span>
                <span className="text-xs font-bold text-slate-900 truncate block" title={topServiceItem?.name || '-'}>
                  {topServiceItem?.shortName || '-'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <span className="text-sm font-extrabold text-amber-900">
                {topServiceItem?.count.toLocaleString() || 0}
              </span>
              <span className="text-[10px] text-amber-700 block">
                {topServiceItem?.percent || 0}%
              </span>
            </div>
          </div>

          {/* Top 2 Popular */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                🥈
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  อันดับ 2
                </span>
                <span className="text-xs font-bold text-slate-900 truncate block" title={activeAnalyticsData[1]?.name || '-'}>
                  {activeAnalyticsData[1]?.shortName || '-'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <span className="text-sm font-extrabold text-slate-800">
                {activeAnalyticsData[1]?.count.toLocaleString() || 0}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {activeAnalyticsData[1]?.percent || 0}%
              </span>
            </div>
          </div>

          {/* Top 3 Popular */}
          <div className="bg-amber-900/5 border border-amber-800/20 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-amber-700/80 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                🥉
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block">
                  อันดับ 3
                </span>
                <span className="text-xs font-bold text-slate-900 truncate block" title={activeAnalyticsData[2]?.name || '-'}>
                  {activeAnalyticsData[2]?.shortName || '-'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <span className="text-sm font-extrabold text-amber-950">
                {activeAnalyticsData[2]?.count.toLocaleString() || 0}
              </span>
              <span className="text-[10px] text-amber-800 block">
                {activeAnalyticsData[2]?.percent || 0}%
              </span>
            </div>
          </div>

          {/* Highest Revenue Service */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Coins className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                  มูลค่าบริการสูงสุด
                </span>
                <span className="text-xs font-bold text-slate-900 truncate block" title={highestRevenueServiceItem?.name || '-'}>
                  {highestRevenueServiceItem?.shortName || '-'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <span className="text-xs font-black text-emerald-800 block">
                {highestRevenueServiceItem ? formatCurrency(highestRevenueServiceItem.revenue) : '0 ฿'}
              </span>
              <span className="text-[10px] text-emerald-600 block">
                {highestRevenueServiceItem?.count || 0} ครั้ง
              </span>
            </div>
          </div>
        </div>

        {/* Main Visual Display: Chart + Breakdown Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-2">
          {/* Chart Column (7 Columns) */}
          <div className="lg:col-span-7 bg-slate-50/60 rounded-2xl p-4 border border-slate-200/60 flex flex-col justify-center">
            {activeAnalyticsData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Layers className="w-8 h-8 text-slate-300 mb-2" />
                <span>ไม่มีข้อมูลบริการในช่วงเวลาที่เลือก</span>
              </div>
            ) : serviceAnalyticsChartType === 'horizontal-bar' ? (
              /* ======================================================== */
              /* RECHARTS: กราฟแท่งแนวนอน (Horizontal Bar Chart)          */
              /* ======================================================== */
              <div>
                <div className="flex items-center justify-between mb-2 px-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    ลำดับความนิยม (แกนตั้ง: บริการ / แกนนอน: จำนวนครั้ง)
                  </span>
                  <span>หน่วย: ครั้งบริการ</span>
                </div>
                <div className="w-full" style={{ height: Math.max(300, activeAnalyticsData.length * 42) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={activeAnalyticsData}
                      margin={{ top: 8, right: 35, left: 10, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="shortName"
                        width={150}
                        tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={renderServiceChartTooltip} />
                      <Bar
                        dataKey="count"
                        radius={[0, 8, 8, 0]}
                        barSize={20}
                        animationDuration={800}
                      >
                        {activeAnalyticsData.map((_, index) => (
                          <Cell
                            key={`bar-cell-${index}`}
                            fill={SERVICE_CHART_COLORS[index % SERVICE_CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* RECHARTS: กราฟวงกลม / โดนัท (Pie / Donut Chart)          */
              /* ======================================================== */
              <div className="relative flex flex-col items-center justify-center">
                <div className="flex items-center justify-between w-full mb-1 px-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    สัดส่วนร้อยละ (Pie / Donut Distribution)
                  </span>
                  <span>เลื่อนเมาส์ชี้เพื่อดูรายละเอียด</span>
                </div>
                <div className="w-full h-[320px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={activeAnalyticsData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={118}
                        paddingAngle={3}
                        animationDuration={800}
                      >
                        {activeAnalyticsData.map((_, index) => (
                          <Cell
                            key={`pie-cell-${index}`}
                            fill={SERVICE_CHART_COLORS[index % SERVICE_CHART_COLORS.length]}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={renderServiceChartTooltip} />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[11px] text-slate-400 font-medium">รวมทั้งหมด</span>
                    <span className="text-2xl font-black text-slate-800">
                      {activeAnalyticsData.reduce((sum, item) => sum + item.count, 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">ครั้งบริการ</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ranking & Detailed Breakdown Column (5 Columns) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
              <span className="font-bold text-slate-700">
                ตารางอันดับความนิยม ({activeAnalyticsData.length} รายการ)
              </span>
              <span className="text-slate-400 text-[11px]">จำนวนครั้ง / ร้อยละ</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {activeAnalyticsData.map((item, idx) => {
                const color = SERVICE_CHART_COLORS[idx % SERVICE_CHART_COLORS.length];
                const isMedal = idx < 3;

                return (
                  <div
                    key={item.name}
                    className="p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 overflow-hidden">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                            idx === 0
                              ? 'bg-amber-500 text-white shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-700/80 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="overflow-hidden">
                          <h4
                            className="text-xs font-semibold text-slate-900 truncate"
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            มูลค่า: {formatCurrency(item.revenue)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-slate-900">
                          {item.count.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">ครั้ง</span>
                        <div
                          className="text-[10px] font-bold"
                          style={{ color: isMedal ? '#059669' : '#64748b' }}
                        >
                          {item.percent}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก รพ.เขาสมิง จ.ตราด
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            คำนวณจากฐานข้อมูลบริการผู้ป่วยจริง {stats.totalPatients.toLocaleString()} ราย
          </span>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
