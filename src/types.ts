export type Gender = 'ชาย' | 'หญิง' | 'อื่นๆ';

export type AgeGroup = '0-14 ปี' | '15-24 ปี' | '25-44 ปี' | '45-59 ปี' | '60 ปีขึ้นไป';

export const GENDER_OPTIONS: Gender[] = ['ชาย', 'หญิง', 'อื่นๆ'];

export const AGE_GROUP_OPTIONS: AgeGroup[] = [
  '0-14 ปี',
  '15-24 ปี',
  '25-44 ปี',
  '45-59 ปี',
  '60 ปีขึ้นไป',
];

export const COVERAGE_TYPE_OPTIONS = [
  'บัตรทอง (UC)',
  'ข้าราชการ/เบิกตรง',
  'ประกันสังคม',
  'ชำระเงินเอง',
  'แรงงานต่างด้าว',
  'อื่นๆ',
] as const;

export type CoverageType = typeof COVERAGE_TYPE_OPTIONS[number];

export const PROCEDURE_TYPE_OPTIONS = [
  'นวดไทยเพื่อการบำบัดรักษา',
  'นวดไทยเพื่อส่งเสริมสุขภาพ/ผ่อนคลาย',
  'ประคบสมุนไพร',
  'อบไอน้ำสมุนไพร',
  'การดูแลฟื้นฟูมารดาหลังคลอด/ทับหม้อเกลือ',
  'การพอกยา/เผายาสมุนไพร',
  'การตรวจวินิจฉัยและจ่ายยาสมุนไพร',
  'บริการคลินิกเฉพาะโรค (อัมพฤกษ์/ไมเกรน/ข้อเข่าเสื่อม)',
] as const;

export type ProcedureType = typeof PROCEDURE_TYPE_OPTIONS[number];

export interface ServiceRecord {
  id: string;
  hn: string;
  patientName: string;
  gender: Gender;
  age: number;
  ageGroup: AgeGroup;
  serviceDate: string; // YYYY-MM-DD
  year: number; // CE (e.g. 2026)
  month: number; // 1-12
  fiscalYear: number; // BE Fiscal Year
  coverageType: CoverageType;
  procedureType: ProcedureType;
  diagnosis?: string;
  practitionerName?: string;
  fee?: number;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export const INCOME_CATEGORIES = [
  'ค่าบริการหัตถการ/นวดประคบ',
  'ค่าจำหน่ายยาสมุนไพรและผลิตภัณฑ์',
  'เงินจัดสรรจากกองทุน/สปสช./รพ.',
  'เงินบริจาค/เงินสนับสนุน',
  'รายรับอื่นๆ',
] as const;

export const EXPENSE_CATEGORIES = [
  'จัดซื้อสมุนไพร/วัตถุดิบและลูกประคบ',
  'จัดซื้อเวชภัณฑ์/ยา/น้ำมันนวด',
  'ค่าตอบแทนบุคลากร/ผู้ช่วยแพทย์แผนไทย',
  'ค่าบำรุงรักษาอุปกรณ์/ตู้อบ/หม้อต้ม',
  'ค่าสาธารณูปโภค/ซักรีดผ้า',
  'ค่าใช้จ่ายดำเนินงานอื่นๆ',
] as const;

export type TransactionType = 'income' | 'expense';

export interface FinancialRecord {
  id: string;
  date: string; // YYYY-MM-DD
  year: number;
  month: number; // 1-12
  type: TransactionType;
  category: string;
  title: string;
  amount: number;
  referenceNo?: string;
  payerPayee?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 14) return '0-14 ปี';
  if (age <= 24) return '15-24 ปี';
  if (age <= 44) return '25-44 ปี';
  if (age <= 59) return '45-59 ปี';
  return '60 ปีขึ้นไป';
}

export function calculateFiscalYear(dateStr: string): number {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  // Thai Fiscal Year: Oct (month 10) to Sep belongs to the next BE year
  const beYear = year + 543;
  return month >= 10 ? beYear + 1 : beYear;
}

export type FiscalQuarter = 1 | 2 | 3 | 4;

export interface FiscalQuarterInfo {
  quarter: FiscalQuarter;
  name: string;
  label: string;
  shortLabel: string;
  months: number[];
  monthRangeLabel: string;
  fullPeriod: string;
}

export const FISCAL_QUARTERS: Record<FiscalQuarter, FiscalQuarterInfo> = {
  1: {
    quarter: 1,
    name: 'ไตรมาสที่ 1',
    label: 'ไตรมาส 1 (ต.ค. - ธ.ค.)',
    shortLabel: 'Q1',
    months: [10, 11, 12],
    monthRangeLabel: 'ต.ค. - ธ.ค.',
    fullPeriod: 'ตุลาคม - ธันวาคม',
  },
  2: {
    quarter: 2,
    name: 'ไตรมาสที่ 2',
    label: 'ไตรมาส 2 (ม.ค. - มี.ค.)',
    shortLabel: 'Q2',
    months: [1, 2, 3],
    monthRangeLabel: 'ม.ค. - มี.ค.',
    fullPeriod: 'มกราคม - มีนาคม',
  },
  3: {
    quarter: 3,
    name: 'ไตรมาสที่ 3',
    label: 'ไตรมาส 3 (เม.ย. - มิ.ย.)',
    shortLabel: 'Q3',
    months: [4, 5, 6],
    monthRangeLabel: 'เม.ย. - มิ.ย.',
    fullPeriod: 'เมษายน - มิถุนายน',
  },
  4: {
    quarter: 4,
    name: 'ไตรมาสที่ 4',
    label: 'ไตรมาส 4 (ก.ค. - ก.ย.)',
    shortLabel: 'Q4',
    months: [7, 8, 9],
    monthRangeLabel: 'ก.ค. - ก.ย.',
    fullPeriod: 'กรกฎาคม - กันยายน',
  },
};

export function getFiscalQuarter(month: number): FiscalQuarter {
  if (month >= 10 && month <= 12) return 1;
  if (month >= 1 && month <= 3) return 2;
  if (month >= 4 && month <= 6) return 3;
  return 4;
}

export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  const yearNum = parseInt(y, 10);
  const monthNum = parseInt(m, 10);
  const dayNum = parseInt(d, 10);
  if (!yearNum || !monthNum || !dayNum) return dateStr;
  return `${dayNum} ${THAI_MONTHS_SHORT[monthNum - 1]} ${yearNum + 543}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('THB', '฿');
}

export const CLINIC_EVENT_CATEGORIES = [
  'คลินิกเฉพาะโรค',
  'คลินิกมารดาหลังคลอด',
  'หน่วยแพทย์เคลื่อนที่/ชุมชน',
  'อบรม/ประชุมเชิงปฏิบัติการ',
  'วันสมุนไพร/กิจกรรมพิเศษ',
  'อื่นๆ',
] as const;

export type ClinicEventCategory = typeof CLINIC_EVENT_CATEGORIES[number];

export interface ClinicEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: ClinicEventCategory;
  startTime?: string; // e.g. "08:30"
  endTime?: string; // e.g. "12:00"
  location?: string; // e.g. "ห้องตรวจแพทย์แผนไทย รพ.เขาสมิง"
  practitioner?: string; // e.g. "พท.ว. อนุสรณ์ พึ่งพา"
  targetPatients?: number;
  notes?: string;
  color?: string; // emerald | sky | amber | violet | rose | indigo
  createdBy?: string;
  createdAt?: string;
}

export const EVENT_CATEGORY_COLORS: Record<ClinicEventCategory, { bg: string; text: string; border: string; dot: string }> = {
  'คลินิกเฉพาะโรค': {
    bg: 'bg-emerald-50 text-emerald-800',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
  'คลินิกมารดาหลังคลอด': {
    bg: 'bg-rose-50 text-rose-800',
    text: 'text-rose-700',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
  },
  'หน่วยแพทย์เคลื่อนที่/ชุมชน': {
    bg: 'bg-sky-50 text-sky-800',
    text: 'text-sky-700',
    border: 'border-sky-300',
    dot: 'bg-sky-500',
  },
  'อบรม/ประชุมเชิงปฏิบัติการ': {
    bg: 'bg-violet-50 text-violet-800',
    text: 'text-violet-700',
    border: 'border-violet-300',
    dot: 'bg-violet-500',
  },
  'วันสมุนไพร/กิจกรรมพิเศษ': {
    bg: 'bg-amber-50 text-amber-800',
    text: 'text-amber-700',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  'อื่นๆ': {
    bg: 'bg-slate-100 text-slate-800',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },
};

