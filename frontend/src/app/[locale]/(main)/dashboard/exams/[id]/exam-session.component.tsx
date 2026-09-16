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
    Pause,
    Play,
    RotateCcw,
    SkipForward,
    Sparkles,
    Trophy,
    XCircle,
} from "lucide-react";

import styles from "./exam-session.module.css";
import { getExamSessionProgress, completeExamSession, submitExamAnswer, pauseExamSession, resumeExamSession } from "@/utils/server/exam-api";
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

    /** pending selection local to the current question (before sending) */
    const [localSelections, setLocalSelections] = useState<Record<number, number>>(
        {},
    );

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
        } else {
            setError(res.message || "Failed to load session");
        }
        setLoading(false);
    }, [sessionId]);

    useEffect(() => {
        load();
    }, [load]);

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

    const handleSelectLocal = (answerId: number) => {
        if (!currentQuestion || !progress) return;
        if (progress.status !== "in_progress") return;
        if (isCurrentAnswered) return;
        setLocalSelections((prev) => ({ ...prev, [currentQuestion.qcmId]: answerId }));
    };

    /** Sends the currently-selected (or skipped) answer for the active question. */
    const commitCurrent = async (): Promise<boolean> => {
        if (!currentQuestion || !progress) return false;
        if (progress.status !== "in_progress") return false;
        if (isCurrentAnswered) return true;

        const selectedId = localSelections[currentQuestion.qcmId];

        setSubmitting(true);
        const res = await submitExamAnswer(sessionId, {
            qcmId: currentQuestion.qcmId,
            selectedAnswerId: selectedId ?? undefined,
        });
        setSubmitting(false);

        if (!res.status || !res.response) return false;

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
                                selectedAnswerId: res.response!.selectedAnswerId,
                                isSkipped: res.response!.isSkipped,
                                answeredAt: new Date().toISOString(),
                            },
                        },
                ),
            };
        });
        return true;
    };

    const goNext = async () => {
        const ok = await commitCurrent();
        if (!ok && !isCurrentAnswered) return;
        setCurrentIndex((i) => Math.min(total - 1, i + 1));
    };

    const goPrev = async () => {
        if (!isCurrentAnswered) await commitCurrent();
        setCurrentIndex((i) => Math.max(0, i - 1));
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
                    ? { ...prev, status: res.response!.status, pausedAt: res.response!.pausedAt }
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
        : `${styles.statPill} ${isPaused ? styles.statPillWarning : styles.statPillInfo}`;

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

                                <div className={styles.answers}>
                                    {currentQuestion?.answers.map((a, idx) => {
                                        const savedId =
                                            currentQuestion.userAnswer?.selectedAnswerId ?? null;
                                        const localId = localSelections[currentQuestion.qcmId] ?? null;
                                        const isSelected = (savedId ?? localId) === a.id;

                                        let cls = styles.answer;
                                        if (isSelected) cls += ` ${styles.answerSelected}`;

                                        return (
                                            <button
                                                key={a.id}
                                                className={cls}
                                                disabled={
                                                    isCurrentAnswered || submitting || isPaused
                                                }
                                                onClick={() => handleSelectLocal(a.id)}
                                            >
                                                <span className={styles.answerBullet}>
                                                    {LETTERS[idx] ?? idx + 1}
                                                </span>
                                                <span className={styles.answerLabel}>{a.answer}</span>
                                            </button>
                                        );
                                    })}
                                </div>

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
                                                onClick={async () => {
                                                    await commitCurrent();
                                                    if (currentIndex < total - 1)
                                                        setCurrentIndex((i) => i + 1);
                                                }}
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
                                        onClick={() => setCurrentIndex(i)}
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
                            <h3 className={styles.modalTitle}>{t("confirmFinishTitle")}</h3>
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

    const total = progress.totalQuestions;
    const correct = progress.score ?? 0;
    const wrong = progress.questions.filter(
        (q) => q.userAnswer && !q.userAnswer.isCorrect && !q.userAnswer.isSkipped,
    ).length;
    const skipped = progress.questions.filter((q) => q.userAnswer?.isSkipped).length;
    const unanswered = progress.questions.filter((q) => !q.userAnswer).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = pct >= 50;

    return (
        <div className={styles.page}>
            <div className={styles.body}>
                <div className={styles.resultsWrap}>
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
                        <div className={styles.resultsPct}>{pct}%</div>

                        <div className={styles.resultsStats}>
                            <div className={styles.resultStat}>
                                <span className={styles.resultStatLabel}>
                                    {t("correctCount")}
                                </span>
                                <span
                                    className={`${styles.resultStatValue} ${styles.resultStatSuccess}`}
                                >
                                    {correct}
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

                    <h2
                        style={{
                            fontSize: 16,
                            fontWeight: 700,
                            margin: "24px 0 12px",
                            color: "var(--foreground)",
                        }}
                    >
                        {t("reviewAnswers")}
                    </h2>

                    <div className={styles.reviewList}>
                        {progress.questions.map((q, i) => {
                            const ua = q.userAnswer;
                            const correctAnswer = q.answers.find((a) => a.isCorrect);
                            const selectedAnswer = q.answers.find(
                                (a) => a.id === ua?.selectedAnswerId,
                            );

                            let badgeCls = styles.reviewBadgeMuted;
                            let badgeIcon = <HelpCircle size={12} />;
                            let badgeLabel = t("unanswered");

                            if (ua?.isSkipped) {
                                badgeCls = styles.reviewBadgeWarning;
                                badgeIcon = <SkipForward size={12} />;
                                badgeLabel = t("skipped");
                            } else if (ua?.isCorrect) {
                                badgeCls = styles.reviewBadgeSuccess;
                                badgeIcon = <CheckCircle2 size={12} />;
                                badgeLabel = t("correct");
                            } else if (ua) {
                                badgeCls = styles.reviewBadgeError;
                                badgeIcon = <XCircle size={12} />;
                                badgeLabel = t("incorrect");
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
                                        <span className={`${styles.reviewBadge} ${badgeCls}`}>
                                            {badgeIcon} {badgeLabel}
                                        </span>
                                    </div>
                                    <p className={styles.reviewQuestion}>{q.question}</p>

                                    {selectedAnswer && !ua?.isSkipped && (
                                        <div
                                            className={`${styles.reviewAnswer} ${ua?.isCorrect
                                                ? styles.reviewAnswerCorrect
                                                : styles.reviewAnswerIncorrect
                                                }`}
                                        >
                                            {ua?.isCorrect ? (
                                                <CheckCircle2 size={15} color="var(--success)" />
                                            ) : (
                                                <XCircle size={15} color="var(--error)" />
                                            )}
                                            <span>
                                                <strong>{t("yourAnswer")}: </strong>
                                                {selectedAnswer.answer}
                                            </span>
                                        </div>
                                    )}

                                    {(!ua?.isCorrect || ua?.isSkipped) && correctAnswer && (
                                        <div
                                            className={`${styles.reviewAnswer} ${styles.reviewAnswerCorrect}`}
                                        >
                                            <CheckCircle2 size={15} color="var(--success)" />
                                            <span>
                                                <strong>{t("correctAnswerWas", { answer: "" })}</strong>
                                                {correctAnswer.answer}
                                            </span>
                                        </div>
                                    )}

                                    {correctAnswer?.explanation && (
                                        <div className={styles.reviewExplanation}>
                                            <div className={styles.reviewExplanationLabel}>
                                                {t("explanation")}
                                            </div>
                                            {correctAnswer.explanation}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}