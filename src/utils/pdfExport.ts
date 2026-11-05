import { jsPDF } from 'jspdf';
import autoTablePlugin, { applyPlugin } from 'jspdf-autotable';
import { ServiceRecord, FinancialRecord, THAI_MONTHS, formatCurrency } from '../types';

// Ensure autoTable plugin is registered on jsPDF instance
try {
  if (typeof applyPlugin === 'function') {
    applyPlugin(jsPDF);
  }
} catch {
  // Ignore if already registered
}

/**
 * Universal autoTable caller that works across Vite ESM, Rollup, and CJS
 */
function autoTable(doc: jsPDF, options: any) {
  if (typeof (doc as any).autoTable === 'function') {
    (doc as any).autoTable(options);
  } else if (typeof autoTablePlugin === 'function') {
    (autoTablePlugin as any)(doc, options);
  } else if (typeof (autoTablePlugin as any)?.default === 'function') {
    (autoTablePlugin as any).default(doc, options);
  } else if (typeof (autoTablePlugin as any)?.autoTable === 'function') {
    (autoTablePlugin as any).autoTable(doc, options);
  } else {
    console.warn('autoTable is not available on doc or module');
  }
}

function getLastY(doc: jsPDF, fallback = 40): number {
  return (doc as any).lastAutoTable?.finalY ?? fallback;
}

export interface ReportSummaryData {
  title: string;
  subTitle: string;
  filterDescription: string;
  generatedDate: string;
  totalPatients: number;
  totalServices: number;
  totalRevenue: number;
  maleCount: number;
  femaleCount: number;
  otherGenderCount: number;
  ageDistribution: { group: string; count: number; percent: number }[];
  coverageDistribution: { name: string; count: number; percent: number }[];
  procedureDistribution: { name: string; count: number; percent: number }[];
  // Financial
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  incomeCategories: { category: string; amount: number }[];
  expenseCategories: { category: string; amount: number }[];
}

/**
 * Generate a PDF document using jsPDF + autoTable
 */
export function generateHospitalPDF(data: ReportSummaryData, filename = 'รายงานสถิติการแพทย์แผนไทย_รพ_เขาสมิง.pdf') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(16);
  doc.text('Khao Saming Hospital - Traditional Thai Medicine Department', 14, 18);
  doc.setFontSize(11);
  doc.text('Statistical & Financial Summary Report', 14, 25);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Criteria: ${data.filterDescription} | Generated: ${data.generatedDate}`, 14, 31);
  doc.setTextColor(0);

  // Overview Table
  autoTable(doc, {
    startY: 36,
    theme: 'grid',
    headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255] },
    head: [['Metric', 'Value', 'Unit']],
    body: [
      ['Total Patient Visits (Total Visits)', data.totalPatients.toLocaleString(), 'visits'],
      ['Total Service Procedures', data.totalServices.toLocaleString(), 'times'],
      ['Total Procedure Fees / Revenue', formatCurrency(data.totalRevenue), 'THB'],
      ['Gender: Male', `${data.maleCount} (${Math.round((data.maleCount / (data.totalPatients || 1)) * 100)}%)`, 'persons'],
      ['Gender: Female', `${data.femaleCount} (${Math.round((data.femaleCount / (data.totalPatients || 1)) * 100)}%)`, 'persons'],
      ['Monthly Total Income', formatCurrency(data.totalIncome), 'THB'],
      ['Monthly Total Expense', formatCurrency(data.totalExpense), 'THB'],
      ['Monthly Net Balance', formatCurrency(data.netBalance), 'THB'],
    ],
  });

  let lastY = getLastY(doc, 40) + 8;

  // Procedure Table
  doc.setFontSize(12);
  doc.text('Procedures Breakdown (Traditional Thai Medicine Services)', 14, lastY);
  autoTable(doc, {
    startY: lastY + 3,
    theme: 'striped',
    headStyles: { fillColor: [4, 120, 87] },
    head: [['Procedure Type', 'Count', 'Ratio (%)']],
    body: data.procedureDistribution.map(p => [p.name, p.count.toLocaleString(), `${p.percent}%`]),
  });

  lastY = getLastY(doc, lastY) + 8;

  // If page space is low, add page
  if (lastY > 230) {
    doc.addPage();
    lastY = 20;
  }

  // Coverage Table
  doc.setFontSize(12);
  doc.text('Healthcare Coverage Rights (Benefit Schemes)', 14, lastY);
  autoTable(doc, {
    startY: lastY + 3,
    theme: 'striped',
    headStyles: { fillColor: [15, 118, 110] },
    head: [['Coverage Scheme', 'Visits', 'Ratio (%)']],
    body: data.coverageDistribution.map(c => [c.name, c.count.toLocaleString(), `${c.percent}%`]),
  });

  lastY = getLastY(doc, lastY) + 8;

  if (lastY > 230) {
    doc.addPage();
    lastY = 20;
  }

  // Age group Table
  doc.setFontSize(12);
  doc.text('Age Group Distribution', 14, lastY);
  autoTable(doc, {
    startY: lastY + 3,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85] },
    head: [['Age Category', 'Visits', 'Ratio (%)']],
    body: data.ageDistribution.map(a => [a.group, a.count.toLocaleString(), `${a.percent}%`]),
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Khao Saming Hospital TTM System | Page ${i} of ${pageCount}`, 14, 287);
  }

  doc.save(filename);
}

export interface QuarterlyReportData {
  fiscalYear: number;
  quarter: 1 | 2 | 3 | 4;
  quarterName: string;
  monthRange: string;
  generatedDate: string;
  totalVisits: number;
  uniquePatients: number;
  newPatients: number;
  returningPatients: number;
  totalRevenue: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  prevQuarterVisits?: number;
  qoqGrowth?: number | null;
  targetVisits?: number;
  targetAchievementRate?: number;
  evaluationGrade?: string;
  topProcedures: { rank: number; name: string; count: number; percent: number; revenue: number }[];
  topDiagnoses: { rank: number; name: string; count: number; percent: number }[];
  coverageBreakdown: { name: string; count: number; percent: number }[];
  quarterComparisons?: { quarter: string; visits: number; revenue: number; uniquePatients: number }[];
  evaluationNotes?: {
    strengths: string;
    challenges: string;
    nextQuarterPlan: string;
  };
}

/**
 * Generate official Quarterly Performance Evaluation PDF Report for the Department Head
 */
export function generateQuarterlyPerformancePDF(
  data: QuarterlyReportData,
  filename?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const finalFilename =
    filename ||
    `รายงานประเมินผลการดำเนินงาน_ไตรมาส${data.quarter}_ปีงบประมาณ${data.fiscalYear}_รพ_เขาสมิง.pdf`;

  // Header Title
  doc.setFontSize(15);
  doc.setTextColor(6, 78, 59); // Emerald-900
  doc.text('Khao Saming Hospital - Traditional Thai Medicine Department', 14, 18);
  
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(
    `Quarterly Performance Evaluation Report - Fiscal Year B.E. ${data.fiscalYear}`,
    14,
    25
  );

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text(
    `Period: ${data.quarterName} (${data.monthRange}) | Issued Date: ${data.generatedDate}`,
    14,
    31
  );

  // Section 1: Executive KPI Summary Table
  autoTable(doc, {
    startY: 36,
    theme: 'grid',
    headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255] },
    head: [['Performance Indicator / Key Metric', 'Result', 'Standard / Benchmark']],
    body: [
      [
        'Total Outpatient Visits in Quarter',
        `${data.totalVisits.toLocaleString()} visits`,
        data.targetVisits ? `Target: ${data.targetVisits.toLocaleString()} visits (${data.targetAchievementRate || 100}%)` : 'Target: Met standard',
      ],
      [
        'Quarter-over-Quarter Growth (QoQ)',
        data.qoqGrowth !== null && data.qoqGrowth !== undefined
          ? `${data.qoqGrowth >= 0 ? '+' : ''}${data.qoqGrowth}% from prior quarter`
          : 'Baseline quarter',
        'Hospital performance threshold',
      ],
      [
        'Unique Patients (HN)',
        `${data.uniquePatients.toLocaleString()} persons`,
        `New: ${data.newPatients} (${data.uniquePatients ? Math.round((data.newPatients / data.uniquePatients) * 100) : 0}%) | Follow-up: ${data.returningPatients}`,
      ],
      [
        'Total Procedure Value / Service Volume',
        formatCurrency(data.totalRevenue),
        'Traditional Thai Medicine Services',
      ],
      [
        'Department Revenue (Hospital Fund Income)',
        formatCurrency(data.totalIncome),
        'Hospital Health Center Financial Fund',
      ],
      [
        'Department Operating Expenses',
        formatCurrency(data.totalExpense),
        'Herbal drugs, materials & remuneration',
      ],
      [
        'Net Operating Balance (Quarter Margin)',
        formatCurrency(data.netBalance),
        data.netBalance >= 0 ? 'Surplus (+)' : 'Deficit (-)',
      ],
      [
        'Executive Performance Assessment Grade',
        data.evaluationGrade || 'Grade A - Excellent (ผลการดำเนินงานดีเยี่ยม)',
        'MOPH Department Performance Standard',
      ],
    ],
  });

  let lastY = getLastY(doc, 40) + 8;

  // Section 2: Top 5 Procedures Table
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('Top 5 Traditional Thai Medicine Procedures in Quarter', 14, lastY);

  autoTable(doc, {
    startY: lastY + 3,
    theme: 'striped',
    headStyles: { fillColor: [4, 120, 87] },
    head: [['Rank', 'Procedure Name', 'Visits', 'Share (%)', 'Total Value']],
    body: data.topProcedures.slice(0, 5).map((p) => [
      `#${p.rank}`,
      p.name,
      p.count.toLocaleString(),
      `${p.percent}%`,
      formatCurrency(p.revenue),
    ]),
  });

  lastY = getLastY(doc, lastY) + 8;

  // Section 3: Top Clinical Diagnoses
  if (data.topDiagnoses && data.topDiagnoses.length > 0) {
    if (lastY > 220) {
      doc.addPage();
      lastY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(6, 78, 59);
    doc.text('Top 5 Clinical Diagnoses / Health Conditions Treated', 14, lastY);

    autoTable(doc, {
      startY: lastY + 3,
      theme: 'striped',
      headStyles: { fillColor: [15, 118, 110] },
      head: [['Rank', 'Diagnosis / Disease Category', 'Cases', 'Share (%)']],
      body: data.topDiagnoses.slice(0, 5).map((d) => [
        `#${d.rank}`,
        d.name,
        d.count.toLocaleString(),
        `${d.percent}%`,
      ]),
    });

    lastY = getLastY(doc, lastY) + 8;
  }

  // Section 4: 4 Quarters Comparison if available
  if (data.quarterComparisons && data.quarterComparisons.length > 0) {
    if (lastY > 215) {
      doc.addPage();
      lastY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(6, 78, 59);
    doc.text(`Fiscal Year B.E. ${data.fiscalYear} Four-Quarter Progress Comparison`, 14, lastY);

    autoTable(doc, {
      startY: lastY + 3,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] },
      head: [['Fiscal Quarter', 'Service Visits', 'Unique Patients', 'Procedure Value']],
      body: data.quarterComparisons.map((qc) => [
        qc.quarter,
        `${qc.visits.toLocaleString()} visits`,
        `${qc.uniquePatients.toLocaleString()} persons`,
        formatCurrency(qc.revenue),
      ]),
    });

    lastY = getLastY(doc, lastY) + 8;
  }

  // Section 5: Evaluation Remarks
  if (lastY > 210) {
    doc.addPage();
    lastY = 20;
  }

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Executive Evaluation Notes by Department Head:', 14, lastY);

  const notesY = lastY + 5;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const strengths = data.evaluationNotes?.strengths || 'ผลการดำเนินงานเป็นไปตามเกณฑ์มาตรฐาน การให้บริการสม่ำเสมอและมีความพึงพอใจสูง';
  const challenges = data.evaluationNotes?.challenges || 'การพัฒนาทักษะเฉพาะด้านและการประชาสัมพันธ์คลินิกเฉพาะโรคในชุมชน';
  const plan = data.evaluationNotes?.nextQuarterPlan || 'ขยายบริการคลินิกฟื้นฟูมารดาหลังคลอดและเชิงรุกในกลุ่มผู้สูงอายุโรคข้อเข่าเสื่อม';

  doc.text(`1. ผลสัมฤทธิ์และจุดเด่น (Key Strengths): ${strengths.slice(0, 95)}`, 14, notesY);
  doc.text(`2. ปัญหาและอุปสรรค (Challenges): ${challenges.slice(0, 95)}`, 14, notesY + 5);
  doc.text(`3. แผนการดำเนินงานไตรมาสถัดไป (Action Plan): ${plan.slice(0, 95)}`, 14, notesY + 10);

  // Official Endorsement Signatures
  const signY = notesY + 22;
  if (signY < 270) {
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('ลงชื่อ ..............................................................', 25, signY);
    doc.text('( ผู้รายงาน / เจ้าหน้าที่ข้อมูล )', 28, signY + 5);
    doc.text('พท.ว. กลุ่มงานการแพทย์แผนไทย', 27, signY + 9);

    doc.text('ลงชื่อ ..............................................................', 115, signY);
    doc.text('( หัวหน้ากลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก )', 105, signY + 5);
    doc.text('โรงพยาบาลเขาสมิง จังหวัดตราด', 125, signY + 9);
  }

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Khao Saming Hospital TTM Quarterly Performance Report | Page ${i} of ${pageCount}`, 14, 287);
  }

  doc.save(finalFilename);
}
