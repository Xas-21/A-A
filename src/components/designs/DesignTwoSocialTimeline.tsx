import React, { useState } from 'react';
import {
  Check,
  Coffee,
  Heart,
  Sparkles,
  Star,
  Calendar as CalendarIcon,
  Gift,
  BarChart3,
  Send,
  Handshake,
  MessageSquareHeart,
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

interface DesignTwoProps {
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

export const DesignTwoSocialTimeline: React.FC<DesignTwoProps> = ({
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

  const [activeStorySheet, setActiveStorySheet] = useState<
    'feed' | 'calendar' | 'coupons' | 'analytics' | 'mood'
  >('feed');

  // Bottom Chat-Style Composer State
  const [composerMode, setComposerMode] = useState<'log' | 'gratitude' | 'rating'>(
    'log'
  );
  const [channel, setChannel] = useState<CommunicationChannel>('جلسة شخصية بالبيت');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [quality, setQuality] = useState<CommunicationQuality>('عميق/فعّال');
  const [lowReason, setLowReason] = useState<LowCommReason>('ضغط عمل');
  const [messageText, setMessageText] = useState('');
  const [disputingLogId, setDisputingLogId] = useState<string | null>(null);
  const [disputeNote, setDisputeNote] = useState('');

  const toneCheck = detectHarshTone(messageText);
  const disputeToneCheck = detectHarshTone(disputeNote);

  const handleComposerSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (composerMode === 'gratitude') {
      await onAddGratitude(messageText.trim());
      setMessageText('');
      return;
    }

    await onAddLog({
      date: selectedDate,
      createdBy: currentUser,
      channel,
      durationMinutes,
      quality,
      lowCommReason: quality === 'شبه معدوم' ? lowReason : undefined,
      details: messageText.trim(),
      timeSlot: 'مساءً (8م - 12ص)',
    });
    setMessageText('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Instagram-Style Story Circles Bar */}
      <section className="bg-white border border-slate-200 rounded-3xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between gap-4 min-w-max">
          <div className="flex items-center gap-4">
            {/* Story 1: Feed Home */}
            <button
              type="button"
              onClick={() => setActiveStorySheet('feed')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-full p-0.5 border-2 transition-transform group-hover:scale-105 flex items-center justify-center ${
                  activeStorySheet === 'feed'
                    ? isAyah
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">
                شريط الحوار
              </span>
            </button>

            {/* Story 2: Abdullah's Mood Bubble */}
            <button
              type="button"
              onClick={() => setActiveStorySheet('mood')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full border-2 border-blue-600 bg-blue-50 flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-xs font-extrabold text-blue-700">ع 💙</span>
                <span className="text-[10px]">
                  {storeState.moods.Abdullah.label.split(' ')[1] || '😊'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-blue-700">
                {storeState.moods.Abdullah.label}
              </span>
            </button>

            {/* Story 3: Ayah's Mood Bubble */}
            <button
              type="button"
              onClick={() => setActiveStorySheet('mood')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full border-2 border-pink-500 bg-pink-50 flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-xs font-extrabold text-pink-600">آ 🩷</span>
                <span className="text-[10px]">
                  {storeState.moods.Ayah.label.split(' ')[1] || '😊'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-pink-600">
                {storeState.moods.Ayah.label}
              </span>
            </button>

            {/* Story 4: Calendar Filter */}
            <button
              type="button"
              onClick={() => setActiveStorySheet('calendar')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center group-hover:scale-105 transition-transform ${
                  activeStorySheet === 'calendar'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <CalendarIcon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">
                تقويم الشهر
              </span>
            </button>

            {/* Story 5: Coupons & Vault */}
            <button
              type="button"
              onClick={() => setActiveStorySheet('coupons')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center group-hover:scale-105 transition-transform ${
                  activeStorySheet === 'coupons'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <Gift className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">
                الكوبونات ({storeState.points[currentUser]})
              </span>
            </button>

            {/* Story 6: Monthly Report */}
            <button
              type="button"
              onClick={() => setActiveStorySheet('analytics')}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center group-hover:scale-105 transition-transform ${
                  activeStorySheet === 'analytics'
                    ? 'border-violet-600 bg-violet-50 text-violet-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">
                ملخص الشهر
              </span>
            </button>
          </div>

          {/* Quick Coffee Invite Button */}
          <button
            type="button"
            onClick={() =>
              onTriggerSos('شريكك يحتاج جلسة تواصل خاصة اليوم لما تفضى ☕')
            }
            className={`px-4 py-3 rounded-2xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shrink-0 ${
              isAyah
                ? 'bg-pink-500 hover:bg-pink-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>نداء قهوة خاصة ☕</span>
          </button>
        </div>
      </section>

      {/* Conditional Story Views */}
      {activeStorySheet === 'mood' && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900">
              تحديث قصة طاقتي اليوم ({isAyah ? 'الملكة آية 🩷' : 'عبدالله 💙'})
            </h3>
            <button
              type="button"
              onClick={() => setActiveStorySheet('feed')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              العودة للحوار ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={async () => {
                  await onUpdateMood(m.id, m.label, myMood?.note || '');
                  setActiveStorySheet('feed');
                }}
                className={`p-4 rounded-2xl border text-right cursor-pointer transition-all ${
                  myMood?.moodId === m.id
                    ? isAyah
                      ? 'border-pink-500 bg-pink-50 font-bold'
                      : 'border-blue-600 bg-blue-50 font-bold'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-bold">{m.label}</div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {m.adviceForPartner}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeStorySheet === 'calendar' && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-900">
              اختر يوماً من تقويم أكتوبر ٢٠٢٦
            </h3>
            <button
              type="button"
              onClick={() => setActiveStorySheet('feed')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              العودة للحوار ✕
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
              const dateStr = `2026-10-${d < 10 ? `0${d}` : d}`;
              const st = computeDayStatus(
                storeState.logs.filter((l) => l.date === dateStr),
                storeState.ratings.filter((r) => r.date === dateStr)
              );
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    onSelectDate(dateStr);
                    setActiveStorySheet('feed');
                  }}
                  className={`h-12 rounded-xl border text-xs font-bold tabular-nums cursor-pointer ${
                    st === 'verified_high'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : st === 'disputed'
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : st === 'low_comm'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  } ${
                    selectedDate === dateStr ? 'ring-2 ring-slate-900' : ''
                  }`}
                >
                  {d} أكتوبر
                </button>
              );
            })}
          </div>
        </section>
      )}

      {activeStorySheet === 'coupons' && (
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

      {activeStorySheet === 'analytics' && (
        <MonthlyAnalyticsSection analytics={analytics} />
      )}

      {/* Main Conversational Feed + Chat Composer */}
      {activeStorySheet === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Chat-Style Timeline Stream (8 Cols) */}
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  شريط الحوار واللحظات الموثقة
                </h2>
                <p className="text-xs text-slate-500">
                  كل سجل تواصل أو رسالة امتنان يظهر كرسالة تفاعلية يمكنك المصادقة عليها بلمسة واحدة
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 tabular-nums">
                التاريخ النشط: {selectedDate}
              </span>
            </div>

            {/* Active SOS Callout in Feed */}
            {storeState.sosRequests[0] && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <Coffee className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-950">
                      نداء قهوة من{' '}
                      {storeState.sosRequests[0].fromUser === 'Abdullah'
                        ? 'عبدالله 💙'
                        : 'آية 🩷'}
                      :
                    </span>{' '}
                    <span className="text-amber-900">
                      «{storeState.sosRequests[0].message}»
                    </span>
                  </div>
                </div>
                {!storeState.sosRequests[0].acknowledged ? (
                  <button
                    type="button"
                    onClick={() =>
                      onAckSos(
                        storeState.sosRequests[0].id,
                        'أبشر/ي، الليلة جلستنا الخاصة مع القهوة ☕🤍'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-amber-700 text-white text-xs font-bold cursor-pointer"
                  >
                    تلبية الدعوة الآن ☕
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>تمت تلبية الدعوة بحب</span>
                  </span>
                )}
              </div>
            )}

            {/* Chat Bubbles Feed (Newest First) */}
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {[...storeState.logs]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 8)
                .map((log) => {
                  const isAbdullahLog = log.createdBy === 'Abdullah';
                  const canVerify =
                    log.status === 'pending' && log.createdBy !== currentUser;

                  return (
                    <div
                      key={log.id}
                      className={`flex flex-col ${
                        isAbdullahLog ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div
                        className={`w-full sm:w-4/5 p-4 rounded-2xl border space-y-2 ${
                          isAbdullahLog
                            ? 'bg-blue-50/60 border-blue-200'
                            : 'bg-pink-50/60 border-pink-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-bold ${
                              isAbdullahLog ? 'text-blue-700' : 'text-pink-600'
                            }`}
                          >
                            {isAbdullahLog ? 'عبدالله 💙' : 'الملكة آية 🩷'} ·{' '}
                            {log.channel}
                          </span>
                          <span className="text-slate-500 tabular-nums">
                            {log.date} · {log.durationMinutes} دقيقة
                          </span>
                        </div>

                        <p className="text-sm text-slate-900 leading-relaxed">
                          {log.details}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                          <span className="text-slate-600">
                            الجودة: {log.quality}
                            {log.lowCommReason ? ` · العذر: ${log.lowCommReason}` : ''}
                          </span>

                          {log.status === 'approved' && (
                            <span className="text-emerald-700 font-bold">
                              ❤️ تمت المصادقة
                            </span>
                          )}
                          {log.status === 'resolved' && (
                            <span className="text-blue-700 font-bold">
                              🤝 تم الصلح والتفاهم
                            </span>
                          )}
                          {log.status === 'disputed' && (
                            <div className="flex items-center gap-2">
                              <span className="text-red-600 font-bold">
                                ⚠️ مؤجل لنقاش الوجه لوجه
                              </span>
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
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                تم الصلح 🤝
                              </button>
                            </div>
                          )}
                          {log.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              {canVerify ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onVerifyLog(log.id, 'approved')}
                                    className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>مصادقة ❤️</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDisputingLogId(
                                        disputingLogId === log.id ? null : log.id
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold cursor-pointer"
                                  >
                                    تحفظ
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-500">
                                  ⏳ بانتظار تفاعل الشريك
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {disputingLogId === log.id && (
                          <div className="pt-2 space-y-2">
                            <input
                              type="text"
                              value={disputeNote}
                              onChange={(e) => setDisputeNote(e.target.value)}
                              placeholder="اكتب ملاحظتك بهدوء..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                            />
                            {disputeToneCheck.isHarsh && (
                              <div className="p-2 rounded-lg bg-violet-50 border border-violet-200 text-xs text-violet-900 flex items-center justify-between gap-2">
                                <span>
                                  اقتراح لطيف: «{disputeToneCheck.gentleSuggestion}»
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDisputeNote(disputeToneCheck.gentleSuggestion)
                                  }
                                  className="px-2 py-1 rounded bg-violet-600 text-white font-bold shrink-0 cursor-pointer"
                                >
                                  اعتماد ✨
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                if (!disputeNote.trim()) return;
                                await onVerifyLog(log.id, 'disputed', disputeNote);
                                setDisputingLogId(null);
                                setDisputeNote('');
                              }}
                              className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                            >
                              تأجيل لنقاش الوجه لوجه
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Bottom Chat-Style Composer */}
            <form
              onSubmit={handleComposerSend}
              className="pt-4 border-t border-slate-200 space-y-3"
            >
              {/* Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setComposerMode('log')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      composerMode === 'log'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    📝 رسالة توثيق تواصل
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerMode('gratitude')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      composerMode === 'gratitude'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    💌 رسالة شكر وامتنان
                  </button>
                </div>

                {composerMode === 'log' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={channel}
                      onChange={(e) =>
                        setChannel(e.target.value as CommunicationChannel)
                      }
                      aria-label="وسيلة التواصل"
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                    >
                      <option value="جلسة شخصية بالبيت">جلسة بالبيت</option>
                      <option value="اتصال هاتفي">اتصال هاتفي</option>
                      <option value="واتساب">واتساب</option>
                      <option value="سناب شات">سناب شات</option>
                      <option value="تواصل قليل/شبه معدوم">تواصل قليل</option>
                    </select>
                    <select
                      value={quality}
                      onChange={(e) =>
                        setQuality(e.target.value as CommunicationQuality)
                      }
                      aria-label="جودة التواصل"
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                    >
                      <option value="عميق/فعّال">عميق/فعّال</option>
                      <option value="سطحي/روتيني">سطحي/روتيني</option>
                      <option value="شبه معدوم">شبه معدوم</option>
                    </select>
                  </div>
                )}
              </div>

              {/* AI Peacekeeper Live Bar above Chat Input */}
              {toneCheck.isHarsh && (
                <div className="p-3 rounded-2xl bg-violet-50 border border-violet-200 text-xs text-violet-900 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold">
                      مستشار التهدئة الذكي: هل ترغب في صياغة ألطف؟
                    </span>{' '}
                    «{toneCheck.gentleSuggestion}»
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const gentle = await onRequestPeacekeeper(messageText);
                      setMessageText(gentle);
                    }}
                    className="px-3 py-1 rounded-xl bg-violet-600 text-white font-bold cursor-pointer"
                  >
                    اعتماد الصياغة اللطيفة ✨
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    composerMode === 'gratitude'
                      ? 'اكتب شيئاً جميلاً سواه شريكك اليوم وأعجبك...'
                      : 'اكتب ملخص تواصلكما اليوم مثل رسالة سريعة لشريكك...'
                  }
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-slate-900"
                />
                <button
                  type="submit"
                  className={`px-5 py-3 rounded-2xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isAyah
                      ? 'bg-pink-500 hover:bg-pink-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال</span>
                </button>
              </div>
            </form>
          </section>

          {/* Side Column (4 Cols): Daily Pulse & Gratitude Wall */}
          <div className="lg:col-span-4 space-y-5">
            {/* Quick Rating Card */}
            <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
              <h3 className="font-display text-base font-bold text-slate-900">
                نبض الرضا ليوم {Number(selectedDate.split('-')[2])} أكتوبر
              </h3>
              <p className="text-xs text-slate-500">
                لمسة واحدة لتقييم رضاك عن الحوار اليوم:
              </p>
              <div className="flex items-center justify-between gap-2">
                {([5, 4, 3, 2, 1] as number[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() =>
                      onSaveRating({
                        date: selectedDate,
                        user: currentUser,
                        stars: st,
                        feeling: st >= 4 ? 'سعيد' : st === 3 ? 'محايد' : 'متضايق',
                      })
                    }
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold tabular-nums cursor-pointer flex items-center justify-center gap-1 ${
                      isAyah
                        ? 'hover:border-pink-500 hover:bg-pink-50'
                        : 'hover:border-blue-600 hover:bg-blue-50'
                    } border-slate-200`}
                  >
                    <span>{st}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </button>
                ))}
              </div>
            </section>

            {/* Gratitude Stream */}
            <section className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-slate-900">
                  جدار الامتنان ولحظات الشكر 🩷
                </h3>
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              </div>
              <div className="space-y-2.5">
                {storeState.gratitudes.slice(0, 4).map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
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
                    <p className="text-xs text-slate-800">«{g.content}»</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
