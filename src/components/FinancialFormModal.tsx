import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, DollarSign, Calendar, Tag, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  FinancialRecord,
  TransactionType,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../types';
import { useData } from '../context/DataContext';

interface FinancialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: FinancialRecord | null;
}

export const FinancialFormModal: React.FC<FinancialFormModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
}) => {
  const { addFinancialRecord, updateFinancialRecord } = useData();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [referenceNo, setReferenceNo] = useState('');
  const [payerPayee, setPayerPayee] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (recordToEdit) {
      setDate(recordToEdit.date);
      setType(recordToEdit.type);
      setCategory(recordToEdit.category);
      setTitle(recordToEdit.title);
      setAmount(recordToEdit.amount);
      setReferenceNo(recordToEdit.referenceNo || '');
      setPayerPayee(recordToEdit.payerPayee || '');
      setNotes(recordToEdit.notes || '');
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setType('income');
      setCategory(INCOME_CATEGORIES[0]);
      setTitle('');
      setAmount(1000);
      setReferenceNo('');
      setPayerPayee('');
      setNotes('');
    }
    setErrorMsg('');
  }, [recordToEdit, isOpen]);

  // Adjust categories when switching between income and expense
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('กรุณาระบุชื่อรายการ');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('จำนวนเงินต้องมากกว่า 0 บาท');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const parts = date.split('-');
      const year = parseInt(parts[0], 10) || 2026;
      const month = parseInt(parts[1], 10) || 1;

      const payload: Omit<FinancialRecord, 'id'> = {
        date,
        year,
        month,
        type,
        category,
        title: title.trim(),
        amount: Number(amount) || 0,
        referenceNo: referenceNo.trim(),
        payerPayee: payerPayee.trim(),
        notes: notes.trim(),
      };

      if (recordToEdit) {
        await updateFinancialRecord(recordToEdit.id, payload);
      } else {
        await addFinancialRecord(payload);
      }

      setSaving(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกรายการบัญชี');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-linear-to-r from-teal-900 via-teal-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-700/80 rounded-xl text-teal-200">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {recordToEdit ? 'แก้ไขรายการบัญชี' : 'บันทึกรายการรายรับ-รายจ่าย'}
              </h3>
              <p className="text-xs text-teal-200/90 font-light">
                กลุ่มงานการแพทย์แผนไทย โรงพยาบาลเขาสมิง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-teal-800/80 rounded-lg text-teal-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Toggle: Income vs Expense */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>รายรับ (Income)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>รายจ่าย (Expense)</span>
            </button>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ทำรายการ *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่ *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 font-medium text-slate-800"
              >
                {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title & Amount */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อรายการ / รายละเอียด *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ค่าจัดซื้อสมุนไพรสดและลูกประคบประจำเดือน"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-teal-500 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จำนวนเงิน (บาท) *
              </label>
              <input
                type="number"
                min={0.01}
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-teal-500 font-black text-slate-900 text-base"
              />
            </div>
          </div>

          {/* Reference & Payee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่เอกสาร / ใบเสร็จ
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="เช่น REC-2603-001 หรือ VOUCH-01"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-teal-500 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'income' ? 'ผู้ชำระเงิน' : 'ผู้รับเงิน / ร้านค้า'}
              </label>
              <input
                type="text"
                value={payerPayee}
                onChange={(e) => setPayerPayee(e.target.value)}
                placeholder={type === 'income' ? 'เช่น สปสช. หรือ ผู้รับบริการ' : 'เช่น วิสาหกิจชุมชนสมุนไพร'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-teal-500 text-slate-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติม
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุหรือรายละเอียดเพิ่มเติม"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-teal-500 text-slate-800"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : recordToEdit ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
