import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pin,
  Clock,
  MapPin,
  User,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Stethoscope,
  Coins,
  CalendarCheck,
  Edit2,
  Trash2,
  Eye,
  Info,
} from 'lucide-react';
import {
  ServiceRecord,
  FinancialRecord,
  ClinicEvent,
  ClinicEventCategory,
  CLINIC_EVENT_CATEGORIES,
  EVENT_CATEGORY_COLORS,
  THAI_MONTHS,
  THAI_MONTHS_SHORT,
  formatCurrency,
  formatThaiDate,
  calculateFiscalYear,
} from '../types';
import { ClinicEventModal } from './ClinicEventModal';

interface CalendarViewProps {
  services: ServiceRecord[];
  finances: FinancialRecord[];
  clinicEvents: ClinicEvent[];
  onAddClinicEvent: (event: Omit<ClinicEvent, 'id'>) => Promise<void>;
  onUpdateClinicEvent: (id: string, event: Partial<ClinicEvent>) => Promise<void>;
  onDeleteClinicEvent: (id: string) => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  services,
  finances,
  clinicEvents,
  onAddClinicEvent,
  onUpdateClinicEvent,
  onDeleteClinicEvent,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Current calendar viewing year & month (1-based month)
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (services.length > 0 && services[0].year) return services[0].year;
    return today.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (services.length > 0 && services[0].month) return services[0].month;
    return today.getMonth() + 1;
  });

  // Selected date on calendar (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (services.length > 0 && services[0].serviceDate) return services[0].serviceDate;
    return todayStr;
  });

  // Filter category for events
  const [selectedCategory, setSelectedCategory] = useState<ClinicEventCategory | 'all'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClinicEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string>(todayStr);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
    setSelectedDate(todayStr);
  };

  // Open Add Event Modal
  const handleOpenAddEvent = (date?: string) => {
    setEditingEvent(null);
    setModalInitialDate(date || selectedDate || todayStr);
    setIsModalOpen(true);
  };

  const handleOpenEditEvent = (event: ClinicEvent) => {
    setEditingEvent(event);
    setModalInitialDate(event.date);
    setIsModalOpen(true);
  };

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  // Day of week of the 1st day of month (0 = Sunday, 1 = Monday, ...)
  const startDayOfWeek = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).getDay();
  }, [currentYear, currentMonth]);

  // Aggregate services by date for quick lookup: { "2026-03-01": [ ...records ] }
  const servicesByDate = useMemo(() => {
    const map: Record<string, ServiceRecord[]> = {};
    services.forEach((s) => {
      if (!s.serviceDate) return;
      if (!map[s.serviceDate]) {
        map[s.serviceDate] = [];
      }
      map[s.serviceDate].push(s);
    });
    return map;
  }, [services]);

  // Filtered clinic events by category
  const filteredClinicEvents = useMemo(() => {
    return clinicEvents.filter((ev) => {
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;
      return true;
    });
  }, [clinicEvents, selectedCategory]);

  // Aggregate clinic events by date: { "2026-03-03": [ ...events ] }
  const eventsByDate = useMemo(() => {
    const map: Record<string, ClinicEvent[]> = {};
    filteredClinicEvents.forEach((ev) => {
      if (!ev.date) return;
      if (!map[ev.date]) {
        map[ev.date] = [];
      }
      map[ev.date].push(ev);
    });
    return map;
  }, [filteredClinicEvents]);

  // Month Statistics for this calendar view
  const monthStats = useMemo(() => {
    let totalVisits = 0;
    let totalRevenue = 0;
    const daysWithServices = new Set<string>();
    const specialEventDays = new Set<string>();

    // Count special event days in this month
    clinicEvents.forEach((ev) => {
      if (!ev.date) return;
      const [y, m] = ev.date.split('-').map(Number);
      if (y === currentYear && m === currentMonth) {
        specialEventDays.add(ev.date);
      }
    });

    // Count services in this month
    let specialDaysVisits = 0;
    let normalDaysVisits = 0;
    let normalWorkingDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayServices = servicesByDate[dStr] || [];
      const isSpecial = specialEventDays.has(dStr);

      if (dayServices.length > 0) {
        daysWithServices.add(dStr);
        totalVisits += dayServices.length;
        totalRevenue += dayServices.reduce((acc, cur) => acc + (cur.fee || 0), 0);

        if (isSpecial) {
          specialDaysVisits += dayServices.length;
        } else {
          normalDaysVisits += dayServices.length;
          normalWorkingDaysCount++;
        }
      }
    }

    const avgDailyVisits =
      daysWithServices.size > 0
        ? Number((totalVisits / daysWithServices.size).toFixed(1))
        : 0;

    const avgSpecialDayVisits =
      specialEventDays.size > 0
        ? Number((specialDaysVisits / specialEventDays.size).toFixed(1))
        : 0;

    const avgNormalDayVisits =
      normalWorkingDaysCount > 0
        ? Number((normalDaysVisits / normalWorkingDaysCount).toFixed(1))
        : 0;

    const impactPercent =
      avgNormalDayVisits > 0 && avgSpecialDayVisits > 0
        ? Math.round(((avgSpecialDayVisits - avgNormalDayVisits) / avgNormalDayVisits) * 100)
        : null;

    return {
      totalVisits,
      totalRevenue,
      daysWithServicesCount: daysWithServices.size,
      specialEventDaysCount: specialEventDays.size,
      avgDailyVisits,
      avgSpecialDayVisits,
      avgNormalDayVisits,
      impactPercent,
    };
  }, [servicesByDate, clinicEvents, currentYear, currentMonth, daysInMonth]);

  // Selected date services & comparison
  const selectedDateServices = useMemo(() => {
    return servicesByDate[selectedDate] || [];
  }, [servicesByDate, selectedDate]);

  const selectedDateEvents = useMemo(() => {
    return eventsByDate[selectedDate] || [];
  }, [eventsByDate, selectedDate]);

  const selectedDateComparison = useMemo(() => {
    const visits = selectedDateServices.length;
    const revenue = selectedDateServices.reduce((sum, s) => sum + (s.fee || 0), 0);
    const avg = monthStats.avgDailyVisits;

    const diffPercent =
      avg > 0
        ? Math.round(((visits - avg) / avg) * 100)
        : null;

    // Procedure distribution on this date
    const procMap: Record<string, number> = {};
    const covMap: Record<string, number> = {};
    const newPatientsSet = new Set<string>();

    selectedDateServices.forEach((s) => {
      const proc = s.procedureType || 'อื่นๆ';
      procMap[proc] = (procMap[proc] || 0) + 1;
      const cov = s.coverageType || 'อื่นๆ';
      covMap[cov] = (covMap[cov] || 0) + 1;
      if (s.hn) newPatientsSet.add(s.hn);
    });

    return {
      visits,
      revenue,
      avg,
      diffPercent,
      procDistribution: Object.entries(procMap).sort((a, b) => b[1] - a[1]),
      covDistribution: Object.entries(covMap).sort((a, b) => b[1] - a[1]),
      uniquePatientsCount: newPatientsSet.size,
      hasSpecialClinic: selectedDateEvents.length > 0,
    };
  }, [selectedDateServices, selectedDateEvents, monthStats.avgDailyVisits]);

  // Helper Thai Weekday Names
  const WEEKDAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const WEEKDAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. Header Banner & Monthly Comparison Insights */}
      {/* ======================================================== */}
      <section className="bg-linear-to-r from-[#032427] via-[#05383f] to-[#041c22] rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-teal-700/40 relative overflow-hidden">
        {/* Subtle ambient cyan glow */}
        <div className="absolute right-0 top-0 w-80 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-teal-500/30 to-cyan-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-200 shadow-inner shrink-0">
              <CalendarIcon className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  ปฏิทินคลินิกพิเศษ &amp; เปรียบเทียบสถิติผู้ป่วยรายวัน
                </h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                  รพ.เขาสมิง
                </span>
              </div>
              <p className="text-xs text-teal-200/80 font-normal mt-0.5">
                ปักหมุดวันที่มีคลินิกเฉพาะโรค หน่วยแพทย์เคลื่อนที่ และวิเคราะห์ความหนาแน่นผู้มารับบริการ
              </p>
            </div>
          </div>

          {/* Action buttons on banner */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenAddEvent()}
              className="flex items-center gap-1.5 bg-linear-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer ring-1 ring-amber-400/40"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>ปักหมุดคลินิกพิเศษ / กิจกรรม</span>
            </button>
          </div>
        </div>

        {/* Impact Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-teal-800/60 text-xs relative z-10">
          <div className="bg-white/10 rounded-xl p-3 border border-cyan-400/20 shadow-2xs">
            <span className="text-[11px] text-cyan-200 block font-medium">ยอดผู้ป่วยรวมเดือนนี้</span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">
              {monthStats.totalVisits.toLocaleString()}{' '}
              <span className="text-xs font-normal text-cyan-300">ราย</span>
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-teal-400/20 shadow-2xs">
            <span className="text-[11px] text-teal-200 block font-medium">เฉลี่ยวันทำการทั่วไป</span>
            <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">
              {monthStats.avgDailyVisits}{' '}
              <span className="text-xs font-normal text-teal-300">ราย/วัน</span>
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-amber-400/20 shadow-2xs">
            <span className="text-[11px] text-amber-200 block font-medium">เฉลี่ยวันมีคลินิกพิเศษ</span>
            <span className="text-lg sm:text-xl font-black text-amber-300 mt-0.5 block">
              {monthStats.avgSpecialDayVisits > 0 ? monthStats.avgSpecialDayVisits : '-'}{' '}
              <span className="text-xs font-normal text-amber-200">ราย/วัน</span>
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-emerald-400/20 shadow-2xs">
            <span className="text-[11px] text-emerald-200 block font-medium">ผลต่างวันมีคลินิกพิเศษ</span>
            <div className="flex items-center gap-1 mt-0.5">
              {monthStats.impactPercent !== null ? (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg sm:text-xl font-black text-emerald-300">
                    +{monthStats.impactPercent}%
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-300 font-medium">รอข้อมูลเพิ่มเติม</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. Calendar Controls & Month Switcher */}
      {/* ======================================================== */}
      <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 sm:p-5 shadow-xs border border-teal-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Month & Year Title with Navigation buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="เดือนก่อนหน้า"
                className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-white rounded-lg transition-all cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="เดือนถัดไป"
                className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 ml-2">
              {THAI_MONTHS[currentMonth - 1]} พ.ศ. {currentYear + 543}
            </h3>

            {/* Quick dropdown selectors */}
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              <select
                aria-label="เลือกเดือน"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                {THAI_MONTHS.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                aria-label="เลือกปี พ.ศ."
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                  <option key={yr} value={yr}>
                    พ.ศ. {yr + 543}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>ประเภท:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด
            </button>

            {CLINIC_EVENT_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Main Layout: Calendar Grid (Left) + Day Detail (Right) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid Container (8 cols on large screens) */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/80 text-center py-2.5 text-xs font-bold text-slate-600">
            {WEEKDAYS_SHORT.map((dayName, idx) => {
              const isWeekend = idx === 0 || idx === 6;
              return (
                <div
                  key={dayName}
                  className={isWeekend ? 'text-rose-600 font-bold' : 'text-slate-700'}
                >
                  {dayName}
                </div>
              );
            })}
          </div>

          {/* Calendar Day Cells Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100/40">
            {/* Empty cells before 1st day of month */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[96px] bg-slate-50/40 p-1.5 opacity-40" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayOfWeek = (startDayOfWeek + idx) % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              const dayServices = servicesByDate[dateStr] || [];
              const dayEvents = eventsByDate[dateStr] || [];
              const patientCount = dayServices.length;
              const isHighTraffic =
                monthStats.avgDailyVisits > 0 &&
                patientCount >= monthStats.avgDailyVisits * 1.25;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[105px] sm:min-h-[115px] p-1.5 sm:p-2 flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-emerald-50/80 ring-2 ring-emerald-600 z-10'
                      : isToday
                      ? 'bg-amber-50/40 hover:bg-slate-50'
                      : isWeekend
                      ? 'bg-slate-50/50 hover:bg-slate-50'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  {/* Top Day row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : isToday
                          ? 'bg-amber-500 text-white font-black shadow-xs'
                          : isWeekend
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Patient count badge */}
                    {patientCount > 0 ? (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 ${
                          isHighTraffic
                            ? 'bg-emerald-600 text-white shadow-2xs animate-pulse-subtle'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                        title={`มีผู้รับบริการ ${patientCount} ราย`}
                      >
                        <Users className="w-2.5 h-2.5" />
                        <span>{patientCount}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddEvent(dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-emerald-700 p-0.5 rounded-sm transition-opacity cursor-pointer"
                        title="ปักหมุดกิจกรรมในวันนี้"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Middle / Bottom: Pinned Events Pills */}
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const colors = EVENT_CATEGORY_COLORS[ev.category] || {
                        bg: 'bg-slate-100 text-slate-800',
                        dot: 'bg-slate-500',
                        border: 'border-slate-300',
                      };

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(dateStr);
                            handleOpenEditEvent(ev);
                          }}
                          className={`text-[10px] leading-tight px-1.5 py-0.5 rounded-md border truncate font-medium flex items-center gap-1 shadow-2xs hover:scale-[1.02] transition-transform ${colors.bg} ${colors.border}`}
                          title={`${ev.title} (${ev.category})`}
                        >
                          <Pin className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-bold px-1">
                        + อีก {dayEvents.length - 2} กิจกรรม
                      </div>
                    )}
                  </div>

                  {/* High traffic subtle glow icon */}
                  {isHighTraffic && dayEvents.length > 0 && (
                    <div
                      className="absolute bottom-1 right-1 text-amber-500"
                      title="วันคลินิกพิเศษมีผู้มารับบริการหนาแน่น"
                    >
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend Footer */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>ผู้ป่วยหนาแน่นพิเศษ (≥ +25%)</span>
              </div>
              <div className="flex items-center gap-1">
                <Pin className="w-3 h-3 text-amber-500" />
                <span>วันที่มีคลินิกพิเศษ / กิจกรรม</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>วันนี้ ({formatThaiDate(todayStr)})</span>
              </div>
            </div>

            <span className="text-[10px] text-slate-400">
              คลิกที่วันที่เพื่อดูสถิติเปรียบเทียบและรายชื่อผู้ป่วย
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. Selected Day Comparison & Details Panel (Right 4 cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
            {/* Header of Selected Date */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                  สรุปผลและสถิติรายวัน
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {formatThaiDate(selectedDate)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddEvent(selectedDate)}
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="ปักหมุดกิจกรรมพิเศษสำหรับวันนี้"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ปักหมุด</span>
              </button>
            </div>

            {/* Comparison Metrics Box */}
            <div className="mt-4 p-4 rounded-2xl bg-linear-to-br from-slate-50 to-emerald-50/50 border border-emerald-100/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  จำนวนผู้รับบริการในวันนี้
                </span>
                {selectedDateComparison.hasSpecialClinic && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5 text-amber-600" />
                    <span>วันคลินิกพิเศษ</span>
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {selectedDateComparison.visits}
                </span>
                <span className="text-xs font-semibold text-slate-500">ราย</span>

                {/* Diff compared to month daily average */}
                {selectedDateComparison.diffPercent !== null && (
                  <div
                    className={`ml-auto flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
                      selectedDateComparison.diffPercent >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedDateComparison.diffPercent >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {selectedDateComparison.diffPercent >= 0 ? '+' : ''}
                      {selectedDateComparison.diffPercent}%
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span>ค่าเฉลี่ยวันทั่วไป: {monthStats.avgDailyVisits} ราย</span>
                <span className="font-bold text-slate-900">
                  รายรับ: {formatCurrency(selectedDateComparison.revenue)}
                </span>
              </div>
            </div>

            {/* Pinned Events on this day */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                  <span>คลินิกพิเศษ / กิจกรรมที่ปักหมุด ({selectedDateEvents.length})</span>
                </h4>
              </div>

              {selectedDateEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateEvents.map((ev) => {
                    const colors = EVENT_CATEGORY_COLORS[ev.category] || {
                      bg: 'bg-slate-100 text-slate-800',
                      dot: 'bg-slate-500',
                      border: 'border-slate-300',
                    };

                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-xl border transition-all ${colors.bg} ${colors.border}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                              {ev.category}
                            </span>
                            <h5 className="font-bold text-xs sm:text-sm mt-0.5 leading-snug">
                              {ev.title}
                            </h5>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditEvent(ev)}
                              className="p-1 rounded-md hover:bg-black/10 transition-colors cursor-pointer text-slate-700"
                              title="แก้ไขกิจกรรม"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`ยืนยันการลบกิจกรรม "${ev.title}"?`)) {
                                  onDeleteClinicEvent(ev.id);
                                }
                              }}
                              className="p-1 rounded-md hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="ลบกิจกรรม"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="mt-2 space-y-1 text-[11px] text-slate-700 opacity-90">
                          {ev.startTime && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>เวลา: {ev.startTime} - {ev.endTime || ''} น.</span>
                            </div>
                          )}
                          {ev.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                          {ev.practitioner && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>ผู้ตรวจ/รับผิดชอบ: {ev.practitioner}</span>
                            </div>
                          )}
                          {ev.targetPatients && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span>เป้าหมายผู้ป่วย: {ev.targetPatients} ราย</span>
                            </div>
                          )}
                          {ev.notes && (
                            <p className="mt-1.5 text-[10px] text-slate-600 bg-white/60 p-1.5 rounded-lg border border-slate-200/60 leading-relaxed">
                              {ev.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-dashed border-slate-200 text-xs text-slate-500">
                  <p>ไม่มีคลินิกพิเศษหรือกิจกรรมที่ปักหมุดในวันนี้</p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddEvent(selectedDate)}
                    className="mt-1.5 text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>คลิกเพื่อปักหมุดคลินิกพิเศษ</span>
                  </button>
                </div>
              )}
            </div>

            {/* Procedures Distribution on this Day */}
            {selectedDateServices.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>หัตถการที่ให้บริการในวันนี้</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {selectedDateComparison.procDistribution.length} ประเภท
                  </span>
                </h4>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedDateComparison.procDistribution.map(([procName, count]) => {
                    const percent = Math.round((count / selectedDateServices.length) * 100);
                    return (
                      <div key={procName} className="text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="truncate max-w-[180px]">{procName}</span>
                          <span className="font-bold text-slate-900 shrink-0">
                            {count} ครั้ง ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Patient List on this Day */}
            {selectedDateServices.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>รายชื่อผู้ป่วยในวันนี้ ({selectedDateServices.length} ราย)</span>
                  <span className="text-[10px] text-slate-400">HN / หัตถการ</span>
                </h4>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {selectedDateServices.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/60 text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">
                          {patient.patientName}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded-md font-semibold">
                          HN {patient.hn}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {patient.procedureType}
                      </div>
                      {patient.diagnosis && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 italic">
                          {patient.diagnosis}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Adding / Editing Clinic Event */}
      <ClinicEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={onAddClinicEvent}
        onUpdate={onUpdateClinicEvent}
        onDelete={onDeleteClinicEvent}
        initialDate={modalInitialDate}
        editingEvent={editingEvent}
      />
    </div>
  );
};
