"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
    Play,
    Pause,
    RotateCcw,
    SkipForward,
    Settings as SettingsIcon,
    Coffee,
    Brain,
    Moon,
    Volume2,
    VolumeX,
    X,
    Check,
} from "lucide-react";
import styles from "./pomodoro.module.css";

// ===========================================================================
// Types & constants
// ===========================================================================

type Mode = "focus" | "shortBreak" | "longBreak";

interface Durations {
    focus: number; // seconds
    shortBreak: number;
    longBreak: number;
}

const DEFAULT_DURATIONS: Durations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
};

const DEFAULT_LONG_BREAK_INTERVAL = 4; // every N focus sessions → long break

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ===========================================================================
// Sound hook — Web Audio API, no assets required
// ===========================================================================

function useSound() {
    const ctxRef = useRef<AudioContext | null>(null);
    const [muted, setMuted] = useState(false);
    const mutedRef = useRef(muted);
    mutedRef.current = muted;

    const getCtx = () => {
        if (typeof window === "undefined") return null;
        if (!ctxRef.current) {
            const AC =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext;
            if (!AC) return null;
            ctxRef.current = new AC();
        }
        return ctxRef.current;
    };

    const playTone = useCallback(
        (
            freq: number,
            duration = 0.15,
            type: OscillatorType = "sine",
            volume = 0.15,
        ) => {
            if (mutedRef.current) return;
            const ctx = getCtx();
            if (!ctx) return;
            try {
                if (ctx.state === "suspended") ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                const now = ctx.currentTime;
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + duration + 0.02);
            } catch {
                /* ignore */
            }
        },
        [],
    );

    const api = useMemo(
        () => ({
            muted,
            setMuted,
            toggleMute: () => setMuted((m) => !m),
            click: () => playTone(520, 0.08, "triangle"),
            start: () => {
                playTone(600, 0.1, "sine");
                setTimeout(() => playTone(800, 0.12, "sine"), 90);
            },
            pause: () => playTone(360, 0.12, "sine"),
            reset: () => {
                playTone(440, 0.08, "triangle");
                setTimeout(() => playTone(300, 0.14, "triangle"), 80);
            },
            next: () => {
                playTone(660, 0.09, "sine");
                setTimeout(() => playTone(880, 0.12, "sine"), 80);
            },
            complete: () => {
                // pleasant 3-note chime
                playTone(660, 0.18, "sine", 0.2);
                setTimeout(() => playTone(880, 0.18, "sine", 0.2), 170);
                setTimeout(() => playTone(1175, 0.4, "sine", 0.22), 340);
            },
        }),
        [muted, playTone],
    );

    return api;
}

// ===========================================================================
// Helpers
// ===========================================================================

const formatTime = (totalSeconds: number) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const MODE_ICON: Record<Mode, typeof Brain> = {
    focus: Brain,
    shortBreak: Coffee,
    longBreak: Moon,
};

// ===========================================================================
// Page component
// ===========================================================================

export default function PomodoroComponent() {
    const t = useTranslations("pomodoro");
    const sound = useSound();

    // ---- config --------------------------------------------------------------
    const [durations, setDurations] = useState<Durations>(DEFAULT_DURATIONS);
    const [longBreakInterval, setLongBreakInterval] = useState(
        DEFAULT_LONG_BREAK_INTERVAL,
    );

    // ---- runtime -------------------------------------------------------------
    const [mode, setMode] = useState<Mode>("focus");
    const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATIONS.focus);
    const [running, setRunning] = useState(false);
    const [completedFocus, setCompletedFocus] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const totalForMode = durations[mode];
    const progress = totalForMode > 0 ? secondsLeft / totalForMode : 0;
    const dashOffset = CIRCUMFERENCE * (1 - progress);

    // ---- timer loop ----------------------------------------------------------
    useEffect(() => {
        if (!running) return;
        if (secondsLeft <= 0) return;

        const id = window.setTimeout(() => {
            setSecondsLeft((s) => Math.max(0, s - 1));
        }, 1000);

        return () => window.clearTimeout(id);
    }, [running, secondsLeft]);

    // ---- on completion -------------------------------------------------------
    const justCompletedRef = useRef(false);
    useEffect(() => {
        if (!running) return;
        if (secondsLeft !== 0) {
            justCompletedRef.current = false;
            return;
        }
        if (justCompletedRef.current) return;
        justCompletedRef.current = true;

        setRunning(false);
        sound.complete();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secondsLeft, running]);

    // ---- actions -------------------------------------------------------------
    const switchMode = useCallback(
        (next: Mode, resetCount = false) => {
            setMode(next);
            setSecondsLeft(durations[next]);
            setRunning(false);
            if (resetCount) setCompletedFocus(0);
        },
        [durations],
    );

    const handleStartPause = () => {
        if (running) {
            sound.pause();
            setRunning(false);
        } else {
            // If the timer already hit zero, restart the current mode
            if (secondsLeft === 0) setSecondsLeft(durations[mode]);
            sound.start();
            setRunning(true);
        }
    };

    const handleReset = () => {
        sound.reset();
        setRunning(false);
        setSecondsLeft(durations[mode]);
        justCompletedRef.current = false;
    };

    const handleNext = () => {
        sound.next();
        justCompletedRef.current = false;

        if (mode === "focus") {
            const nextCount = completedFocus + 1;
            setCompletedFocus(nextCount);
            const isLong = nextCount % longBreakInterval === 0;
            switchMode(isLong ? "longBreak" : "shortBreak");
        } else {
            switchMode("focus");
        }
    };

    const handleSaveSettings = (next: Durations, interval: number) => {
        const clamp = (n: number, lo: number, hi: number) =>
            Math.min(hi, Math.max(lo, Math.floor(n || lo)));

        const safe: Durations = {
            focus: clamp(next.focus, 1, 180) * 60,
            shortBreak: clamp(next.shortBreak, 1, 60) * 60,
            longBreak: clamp(next.longBreak, 1, 120) * 60,
        };
        setDurations(safe);
        setLongBreakInterval(clamp(interval, 1, 12));
        setSecondsLeft(safe[mode]);
        setRunning(false);
        justCompletedRef.current = false;
        setSettingsOpen(false);
        sound.click();
    };

    // ---- derived labels ------------------------------------------------------
    const ModeIcon = MODE_ICON[mode];
    const modeClass =
        mode === "focus"
            ? styles.modeFocus
            : mode === "shortBreak"
                ? styles.modeShort
                : styles.modeLong;

    const sessionsUntilLong =
        longBreakInterval - (completedFocus % longBreakInterval);

    return (
        <div className={styles.page}>
            <div className={styles.wrapper}>
                {/* ---------------- Header ---------------- */}
                <header className={styles.header}>
                    <span className={styles.badge}>
                        <Brain size={14} /> {t("badge")}
                    </span>
                    <h1 className={styles.title}>{t("title")}</h1>
                    <p className={styles.subtitle}>{t("subtitle")}</p>
                </header>

                {/* ---------------- Mode tabs ---------------- */}
                <div
                    className={styles.modeTabs}
                    role="tablist"
                    aria-label={t("title")}
                >
                    {(["focus", "shortBreak", "longBreak"] as Mode[]).map((m) => {
                        const Icon = MODE_ICON[m];
                        const active = mode === m;
                        return (
                            <button
                                key={m}
                                role="tab"
                                aria-selected={active}
                                className={`${styles.modeTab} ${active ? styles.modeTabActive : ""}`}
                                onClick={() => {
                                    if (m === mode) return;
                                    sound.click();
                                    justCompletedRef.current = false;
                                    switchMode(m);
                                }}
                            >
                                <Icon size={16} />
                                <span>{t(`modes.${m}`)}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ---------------- Timer ring ---------------- */}
                <div className={`${styles.timerCard} ${modeClass}`}>
                    <div className={styles.ringWrapper}>
                        <svg
                            className={styles.ring}
                            viewBox="0 0 320 320"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden="true"
                        >
                            <circle
                                className={styles.ringTrack}
                                cx={160}
                                cy={160}
                                r={RADIUS}
                                fill="none"
                                strokeWidth={10}
                            />
                            <circle
                                className={styles.ringProgress}
                                cx={160}
                                cy={160}
                                r={RADIUS}
                                fill="none"
                                strokeWidth={10}
                                strokeLinecap="round"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={dashOffset}
                            />
                        </svg>

                        <div className={styles.ringCenter}>
                            <div className={styles.modeIcon}>
                                <ModeIcon size={26} />
                            </div>
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={formatTime(secondsLeft)}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                    className={styles.time}
                                >
                                    {formatTime(secondsLeft)}
                                </motion.div>
                            </AnimatePresence>
                            <div className={styles.modeLabel}>
                                {t(`modes.${mode}`)}
                            </div>
                        </div>
                    </div>

                    {/* ---------------- Controls ---------------- */}
                    <div className={styles.controls}>
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            className={styles.primaryButton}
                            onClick={handleStartPause}
                            aria-label={
                                running ? t("controls.pause") : t("controls.start")
                            }
                        >
                            {running ? <Pause size={20} /> : <Play size={20} />}
                            <span>
                                {running ? t("controls.pause") : t("controls.start")}
                            </span>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            className={styles.iconButton}
                            onClick={handleReset}
                            aria-label={t("controls.reset")}
                            title={t("controls.reset")}
                        >
                            <RotateCcw size={18} />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            className={styles.secondaryButton}
                            onClick={handleNext}
                            aria-label={t("controls.next")}
                        >
                            <SkipForward size={18} />
                            <span>{t("controls.next")}</span>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            className={styles.iconButton}
                            onClick={sound.toggleMute}
                            aria-label={
                                sound.muted ? t("controls.unmute") : t("controls.mute")
                            }
                            title={
                                sound.muted ? t("controls.unmute") : t("controls.mute")
                            }
                        >
                            {sound.muted ? (
                                <VolumeX size={18} />
                            ) : (
                                <Volume2 size={18} />
                            )}
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            className={styles.iconButton}
                            onClick={() => {
                                sound.click();
                                setSettingsOpen(true);
                            }}
                            aria-label={t("controls.settings")}
                            title={t("controls.settings")}
                        >
                            <SettingsIcon size={18} />
                        </motion.button>
                    </div>
                </div>

                {/* ---------------- Stats ---------------- */}
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>
                            {t("stats.completed")}
                        </span>
                        <span className={styles.statValue}>{completedFocus}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>
                            {t("stats.untilLong")}
                        </span>
                        <span className={styles.statValue}>
                            {sessionsUntilLong === longBreakInterval
                                ? longBreakInterval
                                : sessionsUntilLong}
                        </span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>{t("stats.cycle")}</span>
                        <span className={styles.statValue}>
                            {Math.floor(completedFocus / longBreakInterval) + 1}
                        </span>
                    </div>
                </div>
            </div>

            {/* ---------------- Settings modal ---------------- */}
            <AnimatePresence>
                {settingsOpen && (
                    <SettingsModal
                        initialDurations={durations}
                        initialInterval={longBreakInterval}
                        onClose={() => setSettingsOpen(false)}
                        onSave={handleSaveSettings}
                        t={t}
                        sound={sound}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ===========================================================================
// Settings modal
// ===========================================================================

function SettingsModal({
    initialDurations,
    initialInterval,
    onClose,
    onSave,
    t,
    sound,
}: {
    initialDurations: Durations;
    initialInterval: number;
    onClose: () => void;
    onSave: (d: Durations, interval: number) => void;
    t: ReturnType<typeof useTranslations<"pomodoro">>;
    sound: ReturnType<typeof useSound>;
}) {
    // stored as minutes for the inputs
    const [focusMin, setFocusMin] = useState(
        Math.round(initialDurations.focus / 60),
    );
    const [shortMin, setShortMin] = useState(
        Math.round(initialDurations.shortBreak / 60),
    );
    const [longMin, setLongMin] = useState(
        Math.round(initialDurations.longBreak / 60),
    );
    const [interval, setIntervalVal] = useState(initialInterval);

    const submit = () => {
        const clamp = (n: number, lo: number, hi: number) =>
            Math.min(hi, Math.max(lo, Math.floor(n || lo)));

        onSave(
            {
                focus: clamp(focusMin, 1, 180),
                shortBreak: clamp(shortMin, 1, 60),
                longBreak: clamp(longMin, 1, 120),
            },
            clamp(interval, 1, 12),
        );
    };

    const resetDefaults = () => {
        sound.click();
        setFocusMin(25);
        setShortMin(5);
        setLongMin(15);
        setIntervalVal(4);
    };

    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{t("settings.title")}</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label={t("settings.cancel")}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.formGrid}>
                    <NumberField
                        label={t("settings.focus")}
                        value={focusMin}
                        min={1}
                        max={180}
                        onChange={setFocusMin}
                    />
                    <NumberField
                        label={t("settings.shortBreak")}
                        value={shortMin}
                        min={1}
                        max={60}
                        onChange={setShortMin}
                    />
                    <NumberField
                        label={t("settings.longBreak")}
                        value={longMin}
                        min={1}
                        max={120}
                        onChange={setLongMin}
                    />
                    <NumberField
                        label={t("settings.interval")}
                        value={interval}
                        min={1}
                        max={12}
                        onChange={setIntervalVal}
                    />
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.ghostButton}
                        onClick={resetDefaults}
                        type="button"
                    >
                        <RotateCcw size={14} /> {t("settings.reset")}
                    </button>
                    <div className={styles.modalActionsRight}>
                        <button
                            className={styles.cancelButton}
                            onClick={onClose}
                            type="button"
                        >
                            {t("settings.cancel")}
                        </button>
                        <button
                            className={styles.saveButton}
                            onClick={submit}
                            type="button"
                        >
                            <Check size={14} /> {t("settings.save")}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ===========================================================================
// NumberField — controlled string locally so the caret doesn't jump
// ===========================================================================

function NumberField({
    label,
    value,
    min,
    max,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (n: number) => void;
}) {
    // Local string state lets the user clear/type freely without the caret jumping.
    const [local, setLocal] = useState(String(value));
    const [focused, setFocused] = useState(false);
    const prevRef = useRef(value);
    prevRef.current = value;

    // Keep in sync when the parent changes the value externally
    // (e.g. "Reset to defaults"), but don't fight the user while typing.
    useEffect(() => {
        if (!focused) setLocal(String(value));
    }, [value, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setLocal(raw);

        // Propagate only when it's a valid, in-range integer.
        if (raw === "") return;
        const n = Number(raw);
        if (!Number.isFinite(n)) return;
        if (n < min || n > max) return;
        onChange(Math.floor(n));
    };

    const handleBlur = () => {
        setFocused(false);

        // Empty / NaN → restore last known good value
        const parsed = Number(local);
        if (local.trim() === "" || !Number.isFinite(parsed)) {
            setLocal(String(prevRef.current));
            return;
        }

        // Clamp to [min, max] and round
        const clamped = Math.min(max, Math.max(min, Math.floor(parsed)));
        setLocal(String(clamped));
        if (clamped !== prevRef.current) onChange(clamped);
    };

    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <input
                className={styles.fieldInput}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="done"
                min={min}
                max={max}
                value={local}
                onFocus={() => setFocused(true)}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        </label>
    );
}