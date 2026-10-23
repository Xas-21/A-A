/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CommunicationLog,
  CoupleStoreState,
  DailyRating,
  MemoryItem,
  MoodId,
  UserRole,
  VerificationStatus,
} from './types';
import { createInitialSeedState } from './utils/seedData';
import {
  calculateMonthlyAnalytics,
  detectHarshTone,
  getTodayDateStr,
} from './utils/communicationLogic';
import { LoginView } from './components/LoginView';
import { WelcomeAndMoodModal } from './components/WelcomeAndMoodModal';
import {
  ActiveSectionTab,
  DesignOneSmartCards,
} from './components/designs/DesignOneSmartCards';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserRole | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam === 'Abdullah' || roleParam === 'Ayah') {
        return roleParam;
      }
      if (params.get('autostart') === '1') {
        return 'Ayah';
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<ActiveSectionTab>('daily');
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getTodayDateStr()
  );
  const [storeState, setStoreState] = useState<CoupleStoreState>(() =>
    createInitialSeedState()
  );
  const [onlineUsers, setOnlineUsers] = useState<UserRole[]>([]);
  const [livePartnerToast, setLivePartnerToast] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const currentUserRef = useRef<UserRole | null>(currentUser);
  currentUserRef.current = currentUser;

  // Connect to backend API, live WebSocket (/ws), and SSE fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    const handleIncomingRealtimePayload = (parsed: {
      type?: string;
      actor?: UserRole | null;
      liveMessage?: string | null;
      state?: CoupleStoreState;
      onlineUsers?: UserRole[];
    }) => {
      if (parsed?.state?.logs && parsed?.state?.moods) {
        setStoreState(parsed.state);
      }
      if (Array.isArray(parsed?.onlineUsers)) {
        setOnlineUsers(parsed.onlineUsers);
      }
      // Show live toast when the OTHER spouse performs an action
      if (
        parsed?.liveMessage &&
        parsed.actor &&
        currentUserRef.current &&
        parsed.actor !== currentUserRef.current
      ) {
        setLivePartnerToast(parsed.liveMessage);
      }
    };

    // Initial HTTP state fetch
    fetch('/api/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.logs && data.moods) {
          setStoreState(data);
          if (Array.isArray(data.onlineUsers)) {
            setOnlineUsers(data.onlineUsers);
          }
        }
      })
      .catch(() => {
        // Ignore network error on initial load
      });

    // Connect live WebSocket with auto-reconnect
    const connectWebSocket = () => {
      if (isUnmounted || typeof window === 'undefined') return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (currentUserRef.current) {
            ws.send(
              JSON.stringify({
                type: 'presence:join',
                role: currentUserRef.current,
              })
            );
          }
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            handleIncomingRealtimePayload(parsed);
          } catch {
            // Ignore malformed WS message
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            reconnectTimer = setTimeout(connectWebSocket, 2000);
          }
        };
      } catch {
        // Fallback to SSE
      }
    };

    connectWebSocket();

    // SSE fallback stream
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleIncomingRealtimePayload(parsed);
        } catch {
          // Ignore malformed event
        }
      };
    } catch {
      // Ignore if SSE unsupported
    }

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      eventSource?.close();
    };
  }, []);

  // Announce presence over WebSocket whenever currentUser changes
  useEffect(() => {
    if (
      currentUser &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      wsRef.current.send(
        JSON.stringify({ type: 'presence:join', role: currentUser })
      );
    }
  }, [currentUser]);

  // Auto-clear live partner toast after 5 seconds
  useEffect(() => {
    if (!livePartnerToast) return;
    const timer = setTimeout(() => setLivePartnerToast(''), 5000);
    return () => clearTimeout(timer);
  }, [livePartnerToast]);

  const analytics = useMemo(
    () => calculateMonthlyAnalytics(storeState.logs, storeState.ratings),
    [storeState.logs, storeState.ratings]
  );

  const handleLoginSuccess = (role: UserRole) => {
    setCurrentUser(role);
    setShowWelcomeModal(true);
  };

  const handleSwitchPartnerQuick = () => {
    if (!currentUser) return;
    const nextRole: UserRole = currentUser === 'Ayah' ? 'Abdullah' : 'Ayah';
    setCurrentUser(nextRole);
    setShowWelcomeModal(true);
  };

  const handleSaveMoodAndClose = async (
    moodId: MoodId,
    label: string,
    note: string
  ) => {
    if (!currentUser) return;
    setShowWelcomeModal(false);
    setStoreState((prev) => ({
      ...prev,
      moods: {
        ...prev.moods,
        [currentUser]: {
          user: currentUser,
          moodId,
          label,
          note,
          updatedAt: new Date().toISOString(),
        },
      },
      points: {
        ...prev.points,
        [currentUser]: (prev.points[currentUser] || 0) + 10,
      },
    }));

    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser, moodId, label, note }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleAddLog = async (logData: Partial<CommunicationLog>) => {
    if (!currentUser) return;
    const tempId = `log-${Date.now()}`;
    const optimisticLog: CommunicationLog = {
      id: tempId,
      date: logData.date || selectedDate,
      createdBy: currentUser,
      channel: logData.channel || 'جلسة شخصية بالبيت',
      durationMinutes: Number(logData.durationMinutes) || 30,
      details: logData.details || '',
      quality: logData.quality || 'عميق/فعّال',
      lowCommReason: logData.lowCommReason,
      customExcuseNote: logData.customExcuseNote,
      timeSlot: logData.timeSlot || 'مساءً (8م - 12ص)',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setStoreState((prev) => ({
      ...prev,
      logs: prev.logs.some((l) => l.id === tempId)
        ? prev.logs
        : [optimisticLog, ...prev.logs],
      points: {
        ...prev.points,
        [currentUser]: (prev.points[currentUser] || 0) + 25,
      },
    }));

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...optimisticLog }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleVerifyLog = async (
    logId: string,
    status: VerificationStatus,
    disputeReason?: string,
    resolutionNote?: string
  ) => {
    if (!currentUser) return;
    setStoreState((prev) => ({
      ...prev,
      logs: prev.logs.map((l) =>
        l.id === logId
          ? {
              ...l,
              status,
              disputeReason: disputeReason ?? l.disputeReason,
              resolutionNote: resolutionNote ?? l.resolutionNote,
            }
          : l
      ),
    }));

    try {
      const res = await fetch(`/api/logs/${logId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: currentUser,
          status,
          disputeReason,
          resolutionNote,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleSaveRating = async (rating: DailyRating) => {
    setStoreState((prev) => {
      const idx = prev.ratings.findIndex(
        (r) => r.date === rating.date && r.user === rating.user
      );
      const nextRatings = [...prev.ratings];
      if (idx >= 0) {
        nextRatings[idx] = rating;
      } else {
        nextRatings.push(rating);
      }
      return { ...prev, ratings: nextRatings };
    });

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rating),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleAddGratitude = async (content: string) => {
    if (!currentUser) return;
    const toUser: UserRole = currentUser === 'Abdullah' ? 'Ayah' : 'Abdullah';
    const optimisticGrat = {
      id: `grat-${Date.now()}`,
      date: selectedDate,
      fromUser: currentUser,
      toUser,
      content,
      createdAt: new Date().toISOString(),
    };

    setStoreState((prev) => ({
      ...prev,
      gratitudes: [optimisticGrat, ...prev.gratitudes],
      points: {
        ...prev.points,
        [currentUser]: (prev.points[currentUser] || 0) + 30,
      },
    }));

    try {
      const res = await fetch('/api/gratitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUser: currentUser,
          content,
          date: selectedDate,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleTriggerSos = async (customMessage?: string) => {
    if (!currentUser) return;
    const toUser: UserRole = currentUser === 'Abdullah' ? 'Ayah' : 'Abdullah';
    const optimisticSos = {
      id: `sos-${Date.now()}`,
      fromUser: currentUser,
      toUser,
      message:
        customMessage || 'شريكك يحتاج جلسة تواصل خاصة اليوم لما تفضى ☕',
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };

    setStoreState((prev) => ({
      ...prev,
      sosRequests: [optimisticSos, ...prev.sosRequests],
    }));

    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUser: currentUser, customMessage }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleAckSos = async (sosId: string, responseNote?: string) => {
    if (!currentUser) return;
    setStoreState((prev) => ({
      ...prev,
      sosRequests: prev.sosRequests.map((s) =>
        s.id === sosId ? { ...s, acknowledged: true, responseNote } : s
      ),
    }));

    try {
      const res = await fetch(`/api/sos/${sosId}/ack`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: currentUser, responseNote }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleRedeemCoupon = async (couponId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/coupons/${couponId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Keep optimistic state
    }
  };

  const handleAddMemory = async (memory: Partial<MemoryItem>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...memory, createdBy: currentUser }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Ignore
    }
  };

  const handleResetDatabase = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: currentUser }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.state) setStoreState(json.state);
      }
    } catch {
      // Ignore
    }
  };

  const handleRequestPeacekeeper = async (text: string): Promise<string> => {
    try {
      const res = await fetch('/api/peacekeeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender: currentUser }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.suggestion) return json.suggestion;
      }
    } catch {
      // Ignore
    }
    return detectHarshTone(text).gentleSuggestion || text;
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const isAyah = currentUser === 'Ayah';
  const myMood = storeState.moods[currentUser];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0B0F19] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B0F19] to-[#070A12] text-slate-100"
    >
      {/* Celebratory Login Popup & Mood Check-in */}
      <WelcomeAndMoodModal
        isOpen={showWelcomeModal}
        role={currentUser}
        currentMood={myMood}
        onSaveMoodAndClose={handleSaveMoodAndClose}
        onCloseOnly={() => setShowWelcomeModal(false)}
      />

      {/* Strict 3-Zone Top Bar Contract on Dark Surface */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/90 px-4 md:px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('daily');
            }}
            className={`font-display text-sm sm:text-lg font-extrabold tracking-tight whitespace-nowrap shrink-0 ${
              isAyah ? 'text-pink-400' : 'text-blue-400'
            }`}
          >
            ميثاق المودة — عبدالله وآية
          </a>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400"
          >
            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
                activeTab === 'daily'
                  ? isAyah
                    ? 'border-pink-500 text-white font-bold'
                    : 'border-blue-500 text-white font-bold'
                  : 'border-transparent'
              }`}
            >
              يومياتنا السريعة
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rewards')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
                activeTab === 'rewards'
                  ? isAyah
                    ? 'border-pink-500 text-white font-bold'
                    : 'border-blue-500 text-white font-bold'
                  : 'border-transparent'
              }`}
            >
              المكافآت والذكريات
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
                activeTab === 'analytics'
                  ? isAyah
                    ? 'border-pink-500 text-white font-bold'
                    : 'border-blue-500 text-white font-bold'
                  : 'border-transparent'
              }`}
            >
              إحصائيات الشهر
            </button>
            <button
              type="button"
              onClick={handleSwitchPartnerQuick}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 border-transparent"
            >
              تبديل سريع إلى {isAyah ? 'عبدالله 💙' : 'آية 🩷'}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentUser(null)}
              className={`px-3 sm:px-4 py-2 text-xs font-bold text-white rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-md ${
                isAyah
                  ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              }`}
            >
              تغيير الحساب ({isAyah ? 'آية 🩷' : 'عبدالله 💙'})
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Enhanced Design 1 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <DesignOneSmartCards
          currentUser={currentUser}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          storeState={storeState}
          onlineUsers={onlineUsers}
          livePartnerToast={livePartnerToast}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          analytics={analytics}
          onUpdateMood={handleSaveMoodAndClose}
          onAddLog={handleAddLog}
          onVerifyLog={handleVerifyLog}
          onSaveRating={handleSaveRating}
          onAddGratitude={handleAddGratitude}
          onTriggerSos={handleTriggerSos}
          onAckSos={handleAckSos}
          onRedeemCoupon={handleRedeemCoupon}
          onAddMemory={handleAddMemory}
          onResetDatabase={handleResetDatabase}
          onRequestPeacekeeper={handleRequestPeacekeeper}
        />
      </main>
    </div>
  );
}
