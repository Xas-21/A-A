import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLogin,
  getWelcomeMessage,
  detectHarshTone,
  computeDayStatus,
  calculateMonthlyAnalytics,
} from './communicationLogic';
import { CommunicationLog, DailyRating } from '../types';

test('validateLogin enforces role and shared password 112233', () => {
  assert.equal(validateLogin('Abdullah', '112233'), true);
  assert.equal(validateLogin('Ayah', '112233'), true);
  assert.equal(validateLogin('Ayah', ' 112233 '), true);
  assert.equal(validateLogin('Abdullah', '000000'), false);
  assert.equal(validateLogin(null, '112233'), false);
});

test('getWelcomeMessage returns exact required Arabic greetings for Ayah and Abdullah', () => {
  const ayahMsg = getWelcomeMessage('Ayah');
  assert.equal(ayahMsg.headline, 'اهلا بالملكة أية 🩷');
  assert.ok(ayahMsg.headline.includes('اهلا بالملكة أية'));
  assert.ok(ayahMsg.headline.includes('🩷'));

  const abdullahMsg = getWelcomeMessage('Abdullah');
  assert.equal(abdullahMsg.headline, 'أهلا عبدالله');
});

test('detectHarshTone identifies harsh blaming keywords and offers gentle rewrite', () => {
  const calm = detectHarshTone('كنت مشغولاً في اجتماع عمل طويل اليوم');
  assert.equal(calm.isHarsh, false);

  const harsh = detectHarshTone('أنت دائماً تتجاهلني وما تهتم في كلامي!!');
  assert.equal(harsh.isHarsh, true);
  assert.ok(harsh.matchedWords.length > 0);
  assert.ok(harsh.gentleSuggestion.length > 10);
});

test('computeDayStatus categorizes calendar days accurately', () => {
  const baseLog: CommunicationLog = {
    id: '1',
    date: '2026-10-15',
    createdBy: 'Abdullah',
    channel: 'جلسة شخصية بالبيت',
    durationMinutes: 60,
    details: 'جلسة قهوة وحديث عن الويكند',
    quality: 'عميق/فعّال',
    timeSlot: 'مساءً (8م - 12ص)',
    status: 'approved',
    createdAt: '2026-10-15T20:00:00Z',
  };

  assert.equal(computeDayStatus([], []), 'empty');
  assert.equal(computeDayStatus([baseLog], []), 'verified_high');
  assert.equal(
    computeDayStatus([{ ...baseLog, status: 'pending' }], []),
    'pending'
  );
  assert.equal(
    computeDayStatus([{ ...baseLog, status: 'disputed' }], []),
    'disputed'
  );
  assert.equal(
    computeDayStatus([{ ...baseLog, quality: 'شبه معدوم', durationMinutes: 5 }], []),
    'low_comm'
  );
});

test('calculateMonthlyAnalytics computes streaks, initiator percentages, and badges', () => {
  const logs: CommunicationLog[] = [];
  const ratings: DailyRating[] = [];

  for (let day = 1; day <= 8; day++) {
    const date = `2026-10-0${day}`;
    logs.push({
      id: `log-${day}`,
      date,
      createdBy: day % 2 === 0 ? 'Ayah' : 'Abdullah',
      channel: 'جلسة شخصية بالبيت',
      durationMinutes: 60,
      details: 'نقاش يومي دافئ',
      quality: 'عميق/فعّال',
      timeSlot: 'مساءً (8م - 12ص)',
      status: day === 4 ? 'resolved' : 'approved',
      createdAt: `${date}T20:00:00Z`,
    });
    ratings.push(
      { date, user: 'Abdullah', stars: 5, feeling: 'سعيد' },
      { date, user: 'Ayah', stars: 5, feeling: 'سعيد' }
    );
  }

  const summary = calculateMonthlyAnalytics(logs, ratings);
  assert.equal(summary.initiatorCounts.Abdullah, 4);
  assert.equal(summary.initiatorCounts.Ayah, 4);
  assert.equal(summary.funStats.totalHoursSpoken, 8);
  const warmWeekBadge = summary.badges.find((b) => b.id === 'warm_week');
  assert.equal(warmWeekBadge?.unlocked, true);
  const peacemakerBadge = summary.badges.find((b) => b.id === 'peacemaker');
  assert.equal(peacemakerBadge?.unlocked, true);
});

test('calculateMonthlyAnalytics returns clean zero-state when database is empty', () => {
  const emptySummary = calculateMonthlyAnalytics([], []);
  assert.equal(emptySummary.initiatorCounts.Abdullah, 0);
  assert.equal(emptySummary.initiatorCounts.Ayah, 0);
  assert.equal(emptySummary.initiatorCounts.abdullahPercent, 0);
  assert.equal(emptySummary.initiatorCounts.ayahPercent, 0);
  assert.equal(emptySummary.funStats.totalHoursSpoken, 0);
  assert.equal(emptySummary.funStats.verifiedLogsCount, 0);
  assert.equal(emptySummary.funStats.mostUsedChannel, 'لا توجد سجلات بعد');
  assert.equal(emptySummary.funStats.reconciliationDay, 'لا يوجد بعد');
  assert.equal(emptySummary.dailyTrends.length, 0);
});
