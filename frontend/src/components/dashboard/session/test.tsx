"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
} from "react";
import { useTranslations } from "next-intl";
import {
    ArrowRight,
    BookOpen,
    Check,
    CheckCircle2,
    ChevronDown,
    GraduationCap,
    HelpCircle,
    Loader2,
    Minus,
    Play,
    Plus,
    RotateCw,
    Sparkles,
    Trash2,
    X,
    XCircle,
    RefreshCw,
} from "lucide-react";

import styles from "./session.module.css";
import {
    CreateSession,
    Session,
    SessionAnswer,
    SessionPlayState,
} from "@/utils/types/session.types";
import {
    createSession,
    deleteSession,
    getSessionPlay,
    getSessionsOfStudent,
    nextQuestion,
    restartSession,
    revealAnswer,
    saveDraft,
} from "@/utils/server/session-api";
import {
    getSubject,
    getSubjectsByStudent,
} from "@/utils/server/subject-api";
import {
    getCourses,
    getCoursesBySubject,
} from "@/utils/server/course-api";
import { Subject, Course } from "@/utils/types/allTypes";

// ===========================================================================
// Small helpers
// ===========================================================================

function isOk<T>(r: any): r is { status: true; response: T } {
    return r && r.status === true;
}

function statusClass(status: string) {
    if (status === "completed") return styles.statusCompleted;
    if (status === "in_progress") return styles.statusInProgress;
    return styles.statusNotStarted;
}

function formatDate(d: string | Date | undefined) {
    if (!d) return "";
    try {
        return new Date(d).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "";
    }
}

// ===========================================================================
// Root
// ===========================================================================

export default function SessionComponent() {
    const t = useTranslations("Session");

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [playSessionId, setPlaySessionId] = useState<number | null>(null);

    // -------------------------------------------------------------------------
    const loadSessions = useCallback(async () => {
        setLoadingSessions(true);
        setListError(null);
        try {
            const res = await getSessionsOfStudent();
            if (isOk<Session[]>(res)) {
                setSessions(Array.isArray(res.response) ? res.response : []);
            } else {
                setListError(res.message ?? t("loadError"));
            }
        } catch (e: any) {
            setListError(e?.message ?? t("loadError"));
        } finally {
            setLoadingSessions(false);
        }
    }, [t]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleDeleteSession = async (sessionId: number) => {
        try {
            const res = await deleteSession(sessionId);
            if (res.status) {
                setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            } else {
                alert(res.message ?? t("card.deleteFailed"));
            }
        } catch (e: any) {
            alert(e?.message ?? t("card.deleteFailed"));
        }
    };

    const handleRestartSession = async (sessionId: number) => {
        // NOTE: Connect this to your restart API once implemented on the server
        const response = await restartSession(sessionId)
        if (response.status) {
            alert(response.message)
            loadSessions()
        } else {
            alert(response.message)
        }
    };

    // -------------------------------------------------------------------------
    return (
        <div className={styles.page}>
            <div className={styles.contentWrapper}>
                <header className={styles.header}>
                    <span className={styles.badge}>
                        <BookOpen size={14} /> {t("badge")}
                    </span>
                    <h1 className={styles.title}>{t("title")}</h1>
                    <p className={styles.subtitle}>{t("subtitle")}</p>
                </header>

                <div className={styles.actionBar}>
                    <button
                        className={styles.addButton}
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus size={16} /> {t("newSession")}
                    </button>
                    <button
                        className={styles.cancelButton}
                        onClick={loadSessions}
                        disabled={loadingSessions}
                    >
                        <RotateCw size={14} style={{ marginRight: 6 }} /> {t("refresh")}
                    </button>
                </div>

                {loadingSessions ? (
                    <div className={styles.loading}>
                        <Loader2 className={styles.spinner} size={28} />
                    </div>
                ) : listError ? (
                    <div className={styles.emptyState}>
                        <XCircle className={styles.emptyStateIcon} />
                        <div className={styles.emptyStateTitle}>{t("loadError")}</div>
                        <p className={styles.emptyStateText}>{listError}</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <GraduationCap className={styles.emptyStateIcon} />
                        <div className={styles.emptyStateTitle}>{t("noSessions")}</div>
                        <p className={styles.emptyStateText}>{t("noSessionsHint")}</p>
                    </div>
                ) : (
                    <div className={styles.sessionGrid}>
                        {sessions.map((s) => (
                            <SessionCard
                                key={s.id}
                                session={s}
                                onOpen={() => setPlaySessionId(s.id)}
                                onDelete={handleDeleteSession}
                                onRestart={handleRestartSession}
                            />
                        ))}
                    </div>
                )}
            </div>

            {createOpen && (
                <CreateSessionModal
                    onClose={() => setCreateOpen(false)}
                    onCreated={async (newId) => {
                        setCreateOpen(false);
                        await loadSessions();
                        if (newId) {
                            setPlaySessionId(newId);
                        }
                    }}
                />
            )}

            {playSessionId !== null && (
                <PlaySessionModal
                    sessionId={playSessionId}
                    onClose={async () => {
                        setPlaySessionId(null);
                        await loadSessions();
                    }}
                    onRestart={() => handleRestartSession(playSessionId)}
                />
            )}
        </div>
    );
}

// ===========================================================================
// Session card
// ===========================================================================

function SessionCard({
    session,
    onOpen,
    onDelete,
    onRestart,
}: {
    session: Session;
    onOpen: () => void;
    onDelete: (id: number) => void;
    onRestart: (id: number) => void;
}) {
    const t = useTranslations("Session");

    const handleMove = (e: ReactMouseEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--rx", `${(y / rect.height - 0.5) * -6}deg`);
        el.style.setProperty("--ry", `${(x / rect.width - 0.5) * 6}deg`);
        el.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
        el.style.setProperty("--my", `${(y / rect.height) * 100}%`);
    };

    const handleLeave = (e: ReactMouseEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
    };

    const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
        }
    };

    const isCompleted = session.status === "completed";
    const isInProgress = session.status === "in_progress";

    // Safe fallback for status translation
    const translatedStatus = t.has(`status.${session.status}`)
        ? t(`status.${session.status}`)
        : session.status;

    return (
        <div
            className={styles.sessionCard}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            onClick={onOpen}
            onKeyDown={onKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className={styles.sessionCardHeader}>
                <div className={styles.sessionIcon}>
                    <BookOpen size={20} />
                </div>
                <span className={`${styles.statusBadge} ${statusClass(session.status)}`}>
                    {translatedStatus}
                </span>
            </div>

            <h3 className={styles.sessionCardTitle}>{session.name}</h3>

            <p className={styles.sessionCardInfo}>
                {session.totalQuestions}{" "}
                {session.totalQuestions === 1 ? t("card.question") : t("card.questions")}
                {session.totalQuestions > 0 && <> · {session.correctCount} {t("card.correct")}</>}
                {session.totalQuestions > 0 && isCompleted && (
                    <>
                        {" "}
                        ({Math.round((session.correctCount / session.totalQuestions) * 100)}%)
                    </>
                )}
            </p>

            <div className={styles.sessionCardFooter}>
                <span className={styles.sessionDate}>
                    {t("card.created")} {formatDate(session.createdAt)}
                </span>
                <div className={styles.cardActionsRow}>
                    <button
                        className={
                            isCompleted
                                ? styles.reviewButton
                                : isInProgress
                                    ? styles.resumeButton
                                    : styles.startButton
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpen();
                        }}
                    >
                        {isCompleted ? (
                            <>
                                {t("card.review")} <ArrowRight size={14} />
                            </>
                        ) : isInProgress ? (
                            <>
                                {t("card.resume")} <Play size={14} />
                            </>
                        ) : (
                            <>
                                {t("card.startSession")} <Play size={14} />
                            </>
                        )}
                    </button>

                    <div className={styles.secondaryActions}>
                        {isCompleted && (
                            <button
                                className={styles.restartButton}
                                title={t("card.restart")}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(t("card.restartConfirm", { name: session.name }))) {
                                        onRestart(session.id);
                                    }
                                }}
                            >
                                <RefreshCw size={15} />
                            </button>
                        )}
                        <button
                            className={styles.deleteButton}
                            title={t("card.delete")}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(t("card.deleteConfirm", { name: session.name }))) {
                                    onDelete(session.id);
                                }
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===========================================================================
// Create session modal
// ===========================================================================

function CreateSessionModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (newId?: number) => void;
}) {
    const t = useTranslations("Session");

    const [name, setName] = useState("");
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [openSubjectIds, setOpenSubjectIds] = useState<number[]>([]);
    const [subjectCourses, setSubjectCourses] = useState<Record<number, Course[]>>({});
    const [loadingSubjectCourses, setLoadingSubjectCourses] = useState<Record<number, boolean>>({});
    const [courseSelected, setCourseSelected] = useState<Record<number, boolean>>({});
    const [courseQte, setCourseQte] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setSubjectsLoading(true);
        (async () => {
            try {
                const res = await getSubjectsByStudent();
                if (cancelled) return;
                if (isOk<Subject[]>(res)) {
                    const list = Array.isArray(res.response) ? res.response : [];
                    setSubjects(list);
                    if (list.length === 1) {
                        const sid = list[0].id;
                        setOpenSubjectIds([sid]);
                        fetchCourses(sid);
                    }
                } else {
                    setError(res.message ?? t("create.noSubjects"));
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? t("create.noSubjects"));
            } finally {
                if (!cancelled) setSubjectsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    const fetchCourses = async (subjectId: number, force = false) => {
        if (!force && subjectCourses[subjectId] && subjectCourses[subjectId].length > 0) return;
        if (loadingSubjectCourses[subjectId]) return;
        setLoadingSubjectCourses((prev) => ({ ...prev, [subjectId]: true }));
        try {
            let courses: Course[] = [];

            const coursesRes = await getCoursesBySubject(subjectId);
            if (coursesRes && coursesRes.status && Array.isArray(coursesRes.response) && coursesRes.response.length > 0) {
                courses = coursesRes.response;
            }

            if (courses.length === 0) {
                const res = await getSubject(subjectId);
                if (res && res.status && res.response) {
                    const raw = res.response as any;
                    const found = raw.courses ?? raw.data?.courses;
                    if (Array.isArray(found) && found.length > 0) {
                        courses = found;
                    }
                }
            }

            if (courses.length === 0) {
                const allRes = await getCourses();
                if (allRes && allRes.status && Array.isArray(allRes.response)) {
                    const matched = allRes.response.filter(
                        (c: any) =>
                            (c.subject && Number(c.subject.id) === Number(subjectId)) ||
                            (c.subjectId && Number(c.subjectId) === Number(subjectId)),
                    );
                    if (matched.length > 0) {
                        courses = matched;
                    }
                }
            }

            setSubjectCourses((prev) => ({
                ...prev,
                [subjectId]: courses,
            }));
        } catch (e) {
            console.error("Failed to load courses for subject", subjectId, e);
        } finally {
            setLoadingSubjectCourses((prev) => ({ ...prev, [subjectId]: false }));
        }
    };

    const toggleSubjectAccordion = (subjectId: number) => {
        if (openSubjectIds.includes(subjectId)) {
            setOpenSubjectIds((prev) => prev.filter((id) => id !== subjectId));
        } else {
            setOpenSubjectIds((prev) => [...prev, subjectId]);
            fetchCourses(subjectId, true);
        }
    };

    const toggleCourse = (course: Course) => {
        const maxQcms = course.qcms?.length ?? 0;
        if (maxQcms === 0) return;

        const willSelect = !courseSelected[course.id];
        setCourseSelected((prev) => ({ ...prev, [course.id]: willSelect }));
        if (willSelect && (courseQte[course.id] === undefined || courseQte[course.id] < 1)) {
            setCourseQte((prev) => ({
                ...prev,
                [course.id]: Math.min(5, maxQcms),
            }));
        }
    };

    const setQte = (courseId: number, value: number, max?: number) => {
        let v = Math.max(1, Math.floor(value || 1));
        if (typeof max === "number" && max > 0) v = Math.min(v, max);
        setCourseQte((prev) => ({ ...prev, [courseId]: v }));
    };

    const changeQteBy = (courseId: number, delta: number, max?: number) => {
        const current = courseQte[courseId] ?? 1;
        setQte(courseId, current + delta, max);
    };

    const buildPayload = (): CreateSession | null => {
        const subjectsPayload: CreateSession["subjects"] = [];

        for (const subject of subjects) {
            const courses = (subjectCourses[subject.id] ?? [])
                .filter((c) => courseSelected[c.id])
                .map((c) => {
                    const maxQcms = c.qcms?.length ?? 1;
                    const requestedQte = courseQte[c.id] ?? 1;
                    return {
                        courseId: c.id,
                        qcmQte: Math.max(1, Math.min(requestedQte, maxQcms)),
                    };
                });

            if (courses.length > 0) {
                subjectsPayload.push({
                    subjectId: subject.id,
                    courses,
                });
            }
        }

        if (!name.trim() || subjectsPayload.length === 0) return null;
        return { name: name.trim(), subjects: subjectsPayload };
    };

    const submit = async () => {
        if (!name.trim()) {
            setError(t("create.nameRequired"));
            return;
        }
        const payload = buildPayload();
        if (!payload || payload.subjects.length === 0) {
            setError(t("create.courseRequired"));
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const res = await createSession(payload);
            if (isOk(res)) {
                const newId = (res.response as any)?.response?.id ?? (res.response as any)?.id;
                onCreated(newId);
            } else {
                setError((res as any).message ?? t("create.createFailed"));
            }
        } catch (e: any) {
            setError(e?.message ?? t("create.createFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCoursesCount = useMemo(
        () => Object.values(courseSelected).filter(Boolean).length,
        [courseSelected],
    );

    const totalQcmCount = useMemo(
        () =>
            Object.entries(courseSelected)
                .filter(([, v]) => v)
                .reduce((acc, [id]) => acc + (courseQte[Number(id)] ?? 1), 0),
        [courseSelected, courseQte],
    );

    const getSubjectSelectedCount = (subjectId: number) => {
        const courses = subjectCourses[subjectId] ?? [];
        return courses.filter((c) => courseSelected[c.id]).length;
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.createModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{t("create.title")}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                <div className={styles.stepContainer}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("create.sessionName")}</label>
                        <input
                            className={styles.formInput}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("create.sessionNamePlaceholder")}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t("create.selectSubjectsAndCourses")}</label>
                        <p className={styles.formHint}>{t("create.selectHint")}</p>

                        {subjectsLoading ? (
                            <div className={styles.loading} style={{ padding: "2rem" }}>
                                <Loader2 className={styles.spinner} size={24} />
                            </div>
                        ) : subjects.length === 0 ? (
                            <div className={styles.noSubjects}>{t("create.noSubjects")}</div>
                        ) : (
                            <div className={styles.subjectsList}>
                                {subjects.map((subject) => {
                                    const isOpen = openSubjectIds.includes(subject.id);
                                    const courses = subjectCourses[subject.id] ?? [];
                                    const isLoadingCourses = !!loadingSubjectCourses[subject.id];
                                    const selectedCountInSubject = getSubjectSelectedCount(subject.id);

                                    return (
                                        <div
                                            key={subject.id}
                                            className={`${styles.subjectAccordionItem} ${isOpen ? styles.active : ""}`}
                                        >
                                            <button
                                                type="button"
                                                className={styles.subjectAccordionHeader}
                                                onClick={() => toggleSubjectAccordion(subject.id)}
                                            >
                                                <span style={{ fontWeight: 600 }}>{subject.name}</span>
                                                <div className={styles.subjectBadgeGroup}>
                                                    {selectedCountInSubject > 0 && (
                                                        <span className={styles.coursesCountBadge}>
                                                            {selectedCountInSubject} {t("create.selected")}
                                                        </span>
                                                    )}
                                                    <ChevronDown
                                                        size={18}
                                                        className={`${styles.subjectChevron} ${isOpen ? styles.subjectChevronOpen : ""}`}
                                                    />
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className={styles.subjectCoursesContainer}>
                                                    {isLoadingCourses ? (
                                                        <div className={styles.courseLoadingState}>
                                                            <Loader2 size={16} className={styles.spinner} />
                                                            {t("create.loadingCourses")}
                                                        </div>
                                                    ) : courses.length === 0 ? (
                                                        <div className={styles.courseEmptyState}>
                                                            {t("create.noCourses")}
                                                        </div>
                                                    ) : (
                                                        courses.map((c) => {
                                                            const checked = !!courseSelected[c.id];
                                                            const maxQcms = c.qcms?.length ?? 0;
                                                            const isUnavailable = maxQcms === 0;

                                                            return (
                                                                <div
                                                                    className={styles.contentItem}
                                                                    key={c.id}
                                                                    style={{
                                                                        opacity: isUnavailable ? 0.5 : 1,
                                                                        borderColor: checked ? "var(--primary)" : undefined,
                                                                    }}
                                                                >
                                                                    <label
                                                                        className={styles.contentLabel}
                                                                        style={{ cursor: isUnavailable ? "not-allowed" : "pointer" }}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            className={styles.contentCheckbox}
                                                                            checked={checked}
                                                                            disabled={isUnavailable}
                                                                            onChange={() => toggleCourse(c)}
                                                                        />
                                                                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                                                                        <span
                                                                            className={styles.qcmCount}
                                                                            style={{
                                                                                color: isUnavailable
                                                                                    ? "var(--muted-foreground)"
                                                                                    : "var(--primary)",
                                                                            }}
                                                                        >
                                                                            {isUnavailable
                                                                                ? t("create.zeroQcms")
                                                                                : t("create.qcmsAvailable", { count: maxQcms, plural: maxQcms === 1 ? "" : "s" })}
                                                                        </span>
                                                                    </label>

                                                                    {checked && !isUnavailable && (
                                                                        <div className={styles.qcmQteControl}>
                                                                            <label>{t("create.quantity")}:</label>
                                                                            <div className={styles.stepperControl}>
                                                                                <button
                                                                                    type="button"
                                                                                    className={styles.stepperBtn}
                                                                                    disabled={(courseQte[c.id] ?? 1) <= 1}
                                                                                    onClick={() => changeQteBy(c.id, -1, maxQcms)}
                                                                                >
                                                                                    <Minus size={14} />
                                                                                </button>
                                                                                <input
                                                                                    type="number"
                                                                                    min={1}
                                                                                    max={maxQcms}
                                                                                    className={styles.qcmQteInput}
                                                                                    value={courseQte[c.id] ?? 1}
                                                                                    onChange={(e) =>
                                                                                        setQte(c.id, Number(e.target.value), maxQcms)
                                                                                    }
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className={styles.stepperBtn}
                                                                                    disabled={(courseQte[c.id] ?? 1) >= maxQcms}
                                                                                    onClick={() => changeQteBy(c.id, 1, maxQcms)}
                                                                                >
                                                                                    <Plus size={14} />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className={styles.maxBtn}
                                                                                    onClick={() => setQte(c.id, maxQcms, maxQcms)}
                                                                                >
                                                                                    {t("create.all")} ({maxQcms})
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {selectedCoursesCount > 0 && (
                        <div className={styles.selectedSummary}>
                            <p className={styles.selectedSummaryTitle}>{t("create.summary")}</p>
                            <div className={styles.summaryStats}>
                                <span>
                                    {t("create.courseSelected", { count: selectedCoursesCount, plural: selectedCoursesCount === 1 ? "" : "s" })}
                                </span>
                                <span className={styles.summaryTotalQcms}>
                                    {t("create.totalQcms", { count: totalQcmCount, plural: totalQcmCount === 1 ? "" : "s" })}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button className={styles.cancelButton} onClick={onClose}>
                            {t("create.cancel")}
                        </button>
                        <button
                            className={styles.submitButton}
                            disabled={
                                submitting ||
                                selectedCoursesCount === 0 ||
                                !name.trim() ||
                                totalQcmCount === 0
                            }
                            onClick={submit}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={14} className={styles.spinner} /> {t("create.creating")}
                                </>
                            ) : (
                                <>
                                    {t("create.createSession")} <Check size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===========================================================================
// Play session modal
// ===========================================================================

function PlaySessionModal({
    sessionId,
    onClose,
    onRestart,
}: {
    sessionId: number;
    onClose: () => void;
    onRestart: () => void;
}) {
    const t = useTranslations("Session");

    const [state, setState] = useState<SessionPlayState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [revealing, setRevealing] = useState(false);
    const [advancing, setAdvancing] = useState(false);

    const question = state?.question;
    const isRevealed = !!question?.isRevealed;

    const loadPlay = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getSessionPlay(sessionId);
            if (isOk<SessionPlayState>(res)) {
                setState(res.response);
                setSelected(res.response?.question?.selectedAnswerIds ?? []);
            } else {
                setError((res as any).message ?? t("play.loadFailed"));
            }
        } catch (e: any) {
            setError(e?.message ?? t("play.loadFailed"));
        } finally {
            setLoading(false);
        }
    }, [sessionId, t]);

    useEffect(() => {
        loadPlay();
    }, [loadPlay]);

    useEffect(() => {
        setSelected(question?.selectedAnswerIds ?? []);
    }, [question?.id, question?.isRevealed]);

    const draftTimer = useRef<number | null>(null);
    useEffect(() => {
        if (!question || isRevealed) return;
        if (selected.length === 0) return;

        if (draftTimer.current) window.clearTimeout(draftTimer.current);
        draftTimer.current = window.setTimeout(() => {
            saveDraft(sessionId, question.id, selected).catch(() => { });
        }, 500);

        return () => {
            if (draftTimer.current) window.clearTimeout(draftTimer.current);
        };
    }, [selected, question?.id, isRevealed, sessionId]);

    const toggleAnswer = (id: number) => {
        if (isRevealed) return;
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleReveal = async () => {
        if (!question || selected.length === 0) return;
        setRevealing(true);
        setError(null);
        try {
            const res = await revealAnswer(sessionId, question.id, selected);
            if (res && (res as any).status === true) {
                const next = (res as any).result as SessionPlayState;
                setState(next);
                setSelected(next?.question?.selectedAnswerIds ?? selected);
            } else {
                setError((res as any).message ?? t("play.revealFailed"));
            }
        } catch (e: any) {
            setError(e?.message ?? t("play.revealFailed"));
        } finally {
            setRevealing(false);
        }
    };

    const handleNext = async () => {
        setAdvancing(true);
        setError(null);
        try {
            const res = await nextQuestion(sessionId);
            if (isOk<SessionPlayState>(res)) {
                const next = res.response;
                setState(next);
                setSelected(next?.question?.selectedAnswerIds ?? []);
            } else {
                setError((res as any).message ?? t("play.advanceFailed"));
            }
        } catch (e: any) {
            setError(e?.message ?? t("play.advanceFailed"));
        } finally {
            setAdvancing(false);
        }
    };

    const total = state?.session?.totalQuestions ?? 0;
    const currentPosition = question ? question.position : state?.session?.currentPosition ?? total;
    const correctCount = state?.session?.correctCount ?? 0;
    const progressPct = total > 0 ? Math.min(100, (currentPosition / total) * 100) : 0;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.sessionModal} onClick={(e) => e.stopPropagation()}>
                <button
                    className={`${styles.closeButton} ${styles.closeButtonAbs}`}
                    onClick={onClose}
                    title={t("play.exitTitle")}
                >
                    <X size={18} />
                </button>

                <div className={styles.sessionModalHeader}>
                    <h2 className={styles.sessionModalTitle}>
                        {state?.session?.name ?? t("play.session")}
                    </h2>
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <Loader2 className={styles.spinner} size={28} />
                    </div>
                ) : error ? (
                    <div className={styles.emptyState}>
                        <XCircle className={styles.emptyStateIcon} />
                        <div className={styles.emptyStateTitle}>{t("play.error")}</div>
                        <p className={styles.emptyStateText}>{error}</p>
                    </div>
                ) : state?.completed && !question ? (
                    <div className={styles.completionScreen}>
                        <div className={styles.completionIcon}>
                            <CheckCircle2 size={44} />
                        </div>
                        <h3 className={styles.completionTitle}>{t("completion.title")}</h3>
                        <p className={styles.completionSubtitle}>
                            {t("completion.subtitle", { name: state.session.name })}
                        </p>

                        <div className={styles.completionStats}>
                            <div className={styles.completionStat}>
                                <span className={styles.completionStatValue}>{state.session.correctCount}</span>
                                <span className={styles.completionStatLabel}>{t("completion.correct")}</span>
                            </div>
                            <div className={styles.completionStat}>
                                <span className={styles.completionStatValue}>{state.session.totalQuestions}</span>
                                <span className={styles.completionStatLabel}>{t("completion.totalQuestions")}</span>
                            </div>
                            <div className={styles.completionStat}>
                                <span className={styles.completionStatValue}>
                                    {state.session.totalQuestions > 0
                                        ? Math.round((state.session.correctCount / state.session.totalQuestions) * 100)
                                        : 0}
                                    %
                                </span>
                                <span className={styles.completionStatLabel}>{t("completion.finalScore")}</span>
                            </div>
                        </div>

                        <div className={styles.completionActions}>
                            <button className={styles.cancelButton} onClick={onClose}>
                                {t("completion.backToSessions")}
                            </button>
                            <button
                                className={styles.completionButton}
                                onClick={() => {
                                    onRestart();
                                    onClose();
                                }}
                            >
                                <RefreshCw size={14} style={{ marginRight: 6 }} /> {t("completion.restartSession")}
                            </button>
                        </div>
                    </div>
                ) : question ? (
                    <>
                        <div className={styles.progressSection}>
                            <div className={styles.progressInfo}>
                                <span style={{ fontWeight: 600 }}>
                                    {t("play.questionOf", { current: currentPosition, total: total })}
                                </span>
                                <span className={styles.correctTracker}>
                                    <Sparkles size={14} /> {correctCount} {t("play.correct")}
                                </span>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        <div className={styles.questionSection}>
                            <span className={styles.questionNumber}>
                                {t("play.questionNum", { num: currentPosition })}
                            </span>
                            <h3 className={styles.questionText}>{question.question}</h3>

                            {isRevealed && (
                                <div
                                    className={`${styles.questionResultBanner} ${question.isCorrect ? styles.correct : styles.incorrect
                                        }`}
                                >
                                    {question.isCorrect ? (
                                        <>
                                            <CheckCircle2 size={18} /> {t("play.correctBanner")}
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={18} /> {t("play.incorrectBanner")}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className={styles.answersList}>
                                {question.answers.map((answer: SessionAnswer) => {
                                    const isSelected = selected.includes(answer.id);
                                    const showCorrect = isRevealed && answer.isCorrect;
                                    const showWrong = isRevealed && isSelected && !answer.isCorrect;

                                    let cls = styles.answerButton;
                                    if (isRevealed) cls += ` ${styles.answerDisabled}`;
                                    if (showCorrect) cls += ` ${styles.answerCorrectRevealed}`;
                                    else if (showWrong) cls += ` ${styles.answerIncorrectSelected}`;
                                    else if (isSelected) cls += ` ${styles.answerSelected}`;

                                    return (
                                        <div className={styles.answerWrapper} key={answer.id}>
                                            <button
                                                type="button"
                                                className={cls}
                                                disabled={isRevealed}
                                                onClick={() => toggleAnswer(answer.id)}
                                            >
                                                <span className={styles.answerButtonInner}>
                                                    <span
                                                        className={`${styles.answerCheck} ${isSelected ? styles.answerCheckChecked : ""
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <Check size={14} className={styles.answerCheckIcon} />
                                                        )}
                                                    </span>
                                                    <span className={styles.answerText}>{answer.answer}</span>
                                                </span>

                                                {showCorrect && (
                                                    <CheckCircle2 size={20} className={styles.correctIcon} />
                                                )}
                                                {showWrong && (
                                                    <XCircle size={20} className={styles.correctIcon} style={{ color: "#ef4444" }} />
                                                )}
                                            </button>

                                            {isRevealed && answer.explanation && (
                                                <div
                                                    className={`${styles.answerExplanation} ${answer.isCorrect ? styles.correct : styles.incorrect
                                                        }`}
                                                >
                                                    <div className={styles.explanationHeader}>
                                                        <HelpCircle size={13} />
                                                        <span>
                                                            {answer.isCorrect
                                                                ? t("play.correctExplanation")
                                                                : t("play.optionExplanation")}
                                                        </span>
                                                    </div>
                                                    <div>{answer.explanation}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.questionNavigation}>
                                {!isRevealed ? (
                                    <button
                                        className={styles.submitAnswerButton}
                                        disabled={selected.length === 0 || revealing}
                                        onClick={handleReveal}
                                    >
                                        {revealing ? (
                                            <>
                                                <Loader2 size={14} className={styles.spinner} /> {t("play.checking")}
                                            </>
                                        ) : (
                                            <>
                                                {t("play.revealAnswer")} <Check size={14} />
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        className={styles.nextButton}
                                        disabled={advancing}
                                        onClick={handleNext}
                                    >
                                        {advancing ? (
                                            <>
                                                <Loader2 size={14} className={styles.spinner} /> {t("play.loading")}
                                            </>
                                        ) : currentPosition >= total ? (
                                            <>
                                                {t("play.finishSession")} <CheckCircle2 size={14} />
                                            </>
                                        ) : (
                                            <>
                                                {t("play.nextQuestion")} <ArrowRight size={14} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyStateText}>{t("play.noQuestion")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}