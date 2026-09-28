"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    BookOpen,
    CheckCircle2,
    Clock,
    Filter,
    GraduationCap,
    Loader2,
    Pause,
    Play,
    Plus,
    RotateCcw,
    Trash2,
    Trophy,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import styles from "./exam.module.css";
import {
    deleteExamSession,
    generateExam,

    getUserExamSessions,
    pauseExamSession,
    resumeExamSession,
    startExamSession,
} from "@/utils/server/exam-api";
import type {
    ExamSession,
    ExamSessionStatus,
    Semester,
    Subject,
} from "@/utils/types/exam.types";
import { getSemestersByStudent } from "@/utils/server/semester-api";
import { getSubjectsByStudent } from "@/utils/server/subject-api";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const statusClass: Record<ExamSessionStatus, string> = {
    in_progress: styles.statusInProgress,
    paused: styles.statusPaused,
    completed: styles.statusCompleted,
};

type FilterKey = "all" | ExamSessionStatus;

const DURATION_OPTIONS = [30, 45, 60] as const;
type DurationOption = (typeof DURATION_OPTIONS)[number];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ExamsComponent() {
    const t = useTranslations("exams");
    const router = useRouter();

    const [sessions, setSessions] = useState<ExamSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterKey>("all");
    const [actionId, setActionId] = useState<number | null>(null);

    const [showCreate, setShowCreate] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<ExamSession | null>(null);
    const [deleting, setDeleting] = useState(false);

    /* ------------------------- Data loading ------------------------- */

    const loadSessions = useCallback(async () => {
        setLoading(true);
        const res = await getUserExamSessions();
        if (res.status && res.response) setSessions(res.response);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    /* ------------------------- Derived ------------------------- */

    const counts: any = useMemo(
        () => ({
            all: sessions.length,
            in_progress: sessions.filter((s) => s.status === "in_progress").length,
            paused: sessions.filter((s) => s.status === "paused").length,
            completed: sessions.filter((s) => s.status === "completed").length,
        }),
        [sessions],
    );

    const visible = useMemo(
        () => (filter === "all" ? sessions : sessions.filter((s) => s.status === filter)),
        [filter, sessions],
    );

    /* ------------------------- Actions ------------------------- */

    const handleContinue = (s: ExamSession) => {
        router.push(`/dashboard/exams/${s.id}`);
    };

    const handlePause = async (s: ExamSession) => {
        setActionId(s.id);
        const res = await pauseExamSession(s.id);
        if (res.status) {
            setSessions((prev) =>
                prev.map((x) => (x.id === s.id ? { ...x, ...res.response } : x)),
            );
        }
        setActionId(null);
    };

    const handleResume = async (s: ExamSession) => {
        setActionId(s.id);
        const res = await resumeExamSession(s.id);
        if (res.status) {
            setSessions((prev) =>
                prev.map((x) => (x.id === s.id ? { ...x, ...res.response } : x)),
            );
            router.push(`/dashboard/exams/${s.id}`);
        }
        setActionId(null);
    };

    const handleRetake = async (s: ExamSession) => {
        setActionId(s.id);
        const res = await startExamSession(s.exam.id);
        if (res.status && res.response) {
            router.push(`/dashboard/exams/${res.response.id}`);
        }
        setActionId(null);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        const res = await deleteExamSession(confirmDelete.id);
        if (res.status) {
            setSessions((prev) => prev.filter((x) => x.id !== confirmDelete.id));
        }
        setDeleting(false);
        setConfirmDelete(null);
    };

    /* ------------------------- Render ------------------------- */

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <motion.header
                    className={styles.header}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className={styles.headerText}>
                        <h1>{t("title")}</h1>
                        <p>{t("subtitle")}</p>
                    </div>
                    <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
                        <Plus size={16} />
                        {t("createNew")}
                    </button>
                </motion.header>

                {!loading && sessions.length > 0 && (
                    <div className={styles.filters}>
                        <Filter size={14} style={{ margin: "8px 4px 8px 10px", opacity: 0.5 }} />
                        {(
                            [
                                ["all", t("filterAll")],
                                ["in_progress", t("filterInProgress")],
                                ["paused", t("filterPaused")],
                                ["completed", t("filterCompleted")],
                            ] as [FilterKey, string][]
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                className={`${styles.filter} ${filter === key ? styles.filterActive : ""
                                    }`}
                                onClick={() => setFilter(key)}
                            >
                                {label}
                                <span className={styles.filterCount}>{counts[key]}</span>
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className={styles.skeletonGrid}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={styles.skeleton} />
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <EmptyState
                        title={sessions.length === 0 ? t("emptyTitle") : t("noMatchTitle")}
                        subtitle={
                            sessions.length === 0 ? t("emptySubtitle") : t("noMatchSubtitle")
                        }
                        cta={sessions.length === 0 ? t("createNew") : undefined}
                        onCta={() => setShowCreate(true)}
                    />
                ) : (
                    <motion.div
                        className={styles.grid}
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.05 } },
                        }}
                    >
                        {visible.map((s) => (
                            <SessionCard
                                key={s.id}
                                session={s}
                                busy={actionId === s.id}
                                onContinue={() => handleContinue(s)}
                                onPause={() => handlePause(s)}
                                onResume={() => handleResume(s)}
                                onRetake={() => handleRetake(s)}
                                onDelete={() => setConfirmDelete(s)}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {showCreate && (
                    <CreateExamModal
                        onClose={() => setShowCreate(false)}
                        onCreated={(sessionId) => {
                            setShowCreate(false);
                            router.push(`/dashboard/exams/${sessionId}`);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {confirmDelete && (
                    <ConfirmDeleteModal
                        session={confirmDelete}
                        busy={deleting}
                        onCancel={() => setConfirmDelete(null)}
                        onConfirm={handleDelete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Session card                                                       */
/* ------------------------------------------------------------------ */

interface SessionCardProps {
    session: ExamSession;
    busy: boolean;
    onContinue: () => void;
    onPause: () => void;
    onResume: () => void;
    onRetake: () => void;
    onDelete: () => void;
}

function SessionCard({
    session,
    busy,
    onContinue,
    onPause,
    onResume,
    onRetake,
    onDelete,
}: SessionCardProps) {
    const t = useTranslations("exams");
    const { status, exam, score, totalTimeSpent } = session;

    // score is only meaningful once the session is completed
    const showScore = status === "completed" && typeof score === "number";
    const pct = showScore
        ? Math.round((score! / Math.max(1, exam.questionCount)) * 100)
        : 0;

    return (
        <motion.div
            className={styles.card}
            variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.25 }}
            layout
        >
            <div className={styles.cardTop}>
                <div>
                    <h3 className={styles.cardTitle}>{exam.title}</h3>
                    <div className={styles.cardMeta}>
                        <span className={styles.metaChip}>
                            <BookOpen size={11} />
                            {exam.subject.name}
                        </span>
                        <span className={styles.metaChip}>
                            <GraduationCap size={11} />
                            {t("semester")} {exam.semester.number}
                        </span>
                        {exam.durationMinutes && (
                            <span className={styles.metaChip}>
                                <Clock size={11} />
                                {exam.durationMinutes} {t("minutesShort")}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span className={`${styles.status} ${statusClass[status]}`}>
                        {t(`status.${status}`)}
                    </span>
                    <button
                        className={styles.deleteBtn}
                        onClick={onDelete}
                        title={t("delete")}
                        aria-label={t("delete")}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>{t("questions")}</span>
                    <span className={styles.statValue}>{exam.questionCount}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>{t("time")}</span>
                    <span className={styles.statValue}>
                        <Clock size={13} />
                        {formatTime(totalTimeSpent)}
                    </span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>{t("score")}</span>
                    <span
                        className={`${styles.statValue} ${showScore ? styles.statValueSuccess : ""
                            }`}
                    >
                        {showScore ? (
                            <>
                                <Trophy size={13} />
                                {score}/{exam.questionCount} · {pct}%
                            </>
                        ) : (
                            <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
                                {t("hiddenUntilFinish")}
                            </span>
                        )}
                    </span>
                </div>
            </div>

            <div className={styles.actions}>
                {status === "in_progress" && (
                    <>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={onContinue}
                        >
                            <Play size={14} />
                            {t("continue")}
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={onPause}
                            disabled={busy}
                        >
                            {busy ? (
                                <Loader2 size={14} className={styles.spinner} />
                            ) : (
                                <Pause size={14} />
                            )}
                            {t("pause")}
                        </button>
                    </>
                )}

                {status === "paused" && (
                    <button
                        className={`${styles.btn} ${styles.btnSuccess}`}
                        onClick={onResume}
                        disabled={busy}
                    >
                        {busy ? (
                            <Loader2 size={14} className={styles.spinner} />
                        ) : (
                            <Play size={14} />
                        )}
                        {t("resume")}
                    </button>
                )}

                {status === "completed" && (
                    <>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={onContinue}
                        >
                            <CheckCircle2 size={14} />
                            {t("viewResults")}
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={onRetake}
                            disabled={busy}
                        >
                            {busy ? (
                                <Loader2 size={14} className={styles.spinner} />
                            ) : (
                                <RotateCcw size={14} />
                            )}
                            {t("retake")}
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({
    title,
    subtitle,
    cta,
    onCta,
}: {
    title: string;
    subtitle: string;
    cta?: string;
    onCta?: () => void;
}) {
    return (
        <motion.div
            className={styles.empty}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
        >
            <div className={styles.emptyIcon}>
                <BookOpen size={26} />
            </div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
            {cta && onCta && (
                <button className={styles.createBtn} onClick={onCta}>
                    <Plus size={16} />
                    {cta}
                </button>
            )}
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Create exam modal                                                  */
/* ------------------------------------------------------------------ */

function CreateExamModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (sessionId: number) => void;
}) {
    const t = useTranslations("exams");

    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [semesterId, setSemesterId] = useState<number | "">("");
    const [subjectId, setSubjectId] = useState<number | "">("");
    const [questionCount, setQuestionCount] = useState(20);
    const [duration, setDuration] = useState<DurationOption>(60);

    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoadingCatalog(true);
            const [sems, subs] = await Promise.all([getSemestersByStudent(), getSubjectsByStudent()]);
            if (sems.status && sems.response) setSemesters(sems.response);
            if (subs.status && subs.response) setSubjects(subs.response);
            setLoadingCatalog(false);
        })();
    }, []);

    const canSubmit =
        semesterId !== "" && subjectId !== "" && questionCount > 0 && !submitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);

        const gen = await generateExam({
            subjectId: Number(subjectId),
            semesterId: Number(semesterId),
            questionCount,
            durationMinutes: duration,
        });
        if (!gen.status || !gen.response) {
            setError(gen.message || t("generateFailed"));
            setSubmitting(false);
            return;
        }

        const started = await startExamSession(gen.response.id);
        if (!started.status || !started.response) {
            setError(started.message || t("startFailed"));
            setSubmitting(false);
            return;
        }

        onCreated(started.response.id);
    };

    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2>{t("modal.title")}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.field}>
                        <label className={styles.label}>{t("modal.semester")}</label>
                        <select
                            className={styles.select}
                            value={semesterId}
                            onChange={(e) =>
                                setSemesterId(e.target.value ? Number(e.target.value) : "")
                            }
                            disabled={loadingCatalog}
                        >
                            <option value="">{t("modal.selectSemester")}</option>
                            {semesters.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {t("semester")} {s.number}
                                    {s.year?.name ? ` — ${s.year.name}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>{t("modal.subject")}</label>
                        <select
                            className={styles.select}
                            value={subjectId}
                            onChange={(e) =>
                                setSubjectId(e.target.value ? Number(e.target.value) : "")
                            }
                            disabled={loadingCatalog}
                        >
                            <option value="">{t("modal.selectSubject")}</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>{t("modal.questionCount")}</label>
                        <input
                            type="number"
                            min={5}
                            max={100}
                            className={styles.input}
                            value={questionCount}
                            onChange={(e) =>
                                setQuestionCount(Math.max(1, Number(e.target.value) || 0))
                            }
                        />
                    </div>

                    {/* Duration picker */}
                    <div className={styles.field}>
                        <label className={styles.label}>{t("modal.duration")}</label>
                        <div className={styles.durationRow}>
                            {DURATION_OPTIONS.map((mins) => (
                                <button
                                    key={mins}
                                    type="button"
                                    className={`${styles.durationOption} ${duration === mins ? styles.durationOptionActive : ""
                                        }`}
                                    onClick={() => setDuration(mins)}
                                >
                                    <Clock size={13} />
                                    {mins === 60 ? t("modal.oneHour") : `${mins} ${t("minutesShort")}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={onClose}
                        disabled={submitting}
                    >
                        {t("modal.cancel")}
                    </button>
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={14} className={styles.spinner} />
                                {t("modal.generating")}
                            </>
                        ) : (
                            <>
                                <Play size={14} />
                                {t("modal.start")}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Confirm delete modal                                               */
/* ------------------------------------------------------------------ */

function ConfirmDeleteModal({
    session,
    busy,
    onCancel,
    onConfirm,
}: {
    session: ExamSession;
    busy: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const t = useTranslations("exams");

    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
        >
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 400, padding: 24, textAlign: "center" }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "color-mix(in srgb, var(--error) 12%, transparent)",
                        color: "var(--error)",
                        marginBottom: 12,
                    }}
                >
                    <Trash2 size={24} />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>
                    {t("deleteConfirmTitle")}
                </h2>
                <p
                    style={{
                        fontSize: 13,
                        color: "var(--muted-foreground)",
                        margin: "0 0 20px",
                        lineHeight: 1.5,
                    }}
                >
                    {t("deleteConfirmText", { title: session.exam.title })}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {t("modal.cancel")}
                    </button>
                    <button
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ background: "var(--error)" }}
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? (
                            <Loader2 size={14} className={styles.spinner} />
                        ) : (
                            <Trash2 size={14} />
                        )}
                        {t("delete")}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}