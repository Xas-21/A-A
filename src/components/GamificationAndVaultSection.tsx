import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Gift,
  Sparkles,
  Plus,
  Coffee,
  Utensils,
  Sun,
  Home,
} from 'lucide-react';
import { CouponItem, MemoryItem, UserRole } from '../types';
import {
  MonthlyAnalyticsSummary,
  getTodayDateStr,
} from '../utils/communicationLogic';

interface GamificationAndVaultSectionProps {
  currentUser: UserRole;
  points: Record<UserRole, number>;
  badges: MonthlyAnalyticsSummary['badges'];
  coupons: CouponItem[];
  memories: MemoryItem[];
  onRedeemCoupon: (couponId: string) => Promise<void>;
  onAddMemory: (memory: Partial<MemoryItem>) => Promise<void>;
}

export const GamificationAndVaultSection: React.FC<
  GamificationAndVaultSectionProps
> = ({
  currentUser,
  points,
  badges,
  coupons,
  memories,
  onRedeemCoupon,
  onAddMemory,
}) => {
  const isAyah = currentUser === 'Ayah';
  const myPoints = points[currentUser] || 0;

  const [memTitle, setMemTitle] = useState('');
  const [memNote, setMemNote] = useState('');
  const [memTheme, setMemTheme] = useState<MemoryItem['theme']>('coffee');
  const [redeemFeedback, setRedeemFeedback] = useState<string>('');

  const handleCouponClick = async (coupon: CouponItem) => {
    if (myPoints < coupon.costPoints) {
      setRedeemFeedback(
        `رصيد نقاطك الحالي (${myPoints}) أقل من تكلفة الكوبون (${coupon.costPoints}).`
      );
      return;
    }
    await onRedeemCoupon(coupon.id);
    setRedeemFeedback(`مبارك! تم تفعيل «${coupon.title}» بنجاح 🎉`);
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: isAyah
          ? ['#EC4899', '#F43F5E', '#FBBF24']
          : ['#2563EB', '#3B82F6', '#34D399'],
      });
    } catch {
      // Ignore in headless environments
    }
  };

  const handleMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memTitle.trim() || !memNote.trim()) return;
    await onAddMemory({
      title: memTitle.trim(),
      note: memNote.trim(),
      theme: memTheme,
      createdBy: currentUser,
      date: getTodayDateStr(),
    });
    setMemTitle('');
    setMemNote('');
  };

  const renderMemoryIllustration = (theme: MemoryItem['theme']) => {
    switch (theme) {
      case 'coffee':
        return (
          <div className="h-36 w-full rounded-xl bg-gradient-to-br from-amber-50 via-white to-rose-50 border border-amber-200 flex flex-col items-center justify-center p-4 text-amber-900">
            <Coffee className="w-9 h-9 text-amber-600 mb-2" />
            <span className="text-xs font-display font-bold">
              جلسة قهوة وحوار دافئ
            </span>
          </div>
        );
      case 'dinner':
        return (
          <div className="h-36 w-full rounded-xl bg-gradient-to-br from-pink-50 via-white to-amber-50 border border-pink-200 flex flex-col items-center justify-center p-4 text-pink-900">
            <Utensils className="w-9 h-9 text-pink-500 mb-2" />
            <span className="text-xs font-display font-bold">
              عشاء خاص على ضوء الشموع
            </span>
          </div>
        );
      case 'stroll':
        return (
          <div className="h-36 w-full rounded-xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-200 flex flex-col items-center justify-center p-4 text-blue-900">
            <Sun className="w-9 h-9 text-blue-600 mb-2" />
            <span className="text-xs font-display font-bold">
              مشوار الغروب وضحكات الطريق
            </span>
          </div>
        );
      default:
        return (
          <div className="h-36 w-full rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 flex flex-col items-center justify-center p-4 text-slate-800">
            <Home className="w-9 h-9 text-slate-600 mb-2" />
            <span className="text-xs font-display font-bold">
              أمسية منزلية هادئة
            </span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* 1. Badges System (نظام الشارات والأوسمة) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-black/25">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              الشارات وأوسمة المودة
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              شارات تُفتح تلقائياً مع استمرار التواصل الإيجابي، المبادرة، وحل الخلافات بود
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs tabular-nums">
            <span className="text-blue-600 font-bold">
              نقاط عبدالله: {points.Abdullah} 💙
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="text-pink-600 font-bold">
              نقاط آية: {points.Ayah} 🩷
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-xl border transition-all ${
                badge.unlocked
                  ? 'border-slate-200 bg-slate-50/90'
                  : 'border-dashed border-slate-300 bg-slate-50/50 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    badge.holder === 'عبدالله'
                      ? 'bg-blue-600 text-white'
                      : badge.holder === 'آية'
                      ? 'bg-pink-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {badge.unlocked ? 'شارة مكتسبة' : 'قيد التقدم'} · حاملها:{' '}
                  {badge.holder}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-1">
                {badge.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {badge.description}
              </p>
              <div className="text-xs tabular-nums text-slate-500 font-semibold pt-2 border-t border-slate-200">
                الإنجاز: {badge.progressText}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Reward Coupon Store (متجر الكوبونات والمكافآت) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-black/25">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              متجر الكوبونات الزوجية
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              استبدل نقاط التواصل الفعّال بكوبونات حقيقية تزيد من البهجة والدلال بينكما
            </p>
          </div>
          <div
            className={`text-sm font-bold tabular-nums ${
              isAyah ? 'text-pink-600' : 'text-blue-600'
            }`}
          >
            رصيدك المتاح للاستبدال: {myPoints} نقطة
          </div>
        </div>

        {redeemFeedback && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            {redeemFeedback}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => {
            const canAfford = myPoints >= coupon.costPoints;
            return (
              <div
                key={coupon.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold">{coupon.category}</span>
                    <span className="tabular-nums font-bold text-amber-600">
                      {coupon.costPoints} نقطة
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 mb-1">
                    {coupon.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {coupon.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500">
                    {coupon.redeemedBy.length > 0
                      ? `تم استبداله سابقاً (${coupon.lastRedeemedAt || 'هذا الشهر'})`
                      : 'متاح للاستبدال الفوري'}
                  </span>
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => handleCouponClick(coupon)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
                      isAyah
                        ? 'bg-pink-500 hover:bg-pink-400'
                        : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>استبدال الكوبون</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Memory Vault (صندوق الذكريات وشريط اللحظات السعيدة) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-black/25 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              صندوق الذكريات وأجمل أيام الشهر
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              يحفظ تلقائياً الأيام ذات الرضا المرتفع والحوارات العميقة، ويمكنك توثيق ذكرى خاصة يدوياً
            </p>
          </div>
          <Sparkles
            className={`w-5 h-5 ${isAyah ? 'text-pink-500' : 'text-blue-600'}`}
          />
        </div>

        {/* Highlight Cards Grid */}
        {memories.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-600">
            لا توجد ذكريات مسجلة بعد في قاعدة البيانات — أضف أول ذكرى سعيدة بينكما من النموذج أدناه وستظهر فوراً لدى شريكك!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {memories.map((mem) => {
              const byAbdullah = mem.createdBy === 'Abdullah';
              return (
                <div
                  key={mem.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-3">
                    {renderMemoryIllustration(mem.theme)}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span
                        className={`font-bold ${
                          byAbdullah ? 'text-blue-600' : 'text-pink-600'
                        }`}
                      >
                        وثقها: {byAbdullah ? 'عبدالله 💙' : 'آية 🩷'}
                      </span>
                      <span className="tabular-nums">{mem.date}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      {mem.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {mem.note}
                    </p>
                  </div>
                  <div className="text-[11px] tabular-nums text-emerald-700 font-bold pt-2 border-t border-slate-200">
                    درجة الرضا المسجلة: {mem.satisfactionScore}%
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Custom Memory Form */}
        <form
          onSubmit={handleMemorySubmit}
          className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
        >
          <div className="md:col-span-3">
            <label
              htmlFor="mem-title-input"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              عنوان الذكرى الجميلة:
            </label>
            <input
              id="mem-title-input"
              type="text"
              value={memTitle}
              onChange={(e) => setMemTitle(e.target.value)}
              placeholder="مثال: سهرة القهوة والضحك..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-500"
            />
          </div>
          <div className="md:col-span-4">
            <label
              htmlFor="mem-note-input"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              تفاصيل اللحظة:
            </label>
            <input
              id="mem-note-input"
              type="text"
              value={memNote}
              onChange={(e) => setMemNote(e.target.value)}
              placeholder="اكتب ما جعل هذا اليوم مميزاً..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-500"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="mem-theme-select"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              طابع الذكرى:
            </label>
            <select
              id="mem-theme-select"
              value={memTheme}
              onChange={(e) =>
                setMemTheme(e.target.value as MemoryItem['theme'])
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500"
            >
              <option value="coffee">جلسة قهوة</option>
              <option value="dinner">عشاء خاص</option>
              <option value="stroll">مشوار وتمشية</option>
              <option value="home">أمسية بالبيت</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isAyah
                  ? 'bg-pink-500 hover:bg-pink-400'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>حفظ في صندوق الذكريات</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
