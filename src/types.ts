export type UserRole = 'Abdullah' | 'Ayah';

export type MoodId = 'work_stressed' | 'calm' | 'tired' | 'need_space';

export interface MoodEntry {
  user: UserRole;
  moodId: MoodId;
  label: string;
  note?: string;
  updatedAt: string;
}

export type CommunicationChannel =
  | 'اتصال هاتفي'
  | 'واتساب'
  | 'سناب شات'
  | 'جلسة شخصية بالبيت'
  | 'تواصل قليل/شبه معدوم';

export type CommunicationQuality =
  | 'عميق/فعّال'
  | 'سطحي/روتيني'
  | 'شبه معدوم';

export type LowCommReason =
  | 'ضغط عمل'
  | 'إرهاق'
  | 'التزامات خارج البيت'
  | 'انشغال عائلي'
  | 'أخرى';

export type TimeSlot =
  | 'صباحاً (8ص - 12م)'
  | 'ظهراً (12م - 4م)'
  | 'عصراً (4م - 8م)'
  | 'مساءً (8م - 12ص)';

export type VerificationStatus = 'pending' | 'approved' | 'disputed' | 'resolved';

export interface CommunicationLog {
  id: string;
  date: string; // YYYY-MM-DD
  createdBy: UserRole;
  channel: CommunicationChannel;
  durationMinutes: number;
  details: string;
  quality: CommunicationQuality;
  lowCommReason?: LowCommReason;
  customExcuseNote?: string;
  timeSlot: TimeSlot;
  status: VerificationStatus;
  disputeReason?: string;
  resolutionNote?: string;
  createdAt: string;
}

export type SatisfactionMood = 'سعيد' | 'محايد' | 'متضايق';

export interface DailyRating {
  date: string; // YYYY-MM-DD
  user: UserRole;
  stars: number; // 1 to 5
  feeling: SatisfactionMood;
  comment?: string;
}

export interface GratitudeEntry {
  id: string;
  date: string;
  fromUser: UserRole;
  toUser: UserRole;
  content: string;
  createdAt: string;
}

export interface SosRequest {
  id: string;
  fromUser: UserRole;
  toUser: UserRole;
  message: string;
  createdAt: string;
  acknowledged: boolean;
  responseNote?: string;
}

export interface CouponItem {
  id: string;
  title: string;
  description: string;
  costPoints: number;
  category: string;
  redeemedBy: UserRole[];
  lastRedeemedAt?: string;
}

export interface MemoryItem {
  id: string;
  date: string;
  title: string;
  note: string;
  createdBy: UserRole;
  satisfactionScore: number;
  theme: 'coffee' | 'dinner' | 'stroll' | 'home';
}

export interface CoupleStoreState {
  moods: Record<UserRole, MoodEntry>;
  logs: CommunicationLog[];
  ratings: DailyRating[];
  gratitudes: GratitudeEntry[];
  sosRequests: SosRequest[];
  coupons: CouponItem[];
  memories: MemoryItem[];
  points: Record<UserRole, number>;
}
