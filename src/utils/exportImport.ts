import * as XLSX from 'xlsx';
import {
  ServiceRecord,
  FinancialRecord,
  getAgeGroup,
  calculateFiscalYear,
  CoverageType,
  ProcedureType,
  Gender,
  THAI_MONTHS,
} from '../types';

/**
 * Clean & match column headers flexibly
 */
function normalizeHeader(key: string): string {
  return key.toLowerCase().replace(/[\s\-_()\/]/g, '').trim();
}

/**
 * Export clinical service records to Excel
 */
export function exportServicesToExcel(records: ServiceRecord[], filename = 'รายงานบริการการแพทย์แผนไทย_รพ_เขาสมิง.xlsx') {
  const data = records.map((r, idx) => ({
    'ลำดับ': idx + 1,
    'HN': r.hn,
    'ชื่อ-สกุล ผู้ป่วย': r.patientName,
    'เพศ': r.gender,
    'อายุ (ปี)': r.age,
    'กลุ่มอายุ': r.ageGroup,
    'วันที่รับบริการ': r.serviceDate,
    'ปี พ.ศ.': r.year + 543,
    'เดือน': THAI_MONTHS[r.month - 1] || r.month,
    'ปีงบประมาณ (พ.ศ.)': r.fiscalYear,
    'สิทธิการรักษา': r.coverageType,
    'ประเภทหัตถการ': r.procedureType,
    'การวินิจฉัย/อาการ': r.diagnosis || '-',
    'ผู้ให้บริการ': r.practitionerName || '-',
    'ค่าบริการ (บาท)': r.fee ?? 0,
    'หมายเหตุ': r.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Auto column widths
  const colWidths = [
    { wch: 8 },  // ลำดับ
    { wch: 12 }, // HN
    { wch: 25 }, // ชื่อ-สกุล
    { wch: 8 },  // เพศ
    { wch: 10 }, // อายุ
    { wch: 14 }, // กลุ่มอายุ
    { wch: 14 }, // วันที่
    { wch: 10 }, // ปี
    { wch: 14 }, // เดือน
    { wch: 16 }, // ปีงบประมาณ
    { wch: 20 }, // สิทธิ
    { wch: 35 }, // หัตถการ
    { wch: 35 }, // วินิจฉัย
    { wch: 22 }, // ผู้ให้บริการ
    { wch: 15 }, // ค่าบริการ
    { wch: 25 }, // หมายเหตุ
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ข้อมูลบริการแพทย์แผนไทย');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export financial records to Excel
 */
export function exportFinancesToExcel(records: FinancialRecord[], filename = 'รายงานรายรับรายจ่าย_แพทย์แผนไทย_รพ_เขาสมิง.xlsx') {
  const data = records.map((r, idx) => ({
    'ลำดับ': idx + 1,
    'วันที่': r.date,
    'ปี พ.ศ.': r.year + 543,
    'เดือน': THAI_MONTHS[r.month - 1] || r.month,
    'ประเภท': r.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    'หมวดหมู่': r.category,
    'รายการ': r.title,
    'จำนวนเงิน (บาท)': r.amount,
    'เลขที่เอกสาร/ใบเสร็จ': r.referenceNo || '-',
    'ผู้ชำระ/ผู้รับเงิน': r.payerPayee || '-',
    'หมายเหตุ': r.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 14 }, // วันที่
    { wch: 10 }, // ปี
    { wch: 14 }, // เดือน
    { wch: 10 }, // ประเภท
    { wch: 30 }, // หมวดหมู่
    { wch: 35 }, // รายการ
    { wch: 16 }, // จำนวนเงิน
    { wch: 20 }, // เลขที่เอกสาร
    { wch: 25 }, // ผู้ชำระ/รับ
    { wch: 25 }, // หมายเหตุ
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายรับ-รายจ่าย');
  XLSX.writeFile(workbook, filename);
}

/**
 * Download blank Excel Template for clinical services
 */
export function downloadServiceTemplate() {
  const sample = [
    {
      'HN': '6700142',
      'ชื่อ-สกุล': 'นางสมพร สุขเกษม',
      'เพศ (ชาย/หญิง)': 'หญิง',
      'อายุ': 58,
      'วันที่รับบริการ (YYYY-MM-DD)': '2026-03-01',
      'สิทธิการรักษา': 'บัตรทอง (UC)',
      'ประเภทหัตถการ': 'นวดไทยเพื่อการบำบัดรักษา',
      'การวินิจฉัย': 'โรคลมปลายปัตฆาตสะบักจม / ปวดกล้ามเนื้อเรื้อรัง',
      'ผู้ให้บริการ': 'พท.ว. นภาพร จิตมั่นคง',
      'ค่าบริการ': 250,
      'หมายเหตุ': 'นวดกดจุดสัญญาณบ่าสะบัก',
    },
    {
      'HN': '6700289',
      'ชื่อ-สกุล': 'นายวิชัย รุ่งอรุณ',
      'เพศ (ชาย/หญิง)': 'ชาย',
      'อายุ': 64,
      'วันที่รับบริการ (YYYY-MM-DD)': '2026-03-02',
      'สิทธิการรักษา': 'ข้าราชการ/เบิกตรง',
      'ประเภทหัตถการ': 'ประคบสมุนไพร',
      'การวินิจฉัย': 'โรคลมจับโปงแห้งเข่า',
      'ผู้ให้บริการ': 'พท.ว. อนุสรณ์ พึ่งพา',
      'ค่าบริการ': 300,
      'หมายเหตุ': 'พอกยาเข่าและประคบสมุนไพรสด',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 10 },
    { wch: 25 },
    { wch: 20 },
    { wch: 30 },
    { wch: 35 },
    { wch: 22 },
    { wch: 12 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_นำเข้าข้อมูลบริการ');
  XLSX.writeFile(wb, 'ตัวอย่างไฟล์นำเข้า_บริการแพทย์แผนไทย_รพ_เขาสมิง.xlsx');
}

/**
 * Download blank Excel Template for finances
 */
export function downloadFinancialTemplate() {
  const sample = [
    {
      'วันที่ (YYYY-MM-DD)': '2026-03-01',
      'ประเภท (รายรับ/รายจ่าย)': 'รายรับ',
      'หมวดหมู่': 'เงินจัดสรรจากกองทุน/สปสช./รพ.',
      'รายการ': 'เงินจัดสรรงบกองทุนแพทย์แผนไทย มี.ค.',
      'จำนวนเงิน': 85000,
      'เลขที่เอกสาร': 'MOPH-KS-260301',
      'ผู้ชำระหรือผู้รับเงิน': 'สปสช.',
      'หมายเหตุ': 'งบจัดสรรประจำงวด',
    },
    {
      'วันที่ (YYYY-MM-DD)': '2026-03-03',
      'ประเภท (รายรับ/รายจ่าย)': 'รายจ่าย',
      'หมวดหมู่': 'จัดซื้อสมุนไพร/วัตถุดิบและลูกประคบ',
      'รายการ': 'จัดซื้อสมุนไพรสดและลูกประคบจากวิสาหกิจชุมชน',
      'จำนวนเงิน': 12800,
      'เลขที่เอกสาร': 'VOUCH-2603-01',
      'ผู้ชำระหรือผู้รับเงิน': 'วิสาหกิจชุมชนสมุนไพรเขาสมิง',
      'หมายเหตุ': 'ลูกประคบ 100 ลูก',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 22 },
    { wch: 30 },
    { wch: 35 },
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_นำเข้ารายรับรายจ่าย');
  XLSX.writeFile(wb, 'ตัวอย่างไฟล์นำเข้า_รายรับรายจ่าย_แพทย์แผนไทย_รพ_เขาสมิง.xlsx');
}

/**
 * Parse Excel or CSV file into clinical service records
 */
export async function importServicesFile(file: File): Promise<Omit<ServiceRecord, 'id'>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('ไม่พบข้อมูลในไฟล์ที่เลือก กรุณาตรวจสอบไฟล์');
  }

  const results: Omit<ServiceRecord, 'id'>[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const normalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = val;
    }

    // Fuzzy lookups
    const hn = String(
      normalized['hn'] ||
      normalized['เลขประจำตัว'] ||
      normalized['รหัสผู้ป่วย'] ||
      normalized['hospitalnumber'] ||
      `KS-${1000 + i}`
    ).trim();

    const patientName = String(
      normalized['ชื่อสกุล'] ||
      normalized['ชื่อสกุลผู้ป่วย'] ||
      normalized['ชื่อ'] ||
      normalized['patientname'] ||
      normalized['name'] ||
      ''
    ).trim();

    if (!patientName && !normalized['hn']) {
      // Empty row, skip
      continue;
    }

    const rawGender = String(normalized['เพศ'] || normalized['เพศชายหญิง'] || normalized['gender'] || '').trim();
    let gender: Gender = 'หญิง';
    if (rawGender.includes('ชาย') || rawGender.toLowerCase() === 'm' || rawGender.toLowerCase() === 'male') {
      gender = 'ชาย';
    } else if (rawGender.includes('หญิง') || rawGender.toLowerCase() === 'f' || rawGender.toLowerCase() === 'female') {
      gender = 'หญิง';
    } else if (rawGender) {
      gender = 'อื่นๆ';
    }

    let age = parseInt(String(normalized['อายุ'] || normalized['อายุปี'] || normalized['age'] || '45'), 10);
    if (isNaN(age) || age < 0) age = 45;

    // Date
    let serviceDate = String(
      normalized['วันที่รับบริการ'] ||
      normalized['วันที่รับบริการyyyymmdd'] ||
      normalized['วันที่'] ||
      normalized['servicedate'] ||
      normalized['date'] ||
      ''
    ).trim();

    if (!serviceDate || !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
      // Fallback or Excel serial date
      if (typeof serviceDate === 'number' || !isNaN(Number(serviceDate))) {
        try {
          const dateObj = new Date(Math.round((Number(serviceDate) - 25569) * 86400 * 1000));
          serviceDate = dateObj.toISOString().slice(0, 10);
        } catch {
          serviceDate = new Date().toISOString().slice(0, 10);
        }
      } else {
        serviceDate = new Date().toISOString().slice(0, 10);
      }
    }

    const dateParts = serviceDate.split('-');
    const year = parseInt(dateParts[0], 10) || 2026;
    const month = parseInt(dateParts[1], 10) || 1;

    // Coverage
    const rawCoverage = String(
      normalized['สิทธิการรักษา'] ||
      normalized['สิทธิ'] ||
      normalized['สิทธิ์'] ||
      normalized['coverage'] ||
      normalized['coveragetype'] ||
      'บัตรทอง (UC)'
    ).trim();

    let coverageType: CoverageType = 'บัตรทอง (UC)';
    if (rawCoverage.includes('ข้าราชการ') || rawCoverage.includes('เบิกตรง') || rawCoverage.includes('csmbs')) {
      coverageType = 'ข้าราชการ/เบิกตรง';
    } else if (rawCoverage.includes('ประกันสังคม') || rawCoverage.includes('sss')) {
      coverageType = 'ประกันสังคม';
    } else if (rawCoverage.includes('จ่ายเอง') || rawCoverage.includes('ชำระเงินเอง') || rawCoverage.includes('self')) {
      coverageType = 'ชำระเงินเอง';
    } else if (rawCoverage.includes('ต่างด้าว')) {
      coverageType = 'แรงงานต่างด้าว';
    } else if (rawCoverage.includes('บัตรทอง') || rawCoverage.includes('uc') || rawCoverage.includes('30')) {
      coverageType = 'บัตรทอง (UC)';
    } else {
      coverageType = 'อื่นๆ';
    }

    // Procedure
    const rawProc = String(
      normalized['ประเภทหัตถการ'] ||
      normalized['หัตถการ'] ||
      normalized['procedure'] ||
      normalized['proceduretype'] ||
      'นวดไทยเพื่อการบำบัดรักษา'
    ).trim();

    let procedureType: ProcedureType = 'นวดไทยเพื่อการบำบัดรักษา';
    if (rawProc.includes('ส่งเสริม') || rawProc.includes('ผ่อนคลาย')) {
      procedureType = 'นวดไทยเพื่อส่งเสริมสุขภาพ/ผ่อนคลาย';
    } else if (rawProc.includes('ประคบ')) {
      procedureType = 'ประคบสมุนไพร';
    } else if (rawProc.includes('อบ') || rawProc.includes('ไอน้ำ') || rawProc.includes('กระโจม')) {
      procedureType = 'อบไอน้ำสมุนไพร';
    } else if (rawProc.includes('มารดา') || rawProc.includes('หลังคลอด') || rawProc.includes('หม้อเกลือ')) {
      procedureType = 'การดูแลฟื้นฟูมารดาหลังคลอด/ทับหม้อเกลือ';
    } else if (rawProc.includes('พอก') || rawProc.includes('เผายา')) {
      procedureType = 'การพอกยา/เผายาสมุนไพร';
    } else if (rawProc.includes('จ่ายยา') || rawProc.includes('ตรวจวินิจฉัย')) {
      procedureType = 'การตรวจวินิจฉัยและจ่ายยาสมุนไพร';
    } else if (rawProc.includes('คลินิกเฉพาะโรค') || rawProc.includes('อัมพฤกษ์') || rawProc.includes('ไมเกรน') || rawProc.includes('เข่า')) {
      procedureType = 'บริการคลินิกเฉพาะโรค (อัมพฤกษ์/ไมเกรน/ข้อเข่าเสื่อม)';
    }

    const diagnosis = String(
      normalized['การวินิจฉัย'] ||
      normalized['การวินิจฉัยอาการ'] ||
      normalized['diagnosis'] ||
      normalized['โรค'] ||
      ''
    ).trim();

    const practitionerName = String(
      normalized['ผู้ให้บริการ'] ||
      normalized['แพทย์แผนไทย'] ||
      normalized['practitioner'] ||
      normalized['practitionername'] ||
      'พท.ว. กลุ่มงานแพทย์แผนไทย รพ.เขาสมิง'
    ).trim();

    let fee = parseFloat(String(normalized['ค่าบริการ'] || normalized['ค่าบริการบาท'] || normalized['fee'] || normalized['ราคา'] || '0'));
    if (isNaN(fee)) fee = 0;

    const notes = String(normalized['หมายเหตุ'] || normalized['notes'] || '').trim();

    results.push({
      hn: hn || `KS-${6700000 + i}`,
      patientName: patientName || `ผู้รับบริการ ${i + 1}`,
      gender,
      age,
      ageGroup: getAgeGroup(age),
      serviceDate,
      year,
      month,
      fiscalYear: calculateFiscalYear(serviceDate),
      coverageType,
      procedureType,
      diagnosis: diagnosis || 'อาการปวดเมื่อยกล้ามเนื้อทั่วไป',
      practitionerName,
      fee,
      notes,
    });
  }

  return results;
}

/**
 * Parse Excel or CSV file into financial records
 */
export async function importFinancesFile(file: File): Promise<Omit<FinancialRecord, 'id'>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('ไม่พบข้อมูลในไฟล์ที่เลือก กรุณาตรวจสอบไฟล์');
  }

  const results: Omit<FinancialRecord, 'id'>[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const normalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = val;
    }

    let date = String(
      normalized['วันที่yyyymmdd'] ||
      normalized['วันที่'] ||
      normalized['date'] ||
      ''
    ).trim();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      if (typeof date === 'number' || !isNaN(Number(date))) {
        try {
          const dateObj = new Date(Math.round((Number(date) - 25569) * 86400 * 1000));
          date = dateObj.toISOString().slice(0, 10);
        } catch {
          date = new Date().toISOString().slice(0, 10);
        }
      } else {
        date = new Date().toISOString().slice(0, 10);
      }
    }

    const dateParts = date.split('-');
    const year = parseInt(dateParts[0], 10) || 2026;
    const month = parseInt(dateParts[1], 10) || 1;

    const rawType = String(
      normalized['ประเภทรายรับรายจ่าย'] ||
      normalized['ประเภท'] ||
      normalized['type'] ||
      'รายรับ'
    ).trim();

    const isExpense = rawType.includes('จ่าย') || rawType.toLowerCase() === 'expense';
    const type = isExpense ? 'expense' : 'income';

    const category = String(
      normalized['หมวดหมู่'] ||
      normalized['หมวด'] ||
      normalized['category'] ||
      (type === 'income' ? 'ค่าบริการหัตถการ/นวดประคบ' : 'จัดซื้อสมุนไพร/วัตถุดิบและลูกประคบ')
    ).trim();

    const title = String(
      normalized['รายการ'] ||
      normalized['ชื่อรายการ'] ||
      normalized['title'] ||
      normalized['รายละเอียด'] ||
      (type === 'income' ? 'รับเงินค่าบริการแพทย์แผนไทย' : 'เบิกจ่ายค่าดำเนินงาน')
    ).trim();

    let amount = parseFloat(String(normalized['จำนวนเงิน'] || normalized['จำนวนเงินบาท'] || normalized['amount'] || normalized['ยอดเงิน'] || '0'));
    if (isNaN(amount) || amount < 0) amount = 0;

    const referenceNo = String(normalized['เลขที่เอกสาร'] || normalized['เลขที่เอกสารใบเสร็จ'] || normalized['referenceno'] || normalized['ref'] || '').trim();
    const payerPayee = String(normalized['ผู้ชำระหรือผู้รับเงิน'] || normalized['ผู้ชำระผู้รับเงิน'] || normalized['payerpayee'] || '').trim();
    const notes = String(normalized['หมายเหตุ'] || normalized['notes'] || '').trim();

    results.push({
      date,
      year,
      month,
      type,
      category,
      title,
      amount,
      referenceNo,
      payerPayee,
      notes,
    });
  }

  return results;
}
