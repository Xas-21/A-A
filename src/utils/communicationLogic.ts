import {
  CommunicationLog,
  DailyRating,
  LowCommReason,
  MoodId,
  TimeSlot,
  UserRole,
} from '../types';

export const SHARED_PASSWORD = '112233';

export const ARABIC_MONTHS: Record<number, string> = {
  1: 'يناير',
  2: 'فبراير',
  3: 'مارس',
  4: 'أبريل',
  5: 'مايو',
  6: 'يونيو',
  7: 'يوليو',
  8: 'أغسطس',
  9: 'سبتمبر',
  10: 'أكتوبر',
  11: 'نوفمبر',
  12: 'ديسمبر',
};

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatArabicDateLabel(dateStr: string): {
  dayNum: number;
  monthName: string;
  yearNum: number;
  fullLabel: string;
} {
  const parts = dateStr.split('-');
  const yearNum = Number(parts[0]) || new Date().getFullYear();
  const monthNum = Number(parts[1]) || new Date().getMonth() + 1;
  const dayNum = Number(parts[2]) || new Date().getDate();
  const monthName = ARABIC_MONTHS[monthNum] || 'أكتوبر';
  return {
    dayNum,
    monthName,
    yearNum,
    fullLabel: `${dayNum} ${monthName} ${yearNum}`,
  };
}

export function getSevenDayWindow(anchorDateStr: string): Array<{
  dateStr: string;
  dayNum: number;
  monthName: string;
}> {
  const parts = anchorDateStr.split('-');
  const y = Number(parts[0]) || new Date().getFullYear();
  const m = (Number(parts[1]) || 1) - 1;
  const d = Number(parts[2]) || 1;
  const base = new Date(Date.UTC(y, m, d));

  const result: Array<{ dateStr: string; dayNum: number; monthName: string }> = [];
  for (let offset = -6; offset <= 0; offset++) {
    const dt = new Date(base);
    dt.setUTCDate(base.getUTCDate() + offset);
    const yr = dt.getUTCFullYear();
    const mo = dt.getUTCMonth() + 1;
    const dy = dt.getUTCDate();
    const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`;
    result.push({
      dateStr,
      dayNum: dy,
      monthName: ARABIC_MONTHS[mo] || '',
    });
  }
  return result;
}

export function getMonthDaysForDate(anchorDateStr: string): string[] {
  const parts = anchorDateStr.split('-');
  const y = Number(parts[0]) || new Date().getFullYear();
  const m = Number(parts[1]) || new Date().getMonth() + 1;
  const daysInMonth = new Date(y, m, 0).getDate();
  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  return Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    return `${prefix}-${String(dayNum).padStart(2, '0')}`;
  });
}

export const MOOD_OPTIONS: Array<{
  id: MoodId;
  label: string;
  emoji: string;
  adviceForPartner: string;
}> = [
  {
    id: 'work_stressed',
    label: 'مضغوط بالعمل 🤯',
    emoji: '🤯',
    adviceForPartner: 'يحتاج إلى التقدير وتخفيف العتب اليوم، كلمة دافئة تكفي.',
  },
  {
    id: 'calm',
    label: 'رايق 😊',
    emoji: '😊',
    adviceForPartner: 'فرصة مثالية لجلسة حوار عميقة أو التخطيط لنشاط ممتع معاً.',
  },
  {
    id: 'tired',
    label: 'متعب 😴',
    emoji: '😴',
    adviceForPartner: 'طاقته منخفضة اليوم، التواصل الخفيف والاطمئنان السريع أنسب خيار.',
  },
  {
    id: 'need_space',
    label: 'محتاج مساحة 🧘‍♂️',
    emoji: '🧘‍♂️',
    adviceForPartner: 'يفضل الهدوء المؤقت لاستعادة توازنه دون أن يعني ذلك جفاءً.',
  },
];

export function validateLogin(role: UserRole | null, password: string): boolean {
  if (!role || (role !== 'Abdullah' && role !== 'Ayah')) {
    return false;
  }
  return password.trim() === SHARED_PASSWORD;
}

export function getWelcomeMessage(role: UserRole): {
  headline: string;
  subtext: string;
  badgeText: string;
} {
  if (role === 'Ayah') {
    return {
      headline: 'اهلا بالملكة أية 🩷',
      subtext: 'نورتي مساحتكم الخاصة.. حضورك يضفي الدفء والمودة على كل يوم 🩷',
      badgeText: 'الملكة آية 🩷',
    };
  }
  return {
    headline: 'أهلا عبدالله',
    subtext: 'مرحباً بك في ميثاق المودة.. خطواتك ومبادراتك تصنع الفرق دائماً 💙',
    badgeText: 'الزوج عبدالله 💙',
  };
}

const HARSH_KEYWORDS = [
  'تتجاهلني',
  'تجاهل',
  'ما تهتم',
  'لا تهتم',
  'إهمال',
  'اهمال',
  'تقصير',
  'مقصر',
  'مقصرة',
  'دائما',
  'دائماً',
  'أبدا',
  'أبداً',
  'أناني',
  'اناني',
  'بارد',
  'باردة',
  'مستفز',
  'كذب',
  'تطنيش',
  'تطنش',
  'زهقت',
  'طفشت',
  'مللت',
  'ما تسمع',
  'لا تسمع',
  'غلطك',
  'ذنبك',
  'أنت السبب',
  'انت السبب',
  'لا تبالي',
];

export function detectHarshTone(text: string): {
  isHarsh: boolean;
  matchedWords: string[];
  gentleSuggestion: string;
} {
  const normalized = text.trim();
  if (!normalized) {
    return { isHarsh: false, matchedWords: [], gentleSuggestion: '' };
  }

  const matchedWords = HARSH_KEYWORDS.filter((word) => normalized.includes(word));
  const hasExclamationBurst = /!{2,}|\?{2,}|؟{2,}/.test(normalized);
  const isHarsh = matchedWords.length > 0 || hasExclamationBurst;

  if (!isHarsh) {
    return { isHarsh: false, matchedWords: [], gentleSuggestion: normalized };
  }

  let gentle = normalized
    .replace(/تتجاهلني|تطنيش|تطنش/g, 'انشغلنا عن بعضنا')
    .replace(/ما تهتم|لا تهتم|لا تبالي|إهمال|اهمال/g, 'اشتقت لاهتمامك المعتاد')
    .replace(/تقصير|مقصر|مقصرة/g, 'قلة الوقت المتاح اليوم')
    .replace(/دائماً|دائما|أبداً|أبدا/g, 'في بعض الأوقات')
    .replace(/بارد|باردة|مستفز|أناني|اناني/g, 'مختلف عن طبيعتنا الدافئة')
    .replace(/زهقت|طفشت|مللت/g, 'شعرت ببعض الضيق')
    .replace(/غلطك|ذنبك|أنت السبب|انت السبب/g, 'سوء التفاهم غير المقصود')
    .replace(/!{2,}/g, '.')
    .replace(/؟{2,}/g, '؟');

  if (gentle === normalized) {
    gentle = `أقدّر ظروف يومك، وشعرت بأننا بحاجة لوقت أطول معاً حين تسمح الفرصة (${normalized.replace(/[!؟?]+/g, '')}) 🤍`;
  } else {
    gentle = `حبيبي/حبيبتي، ودي نتحاور بهدوء حول نقطة بسيطة: ${gentle} — وأثق أننا سنتفاهم بسهولة 🤍`;
  }

  return {
    isHarsh: true,
    matchedWords,
    gentleSuggestion: gentle,
  };
}

export type DayCalendarStatus =
  | 'verified_high' // Green
  | 'low_comm'      // Yellow
  | 'disputed'      // Red
  | 'pending'       // Grey
  | 'empty';

export function computeDayStatus(
  logsForDay: CommunicationLog[],
  ratingsForDay: DailyRating[]
): DayCalendarStatus {
  if (logsForDay.length === 0 && ratingsForDay.length === 0) {
    return 'empty';
  }

  if (logsForDay.some((l) => l.status === 'disputed')) {
    return 'disputed';
  }

  if (logsForDay.some((l) => l.status === 'pending')) {
    return 'pending';
  }

  const hasLowQuality = logsForDay.some(
    (l) =>
      l.quality === 'شبه معدوم' ||
      l.channel === 'تواصل قليل/شبه معدوم' ||
      l.durationMinutes < 15
  );

  const avgStars =
    ratingsForDay.length > 0
      ? ratingsForDay.reduce((acc, r) => acc + r.stars, 0) / ratingsForDay.length
      : 4.5;

  if (hasLowQuality || avgStars < 3.5) {
    return 'low_comm';
  }

  return 'verified_high';
}

export interface MonthlyAnalyticsSummary {
  dailyTrends: Array<{
    date: string;
    dayLabel: string;
    abdullahScore: number; // 0-100
    ayahScore: number; // 0-100
  }>;
  initiatorCounts: {
    Abdullah: number;
    Ayah: number;
    abdullahPercent: number;
    ayahPercent: number;
    leader: UserRole;
  };
  excusesBreakdown: Array<{
    reason: LowCommReason;
    count: number;
    percentage: number;
  }>;
  peakHours: Array<{
    slot: TimeSlot;
    totalMinutes: number;
    deepSessionsCount: number;
    effectivenessScore: number; // 0-100
  }>;
  funStats: {
    totalHoursSpoken: number;
    longestCallMinutes: number;
    mostUsedChannel: string;
    reconciliationDay: string;
    verifiedLogsCount: number;
    resolvedDisputesCount: number;
  };
  badges: Array<{
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    holder: 'كلاكما' | 'عبدالله' | 'آية';
    progressText: string;
  }>;
}

export function calculateMonthlyAnalytics(
  logs: CommunicationLog[],
  ratings: DailyRating[]
): MonthlyAnalyticsSummary {
  // 1. Daily satisfaction trend across unique dates
  const datesSet = new Set<string>();
  logs.forEach((l) => datesSet.add(l.date));
  ratings.forEach((r) => datesSet.add(r.date));
  const sortedDates = Array.from(datesSet).sort();

  const dailyTrends = sortedDates.map((date) => {
    const abRating = ratings.find((r) => r.date === date && r.user === 'Abdullah');
    const ayRating = ratings.find((r) => r.date === date && r.user === 'Ayah');
    const parsed = formatArabicDateLabel(date);
    return {
      date,
      dayLabel: `${parsed.dayNum} ${parsed.monthName}`,
      abdullahScore: abRating ? Math.round((abRating.stars / 5) * 100) : 80,
      ayahScore: ayRating ? Math.round((ayRating.stars / 5) * 100) : 80,
    };
  });

  // 2. Initiator Comparison
  const abCount = logs.filter((l) => l.createdBy === 'Abdullah').length;
  const ayCount = logs.filter((l) => l.createdBy === 'Ayah').length;
  const totalLogsCount = abCount + ayCount;
  const abdullahPercent =
    totalLogsCount === 0 ? 0 : Math.round((abCount / totalLogsCount) * 100);
  const ayahPercent = totalLogsCount === 0 ? 0 : 100 - abdullahPercent;

  // 3. Excuses breakdown
  const excuseMap = new Map<LowCommReason, number>();
  logs.forEach((l) => {
    if (l.lowCommReason) {
      excuseMap.set(l.lowCommReason, (excuseMap.get(l.lowCommReason) || 0) + 1);
    }
  });
  const totalExcuses = Math.max(
    1,
    Array.from(excuseMap.values()).reduce((a, b) => a + b, 0)
  );
  const excusesBreakdown: Array<{
    reason: LowCommReason;
    count: number;
    percentage: number;
  }> = Array.from(excuseMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / totalExcuses) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Peak Hours Heatmap
  const slots: TimeSlot[] = [
    'صباحاً (8ص - 12م)',
    'ظهراً (12م - 4م)',
    'عصراً (4م - 8م)',
    'مساءً (8م - 12ص)',
  ];
  const peakHours = slots.map((slot) => {
    const slotLogs = logs.filter((l) => l.timeSlot === slot);
    const totalMinutes = slotLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
    const deepSessionsCount = slotLogs.filter((l) => l.quality === 'عميق/فعّال').length;
    const effectivenessScore = Math.min(
      100,
      Math.round(deepSessionsCount * 22 + totalMinutes / 6)
    );
    return {
      slot,
      totalMinutes,
      deepSessionsCount,
      effectivenessScore,
    };
  });

  // 5. Fun Stats
  const totalMinutesAll = logs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalHoursSpoken = Number((totalMinutesAll / 60).toFixed(1));
  const longestCallMinutes = logs.reduce(
    (max, l) => Math.max(max, l.durationMinutes),
    0
  );

  const channelCounts = new Map<string, number>();
  logs.forEach((l) => {
    if (l.channel !== 'تواصل قليل/شبه معدوم') {
      channelCounts.set(l.channel, (channelCounts.get(l.channel) || 0) + 1);
    }
  });
  let mostUsedChannel = logs.length === 0 ? 'لا توجد سجلات بعد' : 'جلسة شخصية بالبيت';
  let maxChCount = 0;
  channelCounts.forEach((count, ch) => {
    if (count > maxChCount) {
      maxChCount = count;
      mostUsedChannel = ch;
    }
  });

  const resolvedLogs = logs.filter((l) => l.status === 'resolved');
  const reconciliationDay =
    resolvedLogs.length > 0
      ? formatArabicDateLabel(resolvedLogs[resolvedLogs.length - 1].date).fullLabel
      : 'لا يوجد بعد';

  // 6. Badges calculation
  let maxWarmStreak = 0;
  let currentStreak = 0;
  dailyTrends.forEach((d) => {
    const avg = (d.abdullahScore + d.ayahScore) / 2;
    if (avg >= 80) {
      currentStreak += 1;
      maxWarmStreak = Math.max(maxWarmStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  const badges = [
    {
      id: 'warm_week',
      title: 'شارة "أسبوع دافئ"',
      description: 'تحقيق نسبة رضا تفوق 80% لمدة 7 أيام متتالية من التواصل الإيجابي.',
      unlocked: maxWarmStreak >= 7,
      holder: 'كلاكما' as const,
      progressText: `${Math.min(7, maxWarmStreak)} / 7 أيام متتالية`,
    },
    {
      id: 'initiator',
      title: 'شارة "المُبادر"',
      description: 'تُمنح للشريك الأكثر مبادرة في توثيق لحظات التواصل والاطمئنان اليومي.',
      unlocked: abCount + ayCount >= 4,
      holder: (abCount === ayCount ? 'كلاكما' : abCount > ayCount ? 'عبدالله' : 'آية') as
        | 'كلاكما'
        | 'عبدالله'
        | 'آية',
      progressText: `عبدالله (${abCount}) · آية (${ayCount})`,
    },
    {
      id: 'peacemaker',
      title: 'شارة "حلال المشاكل"',
      description: 'تُمنح عند تحويل السجلات المختلف عليها إلى تفاهم ودي وجلسة صلح ناجحة.',
      unlocked: resolvedLogs.length >= 1,
      holder: 'كلاكما' as const,
      progressText: `${resolvedLogs.length} مواقف تم حلها بود`,
    },
  ];

  return {
    dailyTrends,
    initiatorCounts: {
      Abdullah: abCount,
      Ayah: ayCount,
      abdullahPercent,
      ayahPercent,
      leader: abCount >= ayCount ? 'Abdullah' : 'Ayah',
    },
    excusesBreakdown,
    peakHours,
    funStats: {
      totalHoursSpoken,
      longestCallMinutes,
      mostUsedChannel,
      reconciliationDay,
      verifiedLogsCount: logs.filter(
        (l) => l.status === 'approved' || l.status === 'resolved'
      ).length,
      resolvedDisputesCount: resolvedLogs.length,
    },
    badges,
  };
}
