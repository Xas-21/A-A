import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, X } from 'lucide-react';
import { MoodEntry, MoodId, UserRole } from '../types';
import { getWelcomeMessage, MOOD_OPTIONS } from '../utils/communicationLogic';

interface WelcomeAndMoodModalProps {
  isOpen: boolean;
  role: UserRole;
  currentMood: MoodEntry;
  onSaveMoodAndClose: (moodId: MoodId, label: string, note: string) => void;
  onCloseOnly: () => void;
}

export const WelcomeAndMoodModal: React.FC<WelcomeAndMoodModalProps> = ({
  isOpen,
  role,
  currentMood,
  onSaveMoodAndClose,
  onCloseOnly,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodId>(
    currentMood?.moodId || 'calm'
  );
  const [note, setNote] = useState(currentMood?.note || '');

  const isAyah = role === 'Ayah';
  const welcome = getWelcomeMessage(role);

  useEffect(() => {
    if (isOpen) {
      setSelectedMood(currentMood?.moodId || 'calm');
      setNote(currentMood?.note || '');
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: isAyah
            ? ['#EC4899', '#F43F5E', '#FBBF24']
            : ['#2563EB', '#3B82F6', '#60A5FA'],
        });
      } catch {
        // Ignore confetti errors in headless environments
      }
    }
  }, [isOpen, role, isAyah, currentMood]);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen =
      MOOD_OPTIONS.find((m) => m.id === selectedMood) || MOOD_OPTIONS[1];
    onSaveMoodAndClose(chosen.id, chosen.label, note);
  };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className={`w-full max-w-lg bg-white text-slate-900 rounded-3xl border-2 p-6 md:p-8 shadow-2xl shadow-black/50 ${
            isAyah ? 'border-pink-400' : 'border-blue-500'
          }`}
        >
          {/* Header / Welcome Popup Greeting */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                  isAyah
                    ? 'bg-pink-500 shadow-pink-500/30'
                    : 'bg-blue-600 shadow-blue-600/30'
                }`}
              >
                {isAyah ? (
                  <Heart className="w-6 h-6 fill-white" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2
                  id="welcome-modal-title"
                  data-testid="welcome-popup-heading"
                  className={`font-display text-2xl font-extrabold ${
                    isAyah ? 'text-pink-600' : 'text-blue-600'
                  }`}
                >
                  {welcome.headline}
                </h2>
                <p className="text-xs text-slate-600 mt-1">{welcome.subtext}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseOnly}
              aria-label="إغلاق نافذة الترحيب"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Daily Mood & Energy Check-in */}
          <form onSubmit={handleConfirm} className="space-y-5">
            <div className="border-t border-slate-200 pt-4">
              <label className="block text-sm font-bold text-slate-900 mb-1">
                مؤشر طاقة اليوم — كيف حال طاقتك ومزاجك الآن؟
              </label>
              <p className="text-xs text-slate-500 mb-3">
                يظهر مؤشرك فوراً لشريكك في لوحة التحكم لتقدير ظروفك قبل الحكم على مستوى التواصل.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {MOOD_OPTIONS.map((option) => {
                  const active = selectedMood === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedMood(option.id)}
                      className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                        active
                          ? isAyah
                            ? 'border-pink-500 bg-pink-50 text-pink-900 font-bold ring-1 ring-pink-500/20'
                            : 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm">{option.label}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-1 line-clamp-2">
                        {option.adviceForPartner}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="mood-note-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                رسالة سريعة لشريكك حول يومك (اختياري):
              </label>
              <input
                id="mood-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isAyah
                    ? 'مثال: مشتاقة لجلستنا المسائية مع القهوة 🩷'
                    : 'مثال: يومي مزدحم قليلاً لكن متفرغ لكِ المساء 💙'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCloseOnly}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تخطي الآن
              </button>
              <button
                type="submit"
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-md ${
                  isAyah
                    ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                }`}
              >
                حفظ حالة اليوم والبدء
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
