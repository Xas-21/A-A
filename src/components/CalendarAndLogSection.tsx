import React, { useState } from 'react';
import {
  Check,
  AlertTriangle,
  Star,
  Plus,
  Handshake,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react';
import {
  CommunicationChannel,
  CommunicationLog,
  CommunicationQuality,
  DailyRating,
  LowCommReason,
  SatisfactionMood,
  TimeSlot,
  UserRole,
  VerificationStatus,
} from '../types';
import {
  computeDayStatus,
  DayCalendarStatus,
  detectHarshTone,
} from '../utils/communicationLogic';

interface CalendarAndLogSectionProps {
  currentUser: UserRole;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  logs: CommunicationLog[];
  ratings: DailyRating[];
  onAddLog: (logData: Partial<CommunicationLog>) => Promise<void>;
  onVerifyLog: (
    logId: string,
    status: VerificationStatus,
    disputeReason?: string,
    resolutionNote?: string
  ) => Promise<void>;
  onSaveRating: (rating: DailyRating) => Promise<void>;
  onRequestPeacekeeper: (text: string) => Promise<string>;
}

const CHANNELS: CommunicationChannel[] = [
  'جلسة شخصية بالبيت',
  'اتصال هاتفي',
  'واتساب',
  'سناب شات',
  'تواصل قليل/شبه معدوم',
];

const QUALITIES: CommunicationQuality[] = [
  'عميق/فعّال',
  'سطحي/روتيني',
  'شبه معدوم',
];

const LOW_REASONS: LowCommReason[] = [
  'ضغط عمل',
  'إرهاق',
  'التزامات خارج البيت',
  'انشغال عائلي',
  'أخرى',
];

const TIME_SLOTS: TimeSlot[] = [
  'صباحاً (8ص - 12م)',
  'ظهراً (12م - 4م)',
  'عصراً (4م - 8م)',
  'مساءً (8م - 12ص)',
];

const WEEKDAYS_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export const CalendarAndLogSection: React.FC<CalendarAndLogSectionProps> = ({
  currentUser,
  selectedDate,
  onSelectDate,
  logs,
  ratings,
  onAddLog,
  onVerifyLog,
  onSaveRating,
  onRequestPeacekeeper,
}) => {
  const isAyah = currentUser === 'Ayah';

  // Filter toggle: 'selected_date' | 'pending_all' | 'disputed_all'
  const [logFilter, setLogFilter] = useState<
    'selected_date' | 'pending_all' | 'disputed_all'
  >('selected_date');

  // New Log Form State
  const [channel, setChannel] = useState<CommunicationChannel>('جلسة شخصية بالبيت');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [quality, setQuality] = useState<CommunicationQuality>('عميق/فعّال');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('مساءً (8م - 12ص)');
  const [details, setDetails] = useState('');
  const [lowCommReason, setLowCommReason] = useState<LowCommReason>('ضغط عمل');
  const [customExcuseNote, setCustomExcuseNote] = useState('');
  const [formError, setFormError] = useState('');

  // Dispute / Reject Modal or Inline State
  const [disputingLogId, setDisputingLogId] = useState<string | null>(null);
  const [disputeReasonText, setDisputeReasonText] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  // Daily Satisfaction Rating State for Selected Date
  const existingUserRating = ratings.find(
    (r) => r.date === selectedDate && r.user === currentUser
  );
  const [stars, setStars] = useState<number>(existingUserRating?.stars || 5);
  const [feeling, setFeeling] = useState<SatisfactionMood>(
    existingUserRating?.feeling || 'سعيد'
  );
  const [ratingComment, setRatingComment] = useState<string>(
    existingUserRating?.comment || ''
  );
  const [ratingSavedBanner, setRatingSavedBanner] = useState(false);

  const handleDateClick = (dateStr: string) => {
    onSelectDate(dateStr);
    setLogFilter('selected_date');
    const found = ratings.find(
      (r) => r.date === dateStr && r.user === currentUser
    );
    setStars(found?.stars || 5);
    setFeeling(found?.feeling || 'سعيد');
    setRatingComment(found?.comment || '');
    setRatingSavedBanner(false);
  };

  const needsLowReason =
    quality === 'شبه معدوم' || channel === 'تواصل قليل/شبه معدوم';

  // AI Peacekeeper check on excuse note or details
  const excuseToneCheck = detectHarshTone(
    needsLowReason ? `${details} ${customExcuseNote}` : details
  );
  const disputeToneCheck = detectHarshTone(disputeReasonText);

  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setFormError('الرجاء كتابة تفاصيل التواصل لهذا اليوم.');
      return;
    }
    if (needsLowReason && !lowCommReason) {
      setFormError('الرجاء تحديد سبب قلة التواصل.');
      return;
    }
    setFormError('');
    await onAddLog({
      date: selectedDate,
      createdBy: currentUser,
      channel,
      durationMinutes,
      details: details.trim(),
      quality,
      lowCommReason: needsLowReason ? lowCommReason : undefined,
      customExcuseNote: needsLowReason ? customExcuseNote.trim() : undefined,
      timeSlot,
    });
    setDetails('');
    setCustomExcuseNote('');
  };

  const handleApplyPeacekeeperToDispute = async () => {
    setIsRewriting(true);
    try {
      const gentle = await onRequestPeacekeeper(disputeReasonText);
      setDisputeReasonText(gentle);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleApplyPeacekeeperToDetails = async () => {
    setIsRewriting(true);
    try {
      const gentle = await onRequestPeacekeeper(details);
      setDetails(gentle);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveRating({
      date: selectedDate,
      user: currentUser,
      stars,
      feeling,
      comment: ratingComment,
    });
    setRatingSavedBanner(true);
  };

  // October 2026 starts on Thursday (index 4 in Sun-Sat)
  const calendarDays: Array<{ date: string; dayNum: number; status: DayCalendarStatus }> = [];
  for (let d = 1; d <= 31; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const fullDate = `2026-10-${dayStr}`;
    const dLogs = logs.filter((l) => l.date === fullDate);
    const dRatings = ratings.filter((r) => r.date === fullDate);
    calendarDays.push({
      date: fullDate,
      dayNum: d,
      status: computeDayStatus(dLogs, dRatings),
    });
  }

  const displayedLogs =
    logFilter === 'pending_all'
      ? logs.filter((l) => l.status === 'pending')
      : logFilter === 'disputed_all'
      ? logs.filter((l) => l.status === 'disputed')
      : logs.filter((l) => l.date === selectedDate);

  const pendingForCurrentUserCount = logs.filter(
    (l) => l.status === 'pending' && l.createdBy !== currentUser
  ).length;

  const statusMeta = (status: DayCalendarStatus) => {
    switch (status) {
      case 'verified_high':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          label: 'مُصادق',
        };
      case 'low_comm':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          label: 'قليل',
        };
      case 'disputed':
        return {
          bg: 'bg-red-50 border-red-300 text-red-900',
          label: 'مختلف عليه',
        };
      case 'pending':
        return {
          bg: 'bg-slate-100 border-slate-300 text-slate-800',
          label: 'معلق',
        };
      default:
        return {
          bg: 'bg-white border-slate-200 text-slate-600',
          label: '',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Right Column (7 cols): Interactive Monthly Calendar & Daily Satisfaction */}
      <div className="lg:col-span-7 space-y-6">
        {/* Monthly Calendar Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                التقويم السلس وسجل أكتوبر ٢٠٢٦
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                اضغط على أي يوم في التقويم لاستعراض أو إضافة سجلات التواصل والمصادقة عليها
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>أخضر: رضا عالٍ ومُصادق</span>
              <span aria-hidden="true">·</span>
              <span>أصفر: تواصل قليل</span>
              <span aria-hidden="true">·</span>
              <span>أحمر: مؤجل للنقاش</span>
              <span aria-hidden="true">·</span>
              <span>رمادي: معلق</span>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {WEEKDAYS_AR.map((day) => (
              <div
                key={day}
                className="text-xs font-semibold text-slate-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid (October 2026 starts on Thursday -> 4 empty cells) */}
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3].map((emptyIdx) => (
              <div
                key={`empty-${emptyIdx}`}
                className="h-14 rounded-xl bg-slate-50/50 border border-transparent"
              />
            ))}
            {calendarDays.map((item) => {
              const isSelected = item.date === selectedDate;
              const meta = statusMeta(item.status);
              return (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => handleDateClick(item.date)}
                  aria-label={`يوم ${item.dayNum} أكتوبر 2026 ${meta.label}`}
                  className={`h-14 rounded-xl border p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer ${
                    meta.bg
                  } ${
                    isSelected
                      ? isAyah
                        ? 'ring-2 ring-pink-500 border-pink-500 font-bold'
                        : 'ring-2 ring-blue-600 border-blue-600 font-bold'
                      : 'hover:border-slate-400'
                  }`}
                >
                  <span className="text-xs font-mono tabular-nums font-semibold">
                    {item.dayNum}
                  </span>
                  {meta.label && (
                    <span className="text-[10px] leading-none truncate max-w-full">
                      {meta.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Daily Satisfaction Rating Card (نبض اليوم / درجة الرضا) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                نبض اليوم ودرجة الرضا ({Number(selectedDate.split('-')[2])} أكتوبر)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                هل أنت راضي عن التواصل اليوم؟ تقييمك يساعد في رسم منحنى المودة الشهري
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {selectedDate}
            </span>
          </div>

          <form onSubmit={handleRatingSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* 1 to 5 Stars */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setStars(starVal)}
                    aria-label={`تقييم ${starVal} نجوم`}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        starVal <= stars
                          ? isAyah
                            ? 'text-pink-500 fill-pink-500'
                            : 'text-blue-600 fill-blue-600'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono tabular-nums text-slate-600 mr-2">
                  ({stars} / 5)
                </span>
              </div>

              {/* Emoticons: سعيد, محايد, متضايق */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    { id: 'سعيد', emoji: '😊' },
                    { id: 'محايد', emoji: '😐' },
                    { id: 'متضايق', emoji: '😔' },
                  ] as Array<{ id: SatisfactionMood; emoji: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeeling(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      feeling === item.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.emoji} {item.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="ملاحظة قصيرة عن شعورك اليوم (اختياري)..."
                aria-label="ملاحظة قصيرة عن شعورك اليوم"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-900"
              />
              <button
                type="submit"
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isAyah
                    ? 'bg-pink-500 hover:bg-pink-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                حفظ تقييم الرضا
              </button>
            </div>

            {ratingSavedBanner && (
              <p className="text-xs text-emerald-700 font-medium">
                ✓ تم حفظ تقييم رضاك لهذا اليوم وإضافته إلى الإحصائيات المشتركة.
              </p>
            )}
          </form>
        </section>
      </div>

      {/* Left Column (5 cols): Dual-Party Communication Log & Verification */}
      <div className="lg:col-span-5 space-y-6">
        {/* Add New Communication Log Form */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-slate-900">
              توثيق تواصل جديد ({Number(selectedDate.split('-')[2])} أكتوبر)
            </h3>
            <span
              className={`text-xs font-semibold ${
                isAyah ? 'text-pink-600' : 'text-blue-600'
              }`}
            >
              بواسطة {isAyah ? 'آية 🩷' : 'عبدالله 💙'}
            </span>
          </div>

          <form onSubmit={handleAddLogSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="log-channel-select"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  وسيلة التواصل:
                </label>
                <select
                  id="log-channel-select"
                  value={channel}
                  onChange={(e) => {
                    const val = e.target.value as CommunicationChannel;
                    setChannel(val);
                    if (val === 'تواصل قليل/شبه معدوم') {
                      setQuality('شبه معدوم');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="log-duration-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  المدة (بالدقائق):
                </label>
                <input
                  id="log-duration-input"
                  type="number"
                  min={1}
                  max={600}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="log-quality-select"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  جودة التواصل:
                </label>
                <select
                  id="log-quality-select"
                  value={quality}
                  onChange={(e) =>
                    setQuality(e.target.value as CommunicationQuality)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {QUALITIES.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="log-timeslot-select"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  فترة التواصل:
                </label>
                <select
                  id="log-timeslot-select"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mandatory Low Communication Reason if quality is minimal */}
            {needsLowReason && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div>
                  <label
                    htmlFor="low-comm-reason-select"
                    className="block text-xs font-bold text-amber-900 mb-1"
                  >
                    سبب قلة التواصل (إلزامي عند ضعف التواصل):
                  </label>
                  <select
                    id="low-comm-reason-select"
                    value={lowCommReason}
                    onChange={(e) =>
                      setLowCommReason(e.target.value as LowCommReason)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-medium text-slate-900"
                  >
                    {LOW_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="custom-excuse-input"
                    className="block text-xs font-semibold text-amber-900 mb-1"
                  >
                    توضيح لطيف للشريك حول العذر:
                  </label>
                  <input
                    id="custom-excuse-input"
                    type="text"
                    value={customExcuseNote}
                    onChange={(e) => setCustomExcuseNote(e.target.value)}
                    placeholder="مثال: ضغط اجتماعات طارئ وسأعوضك غداً..."
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-slate-800"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="log-details-textarea"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                تفاصيل الحوار أو الموقف:
              </label>
              <textarea
                id="log-details-textarea"
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="مثال: تكلمنا لمدة ساعة عن خطط الويكند..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-900"
              />
            </div>

            {/* Smart Conflict Prevention & AI Peacekeeper Prompt on Log Input */}
            {excuseToneCheck.isHarsh && (
              <div
                data-testid="ai-peacekeeper-alert"
                className="p-3.5 rounded-xl bg-violet-50 border border-violet-200 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-violet-900">
                  <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>
                    مستشار التهدئة الذكي: هل ترغب في إعادة صيغتها بشكل أكثر لطفاً لضمان فهم الطرف الآخر؟
                  </span>
                </div>
                <p className="text-xs text-violet-800">
                  الصياغة المقترحة: «{excuseToneCheck.gentleSuggestion}»
                </p>
                <button
                  type="button"
                  disabled={isRewriting}
                  onClick={handleApplyPeacekeeperToDetails}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors cursor-pointer"
                >
                  {isRewriting
                    ? 'جاري تحسين الصياغة...'
                    : 'اعتماد الصياغة اللطيفة المقترحة ✨'}
                </button>
              </div>
            )}

            {formError && (
              <p role="alert" className="text-xs text-red-600 font-semibold">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isAyah
                  ? 'bg-pink-500 hover:bg-pink-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة السجل وإرساله للمصادقة</span>
            </button>
          </form>
        </section>

        {/* Daily Timeline & Mutual Verification Feed */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-display text-base font-bold text-slate-900">
              سجل التوثيق والمصادقة المتبادلة
            </h3>

            {/* Interactive Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setLogFilter('selected_date')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  logFilter === 'selected_date'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                يوم {Number(selectedDate.split('-')[2])} أكتوبر
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('pending_all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  logFilter === 'pending_all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                معلق ({pendingForCurrentUserCount})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('disputed_all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  logFilter === 'disputed_all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مؤجل للنقاش
              </button>
            </div>
          </div>

          {displayedLogs.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200">
              <CalendarIcon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                لا توجد سجلات موثقة في هذا العرض
              </p>
              <p className="text-xs text-slate-500 mt-1">
                يمكنك إضافة سجل تواصل جديد من النموذج أعلاه ليظهر هنا فوراً.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedLogs.map((log) => {
                const isLogByAbdullah = log.createdBy === 'Abdullah';
                const canCurrentUserVerify =
                  log.status === 'pending' && log.createdBy !== currentUser;

                return (
                  <div key={log.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                    {/* Top Metadata Line (Zero-Pill Unboxed Text with · separators) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold ${
                            isLogByAbdullah ? 'text-blue-600' : 'text-pink-600'
                          }`}
                        >
                          {isLogByAbdullah ? 'عبدالله 💙' : 'آية 🩷'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-800">
                          {log.channel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {log.durationMinutes} دقيقة
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{log.quality}</span>
                      </div>

                      <span className="text-xs font-semibold">
                        {log.status === 'approved' && (
                          <span className="text-emerald-700">✓ مُصادق عليه</span>
                        )}
                        {log.status === 'pending' && (
                          <span className="text-slate-600">⏳ معلق للمصادقة</span>
                        )}
                        {log.status === 'disputed' && (
                          <span className="text-red-600">
                            ⚠️ مختلف عليه - مؤجل لنقاش الوجه لوجه
                          </span>
                        )}
                        {log.status === 'resolved' && (
                          <span className="text-blue-700">
                            🤝 تم الصلح والتفاهم
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Log Details */}
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {log.details}
                    </p>

                    {/* Optional Low Comm Reason & TimeSlot */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.timeSlot}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{log.date}</span>
                      {log.lowCommReason && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-medium">
                            السبب: {log.lowCommReason}
                            {log.customExcuseNote
                              ? ` (${log.customExcuseNote})`
                              : ''}
                          </span>
                        </>
                      )}
                    </div>

                    {/* If Disputed: Show Cooling-Off Notice & Peaceful Resolution Action */}
                    {log.status === 'disputed' && (
                      <div className="p-3 rounded-xl bg-red-50/70 border border-red-200 space-y-2">
                        <p className="text-xs font-semibold text-red-900">
                          وجهة نظر الشريك: «{log.disputeReason}»
                        </p>
                        <p className="text-[11px] text-red-700">
                          تم تفعيل وضع التهدئة (مؤجل لنقاش الوجه لوجه) لتجنب الجدال الرقمي.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            onVerifyLog(
                              log.id,
                              'resolved',
                              undefined,
                              'تم النقاش وجهاً لوجه بابتسامة وتفاهم متبادل 🤝'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Handshake className="w-3.5 h-3.5" />
                          <span>تم النقاش وجهاً لوجه والصلح بسلام 🤝</span>
                        </button>
                      </div>
                    )}

                    {log.status === 'resolved' && log.resolutionNote && (
                      <p className="text-xs text-emerald-700 font-medium">
                        نتيجة النقاش الودي: {log.resolutionNote}
                      </p>
                    )}

                    {/* Recipient Verification Controls (Approve / Dispute) */}
                    {log.status === 'pending' && (
                      <div className="pt-1">
                        {canCurrentUserVerify ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onVerifyLog(log.id, 'approved')}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>موافقة ومصادقة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDisputingLogId(
                                  disputingLogId === log.id ? null : log.id
                                );
                                setDisputeReasonText('');
                              }}
                              className="px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>رفض مع ذكر السبب</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              بانتظار مصادقة{' '}
                              {currentUser === 'Abdullah' ? 'آية 🩷' : 'عبدالله 💙'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDisputingLogId(
                                  disputingLogId === log.id ? null : log.id
                                );
                                setDisputeReasonText('');
                              }}
                              className="text-[11px] text-slate-500 underline hover:text-slate-800 cursor-pointer"
                            >
                              إضافة تحفظ / سبب اختلاف
                            </button>
                          </div>
                        )}

                        {/* Dispute Input Drawer with AI Peacekeeper */}
                        {disputingLogId === log.id && (
                          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <label
                              htmlFor={`dispute-input-${log.id}`}
                              className="block text-xs font-bold text-slate-800"
                            >
                              اذكر سبب التحفظ ليتم تأجيله لنقاش هادئ وجهاً لوجه:
                            </label>
                            <textarea
                              id={`dispute-input-${log.id}`}
                              rows={2}
                              value={disputeReasonText}
                              onChange={(e) =>
                                setDisputeReasonText(e.target.value)
                              }
                              placeholder="اكتب وجهة نظرك بهدوء..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                            />

                            {/* AI Peacekeeper Prompt when harsh words detected */}
                            {disputeToneCheck.isHarsh && (
                              <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 space-y-2">
                                <p className="text-xs font-bold text-violet-900">
                                  هل ترغب في إعادة صيغتها بشكل أكثر لطفاً لضمان فهم الطرف الآخر؟
                                </p>
                                <p className="text-xs text-violet-800">
                                  المقترح اللطيف: «{disputeToneCheck.gentleSuggestion}»
                                </p>
                                <button
                                  type="button"
                                  disabled={isRewriting}
                                  onClick={handleApplyPeacekeeperToDispute}
                                  className="px-3 py-1 rounded-md bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 cursor-pointer"
                                >
                                  اعتماد الصياغة اللطيفة ✨
                                </button>
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setDisputingLogId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 cursor-pointer"
                              >
                                إلغاء
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!disputeReasonText.trim()) return;
                                  await onVerifyLog(
                                    log.id,
                                    'disputed',
                                    disputeReasonText.trim()
                                  );
                                  setDisputingLogId(null);
                                  setDisputeReasonText('');
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                              >
                                تأكيد التحفظ وتفعيل التهدئة
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
