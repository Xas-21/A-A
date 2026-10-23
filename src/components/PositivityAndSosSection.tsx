import React, { useState } from 'react';
import { Coffee, Heart, Send, CheckCircle2, Sparkles } from 'lucide-react';
import { GratitudeEntry, SosRequest, UserRole } from '../types';
import { detectHarshTone } from '../utils/communicationLogic';

interface PositivityAndSosSectionProps {
  currentUser: UserRole;
  gratitudes: GratitudeEntry[];
  sosRequests: SosRequest[];
  onAddGratitude: (content: string) => Promise<void>;
  onTriggerSos: (customMessage?: string) => Promise<void>;
  onAckSos: (sosId: string, responseNote?: string) => Promise<void>;
  onRequestPeacekeeper: (text: string) => Promise<string>;
}

export const PositivityAndSosSection: React.FC<PositivityAndSosSectionProps> = ({
  currentUser,
  gratitudes,
  sosRequests,
  onAddGratitude,
  onTriggerSos,
  onAckSos,
  onRequestPeacekeeper,
}) => {
  const isAyah = currentUser === 'Ayah';
  const partnerName = isAyah ? 'عبدالله 💙' : 'آية 🩷';

  const [gratitudeText, setGratitudeText] = useState('');
  const [sosNote, setSosNote] = useState('');
  const [sosSentBanner, setSosSentBanner] = useState(false);

  // Standalone AI Peacekeeper Tester & Advisor
  const [peacekeeperInput, setPeacekeeperInput] = useState('');
  const [peacekeeperResult, setPeacekeeperResult] = useState('');
  const [isLoadingPeace, setIsLoadingPeace] = useState(false);

  const livePeaceCheck = detectHarshTone(peacekeeperInput);

  const handleGratitudeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gratitudeText.trim()) return;
    await onAddGratitude(gratitudeText.trim());
    setGratitudeText('');
  };

  const handleSosClick = async () => {
    await onTriggerSos(
      sosNote.trim() || 'شريكك يحتاج جلسة تواصل خاصة اليوم لما تفضى ☕'
    );
    setSosNote('');
    setSosSentBanner(true);
  };

  const handlePeacekeeperConvert = async () => {
    if (!peacekeeperInput.trim()) return;
    setIsLoadingPeace(true);
    try {
      const res = await onRequestPeacekeeper(peacekeeperInput);
      setPeacekeeperResult(res);
    } finally {
      setIsLoadingPeace(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Right Column (7 cols): Positivity & Gratitude Bank (بنك الإيجابيات ولحظة شكر) */}
      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            بنك الإيجابيات و«لحظة شكر»
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            شيء جميل سواه الطرف الثاني اليوم وأعجبني — مساحة يومية للامتنان تحفظ الدفء والمودة
          </p>
        </div>

        <form onSubmit={handleGratitudeSubmit} className="space-y-3">
          <label
            htmlFor="gratitude-input"
            className="block text-xs font-semibold text-slate-700"
          >
            اكتب موقفاً لطيفاً أو كلمة شكر لـ {partnerName}:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="gratitude-input"
              type="text"
              value={gratitudeText}
              onChange={(e) => setGratitudeText(e.target.value)}
              placeholder="شيء جميل سواه الطرف الثاني اليوم وأعجبني..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isAyah
                  ? 'bg-pink-500 hover:bg-pink-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>إيداع في بنك الإيجابيات (+30 نقطة)</span>
            </button>
          </div>
        </form>

        <div className="divide-y divide-slate-100">
          {gratitudes.map((item) => {
            const fromAbdullah = item.fromUser === 'Abdullah';
            return (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold ${
                        fromAbdullah ? 'text-blue-600' : 'text-pink-600'
                      }`}
                    >
                      من {fromAbdullah ? 'عبدالله 💙' : 'آية 🩷'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      إلى {fromAbdullah ? 'الملكة آية 🩷' : 'عبدالله 💙'}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums">{item.date}</span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">
                  «{item.content}»
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Left Column (5 cols): SOS Special Time Request & Smart Peacekeeper */}
      <div className="lg:col-span-5 space-y-6">
        {/* SOS Communication Request Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                زر طلب وقت خاص (SOS تواصل)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                يرسل تنبيهاً ودياً عاجلاً لشريكك: «شريكك يحتاج جلسة تواصل خاصة اليوم لما تفضى ☕»
              </p>
            </div>
            <Coffee
              className={`w-6 h-6 shrink-0 ${
                isAyah ? 'text-pink-500' : 'text-blue-600'
              }`}
            />
          </div>

          <input
            type="text"
            value={sosNote}
            onChange={(e) => setSosNote(e.target.value)}
            placeholder="رسالة إضافية اختيارية (أو اتركها للرسالة الافتراضية ☕)..."
            aria-label="رسالة طلب وقت خاص"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
          />

          <button
            type="button"
            onClick={handleSosClick}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isAyah
                ? 'bg-pink-500 hover:bg-pink-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>إرسال طلب جلسة تواصل خاصة ☕</span>
          </button>

          {sosSentBanner && (
            <p className="text-xs text-emerald-700 font-semibold">
              ✓ وصل تنبيه «شريكك يحتاج جلسة تواصل خاصة اليوم لما تفضى ☕» إلى {partnerName} فوراً!
            </p>
          )}

          {/* Active / Past SOS Requests */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700">
              سجل طلبات الوقت الخاص:
            </h4>
            {sosRequests.slice(0, 3).map((sos) => {
              const isFromAbdullah = sos.fromUser === 'Abdullah';
              return (
                <div
                  key={sos.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-bold ${
                        isFromAbdullah ? 'text-blue-600' : 'text-pink-600'
                      }`}
                    >
                      طلب من {isFromAbdullah ? 'عبدالله 💙' : 'آية 🩷'}
                    </span>
                    <span className="text-slate-500">
                      {sos.acknowledged ? '✓ تمت الاستجابة' : '⏳ بانتظار التلبية'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800">
                    «{sos.message}»
                  </p>
                  {sos.acknowledged && sos.responseNote && (
                    <p className="text-xs text-emerald-700">
                      رد الشريك: {sos.responseNote}
                    </p>
                  )}
                  {!sos.acknowledged && (
                    <button
                      type="button"
                      onClick={() =>
                        onAckSos(
                          sos.id,
                          isAyah
                            ? 'عيوني لك يا عبدالله، الليلة جلستنا الخاصة ☕🩷'
                            : 'أبشري يا ملكتي آية، الليلة موعدنا على القهوة ☕💙'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تلبية الدعوة وتحديد الموعد ☕</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Smart Conflict Prevention & AI Peacekeeper Studio (مستشار التهدئة الذكي) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                مستشار التهدئة الذكي
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                حوّل رسائل العتب أو الانفعال إلى عبارات دافئة تضمن تفهم الطرف الآخر
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-violet-600 shrink-0" />
          </div>

          <textarea
            rows={2}
            value={peacekeeperInput}
            onChange={(e) => {
              setPeacekeeperInput(e.target.value);
              setPeacekeeperResult('');
            }}
            placeholder="جرب كتابة عذر أو عتب مثل: أنت دائماً تتجاهلني وما تهتم..."
            aria-label="نص العتب لإعادة صياغته بلطف"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
          />

          {livePeaceCheck.isHarsh && (
            <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-1">
              <p className="font-bold">
                تنبيه لطيف: هل ترغب في إعادة صيغتها بشكل أكثر لطفاً لضمان فهم الطرف الآخر؟
              </p>
              <p className="text-violet-700">
                الصياغة الودية المقترحة: «{livePeaceCheck.gentleSuggestion}»
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={isLoadingPeace || !peacekeeperInput.trim()}
            onClick={handlePeacekeeperConvert}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isLoadingPeace
              ? 'جاري صياغة الرسالة بلطف...'
              : 'إعادة صياغة الرسالة بلطف ومودة ✨'}
          </button>

          {peacekeeperResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="font-bold text-emerald-800">
                الصياغة جاهزة للإرسال:
              </div>
              <p className="leading-relaxed">«{peacekeeperResult}»</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
