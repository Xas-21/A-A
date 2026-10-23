import { CoupleStoreState } from '../types';

export function createInitialSeedState(): CoupleStoreState {
  const nowIso = new Date().toISOString();
  return {
    moods: {
      Abdullah: {
        user: 'Abdullah',
        moodId: 'calm',
        label: 'رايق 😊',
        note: '',
        updatedAt: nowIso,
      },
      Ayah: {
        user: 'Ayah',
        moodId: 'calm',
        label: 'رايق 😊',
        note: '',
        updatedAt: nowIso,
      },
    },
    points: {
      Abdullah: 0,
      Ayah: 0,
    },
    logs: [],
    ratings: [],
    gratitudes: [],
    sosRequests: [],
    coupons: [
      {
        id: 'cp-dinner',
        title: 'كوبون عزومة عشاء فاخرة',
        description:
          'عشاء رومانسي في المطعم الذي يختاره حامل الكوبون مع إغلاق الهواتف تماماً.',
        costPoints: 150,
        category: 'مواعيد خاصة',
        redeemedBy: [],
      },
      {
        id: 'cp-drive',
        title: 'كوبون مشوار خاص وتمشية مسائية',
        description:
          'جولة بالسيارة مع القهوة المفضلة وقائمة صوتيات يختارها الطرف الآخر.',
        costPoints: 100,
        category: 'أوقات ممتعة',
        redeemedBy: [],
      },
      {
        id: 'cp-chores',
        title: 'كوبون إعفاء من طلبات اليوم',
        description:
          'يوم راحة كامل واستجمام بدون أي مهام أو مشاوير منزلية.',
        costPoints: 120,
        category: 'راحة ودلال',
        redeemedBy: [],
      },
      {
        id: 'cp-coffee',
        title: 'كوبون جلسة قهوة وحلى مفاجئة',
        description:
          'إحضار القهوة المختصة والحلى المفضل إلى البيت في أي وقت يطلبه الشريك.',
        costPoints: 80,
        category: 'مفاجآت يومية',
        redeemedBy: [],
      },
    ],
    memories: [],
  };
}
