import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Coffee,
  Heart,
  Sparkles,
  Star,
  ArrowLeft,
  ArrowRight,
  Handshake,
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
  UserRole,
  VerificationStatus,
} from '../../types';
import {
  computeDayStatus,
  detectHarshTone,
  MonthlyAnalyticsSummary,
  MOOD_OPTIONS,
} from '../../utils/communicationLogic';
import { MonthlyAnalyticsSection } from '../MonthlyAnalyticsSection';
import { GamificationAndVaultSection } from '../GamificationAndVaultSection';

interface DesignThreeProps {
  currentUser: UserRole;
  storeState: CoupleStoreState;
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
  onRequestPeacekeeper: (text: string) => Promise<string>;
}

const STEPS = [
  { id: 1, title: '١. طاقتنا وقهوتنا', subtitle: 'اطمئن على شريكك وحدد طاقتك' },
  { id: 2, title: '٢. تواصل اليوم والمصادقة', subtitle: 'سجّل أو صادق بلمسة هادئة' },
  { id: 3, title: '٣. الامتنان والكوبونات', subtitle: 'كلمة طيبة ومكافآت دافئة' },
  { id: 4, title: '٤. حكاية الشهر', subtitle: 'ملخص رحلتكما والرسوم البيانية' },
];

export const DesignThreeZenRitual: React.FC<DesignThreeProps> = ({
  currentUser,
  storeState,
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
  onRequestPeacekeeper,
}) => {
  const isAyah = currentUser === 'Ayah';
  const myMood = storeState.moods[currentUser];
  const partnerRole: UserRole = isAyah ? 'Abdullah' : 'Ayah';
  const partnerMood = storeState.moods[partnerRole];

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [channel, setChannel] = useState<CommunicationChannel>('جلسة شخصية بالبيت');
  const [quality, setQuality] = useState<CommunicationQuality>('عميق/فعّال');
  const [lowReason, setLowReason] = useState<LowCommReason>('ضغط عمل');
  const [duration, setDuration] = useState<number>(60);
  const [details, setDetails] = useState(
    'جلسة مسائية هادئة تحدثنا فيها عن تفاصيل يومنا وخطط نهاية الأسبوع.'
  );
  const [gratitudeNote, setGratitudeNote] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const toneCheck = detectHarshTone(details);
  const dayLogs = storeState.logs.filter((l) => l.date === selectedDate);

  const flashNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Progress Wizard Bar */}
      <nav
        aria-label="خطوات اليوم الهادئة"
        className="bg-white border border-slate-200 rounded-3xl p-3 grid grid-cols-2 md:grid-cols-4 gap-2"
      >
        {STEPS.map((st) => {
          const active = currentStep === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setCurrentStep(st.id)}
              className={`p-3 rounded-2xl text-right transition-all cursor-pointer ${
                active
                  ? isAyah
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="font-display text-xs font-extrabold">
                {st.title}
              </div>
              <div
                className={`text-[11px] mt-0.5 ${
                  active ? 'text-white/90' : 'text-slate-500'
                }`}
              >
                {st.subtitle}
              </div>
            </button>
          );
        })}
      </nav>

      {savedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center">
          {savedNotice}
        </div>
      )}

      {/* STEP 1: Calm Mood & Partner Capacity + SOS Coffee */}
      {currentStep === 1 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-8"
        >
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-slate-400">
              الخطوة الأولى · البداية الهادئة
            </span>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">
              كيف حال طاقتكما اليوم؟
            </h2>
            <p className="text-sm text-slate-600">
              تفهّم طاقة الشريك هو أول خطوة لتواصل ناجح وخالٍ من سوء الفهم
            </p>
          </div>

          {/* Partner Energy Highlight */}
          <div
            className={`p-6 rounded-2xl border text-center space-y-2 ${
              isAyah
                ? 'bg-blue-50/50 border-blue-200'
                : 'bg-pink-50/50 border-pink-200'
            }`}
          >
            <span className="text-xs font-bold text-slate-500">
              حالة شريكك ({isAyah ? 'عبدالله 💙' : 'الملكة آية 🩷'}) الآن:
            </span>
            <div
              className={`font-display text-2xl font-extrabold ${
                isAyah ? 'text-blue-600' : 'text-pink-600'
              }`}
            >
              {partnerMood?.label}
            </div>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              «{partnerMood?.note || 'يتمنى لك يوماً هادئاً وجميلاً'}»
            </p>
          </div>

          {/* Select My Mood with Huge Friendly Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 text-center">
              اضغط لاختيار حالتك اليوم:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MOOD_OPTIONS.map((m) => {
                const isSelected = myMood?.moodId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={async () => {
                      await onUpdateMood(m.id, m.label, myMood?.note || '');
                      flashNotice(`تم تحديث طاقتك إلى: ${m.label}`);
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? isAyah
                          ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500/20'
                          : 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-display text-base font-bold text-slate-900">
                      {m.label}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {m.adviceForPartner}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Big Friendly SOS Button + Next Step */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={async () => {
                await onTriggerSos(
                  'شريكك يحتاج جلسة تواصل خاصة اليوم لما تفضى ☕'
                );
                flashNotice('تم إرسال دعوة القهوة الخاصة لشريكك بكل حب ☕');
              }}
              className="px-5 py-3 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Coffee className="w-4 h-4" />
              <span>إرسال دعوة: «نحتاج جلسة قهوة خاصة اليوم لما تفضى ☕»</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`px-6 py-3 rounded-2xl text-white text-xs font-bold flex items-center gap-2 cursor-pointer ${
                isAyah ? 'bg-pink-500' : 'bg-blue-600'
              }`}
            >
              <span>الانتقال لتوثيق اليوم</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </motion.section>
      )}

      {/* STEP 2: Simple Calendar Strip, Mutual Approval & 1-Card Logging */}
      {currentStep === 2 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400">
                الخطوة الثانية · توثيق ومصادقة
              </span>
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                تواصل يوم {Number(selectedDate.split('-')[2])} أكتوبر
              </h2>
            </div>

            {/* Compact Day Picker */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[19, 20, 21, 22, 23].map((d) => {
                const dStr = `2026-10-${d}`;
                const st = computeDayStatus(
                  storeState.logs.filter((l) => l.date === dStr),
                  storeState.ratings.filter((r) => r.date === dStr)
                );
                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => onSelectDate(dStr)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold tabular-nums cursor-pointer ${
                      selectedDate === dStr
                        ? isAyah
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-blue-600 text-white border-blue-600'
                        : st === 'verified_high'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {d} أكتوبر
                  </button>
                );
              })}
            </div>
          </div>

          {/* Existing Logs for Day (Approve or Resolve with 1 click) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-600">
              السجلات الموثقة في هذا اليوم ({dayLogs.length}):
            </h3>
            {dayLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700">
                    {log.createdBy === 'Abdullah' ? 'عبدالله 💙' : 'آية 🩷'} ·{' '}
                    {log.channel} ({log.durationMinutes} د · {log.quality})
                  </div>
                  <p className="text-sm text-slate-900">{log.details}</p>
                </div>
                <div className="flex items-center gap-2">
                  {log.status === 'pending' && log.createdBy !== currentUser && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onVerifyLog(log.id, 'approved');
                        flashNotice('تمت المصادقة على سجل شريكك بنجاح! 🎉');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>مصادقة السجل</span>
                    </button>
                  )}
                  {log.status === 'disputed' && (
                    <button
                      type="button"
                      onClick={() =>
                        onVerifyLog(
                          log.id,
                          'resolved',
                          undefined,
                          'تم النقاش وجهاً لوجه والصلح بمودة 🤝'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Handshake className="w-4 h-4" />
                      <span>تم الصلح والتفاهم 🤝</span>
                    </button>
                  )}
                  {log.status === 'approved' && (
                    <span className="text-xs font-bold text-emerald-700">
                      ✓ مُصادق عليه
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Simple Guided Form to Add Today's Connection */}
          <div className="p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900">
              أضف سجل تواصل جديد لهذا اليوم:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={channel}
                onChange={(e) =>
                  setChannel(e.target.value as CommunicationChannel)
                }
                aria-label="وسيلة التواصل"
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              >
                <option value="جلسة شخصية بالبيت">جلسة شخصية بالبيت</option>
                <option value="اتصال هاتفي">اتصال هاتفي</option>
                <option value="واتساب">واتساب</option>
                <option value="سناب شات">سناب شات</option>
                <option value="تواصل قليل/شبه معدوم">تواصل قليل/شبه معدوم</option>
              </select>
              <select
                value={quality}
                onChange={(e) =>
                  setQuality(e.target.value as CommunicationQuality)
                }
                aria-label="جودة التواصل"
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
              >
                <option value="عميق/فعّال">عميق/فعّال</option>
                <option value="سطحي/روتيني">سطحي/روتيني</option>
                <option value="شبه معدوم">شبه معدوم</option>
              </select>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                aria-label="المدة بالدقائق"
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold tabular-nums"
              />
            </div>

            {quality === 'شبه معدوم' && (
              <select
                value={lowReason}
                onChange={(e) => setLowReason(e.target.value as LowCommReason)}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900"
              >
                <option value="ضغط عمل">السبب: ضغط عمل</option>
                <option value="إرهاق">السبب: إرهاق</option>
                <option value="التزامات خارج البيت">السبب: التزامات خارج البيت</option>
              </select>
            )}

            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
            />

            {toneCheck.isHarsh && (
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 flex items-center justify-between">
                <span>
                  مستشار التهدئة: «{toneCheck.gentleSuggestion}»
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const g = await onRequestPeacekeeper(details);
                    setDetails(g);
                  }}
                  className="px-3 py-1 rounded-lg bg-violet-600 text-white font-bold cursor-pointer"
                >
                  اعتماد الصياغة اللطيفة ✨
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">
                  تقييم رضاك اليوم:
                </span>
                {(['سعيد', 'محايد', 'متضايق'] as SatisfactionMood[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onSaveRating({
                        date: selectedDate,
                        user: currentUser,
                        stars: m === 'سعيد' ? 5 : m === 'محايد' ? 3 : 2,
                        feeling: m,
                      });
                      flashNotice(`تم تسجيل شعورك اليوم: ${m}`);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!details.trim()) return;
                  await onAddLog({
                    date: selectedDate,
                    createdBy: currentUser,
                    channel,
                    durationMinutes: duration,
                    quality,
                    lowCommReason:
                      quality === 'شبه معدوم' ? lowReason : undefined,
                    details,
                    timeSlot: 'مساءً (8م - 12ص)',
                  });
                  flashNotice('تم حفظ السجل وإرساله للمصادقة بنجاح ✨');
                }}
                className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer ${
                  isAyah ? 'bg-pink-500' : 'bg-blue-600'
                }`}
              >
                حفظ السجل (+25 نقطة)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق: طاقة اليوم</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                isAyah ? 'bg-pink-500' : 'bg-blue-600'
              }`}
            >
              <span>التالي: الامتنان والكوبونات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </motion.section>
      )}

      {/* STEP 3: Gratitude & Rewards Store */}
      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-900">
              لحظة شكر وامتنان لشريكك 🩷
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={gratitudeNote}
                onChange={(e) => setGratitudeNote(e.target.value)}
                placeholder="شيء جميل سواه الطرف الثاني اليوم وأعجبني..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!gratitudeNote.trim()) return;
                  await onAddGratitude(gratitudeNote.trim());
                  setGratitudeNote('');
                  flashNotice('تم إيداع رسالة الشكر في بنك الإيجابيات (+30 نقطة)!');
                }}
                className={`px-5 py-2.5 rounded-2xl text-white text-xs font-bold cursor-pointer ${
                  isAyah ? 'bg-pink-500' : 'bg-blue-600'
                }`}
              >
                إيداع الشكر
              </button>
            </div>
          </section>

          <GamificationAndVaultSection
            currentUser={currentUser}
            points={storeState.points}
            badges={analytics.badges}
            coupons={storeState.coupons}
            memories={storeState.memories}
            onRedeemCoupon={onRedeemCoupon}
            onAddMemory={onAddMemory}
          />
        </motion.div>
      )}

      {/* STEP 4: Monthly Story & Analytics */}
      {currentStep === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MonthlyAnalyticsSection analytics={analytics} />
        </motion.div>
      )}
    </div>
  );
};
