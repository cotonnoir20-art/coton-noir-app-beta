import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import {
  FLOATING_MESSAGES, MAX_DAILY_MESSAGES, MESSAGE_ROTATION, MIN_BETWEEN_ANY_MS,
  TRIGGER_CONFIGS,
} from '../components/blackCotton/constants';
import type {
  BCContextValue, BCMessage, BlackCottonMood, BlackCottonTrigger,
  DisplayMode, FloatingMessage, TriggerContext,
} from '../components/blackCotton/types';
import { getFloatingTips } from '../services/coachApi';
import { useApp } from './AppContext';

// ── Storage keys ──────────────────────────────────────────────────────────
const ONCE_PREFIX  = 'bc_once_';
const DAILY_KEY    = 'bc_daily';

const BCContext = createContext<BCContextValue | null>(null);

export function BlackCottonProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();

  const [current, setCurrent]             = useState<BCMessage | null>(null);
  const [isVisible, setIsVisible]         = useState(false);
  const [isFloatingOpen, setIsFloating]   = useState(false);
  const [floatingMsg, setFloatingMsg]     = useState<FloatingMessage>(FLOATING_MESSAGES[0]);
  const [floatingLoading]                 = useState(false);

  const queue         = useRef<BCMessage[]>([]);
  const shownAt       = useRef<Partial<Record<BlackCottonTrigger, number>>>({});
  const lastShownAt   = useRef(0);
  const dailyCount    = useRef(0);
  const floatIdxRef   = useRef(0);
  const isShowingRef  = useRef(false);
  const claudeTips    = useRef<FloatingMessage[]>([]);

  // ── Fetch Claude tips once on mount ──────────────────────────────────
  useEffect(() => {
    getFloatingTips(state.profile as any)
      .then(tips => {
        claudeTips.current = tips.map(text => ({ text, mood: 'coaching' as const }));
      })
      .catch(() => {});
  }, []);

  // ── Show next queued message ──────────────────────────────────────────
  const flushQueue = useCallback(() => {
    if (queue.current.length === 0 || isShowingRef.current) return;
    const [next, ...rest] = queue.current;
    queue.current = rest;
    isShowingRef.current = true;
    setCurrent(next);
    setIsVisible(true);
    lastShownAt.current = Date.now();
    dailyCount.current += 1;
  }, []);

  // ── Dismiss current message ───────────────────────────────────────────
  const dismiss = useCallback(() => {
    setIsVisible(false);
    setCurrent(null);
    isShowingRef.current = false;
    // Small gap before next message so animations don't collide
    setTimeout(flushQueue, 700);
  }, [flushQueue]);

  // ── Fire a trigger ────────────────────────────────────────────────────
  const fire = useCallback(async (trigger: BlackCottonTrigger, ctx?: TriggerContext) => {
    const config = TRIGGER_CONFIGS[trigger];
    if (!config || config.messages.length === 0) return;

    const now = Date.now();

    // Daily cap
    if (dailyCount.current >= MAX_DAILY_MESSAGES) return;

    // Global cooldown (except priority-1 messages bypass it)
    if (
      config.priority > 1 &&
      lastShownAt.current > 0 &&
      now - lastShownAt.current < MIN_BETWEEN_ANY_MS
    ) return;

    // Per-trigger cooldown
    const last = shownAt.current[trigger] ?? 0;
    if (config.cooldown > 0 && now - last < config.cooldown) return;

    // Once-only triggers (persisted to AsyncStorage)
    if (config.once) {
      const key = `${ONCE_PREFIX}${trigger}`;
      const seen = await AsyncStorage.getItem(key);
      if (seen) return;
      await AsyncStorage.setItem(key, '1');
    }

    // Pick message variant with rotation (avoids repetition)
    const rotIdx = (MESSAGE_ROTATION[trigger] ?? 0) % config.messages.length;
    MESSAGE_ROTATION[trigger] = rotIdx + 1;
    const variant = config.messages[rotIdx];

    const msg: BCMessage = {
      id:          `${trigger}_${now}`,
      text:        variant.text,
      subtext:     variant.subtext,
      mood:        ctx?.mood ?? variant.mood,
      trigger,
      priority:    config.priority,
      displayMode: ctx?.displayMode ?? config.displayMode,
      duration:    config.duration,
      actionLabel: ctx?.actionLabel,
      onAction:    ctx?.onAction,
    };

    shownAt.current[trigger] = now;

    // Enqueue (sorted by priority, capped at 3 pending)
    if (!isShowingRef.current) {
      isShowingRef.current = true;
      setCurrent(msg);
      setIsVisible(true);
      lastShownAt.current = now;
      dailyCount.current += 1;
    } else if (queue.current.length < 3) {
      queue.current = [...queue.current, msg].sort((a, b) => a.priority - b.priority);
    }
  }, []);

  // ── Manually show a message without a trigger ─────────────────────────
  const showManual = useCallback((
    text: string,
    mood: BlackCottonMood = 'happy',
    displayMode: DisplayMode = 'toast',
  ) => {
    const msg: BCMessage = {
      id: `manual_${Date.now()}`,
      text,
      mood,
      trigger:     'manual',
      priority:    2,
      displayMode,
      duration:    4000,
    };
    if (!isShowingRef.current) {
      isShowingRef.current = true;
      setCurrent(msg);
      setIsVisible(true);
    }
  }, []);

  // ── Toggle floating mini panel — Claude tips si dispo, sinon statiques ──
  const toggleFloating = useCallback(() => {
    setIsFloating(prev => {
      if (!prev) {
        const pool = claudeTips.current.length > 0 ? claudeTips.current : FLOATING_MESSAGES;
        const idx  = floatIdxRef.current % pool.length;
        floatIdxRef.current = idx + 1;
        setFloatingMsg(pool[idx]);
      }
      return !prev;
    });
  }, []);

  return (
    <BCContext.Provider value={{
      current, isVisible, isFloatingOpen, floatingMsg, floatingLoading,
      fire, dismiss, toggleFloating, showManual,
    }}>
      {children}
    </BCContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useBlackCotton(): BCContextValue {
  const ctx = useContext(BCContext);
  if (!ctx) throw new Error('useBlackCotton must be used inside <BlackCottonProvider>');
  return ctx;
}
