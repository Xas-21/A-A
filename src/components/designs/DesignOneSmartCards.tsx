import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Check,
  Coffee,
  Sparkles,
  Calendar as CalendarIcon,
  Gift,
  BarChart3,
  Handshake,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  MessageCircle,
  Home,
  Briefcase,
  Heart,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import {
  CommunicationChannel,
  CommunicationLog,
  CommunicationQuality,
  CoupleStoreState,
  DailyRating,
  LowCommReason,
  MemoryItem,
  MoodId,
  SatisfactionMood,
  TimeSlot,
  UserRole,
  VerificationStatus,
} from '../../types';
import {
  computeDayStatus,
  detectHarshTone,
  formatArabicDateLabel,
  getMonthDaysForDate,
  getSevenDayWindow,
  MonthlyAnalyticsSummary,
  MOOD_OPTIONS,
} from '../../utils/communicationLogic';
import { MonthlyAnalyticsSection } from '../MonthlyAnalyticsSection';
import { GamificationAndVaultSection } from '../GamificationAndVaultSection';

export type ActiveSectionTab = 'daily' | 'rewards' | 'analytics';

interface DesignProps {
  currentUser: UserRole;
  activeTab: ActiveSectionTab;
  onChangeTab: (tab: ActiveSectionTab) => void;
  storeState: CoupleStoreState;
  onlineUsers: UserRole[];
  livePartnerToast: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  analytics: MonthlyAnalyticsSummary;
  onUpdateMood: (moodId: MoodId, label: string, note: string) => Promise<void>;
  onAddLog: (logData: Partial<CommunicationLog>) => Promise<void>;
  onVerifyLog: (
    logId: string,
    status: VerificationStatus,
    disputeReason?: string,
    resolutionNote?: string
  ) => Promise<void>;
  onSaveRating: (rating: DailyRating) => Promise<void>;
  onAddGratitude: (content: string) => Promise<void>;
  onTriggerSos: (customMessage?: string) => Promise<void>;
  onAckSos: (sosId: string, responseNote?: string) => Promise<void>;
  onRedeemCoupon: (couponId: string) => Promise<void>;
  onAddMemory: (memory: Partial<MemoryItem>) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  onRequestPeacekeeper: (text: string) => Promise<string>;
}

const QUICK_PRESETS: Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  channel: CommunicationChannel;
  durationMinutes: number;
  quality: CommunicationQuality;
  defaultDetails: string;
  lowReason?: LowCommReason;
}> = [
  {
    id: 'home_coffee',
    title: 'قهوة وسوالف بالبيت ☕',
    subtitle: '٦٠ دقيقة · عميق وفعّال',
    icon: <Home className="w-5 h-5" />,
    channel: 'جلسة شخصية بالبيت',
    durationMinutes: 60,
    quality: 'عميق/فعّال',
    defaultDetails: 'جلسة قهوة وسوالف دافئة بالبيت عن يومنا وخططنا القادمة.',
  },
  {
    id: 'warm_call',
    title: 'مكالمة تطمين دافئة 📞',
    subtitle: '٣٠ دقيقة · اتصال هاتفي',
    icon: <PhoneCall className="w-5 h-5" />,
    channel: 'اتصال هاتفي',
    durationMinutes: 30,
    quality: 'عميق/فعّال',
    defaultDetails: 'مكالمة هاتفية لطيفة للاطمئنان ومشاركة تفاصيل اليوم.',
  },
  {
    id: 'sweet_chat',
    title: 'رسائل واتساب / سناب 💬',
    subtitle: '٢٥ دقيقة · تفاعل يومي',
    icon: <MessageCircle className="w-5 h-5" />,
    channel: 'واتساب',
    durationMinutes: 25,
    quality: 'عميق/فعّال',
    defaultDetails: 'رسائل وصور لطيفة على مدار اليوم حافظت على تقاربنا.',
  },
  {
    id: 'busy_day',
    title: 'يوم مزدحم / تواصل خفيف 💼',
    subtitle: '١٠ دقائق · عذر ضغط عمل',
    icon: <Briefcase className="w-5 h-5" />,
    channel: 'تواصل قليل/شبه معدوم',
    durationMinutes: 10,
    quality: 'شبه معدوم',
    defaultDetails: 'انشغال كبير اليوم بسبب ضغط العمل مع الوعد بتعويض قريب.',
    lowReason: 'ضغط عمل',
  },
];

export const DesignOneSmartCards: React.FC<DesignProps> = ({
  currentUser,
  activeTab,
  onChangeTab,
  storeState,
  onlineUsers,
  livePartnerToast,
  selectedDate,
  onSelectDate,
  analytics,
  onUpdateMood,
  onAddLog,
  onVerifyLog,
  onSaveRating,
  onAddGratitude,
  onTriggerSos,
  onAckSos,
  onRedeemCoupon,
  onAddMemory,
  onResetDatabase,
  onRequestPeacekeeper,
}) => {
  const isAyah = currentUser === 'Ayah';
  const partnerRole: UserRole = isAyah ? 'Abdullah' : 'Ayah';
  const isPartnerOnline = onlineUsers.includes(partnerRole);
  const myMood = storeState.moods[currentUser];
  const partnerMood = storeState.moods[partnerRole];

  const [showFullMonthCalendar, setShowFullMonthCalendar] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('home_coffee');
  const [customDetails, setCustomDetails] = useState(
    QUICK_PRESETS[0].defaultDetails
  );
  const [customDuration, setCustomDuration] = useState<number>(60);
  const [customLowReason, setCustomLowReason] = useState<LowCommReason>('ضغط عمل');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('مساءً (8م - 12ص)');
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Pending logs created by partner that need current user's approval
  const pendingForMe = storeState.logs.filter(
    (l) => l.status === 'pending' && l.createdBy !== currentUser
  );

  const logsForSelectedDate = storeState.logs.filter(
    (l) => l.date === selectedDate
  );

  const existingRating = storeState.ratings.find(
    (r) => r.date === selectedDate && r.user === currentUser
  );

  const parsedSelectedDate = formatArabicDateLabel(selectedDate);

  // Dynamic 7-day strip around selectedDate
  const quickDays = getSevenDayWindow(selectedDate).map((d) => {
    const dLogs = storeState.logs.filter((l) => l.date === d.dateStr);
    const dRatings = storeState.ratings.filter((r) => r.date === d.dateStr);
    return {
      ...d,
      status: computeDayStatus(dLogs, dRatings),
    };
  });

  const fullMonthDates = getMonthDaysForDate(selectedDate);

  const activePreset =
    QUICK_PRESETS.find((p) => p.id === selectedPresetId) || QUICK_PRESETS[0];
  const harshCheck = detectHarshTone(customDetails);
  const disputeHarshCheck = detectHarshTone(disputeText);

  const handleSelectPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setSelectedPresetId(preset.id);
    setCustomDetails(preset.defaultDetails);
    setCustomDuration(preset.durationMinutes);
    if (preset.lowReason) {
      setCustomLowReason(preset.lowReason);
    }
  };

  const handleQuickLogSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDetails.trim()) return;
    await onAddLog({
      date: selectedDate,
      createdBy: currentUser,
      channel: activePreset.channel,
      durationMinutes: customDuration,
      quality: activePreset.quality,
      details: customDetails.trim(),
      lowCommReason:
        activePreset.quality === 'شبه معدوم' ? customLowReason : undefined,
      timeSlot,
    });
    showToast('تم توثيق التواصل بنجاح وإرساله لشريكك للمصادقة ✨');
  };

  const handleOneTapRating = async (starsCount: number, mood: SatisfactionMood) => {
    await onSaveRating({
      date: selectedDate,
      user: currentUser,
      stars: starsCount,
      feeling: mood,
    });
    showToast(`تم حفظ تقييم رضاك لليوم (${starsCount}/5 نجوم) 🌟`);
    if (starsCount === 5) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: isAyah
            ? ['#EC4899', '#F43F5E', '#FBBF24']
            : ['#2563EB', '#3B82F6', '#60A5FA'],
        });
      } catch {
        // Ignore
      }
    }
  };

  const latestSos = storeState.sosRequests[0];

  return (
    <div className="space-y-6">
      {/* Local Action Toast or Live WebSocket Partner Toast Banner */}
      <AnimatePresence>
        {(toastMsg || livePartnerToast) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3.5 rounded-2xl text-white text-xs font-bold text-center shadow-lg ${
              livePartnerToast && !toastMsg
                ? isAyah
                  ? 'bg-blue-600'
                  : 'bg-pink-500'
                : 'bg-emerald-600'
            }`}
          >
            {toastMsg || livePartnerToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Friendly Sub-Navigation & One-Tap SOS Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl shadow-black/25 text-slate-900 overflow-hidden">
        <div className="w-full sm:w-auto grid grid-cols-1 sm:flex items-center gap-1.5 p-1.5 sm:p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onChangeTab('daily')}
            className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 sm:whitespace-nowrap sm:shrink-0 ${
              activeTab === 'daily'
                ? isAyah
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            <span>يومياتنا السريعة</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('rewards')}
            className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 sm:whitespace-nowrap sm:shrink-0 ${
              activeTab === 'rewards'
                ? isAyah
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>المكافآت والذكريات ({storeState.points[currentUser]} نقطة)</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('analytics')}
            className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 sm:whitespace-nowrap sm:shrink-0 ${
              activeTab === 'analytics'
                ? isAyah
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>إحصائيات الشهر</span>
          </button>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* One-Tap SOS Coffee Request */}
          <button
            type="button"
            onClick={async () => {
              await onTriggerSos('شريكك يحتاج جلسة تواصل خاصة اليوم لما تفضى ☕');
              showToast('تم إرسال دعوة قهوة وجلسة خاصة لشريكك ☕🤍');
            }}
            className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 sm:whitespace-nowrap sm:shrink-0 ${
              isAyah
                ? 'border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100'
                : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Coffee className="w-4 h-4 shrink-0" />
            <span>اطلب جلسة قهوة خاصة اليوم ☕</span>
          </button>

          {/* Reset Database Button for clean testing */}
          <button
            type="button"
            onClick={async () => {
              await onResetDatabase();
              showToast('تم تصفير جميع السجلات والبدء من جديد ✨');
            }}
            title="تصفير قاعدة البيانات والبدء من الصفر"
            className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center gap-1.5 sm:whitespace-nowrap sm:shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>تصفير البيانات</span>
          </button>
        </div>
      </div>

      {activeTab === 'rewards' && (
        <GamificationAndVaultSection
          currentUser={currentUser}
          points={storeState.points}
          badges={analytics.badges}
          coupons={storeState.coupons}
          memories={storeState.memories}
          onRedeemCoupon={onRedeemCoupon}
          onAddMemory={onAddMemory}
        />
      )}

      {activeTab === 'analytics' && (
        <MonthlyAnalyticsSection analytics={analytics} />
      )}

      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* 1. Warm Dual Energy & Mood Card (1-Tap Mood Switcher) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Partner Status Card */}
            <div
              className={`p-5 rounded-2xl border-2 bg-white shadow-xl shadow-black/25 flex items-center justify-between gap-4 text-slate-900 ${
                isAyah ? 'border-blue-200' : 'border-pink-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    طاقة شريكك الآن ({isAyah ? 'عبدالله 💙' : 'الملكة آية 🩷'})
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isPartnerOnline
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isPartnerOnline ? 'متصل الآن مباشر 🟢' : 'مزامنة فورية مفعلة ⚡'}
                  </span>
                </div>
                <div
                  className={`font-display text-xl font-extrabold ${
                    isAyah ? 'text-blue-600' : 'text-pink-600'
                  }`}
                >
                  {partnerMood?.label}
                </div>
                <p className="text-xs text-slate-600">
                  {partnerMood?.note || 'فرصة طيبة لكلمة لطيفة أو قهوة مسائية.'}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-bold text-lg shrink-0 shadow-lg ${
                  isAyah
                    ? 'bg-blue-600 shadow-blue-600/30'
                    : 'bg-pink-500 shadow-pink-500/30'
                }`}
              >
                {isAyah ? 'ع' : 'آ'}
              </div>
            </div>

            {/* My Quick Mood Picker */}
            <div
              className={`p-5 rounded-2xl border-2 bg-white shadow-xl shadow-black/25 space-y-2.5 text-slate-900 ${
                isAyah ? 'border-pink-200' : 'border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  طاقتي اليوم (تغيير بنقرة واحدة):
                </span>
                <span
                  className={`text-xs font-bold ${
                    isAyah ? 'text-pink-600' : 'text-blue-600'
                  }`}
                >
                  {myMood?.label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MOOD_OPTIONS.map((m) => {
                  const active = myMood?.moodId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onUpdateMood(m.id, m.label, myMood?.note || '');
                        showToast(`تم تحديث حالتك إلى: ${m.label}`);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                        active
                          ? isAyah
                            ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-500/20'
                            : 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Active SOS Request Banner (if unacknowledged) */}
          {latestSos && !latestSos.acknowledged && (
            <section className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-lg flex flex-wrap items-center justify-between gap-4 text-slate-900">
              <div className="flex items-center gap-3 text-xs">
                <Coffee className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900">
                    طلب جلسة خاصة من{' '}
                    {latestSos.fromUser === 'Abdullah'
                      ? 'عبدالله 💙'
                      : 'الملكة آية 🩷'}
                    :
                  </span>{' '}
                  <span className="text-amber-800 font-medium">
                    «{latestSos.message}»
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onAckSos(
                    latestSos.id,
                    'تمت الاستجابة بكل حب، موعدنا الليلة على القهوة ☕🤍'
                  );
                  showToast('تم تأكيد موعد القهوة الخاصة مع شريكك ☕🤍');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تلبية الدعوة الآن ☕</span>
              </button>
            </section>
          )}

          {/* 2. Highlighted Pending Approvals Banner (If partner logged something) */}
          {pendingForMe.length > 0 && (
            <section className="p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-xl shadow-black/25 space-y-3 text-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold text-amber-700">
                  🔔 لديك {pendingForMe.length} سجل بانتظار مصادقتك السريعة
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  مصادقتك تضيف النقاط لإحصائياتكما المشتركة فوراً
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingForMe.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span
                        className={`font-bold ${
                          log.createdBy === 'Abdullah'
                            ? 'text-blue-600'
                            : 'text-pink-600'
                        }`}
                      >
                        سجله {log.createdBy === 'Abdullah' ? 'عبدالله 💙' : 'آية 🩷'}
                      </span>
                      <span className="tabular-nums font-semibold text-slate-600">
                        {log.date} · {log.durationMinutes} د · {log.channel}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await onVerifyLog(log.id, 'approved');
                          showToast('تمت المصادقة على السجل بنجاح! +20 نقطة 🎉');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        <span>موافقة ومصادقة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDisputingId(disputingId === log.id ? null : log.id)
                        }
                        className="py-2 px-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer hover:bg-rose-100"
                      >
                        لي وجهة نظر
                      </button>
                    </div>
                    {disputingId === log.id && (
                      <div className="pt-2 space-y-2">
                        <input
                          type="text"
                          value={disputeText}
                          onChange={(e) => setDisputeText(e.target.value)}
                          placeholder="اكتب ملاحظتك بهدوء ليتم تأجيلها لنقاش الوجه لوجه..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                        {disputeHarshCheck.isHarsh && (
                          <div className="p-2.5 rounded-lg bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-1.5">
                            <p className="font-bold">
                              مستشار التهدئة: هل ترغب في إعادة صيغتها بشكل أكثر لطفاً؟
                            </p>
                            <p className="text-violet-700">
                              «{disputeHarshCheck.gentleSuggestion}»
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setDisputeText(disputeHarshCheck.gentleSuggestion)
                              }
                              className="px-2.5 py-1 rounded-md bg-violet-600 text-white text-[11px] font-bold cursor-pointer"
                            >
                              استخدم الصياغة اللطيفة ✨
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!disputeText.trim()) return;
                            await onVerifyLog(log.id, 'disputed', disputeText);
                            setDisputingId(null);
                            setDisputeText('');
                            showToast('تم تفعيل وضع التهدئة لنقاش الوجه لوجه 🤝');
                          }}
                          className="w-full py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                        >
                          تأجيل لنقاش هادئ وجهاً لوجه
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Horizontal Quick Day Scroller + Expandable Full Month Calendar */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-black/25 space-y-4 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  اختر اليوم ({parsedSelectedDate.fullLabel})
                </h2>
                <p className="text-xs text-slate-500">
                  شريط الأيام السريع أو افتح التقويم الشهري الكامل
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullMonthCalendar(!showFullMonthCalendar)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>
                  {showFullMonthCalendar
                    ? 'إخفاء التقويم الكامل'
                    : 'عرض تقويم الشهر كاملاً'}
                </span>
                {showFullMonthCalendar ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* 7-Day Thumb-Friendly Strip */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {quickDays.map((d) => {
                const isSelected = d.dateStr === selectedDate;
                const statusColor =
                  d.status === 'verified_high'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : d.status === 'disputed'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : d.status === 'low_comm'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700';

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => onSelectDate(d.dateStr)}
                    className={`py-2 sm:py-3 px-1 sm:px-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer min-w-0 ${statusColor} ${
                      isSelected
                        ? isAyah
                          ? 'ring-2 ring-pink-500 border-pink-500 text-pink-900 font-extrabold'
                          : 'ring-2 ring-blue-600 border-blue-600 text-blue-900 font-extrabold'
                        : 'hover:border-slate-300'
                    }`}
                  >
                    <span className="text-[10px] sm:text-[11px] opacity-80 truncate max-w-full">
                      {d.monthName}
                    </span>
                    <span className="text-sm sm:text-base font-display font-bold tabular-nums">
                      {d.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Expandable Full Month Grid */}
            {showFullMonthCalendar && (
              <div className="pt-3 border-t border-slate-200 grid grid-cols-7 gap-1.5">
                {fullMonthDates.map((dateStr) => {
                  const dayNum = Number(dateStr.split('-')[2]);
                  const st = computeDayStatus(
                    storeState.logs.filter((l) => l.date === dateStr),
                    storeState.ratings.filter((r) => r.date === dateStr)
                  );
                  const active = dateStr === selectedDate;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => onSelectDate(dateStr)}
                      className={`h-10 rounded-lg border text-xs font-bold tabular-nums transition-all cursor-pointer ${
                        st === 'verified_high'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : st === 'disputed'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : st === 'low_comm'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      } ${
                        active
                          ? isAyah
                            ? 'ring-2 ring-pink-500 text-pink-900'
                            : 'ring-2 ring-blue-600 text-blue-900'
                          : ''
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4. Main Two-Column Friendly Area: 1-Tap Quick Log Presets + Today's Feed & Positivity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Right 7 Cols: 1-Tap Quick Log Presets (No tedious form filling!) */}
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/25 space-y-5 text-slate-900">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  سجّل تواصلكما اليوم بنقرة واحدة ✨
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  اختر القالب الجاهز لتعبئة البيانات تلقائياً بدون عناء الكتابة الطويلة
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_PRESETS.map((preset) => {
                  const isChosen = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-4 rounded-xl border-2 text-right transition-all cursor-pointer flex items-start gap-3 ${
                        isChosen
                          ? isAyah
                            ? 'border-pink-500 bg-pink-50/70 ring-2 ring-pink-500/15'
                            : 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/15'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isChosen
                            ? isAyah
                              ? 'bg-pink-500 text-white'
                              : 'bg-blue-600 text-white'
                            : 'bg-white text-slate-500 border border-slate-200'
                        }`}
                      >
                        {preset.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-bold text-sm text-slate-900">
                          {preset.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {preset.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleQuickLogSave} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المدة (دقيقة):
                    </label>
                    <input
                      type="number"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الوقت:
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500"
                    >
                      <option value="صباحاً (8ص - 12م)">صباحاً (8ص - 12م)</option>
                      <option value="ظهراً (12م - 4م)">ظهراً (12م - 4م)</option>
                      <option value="عصراً (4م - 8م)">عصراً (4م - 8م)</option>
                      <option value="مساءً (8م - 12ص)">مساءً (8م - 12ص)</option>
                    </select>
                  </div>
                </div>

                {activePreset.quality === 'شبه معدوم' && (
                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">
                      سبب انخفاض التواصل اليوم:
                    </label>
                    <select
                      value={customLowReason}
                      onChange={(e) =>
                        setCustomLowReason(e.target.value as LowCommReason)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900"
                    >
                      <option value="ضغط عمل">ضغط عمل</option>
                      <option value="إرهاق">إرهاق</option>
                      <option value="التزامات خارج البيت">التزامات خارج البيت</option>
                      <option value="انشغال عائلي">انشغال عائلي</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تفاصيل اللحظة (جاهزة أو عدّلها كما تحب):
                  </label>
                  <input
                    type="text"
                    value={customDetails}
                    onChange={(e) => setCustomDetails(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                </div>

                {harshCheck.isHarsh && (
                  <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span>
                        مستشار التهدئة الذكي: هل ترغب في إعادة صيغتها بشكل أكثر لطفاً؟
                      </span>
                    </div>
                    <p className="text-violet-700">
                      «{harshCheck.gentleSuggestion}»
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        const gentle = await onRequestPeacekeeper(customDetails);
                        setCustomDetails(gentle);
                      }}
                      className="px-3 py-1 rounded-lg bg-violet-600 text-white font-bold cursor-pointer"
                    >
                      اعتماد الصياغة اللطيفة ✨
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 px-5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg ${
                    isAyah
                      ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                  }`}
                >
                  حفظ وتوثيق تواصل اليوم (+25 نقطة)
                </button>
              </form>
            </section>

            {/* Left 5 Cols: 1-Tap Satisfaction Rating + Quick Gratitude + Today's Logs */}
            <div className="lg:col-span-5 space-y-5">
              {/* 1-Tap Daily Satisfaction Card */}
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-black/25 space-y-3 text-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm sm:text-base font-bold text-slate-900">
                    هل أنت راضي عن التواصل اليوم؟
                  </h3>
                  <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">
                    {existingRating ? `${existingRating.stars}/5 نجوم` : 'لم يُقيّم بعد'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleOneTapRating(5, 'سعيد')}
                    className={`py-2.5 px-1.5 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                      existingRating?.feeling === 'سعيد'
                        ? isAyah
                          ? 'border-pink-500 bg-pink-50 text-pink-700 ring-1 ring-pink-500/20'
                          : 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    😊 سعيد (5)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOneTapRating(3, 'محايد')}
                    className={`py-2.5 px-1.5 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                      existingRating?.feeling === 'محايد'
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    😐 محايد (3)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOneTapRating(2, 'متضايق')}
                    className={`py-2.5 px-1.5 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                      existingRating?.feeling === 'متضايق'
                        ? 'border-rose-500 bg-rose-50 text-rose-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    😔 متضايق (2)
                  </button>
                </div>
              </section>

              {/* Quick Positivity & Gratitude Note */}
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-black/25 space-y-3 text-slate-900">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    بنك الإيجابيات ولحظة شكر 💌
                  </h3>
                  <Heart
                    className={`w-4 h-4 shrink-0 ${
                      isAyah
                        ? 'text-pink-500 fill-pink-500'
                        : 'text-blue-600 fill-blue-600'
                    }`}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gratitudeInput}
                    onChange={(e) => setGratitudeInput(e.target.value)}
                    placeholder="شيء جميل سواه شريكك اليوم وأعجبك..."
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!gratitudeInput.trim()) return;
                      await onAddGratitude(gratitudeInput.trim());
                      setGratitudeInput('');
                      showToast('تمت إضافة رسالتك في بنك الإيجابيات (+30 نقطة) 🩷');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer shrink-0 ${
                      isAyah
                        ? 'bg-pink-500 hover:bg-pink-400'
                        : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    إرسال
                  </button>
                </div>
                <div className="space-y-2 pt-1">
                  {storeState.gratitudes.length === 0 ? (
                    <p className="text-xs text-slate-500 py-1">
                      لا توجد رسائل شكر بعد — اكتب أول كلمة طيبة لشريكك اليوم 💌
                    </p>
                  ) : (
                    storeState.gratitudes.slice(0, 3).map((g) => (
                      <div
                        key={g.id}
                        className="text-xs text-slate-700 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span
                            className={`font-bold ${
                              g.fromUser === 'Abdullah'
                                ? 'text-blue-600'
                                : 'text-pink-600'
                            }`}
                          >
                            من {g.fromUser === 'Abdullah' ? 'عبدالله 💙' : 'آية 🩷'}
                          </span>
                          <span className="tabular-nums">{g.date}</span>
                        </div>
                        <p className="font-medium text-slate-800">«{g.content}»</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Selected Day Logs Summary */}
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-black/25 space-y-3 text-slate-900">
                <h3 className="font-display text-base font-bold text-slate-900">
                  سجلات يوم {parsedSelectedDate.dayNum} {parsedSelectedDate.monthName} (
                  {logsForSelectedDate.length})
                </h3>
                {logsForSelectedDate.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    لا توجد سجلات لهذا اليوم بعد — اختر أحد القوالب السريعة لتوثيق يومكما.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {logsForSelectedDate.map((l) => (
                      <div key={l.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span
                            className={`font-bold ${
                              l.createdBy === 'Abdullah'
                                ? 'text-blue-600'
                                : 'text-pink-600'
                            }`}
                          >
                            {l.createdBy === 'Abdullah' ? 'عبدالله 💙' : 'آية 🩷'} ·{' '}
                            {l.channel}
                          </span>
                          <span className="font-bold">
                            {l.status === 'approved' ? (
                              <span className="text-emerald-600">مُصادق</span>
                            ) : l.status === 'disputed' ? (
                              <span className="text-rose-600">مؤجل للنقاش</span>
                            ) : l.status === 'resolved' ? (
                              <span className="text-blue-600">تم الصلح</span>
                            ) : (
                              <span className="text-amber-600">معلق</span>
                            )}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-800">{l.details}</p>
                        {l.status === 'disputed' && (
                          <button
                            type="button"
                            onClick={() =>
                              onVerifyLog(
                                l.id,
                                'resolved',
                                undefined,
                                'تم النقاش وجهاً لوجه والصلح بمودة 🤝'
                              )
                            }
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Handshake className="w-3 h-3" />
                            <span>توثيق الصلح والتفاهم 🤝</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
