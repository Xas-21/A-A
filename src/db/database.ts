import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CommunicationLog,
  CoupleStoreState,
  DailyRating,
  GratitudeEntry,
  MemoryItem,
  MoodId,
  SosRequest,
  UserRole,
  VerificationStatus,
} from '../types';
import { createInitialSeedState } from '../utils/seedData';
import { getTodayDateStr } from '../utils/communicationLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'couple-database.json');

export interface DatabaseSchema {
  schemaVersion: number;
  updatedAt: string;
  tables: {
    user_profiles: Record<
      UserRole,
      {
        user: UserRole;
        moodId: MoodId;
        label: string;
        note: string;
        updatedAt: string;
        points: number;
      }
    >;
    communication_logs: CommunicationLog[];
    daily_ratings: DailyRating[];
    gratitudes: GratitudeEntry[];
    sos_requests: SosRequest[];
    coupons: CoupleStoreState['coupons'];
    memories: MemoryItem[];
  };
}

function createEmptyDatabaseSchema(): DatabaseSchema {
  const initial = createInitialSeedState();
  const nowIso = new Date().toISOString();
  return {
    schemaVersion: 2,
    updatedAt: nowIso,
    tables: {
      user_profiles: {
        Abdullah: {
          user: 'Abdullah',
          moodId: initial.moods.Abdullah.moodId,
          label: initial.moods.Abdullah.label,
          note: initial.moods.Abdullah.note || '',
          updatedAt: nowIso,
          points: 0,
        },
        Ayah: {
          user: 'Ayah',
          moodId: initial.moods.Ayah.moodId,
          label: initial.moods.Ayah.label,
          note: initial.moods.Ayah.note || '',
          updatedAt: nowIso,
          points: 0,
        },
      },
      communication_logs: [],
      daily_ratings: [],
      gratitudes: [],
      sos_requests: [],
      coupons: initial.coupons,
      memories: [],
    },
  };
}

function loadDatabaseSchema(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (parsed && parsed.schemaVersion === 2 && parsed.tables) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read database file, initializing clean DB:', err);
  }
  const fresh = createEmptyDatabaseSchema();
  persistDatabaseSchema(fresh);
  return fresh;
}

function persistDatabaseSchema(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database schema:', err);
  }
}

let dbInstance: DatabaseSchema = loadDatabaseSchema();

export function getFullDatabaseState(): CoupleStoreState {
  const { tables } = dbInstance;
  return {
    moods: {
      Abdullah: {
        user: 'Abdullah',
        moodId: tables.user_profiles.Abdullah.moodId,
        label: tables.user_profiles.Abdullah.label,
        note: tables.user_profiles.Abdullah.note,
        updatedAt: tables.user_profiles.Abdullah.updatedAt,
      },
      Ayah: {
        user: 'Ayah',
        moodId: tables.user_profiles.Ayah.moodId,
        label: tables.user_profiles.Ayah.label,
        note: tables.user_profiles.Ayah.note,
        updatedAt: tables.user_profiles.Ayah.updatedAt,
      },
    },
    points: {
      Abdullah: tables.user_profiles.Abdullah.points,
      Ayah: tables.user_profiles.Ayah.points,
    },
    logs: tables.communication_logs,
    ratings: tables.daily_ratings,
    gratitudes: tables.gratitudes,
    sosRequests: tables.sos_requests,
    coupons: tables.coupons,
    memories: tables.memories,
  };
}

export function resetDatabase(): CoupleStoreState {
  dbInstance = createEmptyDatabaseSchema();
  persistDatabaseSchema(dbInstance);
  return getFullDatabaseState();
}

export function updateUserMood(
  user: UserRole,
  moodId: MoodId,
  label: string,
  note?: string
): CoupleStoreState {
  const profile = dbInstance.tables.user_profiles[user];
  profile.moodId = moodId;
  profile.label = label;
  profile.note = note?.trim() || '';
  profile.updatedAt = new Date().toISOString();
  profile.points += 10;

  persistDatabaseSchema(dbInstance);
  return getFullDatabaseState();
}

export function insertCommunicationLog(
  body: Partial<CommunicationLog>
): { state: CoupleStoreState; log: CommunicationLog } {
  const logId = body.id || `log-${Date.now()}`;
  const existing = dbInstance.tables.communication_logs.find(
    (l) => l.id === logId
  );
  if (existing) {
    return { state: getFullDatabaseState(), log: existing };
  }

  const createdBy = body.createdBy || 'Abdullah';
  const newLog: CommunicationLog = {
    id: logId,
    date: body.date || getTodayDateStr(),
    createdBy,
    channel: body.channel || 'جلسة شخصية بالبيت',
    durationMinutes: Number(body.durationMinutes) || 15,
    details: (body.details || '').trim(),
    quality: body.quality || 'عميق/فعّال',
    lowCommReason: body.lowCommReason,
    customExcuseNote: body.customExcuseNote?.trim(),
    timeSlot: body.timeSlot || 'مساءً (8م - 12ص)',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  dbInstance.tables.communication_logs.unshift(newLog);
  dbInstance.tables.user_profiles[createdBy].points += 25;

  // Auto-save high quality long sessions into Memory Vault
  if (newLog.quality === 'عميق/فعّال' && newLog.durationMinutes >= 60) {
    const memId = `mem-auto-${newLog.id}`;
    if (!dbInstance.tables.memories.some((m) => m.id === memId)) {
      dbInstance.tables.memories.unshift({
        id: memId,
        date: newLog.date,
        title: `لحظة تواصل مميزة (${newLog.channel})`,
        note: newLog.details,
        createdBy: newLog.createdBy,
        satisfactionScore: 95,
        theme: newLog.channel === 'جلسة شخصية بالبيت' ? 'coffee' : 'stroll',
      });
    }
  }

  persistDatabaseSchema(dbInstance);
  return { state: getFullDatabaseState(), log: newLog };
}

export function verifyCommunicationLog(
  id: string,
  actor: UserRole,
  status: VerificationStatus,
  disputeReason?: string,
  resolutionNote?: string
): { state: CoupleStoreState; log: CommunicationLog | null } {
  const log = dbInstance.tables.communication_logs.find((l) => l.id === id);
  if (!log) {
    return { state: getFullDatabaseState(), log: null };
  }

  log.status = status;
  if (status === 'disputed' && disputeReason) {
    log.disputeReason = disputeReason.trim();
  }
  if (status === 'resolved') {
    log.resolutionNote =
      resolutionNote?.trim() || 'تم النقاش وجهاً لوجه والتفاهم بكل مودة 🤝';
    dbInstance.tables.user_profiles.Abdullah.points += 40;
    dbInstance.tables.user_profiles.Ayah.points += 40;
  } else if (status === 'approved' && actor) {
    dbInstance.tables.user_profiles[actor].points += 20;
  }

  persistDatabaseSchema(dbInstance);
  return { state: getFullDatabaseState(), log };
}

export function upsertDailyRating(rating: DailyRating): CoupleStoreState {
  const idx = dbInstance.tables.daily_ratings.findIndex(
    (r) => r.date === rating.date && r.user === rating.user
  );
  const entry: DailyRating = {
    date: rating.date,
    user: rating.user,
    stars: Math.min(5, Math.max(1, Number(rating.stars))),
    feeling: rating.feeling,
    comment: rating.comment?.trim(),
  };

  if (idx >= 0) {
    dbInstance.tables.daily_ratings[idx] = entry;
  } else {
    dbInstance.tables.daily_ratings.push(entry);
    dbInstance.tables.user_profiles[rating.user].points += 15;
  }

  persistDatabaseSchema(dbInstance);
  return getFullDatabaseState();
}

export function insertGratitude(
  fromUser: UserRole,
  content: string,
  date?: string
): { state: CoupleStoreState; gratitude: GratitudeEntry } {
  const toUser: UserRole = fromUser === 'Abdullah' ? 'Ayah' : 'Abdullah';
  const newGratitude: GratitudeEntry = {
    id: `grat-${Date.now()}`,
    date: date || getTodayDateStr(),
    fromUser,
    toUser,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  dbInstance.tables.gratitudes.unshift(newGratitude);
  dbInstance.tables.user_profiles[fromUser].points += 30;
  dbInstance.tables.user_profiles[toUser].points += 15;

  persistDatabaseSchema(dbInstance);
  return { state: getFullDatabaseState(), gratitude: newGratitude };
}

export function insertSosRequest(
  fromUser: UserRole,
  customMessage?: string
): { state: CoupleStoreState; sos: SosRequest } {
  const toUser: UserRole = fromUser === 'Abdullah' ? 'Ayah' : 'Abdullah';
  const newSos: SosRequest = {
    id: `sos-${Date.now()}`,
    fromUser,
    toUser,
    message:
      customMessage?.trim() ||
      'شريكك يحتاج جلسة تواصل خاصة اليوم لما تفضى ☕',
    createdAt: new Date().toISOString(),
    acknowledged: false,
  };

  dbInstance.tables.sos_requests.unshift(newSos);
  persistDatabaseSchema(dbInstance);
  return { state: getFullDatabaseState(), sos: newSos };
}

export function acknowledgeSosRequest(
  id: string,
  actor: UserRole,
  responseNote?: string
): CoupleStoreState | null {
  const item = dbInstance.tables.sos_requests.find((s) => s.id === id);
  if (!item) return null;

  item.acknowledged = true;
  item.responseNote =
    responseNote?.trim() || 'تمت الاستجابة بكل حب، موعدنا الليلة على قهوة ☕🤍';
  if (actor) {
    dbInstance.tables.user_profiles[actor].points += 25;
  }

  persistDatabaseSchema(dbInstance);
  return getFullDatabaseState();
}

export function redeemCouponById(
  id: string,
  user: UserRole
): { ok: boolean; error?: string; state: CoupleStoreState } {
  const coupon = dbInstance.tables.coupons.find((c) => c.id === id);
  if (!coupon) {
    return { ok: false, error: 'الكوبون غير موجود', state: getFullDatabaseState() };
  }
  const currentPoints = dbInstance.tables.user_profiles[user].points;
  if (currentPoints < coupon.costPoints) {
    return {
      ok: false,
      error: 'رصيد النقاط غير كافٍ لاستبدال هذا الكوبون',
      state: getFullDatabaseState(),
    };
  }

  dbInstance.tables.user_profiles[user].points -= coupon.costPoints;
  if (!coupon.redeemedBy.includes(user)) {
    coupon.redeemedBy.push(user);
  }
  coupon.lastRedeemedAt = getTodayDateStr();

  persistDatabaseSchema(dbInstance);
  return { ok: true, state: getFullDatabaseState() };
}

export function insertMemoryItem(
  body: Partial<MemoryItem>
): { state: CoupleStoreState; memory: MemoryItem } {
  const createdBy = body.createdBy || 'Abdullah';
  const mem: MemoryItem = {
    id: `mem-${Date.now()}`,
    date: body.date || getTodayDateStr(),
    title: (body.title || '').trim(),
    note: (body.note || '').trim(),
    createdBy,
    satisfactionScore: 100,
    theme: body.theme || 'coffee',
  };

  dbInstance.tables.memories.unshift(mem);
  dbInstance.tables.user_profiles[createdBy].points += 20;

  persistDatabaseSchema(dbInstance);
  return { state: getFullDatabaseState(), memory: mem };
}
