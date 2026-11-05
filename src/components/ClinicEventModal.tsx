import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  FileText,
  Tag,
  Sparkles,
  Save,
  Trash2,
} from 'lucide-react';
import {
  ClinicEvent,
  ClinicEventCategory,
  CLINIC_EVENT_CATEGORIES,
  EVENT_CATEGORY_COLORS,
} from '../types';

interface ClinicEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<ClinicEvent, 'id'>) => Promise<void>;
  onUpdate?: (id: string, event: Partial<ClinicEvent>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialDate?: string;
  editingEvent?: ClinicEvent | null;
}

export const ClinicEventModal: React.FC<ClinicEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  initialDate,
  editingEvent,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<ClinicEventCategory>('คลินิกเฉพาะโรค');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('12:00');
  const [location, setLocation] = useState('ห้องตรวจการแพทย์แผนไทย ชั้น 1 รพ.เขาสมิง');
  const [practitioner, setPractitioner] = useState('พท.ว. อนุสรณ์ พึ่งพา');
  const [targetPatients, setTargetPatients] = useState<number | ''>(20);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('emerald');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '');
      setDate(editingEvent.date || '');
      setCategory(editingEvent.category || 'คลินิกเฉพาะโรค');
      setStartTime(editingEvent.startTime || '08:30');
      setEndTime(editingEvent.endTime || '12:00');
      setLocation(editingEvent.location || 'ห้องตรวจการแพทย์แผนไทย ชั้น 1 รพ.เขาสมิง');
      setPractitioner(editingEvent.practitioner || '');
      setTargetPatients(editingEvent.targetPatients ?? 20);
      setNotes(editingEvent.notes || '');
      setColor(editingEvent.color || 'emerald');
    } else {
      // New event
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setDate(defaultDate);
      setCategory('คลินิกเฉพาะโรค');
      setStartTime('08:30');
      setEndTime('12:00');
      setLocation('ห้องตรวจการแพทย์แผนไทย ชั้น 1 รพ.เขาสมิง');
      setPractitioner('พท.ว. อนุสรณ์ พึ่งพา');
      setTargetPatients(20);
      setNotes('');
      setColor('emerald');
    }
  }, [editingEvent, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSubmitting(true);
    try {
      const payload: Omit<ClinicEvent, 'id'> = {
        title: title.trim(),
        date,
        category,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        location: location.trim() || undefined,
        practitioner: practitioner.trim() || undefined,
        targetPatients: targetPatients === '' ? undefined : Number(targetPatients),
        notes: notes.trim() || undefined,
        color,
      };

      if (editingEvent && onUpdate) {
        await onUpdate(editingEvent.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save clinic event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || !onDelete) return;
    if (window.confirm(`ยืนยันการลบกิจกรรม "${editingEvent.title}" หรือไม่?`)) {
      setIsSubmitting(true);
      try {
        await onDelete(editingEvent.id);
        onClose();
      } catch (err) {
        console.error('Failed to delete event:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Preset quick titles
  const PRESET_CLINIC_NAMES = [
    'คลินิกเฉพาะโรคอัมพฤกษ์-อัมพาตและฟื้นฟูระบบประสาท',
    'คลินิกบำบัดโรคลมจับโปงแห้งเข่า (ข้อเข่าเสื่อม)',
    'คลินิกรักษาโรคลมปลายปัตฆาตและไมเกรน',
    'คลินิกฟื้นฟูสุขภาพมารดาหลังคลอดและทับหม้อเกลือ',
    'หน่วยแพทย์แผนไทยเคลื่อนที่เชิงรุก รพ.สต.',
    'อบรมสมุนไพรพื้นบ้านและการดูแลสุขภาพชุมชน',
    'วันตรวจวิเคราะห์ธาตุเจ้าเรือนและปรับสมดุล',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 text-emerald-200 shadow-inner">
              <Calendar className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {editingEvent ? 'แก้ไขคลินิกพิเศษ / กิจกรรม' : 'ปักหมุดคลินิกพิเศษ / กิจกรรม'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                กลุ่มงานการแพทย์แผนไทย โรงพยาบาลเขาสมิง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Quick presets pill selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>เลือกคลินิกพิเศษยอดนิยมด่วน:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CLINIC_NAMES.slice(0, 4).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setTitle(preset);
                    if (preset.includes('มารดาหลังคลอด')) {
                      setCategory('คลินิกมารดาหลังคลอด');
                      setColor('rose');
                    } else if (preset.includes('เคลื่อนที่')) {
                      setCategory('หน่วยแพทย์เคลื่อนที่/ชุมชน');
                      setColor('sky');
                    } else {
                      setCategory('คลินิกเฉพาะโรค');
                      setColor('emerald');
                    }
                  }}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 px-2 py-1 rounded-lg text-slate-700 transition-all cursor-pointer text-left"
                >
                  {preset.length > 30 ? preset.slice(0, 28) + '...' : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Event Title */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              ชื่อคลินิกพิเศษ / กิจกรรม <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น คลินิกบำบัดโรคลมจับโปงแห้งเข่า (ข้อเข่าเสื่อม)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all font-medium"
              />
            </div>
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                ประเภทกิจกรรม <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as ClinicEventCategory;
                  setCategory(cat);
                  if (cat === 'คลินิกเฉพาะโรค') setColor('emerald');
                  else if (cat === 'คลินิกมารดาหลังคลอด') setColor('rose');
                  else if (cat === 'หน่วยแพทย์เคลื่อนที่/ชุมชน') setColor('sky');
                  else if (cat === 'อบรม/ประชุมเชิงปฏิบัติการ') setColor('violet');
                  else if (cat === 'วันสมุนไพร/กิจกรรมพิเศษ') setColor('amber');
                  else setColor('slate');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 font-medium"
              >
                {CLINIC_EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                วันที่จัดกิจกรรม <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 font-medium"
              />
            </div>
          </div>

          {/* Time & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>เวลาเปิดให้บริการ</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-center text-xs text-slate-900"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-center text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>เป้าหมายผู้ป่วย (ราย)</span>
              </label>
              <input
                type="number"
                min="0"
                value={targetPatients}
                onChange={(e) => setTargetPatients(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="เช่น 25"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Location & Practitioner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>สถานที่จัดกิจกรรม</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น ห้องตรวจการแพทย์แผนไทย 1"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-hidden text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>แพทย์/ผู้รับผิดชอบ</span>
              </label>
              <input
                type="text"
                value={practitioner}
                onChange={(e) => setPractitioner(e.target.value)}
                placeholder="เช่น พท.ว. อนุสรณ์ พึ่งพา"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-hidden text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>หมายเหตุ / รายละเอียดการรักษาเพิ่มเติม</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น รับผู้ป่วยนัดหมายล่วงหน้า 20 ราย มีหัตถการพอกยาสมุนไพรและจ่ายยาเฉพาะโรค"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-hidden text-xs resize-none"
            />
          </div>

          {/* Color tag picker */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              สีแถบปักหมุดในปฏิทิน:
            </label>
            <div className="flex items-center gap-3">
              {[
                { name: 'emerald', label: 'เขียวสมุนไพร', bg: 'bg-emerald-600' },
                { name: 'sky', label: 'ฟ้าแพทย์แผนไทย', bg: 'bg-sky-600' },
                { name: 'rose', label: 'ชมพูมารดา', bg: 'bg-rose-500' },
                { name: 'violet', label: 'ม่วงอบรม', bg: 'bg-violet-600' },
                { name: 'amber', label: 'ส้มกิจกรรม', bg: 'bg-amber-500' },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${c.bg} ${
                    color === c.name ? 'ring-3 ring-offset-2 ring-slate-800 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            {editingEvent && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบกิจกรรม</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !date}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังบันทึก...' : editingEvent ? 'บันทึกการแก้ไข' : 'ปักหมุดกิจกรรม'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
