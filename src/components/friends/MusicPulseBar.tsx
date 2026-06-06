"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MusicToggleButton } from "@/components/ui/skiper-ui/skiper25";
import { AnimatedNumber } from "@/components/ui/skiper-ui/skiper37";
import { ProgressiveBlur } from "@/components/ui/skiper-ui/skiper41";
import { createCountdownParts, type CountdownParts } from "@/lib/countdown";
import {
  PORTAL_AUDIO_CUE_PHASE,
  PORTAL_INTRO_ENTER_EVENT,
  PORTAL_PHASE_CHANGE_EVENT
} from "@/lib/portal-events";
import { createTypewriterPlan, pickWeddingWelcomeMessage, weddingWelcomeMessages } from "@/lib/typewriter";
import { wedding } from "@/lib/wedding";

const BAR_COUNT = 6;
const IDLE_HEIGHT = 0.08;
const DEFAULT_MESSAGE = weddingWelcomeMessages[0];

function randomBarHeights(): number[] {
  return Array.from({ length: BAR_COUNT }, () => Math.random() * 0.8 + 0.2);
}

function idleBarHeights(): number[] {
  return Array(BAR_COUNT).fill(IDLE_HEIGHT);
}

function subscribeReducedMotion(listener: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

function formatCompactCountdown(parts: CountdownParts | null): string {
  if (!parts) {
    return "距離婚禮還有 -- 天 --:--:--";
  }

  if (parts.isComplete) {
    return "今天，就是今天";
  }

  return `距離婚禮還有 ${parts.days} 天 ${parts.hours}:${parts.minutes}:${parts.seconds}`;
}

function countdownValue(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function useCountdownParts(targetIso: string, initialNow?: Date) {
  const target = useMemo(() => new Date(targetIso), [targetIso]);
  const [parts, setParts] = useState<CountdownParts | null>(() =>
    initialNow ? createCountdownParts(target, initialNow) : null
  );

  useEffect(() => {
    if (initialNow) {
      return undefined;
    }

    const tick = () => setParts(createCountdownParts(target));
    const initialTimer = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [initialNow, target]);

  return parts;
}

function useTypewriterMessage(reduceMotion: boolean) {
  const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);
  // Track current displayed text in a ref so eraseNext can read its length
  // without going through setState — keeps the updater a pure return-value function.
  const displayedRef = useRef<string>(DEFAULT_MESSAGE);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = (fn: () => void, delay: number) => {
      timer = setTimeout(fn, delay);
    };

    const show = (text: string) => {
      displayedRef.current = text;
      setMessage(text);
    };

    const run = () => {
      const targetMessage = pickWeddingWelcomeMessage();
      const plan = createTypewriterPlan(targetMessage);
      let index = 0;

      const typeNext = () => {
        if (cancelled) return;

        if (index < plan.length) {
          const step = plan[index]!;
          show(step.text);
          index += 1;
          schedule(typeNext, step.delayMs);
          return;
        }

        const holdMs = 2000 + Math.random() * 3000;
        schedule(eraseNext, holdMs);
      };

      const eraseNext = () => {
        if (cancelled) return;
        // Read length from ref — pure side-effect-free, no updater scheduling
        const current = displayedRef.current;
        if (current.length <= 1) {
          show("");
          schedule(run, 220 + Math.random() * 520);
          return;
        }
        show(Array.from(current).slice(0, -1).join(""));
        schedule(eraseNext, 38 + Math.random() * 86);
      };

      show("");
      schedule(typeNext, 120 + Math.random() * 420);
    };

    schedule(run, 900 + Math.random() * 1600);

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [reduceMotion]);

  return reduceMotion ? DEFAULT_MESSAGE : message;
}

function tryPlay(
  audio: HTMLAudioElement,
  setIsPlaying: (v: boolean) => void,
  setNeedsManualPlay: (v: boolean) => void
) {
  audio.play().then(() => {
    setIsPlaying(true);
    setNeedsManualPlay(false);
  }).catch((err: unknown) => {
    // AbortError fires when play() is interrupted by a rapid pause — not a policy block.
    // Only surface the manual-play prompt for genuine autoplay policy rejections.
    const name = err instanceof Error ? err.name : "";
    if (name !== "AbortError") {
      setNeedsManualPlay(true);
    }
    setIsPlaying(false);
  });
}

type MusicPulseBarProps = {
  initialNow?: Date;
  targetIso?: string;
};

export function MusicPulseBar({ initialNow, targetIso = wedding.dateTimeIso }: MusicPulseBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isArmingRef = useRef(false);
  const audibleStartedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>(idleBarHeights);
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const countdownParts = useCountdownParts(targetIso, initialNow);
  const typewriterMessage = useTypewriterMessage(reduceMotion);
  const displayHeights = isPlaying && !reduceMotion ? barHeights : idleBarHeights();
  const countdownLabel = formatCompactCountdown(countdownParts);
  const dayValue = countdownValue(countdownParts?.days);
  const hourValue = countdownValue(countdownParts?.hours);
  const minuteValue = countdownValue(countdownParts?.minutes);
  const secondValue = countdownValue(countdownParts?.seconds);

  // Create audio element once on mount; sync isPlaying with OS play/pause events
  useEffect(() => {
    const audio = new Audio("/audio/i_love_you_baby.mp3");
    audio.loop = true;
    audio.preload = "none";

    // Keep React state in sync when OS interrupts playback (calls, notifications, etc.)
    const onPlay = () => {
      if (!isArmingRef.current) {
        setIsPlaying(true);
      }
    };
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Animate bars with setInterval when playing
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && !reduceMotion) {
      intervalRef.current = setInterval(() => {
        setBarHeights(randomBarHeights());
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, reduceMotion]);

  // The intro click silently arms playback so browser policy accepts the later audible cue.
  useEffect(() => {
    const armMutedPlayback = () => {
      const audio = audioRef.current;
      if (!audio) return;

      // New intro cycle: allow one audible start when cue/done arrives.
      audibleStartedRef.current = false;
      isArmingRef.current = true;
      audio.muted = true;
      tryPlay(audio, () => setIsPlaying(false), () => undefined);
    };

    const startAudiblePlayback = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audibleStartedRef.current) return;

      isArmingRef.current = false;
      audio.muted = false;
      audio.currentTime = 0;
      audibleStartedRef.current = true;
      if (audio.paused) {
        tryPlay(audio, setIsPlaying, setNeedsManualPlay);
      } else {
        setIsPlaying(true);
        setNeedsManualPlay(false);
      }
    };

    const handlePhaseChange = (event: Event) => {
      const e = event as CustomEvent<{ phase: string }>;
      if (e.detail.phase === PORTAL_AUDIO_CUE_PHASE || e.detail.phase === "done") startAudiblePlayback();
    };

    window.addEventListener(PORTAL_INTRO_ENTER_EVENT, armMutedPlayback);
    window.addEventListener(PORTAL_PHASE_CHANGE_EVENT, handlePhaseChange);

    // Catch-up: if phase was already "done" before we registered
    if (
      document.body.dataset.portalPhase === PORTAL_AUDIO_CUE_PHASE ||
      document.body.dataset.portalPhase === "done"
    ) {
      startAudiblePlayback();
    }

    return () => {
      window.removeEventListener(PORTAL_INTRO_ENTER_EVENT, armMutedPlayback);
      window.removeEventListener(PORTAL_PHASE_CHANGE_EVENT, handlePhaseChange);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      // isPlaying will be set false by the "pause" event listener
    } else {
      isArmingRef.current = false;
      audio.muted = false;
      tryPlay(audio, setIsPlaying, setNeedsManualPlay);
    }
  };

  return (
    <div className="music-glass-shell">
      <div className="friends-progressive-blur friends-progressive-blur-bottom" aria-hidden="true">
        <ProgressiveBlur
          position="bottom"
          height="150px"
          backgroundColor="#f7f6f2"
          blurAmount="4px"
        />
      </div>
      {/* No aria-label on the div — it has no role, screen readers ignore it.
      The meaningful label lives on the button below. */}
      <div className="music-glass-bar">
        <div className="music-countdown-ticker" aria-live="polite" aria-label={countdownLabel}>
          <span className="sr-only">{countdownLabel}</span>
          <span className="music-countdown-label">距離婚禮還有</span>
          <span className="music-countdown-time" aria-hidden="true">
            <AnimatedNumber value={dayValue} padDigits={2} className="music-countdown-number" />
            <span className="music-countdown-unit">天</span>
            <AnimatedNumber value={hourValue} padDigits={2} className="music-countdown-number" />
            <span className="music-countdown-colon">:</span>
            <AnimatedNumber value={minuteValue} padDigits={2} className="music-countdown-number" />
            <span className="music-countdown-colon">:</span>
            <AnimatedNumber value={secondValue} padDigits={2} className="music-countdown-number" />
          </span>
          <span className="music-countdown-separator" aria-hidden="true">·</span>
          <span className="music-countdown-message">{typewriterMessage}</span>
          {!reduceMotion && <span className="music-countdown-cursor" aria-hidden="true">|</span>}
        </div>
        <MusicToggleButton
          isPlaying={isPlaying}
          onToggle={toggle}
          heights={displayHeights}
          hint={needsManualPlay ? "點擊播放音樂" : null}
          label={isPlaying ? "暫停背景音樂" : "播放背景音樂"}
        />
      </div>
    </div>
  );
}
