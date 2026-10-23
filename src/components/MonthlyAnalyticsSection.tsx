import React from 'react';
import {
  Clock,
  PhoneCall,
  MessageCircle,
  HeartHandshake,
} from 'lucide-react';
import { MonthlyAnalyticsSummary } from '../utils/communicationLogic';

interface MonthlyAnalyticsSectionProps {
  analytics: MonthlyAnalyticsSummary;
}

export const MonthlyAnalyticsSection: React.FC<MonthlyAnalyticsSectionProps> = ({
  analytics,
}) => {
  const { dailyTrends, initiatorCounts, excusesBreakdown, peakHours, funStats } =
    analytics;

  // Build SVG polyline points for Abdullah (#3B82F6) & Ayah (#EC4899)
  const chartWidth = 640;
  const chartHeight = 200;
  const padX = 54;
  const padY = 24;

  const pointsCount = Math.max(2, dailyTrends.length);
  const getX = (index: number) =>
    padX + (index / (pointsCount - 1)) * (chartWidth - padX * 2);
  const getY = (score: number) =>
    chartHeight - padY - (score / 100) * (chartHeight - padY * 2);

  const abdullahPolyline = dailyTrends
    .map((d, i) => `${getX(i)},${getY(d.abdullahScore)}`)
    .join(' ');
  const ayahPolyline = dailyTrends
    .map((d, i) => `${getX(i)},${getY(d.ayahScore)}`)
    .join(' ');

  const EXCUSE_COLORS = ['#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#94A3B8'];

  return (
    <div className="space-y-8 text-slate-900">
      {/* 1. Monthly Fun Stats Strip (بطاقة ملخص الشهر الممتع) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-black/25">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>إجمالي ساعات الحوار</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-display text-2xl font-extrabold text-slate-900 tabular-nums">
            {funStats.totalHoursSpoken} ساعة
          </div>
          <p className="text-xs text-slate-500 mt-1">
            عبر {funStats.verifiedLogsCount} جلسة تواصل مُصادق عليها
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-black/25">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>أطول جلسة / مكالمة</span>
            <PhoneCall className="w-4 h-4 text-pink-500" />
          </div>
          <div className="font-display text-2xl font-extrabold text-slate-900 tabular-nums">
            {funStats.longestCallMinutes} دقيقة
          </div>
          <p className="text-xs text-slate-500 mt-1">
            حوار عميق ومثمر بدون مقاطعات
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-black/25">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>الوسيلة الأكثر استخداماً</span>
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-display text-xl font-extrabold text-slate-900 truncate">
            {funStats.mostUsedChannel}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            القناة المفضلة للتقارب اليومي
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-black/25">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>يوم المصالحة الكبير</span>
            <HeartHandshake className="w-4 h-4 text-pink-500" />
          </div>
          <div className="font-display text-xl font-extrabold text-slate-900 tabular-nums">
            {funStats.reconciliationDay}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تحويل الاختلاف إلى جلسة مودة وتفاهم
          </p>
        </div>
      </section>

      {/* 2. Satisfaction Rate Trends Line Chart (مؤشر الرضا المقارن: عبدالله أزرق vs آية وردي) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-black/25">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              منحنى درجة الرضا الشهري (عبدالله vs آية)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              مقارنة يومية لنسبة الرضا عن التواصل بين الزوجين خلال شهر أكتوبر ٢٠٢٦
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-blue-600">عبدالله (#2563EB) 💙</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="text-pink-600">آية (#EC4899) 🩷</span>
          </div>
        </div>

        {dailyTrends.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-600">
            لا توجد بيانات تقييم أو سجلات بعد لرسم المنحنى — أضف أول جلسة تواصل أو قيّم رضا اليوم ليظهر المخطط فوراً!
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
              className="w-full sm:min-w-[540px] h-48 sm:h-60"
              role="img"
              aria-label="مخطط منحنى الرضا الشهري لعبدالله وآية"
            >
              {/* Horizontal grid lines */}
              {[20, 40, 60, 80, 100].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={chartWidth - padX}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padX - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-500 text-[10px] font-mono"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Abdullah Line (Blue #2563EB) */}
              {dailyTrends.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={abdullahPolyline}
                />
              )}

              {/* Ayah Line (Pink #EC4899) */}
              {dailyTrends.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={ayahPolyline}
                />
              )}

              {/* Data Points & Date Labels */}
              {dailyTrends.map((d, i) => {
                const x = dailyTrends.length === 1 ? chartWidth / 2 : getX(i);
                const yAb = getY(d.abdullahScore);
                const yAy = getY(d.ayahScore);
                return (
                  <g key={d.date}>
                    <circle cx={x} cy={yAb} r="5" fill="#2563EB" />
                    <circle cx={x} cy={yAy} r="5" fill="#EC4899" />
                    <text
                      x={x}
                      y={chartHeight + 14}
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px] font-mono"
                    >
                      {d.date.slice(8)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </section>

      {/* 3. Initiator Comparison & Excuses Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Initiator Comparison Card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-black/25 space-y-5">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              مين الأكثر تواصل والمبادرة هذا الشهر؟
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              نسبة المبادرة في تسجيل جلسات التواصل والاطمئنان اليومي
            </p>
          </div>

          {/* Comparative Dual Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold">
              <span className="text-blue-600 tabular-nums">
                عبدالله: {initiatorCounts.Abdullah} مبادرة ({initiatorCounts.abdullahPercent}%)
              </span>
              <span className="text-pink-600 tabular-nums">
                آية: {initiatorCounts.Ayah} مبادرة ({initiatorCounts.ayahPercent}%)
              </span>
            </div>

            <div className="w-full h-5 rounded-xl overflow-hidden bg-slate-100 flex">
              <div
                style={{ width: `${initiatorCounts.abdullahPercent}%` }}
                className="bg-blue-600 h-full transition-all"
                title={`عبدالله ${initiatorCounts.abdullahPercent}%`}
              />
              <div
                style={{ width: `${initiatorCounts.ayahPercent}%` }}
                className="bg-pink-500 h-full transition-all"
                title={`آية ${initiatorCounts.ayahPercent}%`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-xs text-blue-800 font-bold">
                مبادرات عبدالله 💙
              </div>
              <div className="font-display text-2xl font-extrabold text-blue-600 tabular-nums mt-1">
                {initiatorCounts.abdullahPercent}%
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {initiatorCounts.Abdullah} سجلات موثقة
              </div>
            </div>
            <div className="p-4 rounded-xl bg-pink-50 border border-pink-200">
              <div className="text-xs text-pink-800 font-bold">
                مبادرات الملكة آية 🩷
              </div>
              <div className="font-display text-2xl font-extrabold text-pink-600 tabular-nums mt-1">
                {initiatorCounts.ayahPercent}%
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {initiatorCounts.Ayah} سجلات موثقة
              </div>
            </div>
          </div>
        </section>

        {/* Excuses & Obstacles Breakdown */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-black/25 space-y-5">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              تحليل الأعذار وعوائق التواصل
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              تصنيف الأسباب المتكررة لأيام انخفاض التواصل لمعالجتها معاً
            </p>
          </div>

          {excusesBreakdown.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-600">
              لا توجد أعذار أو عوائق تواصل مسجلة حتى الآن — سجلوا جلساتكم اليومية ليتم تحليلها تلقائياً.
            </div>
          ) : (
            <div className="space-y-3">
              {excusesBreakdown.map((item, idx) => (
                <div key={item.reason} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {item.reason}
                    </span>
                    <span className="tabular-nums text-slate-500 font-semibold">
                      {item.percentage}% ({item.count} مرات)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-lg bg-slate-100 overflow-hidden">
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: EXCUSE_COLORS[idx % EXCUSE_COLORS.length],
                      }}
                      className="h-full rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 4. Peak Hours Heatmap (خريطة أوقات الذروة وأفضل فترات التواصل) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-black/25">
        <div className="mb-5">
          <h3 className="font-display text-lg font-bold text-slate-900">
            خريطة أوقات الذروة لفعالية التواصل (Peak Hours Heatmap)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            توضح الفترات الزمنية التي يكون فيها الحوار بين عبدالله وآية أكثر عمقاً وانسجاماً
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {peakHours.map((slotItem) => {
            const isPeak = slotItem.effectivenessScore >= 75;
            return (
              <div
                key={slotItem.slot}
                className={`p-4 rounded-xl border transition-all ${
                  isPeak
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 mb-2">
                  {slotItem.slot}
                </div>
                <div className="font-display text-2xl font-extrabold tabular-nums text-slate-900">
                  {slotItem.effectivenessScore}%
                </div>
                <div className="text-xs text-slate-500 mt-1 tabular-nums">
                  {slotItem.totalMinutes} دقيقة · {slotItem.deepSessionsCount} جلسات عميقة
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
