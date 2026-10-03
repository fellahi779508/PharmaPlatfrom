"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    CheckCircle2,
    Clock,
    Flag,
    HelpCircle,
    Loader2,
    Maximize2,
    Pause,
    Play,
    RotateCcw,
    Save,
    SkipForward,
    Sparkles,
    Trophy,
    X,
    XCircle,
} from "lucide-react";

import styles from "./exam-session.module.css";
import {
    getExamSessionProgress,
    completeExamSession,
    submitExamAnswer,
    pauseExamSession,
    resumeExamSession,
} from "@/utils/server/exam-api";
import { ExamSessionProgress, ExamQuestion } from "@/utils/types/exam.types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = sec.toString().padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** Compare two answer-id arrays as sets. */
const sameSet = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    return sa.every((v, i) => v === sb[i]);
};

/** Format a fractional score nicely: 0.5, 1, 1.25, 2.67 → keep up to 2 decimals. */
const formatScore = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return Number(n.toFixed(2)).toString();
};

/* ------------------------------------------------------------------ */
/*  Grading — pure frontend computation                                */
/* ------------------------------------------------------------------ */

type GradingMode = "all-or-nothing" | "negative-partial" | "partial";

/** Penalty multiplier for "negative-partial". 0.5 = −0.5 per wrong pick. */
const NEGATIVE_PENALTY = 0.5;

/**
 * Returns a 0..1 score for a single question under the given grading mode.
 * Requires the session to be COMPLETED (correctness is only exposed then).
 */
function gradeQuestion(question: ExamQuestion, mode: GradingMode): number {
    const ua = question.userAnswer;

    // No answer or skipped → 0 under every scheme
    if (!ua || ua.isSkipped) return 0;

    const selectedIds = ua.selectedAnswerIds ?? [];
    if (selectedIds.length === 0) return 0;

    const correctIds = question.answers
        .filter((a) => a.isCorrect === true)
        .map((a) => a.id);

    const correctSet = new Set(correctIds);
    const selectedSet = new Set(selectedIds);

    let correctSelected = 0;
    let wrongSelected = 0;

    selectedSet.forEach((id) => {
        if (correctSet.has(id)) correctSelected++;
        else wrongSelected++;
    });

    const totalCorrect = correctSet.size;
    if (totalCorrect === 0) return 0;

    switch (mode) {
        case "all-or-nothing":
            return correctSelected === totalCorrect && wrongSelected === 0 ? 1 : 0;

        case "partial":
            // Forgiving: only counts how much of the correct set was captured
            return correctSelected / totalCorrect;

        case "negative-partial": {
            // Rewards correct picks, punishes wrong ones, floored at 0
            const raw = correctSelected - wrongSelected * NEGATIVE_PENALTY;
            return Math.max(0, raw) / totalCorrect;
        }

        default:
            return 0;
    }
}

interface ScoreBreakdown {
    /** Sum of per-question scores, in units of "questions". */
    earned: number;
    /** Score out of 20, 2 decimals. */
    outOf20: number;
    /** Score out of 20 rounded to nearest 0.5 (FR/MA convention). */
    outOf20Rounded: number;
    /** Percentage 0–100. */
    percentage: number;
    /** Number of questions considered fully correct under this mode. */
    fullyCorrect: number;
    /** Per-question scores, same index as `progress.questions`. */
    perQuestion: number[];
}

/** Computes the score for a completed session under a given mode. */
function computeScore(
    questions: ExamQuestion[],
    mode: GradingMode,
): ScoreBreakdown {
    const perQuestion = questions.map((q) => gradeQuestion(q, mode));
    const earned = perQuestion.reduce((sum, s) => sum + s, 0);
    const total = questions.length;
    const rawPct = total > 0 ? (earned / total) * 100 : 0;
    const outOf20 = (rawPct / 100) * 20;
    const outOf20Rounded = Math.round(outOf20 * 2) / 2;

    const fullyCorrect = perQuestion.filter((s) => s === 1).length;

    return {
        earned,
        outOf20: Math.round(outOf20 * 100) / 100,
        outOf20Rounded,
        percentage: Math.round(rawPct),
        fullyCorrect,
        perQuestion,
    };
}

/** A short semantic label for a single-question score under a mode. */
function questionOutcome(
    score: number,
    hasAnswer: boolean,
    isSkipped: boolean,
): "skipped" | "unanswered" | "correct" | "partial" | "wrong" {
    if (isSkipped) return "skipped";
    if (!hasAnswer) return "unanswered";
    if (score >= 1) return "correct";
    if (score > 0) return "partial";
    return "wrong";
}

/* ------------------------------------------------------------------ */
/*  Image helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Safely extracts an image URL from a question object regardless of
 * the shape it comes in from the backend.
 */
function getQuestionImageUrl(question: any): string | null {
    if (!question) return null;

    const candidates: any[] = [
        question.image,
        question.qcm?.image,
        question.qcmImage,
        question.qcm_image,
    ];

    for (const c of candidates) {
        if (!c) continue;
        if (typeof c === "string" && c.trim()) return c;
        if (typeof c === "object" && typeof c.url === "string" && c.url.trim()) {
            return c.url;
        }
    }
    return null;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ExamSessionComponent() {
    const t = useTranslations("exams.session");
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const sessionId = Number(params.id);

    const [progress, setProgress] = useState<ExamSessionProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [busy, setBusy] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);

    /** Fullscreen lightbox for viewing a question's image. */
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    /**
     * Pending selection(s) per qcmId (before saving).
     * Only present when the user has toggled something since the last save.
     */
    const [localSelections, setLocalSelections] = useState<
        Record<number, number[]>
    >({});

    /** running timer in seconds */
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<number | null>(null);
    const baseTimeRef = useRef(0);
    const baseAtRef = useRef(0);
    const autoFinishTriggered = useRef(false);

    /* ------------------------- Load ------------------------- */

    const load = useCallback(async () => {
        if (!Number.isFinite(sessionId)) {
            setError("Invalid session id");
            setLoading(false);
            return;
        }
        setLoading(true);
        const res = await getExamSessionProgress(sessionId);
        if (res.status && res.response) {
            setProgress(res.response);
            setCurrentIndex(
                Math.min(
                    res.response.currentQuestionIndex,
                    Math.max(0, res.response.questions.length - 1),
                ),
            );
            baseTimeRef.current = res.response.totalTimeSpent;
            baseAtRef.current = Date.now();
            setElapsed(res.response.totalTimeSpent);
            setLocalSelections({});
        } else {
            setError(res.message || "Failed to load session");
        }
        setLoading(false);
    }, [sessionId]);

    useEffect(() => {
        load();
    }, [load]);

    /* ------------------------- Escape closes lightbox ------------------------- */

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && lightboxUrl) setLightboxUrl(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxUrl]);

    /* ------------------------- Timer ------------------------- */

    useEffect(() => {
        if (!progress) return;

        const isRunning = progress.status === "in_progress";
        if (!isRunning) {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = window.setInterval(() => {
            const delta = (Date.now() - baseAtRef.current) / 1000;
            setElapsed(baseTimeRef.current + delta);
        }, 500);

        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [progress?.status]);

    /* ------------------------- Derived ------------------------- */

    const questions = progress?.questions ?? [];
    const total = questions.length;
    const answeredCount = useMemo(
        () => questions.filter((q) => !!q.userAnswer).length,
        [questions],
    );
    const currentQuestion: ExamQuestion | undefined = questions[currentIndex];
    const isCurrentAnswered = !!currentQuestion?.userAnswer;

    /** Image URL for the currently displayed question (null if none). */
    const currentImageUrl = useMemo(
        () => getQuestionImageUrl(currentQuestion),
        [currentQuestion],
    );

    const effectiveSelection = useMemo<number[]>(() => {
        if (!currentQuestion) return [];
        const local = localSelections[currentQuestion.qcmId];
        if (local !== undefined) return local;
        return currentQuestion.userAnswer?.selectedAnswerIds ?? [];
    }, [currentQuestion, localSelections]);

    const hasPendingChanges = useMemo(() => {
        if (!currentQuestion) return false;
        const local = localSelections[currentQuestion.qcmId];
        if (local === undefined) return false;
        const saved = currentQuestion.userAnswer?.selectedAnswerIds ?? [];
        return !sameSet(local, saved);
    }, [currentQuestion, localSelections]);

    const durationSeconds = (progress?.durationMinutes ?? 60) * 60;
    const remaining = Math.max(0, durationSeconds - elapsed);
    const isLowTime = remaining > 0 && remaining <= 60;
    const isTimeUp = remaining <= 0 && progress?.status === "in_progress";

    /* ------------------------- Auto-finish on timeout ------------------------- */

    useEffect(() => {
        if (!isTimeUp) return;
        if (autoFinishTriggered.current) return;
        autoFinishTriggered.current = true;

        (async () => {
            setBusy(true);
            await completeExamSession(sessionId);
            await load();
            setBusy(false);
        })();
    }, [isTimeUp, sessionId, load]);

    /* ------------------------- Actions ------------------------- */

    const handleToggleLocal = (answerId: number) => {
        if (!currentQuestion || !progress) return;
        if (progress.status !== "in_progress") return;
        if (submitting) return;

        const qcmId = currentQuestion.qcmId;

        setLocalSelections((prev) => {
            const base =
                prev[qcmId] ?? currentQuestion.userAnswer?.selectedAnswerIds ?? [];

            const has = base.includes(answerId);
            const next = has
                ? base.filter((id) => id !== answerId)
                : [...base, answerId];

            return { ...prev, [qcmId]: next };
        });
    };

    const commitCurrent = async (): Promise<boolean> => {
        if (!currentQuestion || !progress) return false;
        if (progress.status !== "in_progress") return false;

        const qcmId = currentQuestion.qcmId;
        const local = localSelections[qcmId];
        const saved = currentQuestion.userAnswer?.selectedAnswerIds ?? [];

        const isFirstAnswer = !currentQuestion.userAnswer;

        if (!isFirstAnswer && local === undefined) {
            return true;
        }

        const selectionToSave = isFirstAnswer ? local ?? [] : local ?? saved;

        setSubmitting(true);
        const res = await submitExamAnswer(sessionId, {
            qcmId,
            selectedAnswerIds: selectionToSave,
        });
        setSubmitting(false);

        if (!res.status || !res.response) return false;

        setProgress((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                currentQuestionIndex: res.response!.currentQuestionIndex,
                questions: prev.questions.map((q: any) =>
                    q.qcmId !== qcmId
                        ? q
                        : {
                            ...q,
                            userAnswer: {
                                selectedAnswerIds: res.response!.selectedAnswerIds,
                                isSkipped: res.response!.isSkipped,
                                answeredAt: new Date().toISOString(),
                            },
                        },
                ),
            };
        });

        setLocalSelections((prev) => {
            if (!(qcmId in prev)) return prev;
            const next = { ...prev };
            delete next[qcmId];
            return next;
        });

        return true;
    };

    const goToIndex = async (nextIndex: number) => {
        if (nextIndex === currentIndex) return;
        const ok = await commitCurrent();
        if (!ok) return;
        setCurrentIndex(nextIndex);
    };

    const goNext = () => goToIndex(Math.min(total - 1, currentIndex + 1));
    const goPrev = () => goToIndex(Math.max(0, currentIndex - 1));

    const handleSkip = async () => {
        if (!currentQuestion || !progress) return;
        if (progress.status !== "in_progress") return;

        setLocalSelections((prev) => ({ ...prev, [currentQuestion.qcmId]: [] }));

        setSubmitting(true);
        const res = await submitExamAnswer(sessionId, {
            qcmId: currentQuestion.qcmId,
            selectedAnswerIds: [],
        });
        setSubmitting(false);
        if (!res.status || !res.response) return;

        setProgress((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                currentQuestionIndex: res.response!.currentQuestionIndex,
                questions: prev.questions.map((q: any) =>
                    q.qcmId !== currentQuestion.qcmId
                        ? q
                        : {
                            ...q,
                            userAnswer: {
                                selectedAnswerIds: [],
                                isSkipped: true,
                                answeredAt: new Date().toISOString(),
                            },
                        },
                ),
            };
        });
        setLocalSelections((prev) => {
            const next = { ...prev };
            delete next[currentQuestion.qcmId];
            return next;
        });

        if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
    };

    const handlePause = async () => {
        if (!progress) return;
        await commitCurrent();
        setBusy(true);
        const res = await pauseExamSession(sessionId);
        if (res.status && res.response) {
            setProgress((prev) =>
                prev
                    ? {
                        ...prev,
                        status: res.response!.status,
                        totalTimeSpent: res.response!.totalTimeSpent,
                        pausedAt: res.response!.pausedAt,
                    }
                    : prev,
            );
        }
        setBusy(false);
    };

    const handleResume = async () => {
        if (!progress) return;
        setBusy(true);
        const res = await resumeExamSession(sessionId);
        if (res.status && res.response) {
            baseTimeRef.current = res.response.totalTimeSpent;
            baseAtRef.current = Date.now();
            setProgress((prev) =>
                prev
                    ? {
                        ...prev,
                        status: res.response!.status,
                        pausedAt: res.response!.pausedAt,
                    }
                    : prev,
            );
        }
        setBusy(false);
    };

    const handleFinish = async () => {
        if (!progress) return;
        await commitCurrent();
        setBusy(true);
        await completeExamSession(sessionId);
        const refreshed = await getExamSessionProgress(sessionId);
        if (refreshed.status && refreshed.response) {
            setProgress(refreshed.response);
            baseTimeRef.current = refreshed.response.totalTimeSpent;
            setElapsed(refreshed.response.totalTimeSpent);
            setLocalSelections({});
        }
        setBusy(false);
        setShowFinishConfirm(false);
    };

    /* ------------------------- Render ------------------------- */

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.center}>
                    <Loader2 size={28} className={styles.spinner} />
                    <span>{t("loading")}</span>
                </div>
            </div>
        );
    }

    if (error || !progress) {
        return (
            <div className={styles.page}>
                <div className={styles.center}>
                    <AlertTriangle size={28} color="var(--error)" />
                    <span>{error || "Session not found"}</span>
                    <button
                        className={styles.actionBtn}
                        onClick={() => router.push("/dashboard/exams")}
                    >
                        <ArrowLeft size={14} /> {t("back")}
                    </button>
                </div>
            </div>
        );
    }

    if (progress.status === "completed") {
        return (
            <ResultsView
                progress={progress}
                onRetake={() => router.push("/dashboard/exams")}
                onBack={() => router.push("/dashboard/exams")}
            />
        );
    }

    const isPaused = progress.status === "paused";
    const pct = total > 0 ? (answeredCount / total) * 100 : 0;

    const timerPillClass = isLowTime
        ? `${styles.statPill} ${styles.statPillError} ${styles.statPillErrorPulse}`
        : `${styles.statPill} ${isPaused ? styles.statPillWarning : styles.statPillInfo
        }`;

    const selection = effectiveSelection;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <button
                        className={styles.backBtn}
                        onClick={() => router.push("/dashboard/exams")}
                        aria-label={t("back")}
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <div className={styles.titleBlock}>
                        <h1 className={styles.title}>{progress.exam.title}</h1>
                        <div className={styles.meta}>
                            <span>{progress.exam.subject.name}</span>
                            <span className={styles.metaDot}>·</span>
                            <span>
                                {t("question")} {currentIndex + 1} {t("of")} {total}
                            </span>
                        </div>
                    </div>

                    <div className={styles.headerStats}>
                        <span className={timerPillClass}>
                            <Clock size={14} />
                            {formatTime(remaining)}
                        </span>

                        <span className={`${styles.statPill} ${styles.statPillInfo}`}>
                            <CheckCircle2 size={14} />
                            {answeredCount}/{total}
                        </span>

                        {isPaused ? (
                            <button
                                className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                onClick={handleResume}
                                disabled={busy}
                            >
                                {busy ? (
                                    <Loader2 size={14} className={styles.spinner} />
                                ) : (
                                    <Play size={14} />
                                )}
                                {t("resume")}
                            </button>
                        ) : (
                            <button
                                className={`${styles.actionBtn} ${styles.actionBtnWarning}`}
                                onClick={handlePause}
                                disabled={busy || submitting}
                            >
                                {busy ? (
                                    <Loader2 size={14} className={styles.spinner} />
                                ) : (
                                    <Pause size={14} />
                                )}
                                {t("pause")}
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
            </header>

            <div className={styles.body}>
                <div className={styles.bodyInner}>
                    <div>
                        {isPaused && (
                            <div
                                className={styles.feedback}
                                style={{
                                    background:
                                        "color-mix(in srgb, var(--warning) 10%, transparent)",
                                    border:
                                        "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
                                    color: "var(--warning)",
                                    marginBottom: 16,
                                }}
                            >
                                <div className={styles.feedbackTitle}>
                                    <Pause size={14} /> {t("pausedBanner")}
                                </div>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestion?.qcmId ?? currentIndex}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.2 }}
                                className={styles.questionCard}
                            >
                                <div className={styles.questionIndex}>
                                    <HelpCircle size={12} />
                                    {t("question")} {currentIndex + 1} {t("of")} {total}
                                </div>

                                <h2 className={styles.questionText}>
                                    {currentQuestion?.question}
                                </h2>

                                {/* ---------- QCM image (only if available) ---------- */}
                                {currentImageUrl && (
                                    <button
                                        type="button"
                                        className={styles.questionImageButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxUrl(currentImageUrl);
                                        }}
                                        aria-label="Enlarge image"
                                        title="Enlarge image"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={currentImageUrl}
                                            alt=""
                                            className={styles.questionImage}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <span
                                            className={styles.questionImageZoom}
                                            aria-hidden
                                        >
                                            <Maximize2 size={12} />
                                        </span>
                                    </button>
                                )}

                                <div className={styles.multiHint}>
                                    {isCurrentAnswered
                                        ? t("canChangeAnswer")
                                        : t("selectOneOrMore")}
                                </div>

                                <div className={styles.answers}>
                                    {currentQuestion?.answers.map((a, idx) => {
                                        const isSelected = selection.includes(a.id);

                                        let cls = styles.answer;
                                        if (isSelected) cls += ` ${styles.answerSelected}`;

                                        return (
                                            <button
                                                key={a.id}
                                                className={cls}
                                                disabled={submitting || isPaused}
                                                onClick={() => handleToggleLocal(a.id)}
                                            >
                                                <span className={styles.answerBullet}>
                                                    {LETTERS[idx] ?? idx + 1}
                                                </span>
                                                <span className={styles.answerLabel}>{a.answer}</span>
                                                {isSelected && (
                                                    <Check size={16} color="var(--primary)" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {hasPendingChanges && (
                                    <div className={`${styles.feedback} ${styles.feedbackInfo}`}>
                                        <div className={styles.feedbackTitle}>
                                            <Save size={14} /> {t("unsavedChanges")}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.qFooter}>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={goPrev}
                                        disabled={currentIndex === 0 || submitting}
                                    >
                                        <ArrowLeft size={14} /> {t("previous")}
                                    </button>

                                    <div className={styles.qFooterRight}>
                                        {!isCurrentAnswered && (
                                            <button
                                                className={styles.actionBtn}
                                                onClick={handleSkip}
                                                disabled={submitting || isPaused}
                                            >
                                                <SkipForward size={14} /> {t("skip")}
                                            </button>
                                        )}

                                        {currentIndex < total - 1 ? (
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                                onClick={goNext}
                                                disabled={submitting || isPaused}
                                            >
                                                {submitting ? (
                                                    <Loader2 size={14} className={styles.spinner} />
                                                ) : (
                                                    <>
                                                        {t("next")} <ArrowRight size={14} />
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                                onClick={() => setShowFinishConfirm(true)}
                                                disabled={busy || submitting}
                                            >
                                                <Flag size={14} /> {t("finish")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <aside className={styles.navigator}>
                        <h3 className={styles.navTitle}>{t("navigator")}</h3>
                        <div className={styles.navGrid}>
                            {questions.map((q, i) => {
                                const answered = !!q.userAnswer;
                                const isActive = i === currentIndex;

                                let cls = styles.navCell;
                                if (answered) cls += ` ${styles.navCellAnswered}`;
                                if (isActive) cls += ` ${styles.navCellActive}`;

                                return (
                                    <button
                                        key={q.qcmId}
                                        className={cls}
                                        onClick={() => goToIndex(i)}
                                        title={q.question}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.navLegend}>
                            <span className={styles.legendItem}>
                                <span
                                    className={styles.legendDot}
                                    style={{ background: "var(--primary)" }}
                                />
                                {t("legendAnswered")}
                            </span>
                            <span className={styles.legendItem}>
                                <span
                                    className={styles.legendDot}
                                    style={{ background: "var(--border)" }}
                                />
                                {t("legendUnanswered")}
                            </span>
                        </div>
                    </aside>
                </div>
            </div>

            <AnimatePresence>
                {showFinishConfirm && (
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowFinishConfirm(false)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalIcon}>
                                <AlertTriangle size={26} />
                            </div>
                            <h3 className={styles.modalTitle}>
                                {t("confirmFinishTitle")}
                            </h3>
                            <p className={styles.modalText}>
                                {answeredCount < total
                                    ? t("confirmFinishText", { count: total - answeredCount })
                                    : t("confirmFinishTextAll")}
                            </p>
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => setShowFinishConfirm(false)}
                                    disabled={busy}
                                >
                                    {t("confirmFinishNo")}
                                </button>
                                <button
                                    className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                    onClick={handleFinish}
                                    disabled={busy}
                                >
                                    {busy ? (
                                        <Loader2 size={14} className={styles.spinner} />
                                    ) : (
                                        <Check size={14} />
                                    )}
                                    {t("confirmFinishYes")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ==================== Lightbox ==================== */}
            <AnimatePresence>
                {lightboxUrl && (
                    <motion.div
                        className={styles.lightboxOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxUrl(null)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            type="button"
                            className={styles.lightboxClose}
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxUrl(null);
                            }}
                            aria-label="Close"
                            title="Close"
                        >
                            <X size={20} />
                        </button>

                        <motion.img
                            src={lightboxUrl}
                            alt=""
                            className={styles.lightboxImage}
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            draggable={false}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Results view                                                       */
/* ------------------------------------------------------------------ */

function ResultsView({
    progress,
    onRetake,
    onBack,
}: {
    progress: ExamSessionProgress;
    onRetake: () => void;
    onBack: () => void;
}) {
    const t = useTranslations("exams.session");

    const [mode, setMode] = useState<GradingMode>("all-or-nothing");
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const questions = progress.questions;
    const total = progress.totalQuestions;

    /* --- Escape closes lightbox in results too --- */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && lightboxUrl) setLightboxUrl(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxUrl]);

    /* --- Breakdowns for every mode (computed once) --- */
    const breakdowns = useMemo(
        () => ({
            "all-or-nothing": computeScore(questions, "all-or-nothing"),
            "negative-partial": computeScore(questions, "negative-partial"),
            partial: computeScore(questions, "partial"),
        }),
        [questions],
    );

    const current = breakdowns[mode];

    /* --- Stats that don't depend on mode --- */
    const skipped = questions.filter((q) => q.userAnswer?.isSkipped).length;
    const unanswered = questions.filter((q) => !q.userAnswer).length;

    /* --- Wrong count depends on mode (partial ≠ wrong) --- */
    const wrong = questions.filter(
        (q, i) =>
            q.userAnswer && !q.userAnswer.isSkipped && current.perQuestion[i] < 1,
    ).length;

    const passed = current.outOf20 >= 10;

    const MODES: GradingMode[] = [
        "all-or-nothing",
        "negative-partial",
        "partial",
    ];

    return (
        <div className={styles.page}>
            <div className={styles.body}>
                <div className={styles.resultsWrap}>
                    {/* ================= Hero ================= */}
                    <motion.div
                        className={styles.resultsHero}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div
                            className={`${styles.resultsIconWrap} ${passed ? styles.resultsIconSuccess : styles.resultsIconError
                                }`}
                        >
                            {passed ? <Trophy size={32} /> : <Sparkles size={32} />}
                        </div>

                        <h1 className={styles.resultsTitle}>{t("results")}</h1>
                        <p className={styles.resultsSubtitle}>{progress.exam.title}</p>

                        {/* ---- Mode picker ---- */}
                        <div className={styles.modePicker} role="tablist">
                            {MODES.map((m) => (
                                <button
                                    key={m}
                                    role="tab"
                                    aria-selected={mode === m}
                                    className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ""
                                        }`}
                                    onClick={() => setMode(m)}
                                >
                                    {t(`grading.${m}` as any)}
                                </button>
                            ))}
                        </div>

                        {/* ---- Big score /20 ---- */}
                        <div className={styles.scoreHeroRow}>
                            <div className={styles.scoreHeroMain}>
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={`score-${mode}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.scoreHeroValue}
                                    >
                                        {formatScore(current.outOf20)}
                                    </motion.span>
                                </AnimatePresence>
                                <span className={styles.scoreHeroUnit}>/20</span>
                            </div>

                            <div className={styles.scoreHeroSide}>
                                <span className={styles.scoreHeroPct}>
                                    {current.percentage}%
                                </span>
                                <span className={styles.scoreHeroRounded}>
                                    ≈ {formatScore(current.outOf20Rounded)}/20
                                </span>
                            </div>
                        </div>

                        {/* ---- Mode hint ---- */}
                        <p className={styles.modeHint}>
                            {t(`grading.hint.${mode}` as any)}
                        </p>

                        {/* ---- Stat grid ---- */}
                        <div className={styles.resultsStats}>
                            <div className={styles.resultStat}>
                                <span className={styles.resultStatLabel}>
                                    {t("correctCount")}
                                </span>
                                <span
                                    className={`${styles.resultStatValue} ${styles.resultStatSuccess}`}
                                >
                                    {current.fullyCorrect}
                                </span>
                            </div>
                            <div className={styles.resultStat}>
                                <span className={styles.resultStatLabel}>
                                    {t("wrongCount")}
                                </span>
                                <span
                                    className={`${styles.resultStatValue} ${styles.resultStatError}`}
                                >
                                    {wrong}
                                </span>
                            </div>
                            <div className={styles.resultStat}>
                                <span className={styles.resultStatLabel}>
                                    {t("skippedCount")}
                                </span>
                                <span
                                    className={`${styles.resultStatValue} ${styles.resultStatWarning}`}
                                >
                                    {skipped}
                                </span>
                            </div>
                            <div className={styles.resultStat}>
                                <span className={styles.resultStatLabel}>
                                    {t("unansweredCount")}
                                </span>
                                <span
                                    className={`${styles.resultStatValue} ${styles.resultStatMuted}`}
                                >
                                    {unanswered}
                                </span>
                            </div>
                        </div>

                        <div className={styles.resultsActions}>
                            <button className={styles.actionBtn} onClick={onBack}>
                                <ArrowLeft size={14} /> {t("backToList")}
                            </button>
                            <button
                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                onClick={onRetake}
                            >
                                <RotateCcw size={14} /> {t("retake")}
                            </button>
                        </div>
                    </motion.div>

                    {/* ================= Comparison strip ================= */}
                    <div className={styles.comparisonStrip}>
                        <div className={styles.comparisonTitle}>
                            {t("grading.comparison")}
                        </div>
                        <div className={styles.comparisonGrid}>
                            {MODES.map((m) => {
                                const b = breakdowns[m];
                                return (
                                    <button
                                        key={m}
                                        className={`${styles.comparisonCard} ${mode === m ? styles.comparisonCardActive : ""
                                            }`}
                                        onClick={() => setMode(m)}
                                    >
                                        <span className={styles.comparisonLabel}>
                                            {t(`grading.${m}` as any)}
                                        </span>
                                        <span className={styles.comparisonValue}>
                                            {formatScore(b.outOf20)}
                                            <span className={styles.comparisonUnit}>/20</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ================= Review list ================= */}
                    <h2 className={styles.reviewSectionTitle}>
                        {t("reviewAnswers")}
                    </h2>

                    <div className={styles.reviewList}>
                        {questions.map((q, i) => {
                            const ua = q.userAnswer;
                            const selectedIds = ua?.selectedAnswerIds ?? [];
                            const correctAnswers = q.answers.filter((a) => a.isCorrect);
                            const selectedAnswers = q.answers.filter((a) =>
                                selectedIds.includes(a.id),
                            );

                            const qImageUrl = getQuestionImageUrl(q);

                            const qScore = current.perQuestion[i];
                            const outcome = questionOutcome(
                                qScore,
                                !!ua,
                                !!ua?.isSkipped,
                            );

                            let badgeCls = styles.reviewBadgeMuted;
                            let badgeIcon = <HelpCircle size={12} />;
                            let badgeLabel: string = t("unanswered");

                            if (outcome === "skipped") {
                                badgeCls = styles.reviewBadgeWarning;
                                badgeIcon = <SkipForward size={12} />;
                                badgeLabel = t("skipped");
                            } else if (outcome === "correct") {
                                badgeCls = styles.reviewBadgeSuccess;
                                badgeIcon = <CheckCircle2 size={12} />;
                                badgeLabel = `1 ${t("points")}`;
                            } else if (outcome === "partial") {
                                badgeCls = styles.reviewBadgeWarning;
                                badgeIcon = <Sparkles size={12} />;
                                badgeLabel = `${formatScore(qScore)} ${t("points")}`;
                            } else if (outcome === "wrong") {
                                badgeCls = styles.reviewBadgeError;
                                badgeIcon = <XCircle size={12} />;
                                badgeLabel = `0 ${t("points")}`;
                            }

                            return (
                                <motion.div
                                    key={q.qcmId}
                                    className={styles.reviewItem}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: i * 0.02 }}
                                >
                                    <div className={styles.reviewHead}>
                                        <span className={styles.reviewNum}>
                                            <BookOpen size={12} /> {t("question")} {i + 1}
                                        </span>
                                        <span
                                            className={`${styles.reviewBadge} ${badgeCls}`}
                                        >
                                            {badgeIcon} {badgeLabel}
                                        </span>
                                    </div>
                                    <p className={styles.reviewQuestion}>{q.question}</p>

                                    {/* ---------- QCM image in the review (only if available) ---------- */}
                                    {qImageUrl && (
                                        <button
                                            type="button"
                                            className={styles.reviewImageButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxUrl(qImageUrl);
                                            }}
                                            aria-label="Enlarge image"
                                            title="Enlarge image"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={qImageUrl}
                                                alt=""
                                                className={styles.reviewImage}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <span
                                                className={styles.reviewImageZoom}
                                                aria-hidden
                                            >
                                                <Maximize2 size={12} />
                                            </span>
                                        </button>
                                    )}

                                    {selectedAnswers.length > 0 && !ua?.isSkipped && (
                                        <div
                                            className={`${styles.reviewAnswer} ${outcome === "correct"
                                                ? styles.reviewAnswerCorrect
                                                : outcome === "partial"
                                                    ? styles.reviewAnswerPartial
                                                    : styles.reviewAnswerIncorrect
                                                }`}
                                        >
                                            {outcome === "correct" ? (
                                                <CheckCircle2 size={15} color="var(--success)" />
                                            ) : outcome === "partial" ? (
                                                <Sparkles size={15} color="var(--warning)" />
                                            ) : (
                                                <XCircle size={15} color="var(--error)" />
                                            )}
                                            <div>
                                                <strong>{t("yourAnswer")}:</strong>
                                                <ul className={styles.reviewAnswerList}>
                                                    {selectedAnswers.map((a) => (
                                                        <li key={a.id}>{a.answer}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {outcome !== "correct" && correctAnswers.length > 0 && (
                                        <div
                                            className={`${styles.reviewAnswer} ${styles.reviewAnswerCorrect}`}
                                        >
                                            <CheckCircle2 size={15} color="var(--success)" />
                                            <div>
                                                <strong>
                                                    {t("correctAnswerWas", { answer: "" })}
                                                </strong>
                                                <ul className={styles.reviewAnswerList}>
                                                    {correctAnswers.map((a) => (
                                                        <li key={a.id}>{a.answer}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {correctAnswers[0]?.explanation && (
                                        <div className={styles.reviewExplanation}>
                                            <div className={styles.reviewExplanationLabel}>
                                                {t("explanation")}
                                            </div>
                                            {correctAnswers[0].explanation}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ==================== Lightbox (shared with main view) ==================== */}
            <AnimatePresence>
                {lightboxUrl && (
                    <motion.div
                        className={styles.lightboxOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxUrl(null)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            type="button"
                            className={styles.lightboxClose}
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxUrl(null);
                            }}
                            aria-label="Close"
                            title="Close"
                        >
                            <X size={20} />
                        </button>

                        <motion.img
                            src={lightboxUrl}
                            alt=""
                            className={styles.lightboxImage}
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                            onClick={(e) => e.stopPropagation()}
                            draggable={false}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}