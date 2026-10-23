import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { detectHarshTone } from './src/utils/communicationLogic';
import {
  acknowledgeSosRequest,
  getFullDatabaseState,
  insertCommunicationLog,
  insertGratitude,
  insertMemoryItem,
  insertSosRequest,
  redeemCouponById,
  resetDatabase,
  updateUserMood,
  upsertDailyRating,
  verifyCommunicationLog,
} from './src/db/database';
import {
  CommunicationLog,
  DailyRating,
  MemoryItem,
  MoodId,
  UserRole,
  VerificationStatus,
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connected SSE & WebSocket clients for real-time multi-user sync
const sseClients = new Set<Response>();
const wsClients = new Map<WebSocket, { role?: UserRole }>();

function getOnlineUsers(): UserRole[] {
  const roles = new Set<UserRole>();
  for (const [client, meta] of wsClients.entries()) {
    if (client.readyState === WebSocket.OPEN && meta.role) {
      roles.add(meta.role);
    }
  }
  return Array.from(roles);
}

function broadcastRealtimeEvent(
  eventType: string,
  actor?: UserRole,
  liveMessage?: string
) {
  const state = getFullDatabaseState();
  const onlineUsers = getOnlineUsers();
  const payload = JSON.stringify({
    type: eventType,
    actor: actor || null,
    liveMessage: liveMessage || null,
    state,
    onlineUsers,
    timestamp: new Date().toISOString(),
  });

  // 1. Broadcast to all connected WebSocket clients
  for (const [wsClient] of wsClients.entries()) {
    if (wsClient.readyState === WebSocket.OPEN) {
      try {
        wsClient.send(payload);
      } catch {
        wsClients.delete(wsClient);
      }
    } else {
      wsClients.delete(wsClient);
    }
  }

  // 2. Broadcast to all connected SSE clients
  for (const sseClient of sseClients) {
    try {
      sseClient.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(sseClient);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = request.url?.split('?')[0];
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    wsClients.set(ws, {});

    // Send initial database state immediately upon connection
    const initPayload = JSON.stringify({
      type: 'init',
      state: getFullDatabaseState(),
      onlineUsers: getOnlineUsers(),
      timestamp: new Date().toISOString(),
    });
    ws.send(initPayload);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (
          msg?.type === 'presence:join' &&
          (msg.role === 'Abdullah' || msg.role === 'Ayah')
        ) {
          wsClients.set(ws, { role: msg.role });
          broadcastRealtimeEvent('presence:update', msg.role);
        }
      } catch {
        // Ignore malformed WS messages
      }
    });

    ws.on('close', () => {
      const meta = wsClients.get(ws);
      wsClients.delete(ws);
      if (meta?.role) {
        broadcastRealtimeEvent('presence:update', meta.role);
      }
    });
  });

  // Real-time Server-Sent Events stream (fallback / dual sync)
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const initPayload = JSON.stringify({
      type: 'init',
      state: getFullDatabaseState(),
      onlineUsers: getOnlineUsers(),
      timestamp: new Date().toISOString(),
    });
    res.write(`data: ${initPayload}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Get full database state
  app.get('/api/state', (_req: Request, res: Response) => {
    res.json({
      ...getFullDatabaseState(),
      onlineUsers: getOnlineUsers(),
    });
  });

  // Reset database to clean empty state
  app.post('/api/reset', (req: Request, res: Response) => {
    const { actor } = (req.body || {}) as { actor?: UserRole };
    const state = resetDatabase();
    broadcastRealtimeEvent(
      'db:reset',
      actor,
      'تم تصفير قاعدة البيانات والبدء من جديد بنجاح ✨'
    );
    res.json({ ok: true, state });
  });

  // Update Daily Mood & Energy Check-in
  app.post('/api/mood', (req: Request, res: Response) => {
    const { user, moodId, label, note } = req.body as {
      user: UserRole;
      moodId: MoodId;
      label: string;
      note?: string;
    };
    if (!user || !moodId || !label) {
      res.status(400).json({ error: 'بيانات الحالة غير مكتملة' });
      return;
    }

    const state = updateUserMood(user, moodId, label, note);
    const actorName = user === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    broadcastRealtimeEvent(
      'mood:updated',
      user,
      `تحديث مباشر: ${actorName} غيّر مؤشر طاقته إلى «${label}»`
    );
    res.json({ ok: true, state });
  });

  // Create Communication Log Entry (Idempotent by ID)
  app.post('/api/logs', (req: Request, res: Response) => {
    const body = req.body as Partial<CommunicationLog>;
    if (!body.createdBy || !body.date || !body.channel || !body.details) {
      res.status(400).json({ error: 'الرجاء تعبئة كافة الحقول المطلوبة' });
      return;
    }

    const { state, log } = insertCommunicationLog(body);
    const actorName =
      body.createdBy === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    broadcastRealtimeEvent(
      'log:created',
      body.createdBy,
      `تحديث مباشر: أضاف ${actorName} سجل تواصل جديد (${log.channel}) بانتظار مصادقتك!`
    );
    res.json({ ok: true, state, log });
  });

  // Verify / Dispute / Resolve Communication Log
  app.patch('/api/logs/:id/verify', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actor, status, disputeReason, resolutionNote } = req.body as {
      actor: UserRole;
      status: VerificationStatus;
      disputeReason?: string;
      resolutionNote?: string;
    };

    const { state, log } = verifyCommunicationLog(
      id,
      actor,
      status,
      disputeReason,
      resolutionNote
    );
    if (!log) {
      res.status(404).json({ error: 'السجل غير موجود' });
      return;
    }

    const actorName = actor === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    const actionLabel =
      status === 'approved'
        ? 'صادق على سجل التواصل 🎉'
        : status === 'resolved'
        ? 'وثّق الصلح والتفاهم 🤝'
        : 'أضاف وجهة نظر لنقاش هادئ وجهاً لوجه';
    broadcastRealtimeEvent(
      'log:verified',
      actor,
      `تحديث مباشر: ${actorName} ${actionLabel}`
    );
    res.json({ ok: true, state, log });
  });

  // Save Daily Satisfaction Rating
  app.post('/api/ratings', (req: Request, res: Response) => {
    const { date, user, stars, feeling, comment } = req.body as DailyRating;
    if (!date || !user || !stars || !feeling) {
      res.status(400).json({ error: 'بيانات التقييم غير مكتملة' });
      return;
    }

    const state = upsertDailyRating({ date, user, stars, feeling, comment });
    const actorName = user === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    broadcastRealtimeEvent(
      'rating:updated',
      user,
      `تحديث مباشر: قيّم ${actorName} رضا اليوم بـ (${stars}/5 نجوم - ${feeling})`
    );
    res.json({ ok: true, state });
  });

  // Add Positivity & Gratitude Entry
  app.post('/api/gratitudes', (req: Request, res: Response) => {
    const { fromUser, content, date } = req.body as {
      fromUser: UserRole;
      content: string;
      date?: string;
    };
    if (!fromUser || !content?.trim()) {
      res.status(400).json({ error: 'الرجاء كتابة رسالة الشكر والامتنان' });
      return;
    }

    const { state, gratitude } = insertGratitude(fromUser, content, date);
    const actorName = fromUser === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    broadcastRealtimeEvent(
      'gratitude:created',
      fromUser,
      `💌 رسالة شكر جديدة من ${actorName}: «${gratitude.content}»`
    );
    res.json({ ok: true, state, gratitude });
  });

  // SOS Communication Request & Acknowledgement
  app.post('/api/sos', (req: Request, res: Response) => {
    const { fromUser, customMessage } = req.body as {
      fromUser: UserRole;
      customMessage?: string;
    };
    if (!fromUser) {
      res.status(400).json({ error: 'المستخدم غير محدد' });
      return;
    }

    const { state, sos } = insertSosRequest(fromUser, customMessage);
    const actorName = fromUser === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    broadcastRealtimeEvent(
      'sos:triggered',
      fromUser,
      `☕ دعوة خاصة الآن من ${actorName}: «${sos.message}»`
    );
    res.json({ ok: true, state, sos });
  });

  app.patch('/api/sos/:id/ack', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actor, responseNote } = req.body as {
      actor: UserRole;
      responseNote?: string;
    };
    const state = acknowledgeSosRequest(id, actor, responseNote);
    if (!state) {
      res.status(404).json({ error: 'الطلب غير موجود' });
      return;
    }

    const actorName = actor === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    broadcastRealtimeEvent(
      'sos:acknowledged',
      actor,
      `☕ لبّى ${actorName} دعوة القهوة الخاصة بكل حب!`
    );
    res.json({ ok: true, state });
  });

  // Redeem Reward Coupon
  app.post('/api/coupons/:id/redeem', (req: Request, res: Response) => {
    const { id } = req.params;
    const { user } = req.body as { user: UserRole };
    if (!user) {
      res.status(400).json({ error: 'المستخدم غير محدد' });
      return;
    }

    const result = redeemCouponById(id, user);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    const actorName = user === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    broadcastRealtimeEvent(
      'coupon:redeemed',
      user,
      `🎁 قام ${actorName} باستبدال كوبون مكافأة من المتجر!`
    );
    res.json({ ok: true, state: result.state });
  });

  // Add Memory to Vault
  app.post('/api/memories', (req: Request, res: Response) => {
    const { title, note, date, createdBy, theme } = req.body as Partial<MemoryItem>;
    if (!title || !note || !createdBy) {
      res.status(400).json({ error: 'الرجاء إدخال عنوان وتفاصيل الذكرى' });
      return;
    }

    const { state, memory } = insertMemoryItem({
      title,
      note,
      date,
      createdBy,
      theme,
    });
    const actorName =
      createdBy === 'Abdullah' ? 'عبدالله 💙' : 'الملكة آية 🩷';
    broadcastRealtimeEvent(
      'memory:created',
      createdBy,
      `✨ أضاف ${actorName} ذكرى جديدة: «${memory.title}»`
    );
    res.json({ ok: true, state, memory });
  });

  // AI Peacekeeper Smart Rephrasing Endpoint
  app.post('/api/peacekeeper', async (req: Request, res: Response) => {
    const { text, sender } = req.body as { text: string; sender?: UserRole };
    if (!text?.trim()) {
      res.status(400).json({ error: 'النص فارغ' });
      return;
    }

    const localCheck = detectHarshTone(text);
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const partnerName = sender === 'Abdullah' ? 'آية' : 'عبدالله';
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `أنت مستشار علاقات زوجية لطيف وحكيم. أعد صياغة هذه الملاحظة الموجهة للشريك (${partnerName}) باللغة العربية بأسلوب دافئ، حنون، وهادئ يعبّر عن الاحتياج العاطفي دون لوم أو قسوة، في جملة واحدة أو جملتين قصيرتين فقط:\n"${text}"`,
        });
        const rewritten = response.text?.trim();
        if (rewritten) {
          res.json({
            isHarsh: localCheck.isHarsh,
            suggestion: rewritten.replace(/^["«]|["»]$/g, ''),
          });
          return;
        }
      } catch {
        // Fallback to deterministic local suggestion
      }
    }

    res.json({
      isHarsh: localCheck.isHarsh,
      suggestion: localCheck.gentleSuggestion,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server + WebSocket listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
