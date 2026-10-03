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
import { Subject, Course, Td, Tp } from "@/utils/types/allTypes";
import { getTdsBySubject } from "@/utils/server/td-api";
import { getTpsBySubject } from "@/utils/server/tp-api";
import { generateExplanation } from "@/utils/server/qcm-api";
import Image from "next/image";

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

/**
 * Try to extract a QCM image URL from a question object coming from the
 * session play API. Handles multiple shapes:
 *   - question.image.url
 *   - question.qcm.image.url
 *   - question.image (string)
 *   - question.qcmImage?.url
 */
function getQuestionImageUrl(question: any): string | null {
  if (!question) return null;

  const candidates: any[] = [
    question?.image,
    question?.qcm?.image,
    question?.qcmImage,
    question?.qcm_image,
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
    const response = await restartSession(sessionId);
    if (response.status) {
      loadSessions();
    } else {
      alert(response.message);
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

  // Data caches
  const [subjectCourses, setSubjectCourses] = useState<Record<number, Course[]>>({});
  const [subjectTds, setSubjectTds] = useState<Record<number, Td[]>>({});
  const [subjectTps, setSubjectTps] = useState<Record<number, Tp[]>>({});
  const [loadingSubjectData, setLoadingSubjectData] = useState<Record<number, boolean>>({});

  // Selections
  const [courseSelected, setCourseSelected] = useState<Record<number, boolean>>({});
  const [tdSelected, setTdSelected] = useState<Record<number, boolean>>({});
  const [tpSelected, setTpSelected] = useState<Record<number, boolean>>({});

  // Quantities
  const [courseQte, setCourseQte] = useState<Record<number, number>>({});
  const [tdQte, setTdQte] = useState<Record<number, number>>({});
  const [tpQte, setTpQte] = useState<Record<number, number>>({});

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
            fetchSubjectContent(sid);
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

  const fetchSubjectContent = async (subjectId: number, force = false) => {
    if (!force && subjectCourses[subjectId] && subjectCourses[subjectId].length > 0) return;
    if (loadingSubjectData[subjectId]) return;

    setLoadingSubjectData((prev) => ({ ...prev, [subjectId]: true }));
    try {
      let courses: Course[] = [];
      let tds: Td[] = [];
      let tps: Tp[] = [];

      const coursesRes = await getCoursesBySubject(subjectId);
      const tdRes = await getTdsBySubject(subjectId);
      const tpRes = await getTpsBySubject(subjectId);

      if (coursesRes && coursesRes.status && Array.isArray(coursesRes.response)) {
        courses = coursesRes.response;
      }
      if (tdRes && tdRes.status && Array.isArray(tdRes.response)) {
        tds = tdRes.response;
      }
      if (tpRes && tpRes.status && Array.isArray(tpRes.response)) {
        tps = tpRes.response;
      }

      setSubjectCourses((prev) => ({ ...prev, [subjectId]: courses }));
      setSubjectTds((prev) => ({ ...prev, [subjectId]: tds }));
      setSubjectTps((prev) => ({ ...prev, [subjectId]: tps }));
    } catch (e) {
      console.error("Failed to load content for subject", subjectId, e);
    } finally {
      setLoadingSubjectData((prev) => ({ ...prev, [subjectId]: false }));
    }
  };

  const toggleSubjectAccordion = (subjectId: number) => {
    if (openSubjectIds.includes(subjectId)) {
      setOpenSubjectIds((prev) => prev.filter((id) => id !== subjectId));
    } else {
      setOpenSubjectIds((prev) => [...prev, subjectId]);
      fetchSubjectContent(subjectId, true);
    }
  };

  const toggleContent = (type: "course" | "td" | "tp", item: any) => {
    const maxQcms = item.qcms?.length ?? 0;
    if (maxQcms === 0) return;

    if (type === "course") {
      const willSelect = !courseSelected[item.id];
      setCourseSelected((prev) => ({ ...prev, [item.id]: willSelect }));
      if (willSelect && (courseQte[item.id] === undefined || courseQte[item.id] < 1)) {
        setCourseQte((prev) => ({ ...prev, [item.id]: Math.min(5, maxQcms) }));
      }
    } else if (type === "td") {
      const willSelect = !tdSelected[item.id];
      setTdSelected((prev) => ({ ...prev, [item.id]: willSelect }));
      if (willSelect && (tdQte[item.id] === undefined || tdQte[item.id] < 1)) {
        setTdQte((prev) => ({ ...prev, [item.id]: Math.min(5, maxQcms) }));
      }
    } else if (type === "tp") {
      const willSelect = !tpSelected[item.id];
      setTpSelected((prev) => ({ ...prev, [item.id]: willSelect }));
      if (willSelect && (tpQte[item.id] === undefined || tpQte[item.id] < 1)) {
        setTpQte((prev) => ({ ...prev, [item.id]: Math.min(5, maxQcms) }));
      }
    }
  };

  const setQte = (type: "course" | "td" | "tp", id: number, value: number, max?: number) => {
    let v = Math.max(1, Math.floor(value || 1));
    if (typeof max === "number" && max > 0) v = Math.min(v, max);

    if (type === "course") setCourseQte((prev) => ({ ...prev, [id]: v }));
    else if (type === "td") setTdQte((prev) => ({ ...prev, [id]: v }));
    else if (type === "tp") setTpQte((prev) => ({ ...prev, [id]: v }));
  };

  const changeQteBy = (type: "course" | "td" | "tp", id: number, delta: number, max?: number) => {
    let current = 1;
    if (type === "course") current = courseQte[id] ?? 1;
    else if (type === "td") current = tdQte[id] ?? 1;
    else if (type === "tp") current = tpQte[id] ?? 1;
    setQte(type, id, current + delta, max);
  };

  const buildPayload = (): CreateSession | null => {
    const subjectsPayload: CreateSession["subjects"] = [];

    for (const subject of subjects) {
      const courses = (subjectCourses[subject.id] ?? [])
        .filter((c) => courseSelected[c.id])
        .map((c) => ({
          courseId: c.id,
          qcmQte: Math.max(1, Math.min(courseQte[c.id] ?? 1, c.qcms?.length ?? 1)),
        }));

      const tds = (subjectTds[subject.id] ?? [])
        .filter((t) => tdSelected[t.id])
        .map((t) => ({
          tdId: t.id,
          qcmQte: Math.max(1, Math.min(tdQte[t.id] ?? 1, t.qcms?.length ?? 1)),
        }));

      const tps = (subjectTps[subject.id] ?? [])
        .filter((t) => tpSelected[t.id])
        .map((t) => ({
          tpId: t.id,
          qcmQte: Math.max(1, Math.min(tpQte[t.id] ?? 1, t.qcms?.length ?? 1)),
        }));

      if (courses.length > 0 || tds.length > 0 || tps.length > 0) {
        subjectsPayload.push({
          subjectId: subject.id,
          courses,
          tds,
          tps,
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

  // Compute total selected files and QCM counts across all types
  const selectedContentCount = useMemo(() => {
    let count = 0;
    count += Object.values(courseSelected).filter(Boolean).length;
    count += Object.values(tdSelected).filter(Boolean).length;
    count += Object.values(tpSelected).filter(Boolean).length;
    return count;
  }, [courseSelected, tdSelected, tpSelected]);

  const totalQcmCount = useMemo(() => {
    let total = 0;
    Object.entries(courseSelected).forEach(([id, selected]) => { if (selected) total += courseQte[Number(id)] ?? 1 });
    Object.entries(tdSelected).forEach(([id, selected]) => { if (selected) total += tdQte[Number(id)] ?? 1 });
    Object.entries(tpSelected).forEach(([id, selected]) => { if (selected) total += tpQte[Number(id)] ?? 1 });
    return total;
  }, [courseSelected, courseQte, tdSelected, tdQte, tpSelected, tpQte]);

  const getSubjectSelectedCount = (subjectId: number) => {
    let count = 0;
    count += (subjectCourses[subjectId] ?? []).filter((c) => courseSelected[c.id]).length;
    count += (subjectTds[subjectId] ?? []).filter((t) => tdSelected[t.id]).length;
    count += (subjectTps[subjectId] ?? []).filter((t) => tpSelected[t.id]).length;
    return count;
  };

  // Reusable render helper for lists
  const renderContentList = (
    items: any[],
    type: "course" | "td" | "tp",
    title: string,
    selectedState: Record<number, boolean>,
    qteState: Record<number, number>
  ) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.5rem", flexShrink: 0 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase" }}>
          {title}
        </div>
        {items.map((item) => {
          const checked = !!selectedState[item.id];
          const maxQcms = item.qcms?.length ?? 0;
          const isUnavailable = maxQcms === 0;

          return (
            <div
              className={styles.contentItem}
              key={item.id}
              style={{
                opacity: isUnavailable ? 0.5 : 1,
                borderColor: checked ? "var(--primary)" : undefined,
                flexShrink: 0,
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
                  onChange={() => toggleContent(type, item)}
                />
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <span
                  className={styles.qcmCount}
                  style={{
                    color: isUnavailable ? "var(--muted-foreground)" : "var(--primary)",
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
                      disabled={(qteState[item.id] ?? 1) <= 1}
                      onClick={() => changeQteBy(type, item.id, -1, maxQcms)}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={maxQcms}
                      className={styles.qcmQteInput}
                      value={qteState[item.id] ?? 1}
                      onChange={(e) => setQte(type, item.id, Number(e.target.value), maxQcms)}
                    />
                    <button
                      type="button"
                      className={styles.stepperBtn}
                      disabled={(qteState[item.id] ?? 1) >= maxQcms}
                      onClick={() => changeQteBy(type, item.id, 1, maxQcms)}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.maxBtn}
                      onClick={() => setQte(type, item.id, maxQcms, maxQcms)}
                    >
                      {t("create.all")} ({maxQcms})
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
                  const tds = subjectTds[subject.id] ?? [];
                  const tps = subjectTps[subject.id] ?? [];

                  const isLoadingData = !!loadingSubjectData[subject.id];
                  const selectedCountInSubject = getSubjectSelectedCount(subject.id);
                  const hasNoContent = courses.length === 0 && tds.length === 0 && tps.length === 0;

                  return (
                    <div
                      key={subject.id}
                      className={`${styles.subjectAccordionItem} ${isOpen ? styles.active : ""}`}
                      style={{ flexShrink: 0 }}
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
                          {isLoadingData ? (
                            <div className={styles.courseLoadingState}>
                              <Loader2 size={16} className={styles.spinner} />
                              {t("create.loadingCourses")}
                            </div>
                          ) : hasNoContent ? (
                            <div className={styles.courseEmptyState}>
                              {t("create.noCourses")}
                            </div>
                          ) : (
                            <>
                              {renderContentList(courses, "course", "Courses", courseSelected, courseQte)}
                              {renderContentList(tds, "td", "TDs", tdSelected, tdQte)}
                              {renderContentList(tps, "tp", "TPs", tpSelected, tpQte)}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedContentCount > 0 && (
            <div className={styles.selectedSummary}>
              <p className={styles.selectedSummaryTitle}>{t("create.summary")}</p>
              <div className={styles.summaryStats}>
                <span>
                  {t("create.courseSelected", { count: selectedContentCount, plural: selectedContentCount === 1 ? "" : "s" })}
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
                selectedContentCount === 0 ||
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

// ===========================================================================
// Typewriter hook — writes out text character by character
// ===========================================================================

function useTypewriter(text: string | null, speed = 10) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      return;
    }
    let i = 0;
    setDisplayed("");
    const interval = window.setInterval(() => {
      i += 2; // 2 chars per tick → ~200 chars/sec at 10ms
      if (i >= text.length) {
        setDisplayed(text);
        window.clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);
    return () => window.clearInterval(interval);
  }, [text, speed]);

  return displayed;
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

  /* -------- AI explanation state -------- */
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  /* -------- Audio -------- */
  const correctSound = useRef<HTMLAudioElement | null>(null);
  const wrongSound = useRef<HTMLAudioElement | null>(null);
  const finishSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctSound.current = new Audio("/sounds/correct.mp3");
    wrongSound.current = new Audio("/sounds/wrong.mp3");
    finishSound.current = new Audio("/sounds/finish.mp3");
  }, []);

  const playSound = useCallback((type: "correct" | "wrong" | "finish") => {
    try {
      let audio: HTMLAudioElement | null = null;
      if (type === "correct") audio = correctSound.current;
      else if (type === "wrong") audio = wrongSound.current;
      else if (type === "finish") audio = finishSound.current;

      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((e) => console.log("Audio play blocked/failed:", e));
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  }, []);

  const question = state?.question;
  const isRevealed = !!question?.isRevealed;

  /** Image URL for the current question (null if none). */
  const questionImageUrl = useMemo(
    () => getQuestionImageUrl(question),
    [question],
  );

  /* -------- Load play state -------- */
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

  /* -------- Reset AI panel when question changes -------- */
  useEffect(() => {
    setAiExplanation(null);
    setAiError(null);
    setAiLoading(false);
  }, [question?.id]);

  /* -------- Draft autosave -------- */
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

  /* -------- Reveal -------- */
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

        if (next?.question?.isCorrect) {
          playSound("correct");
        } else if (next?.question?.isRevealed) {
          playSound("wrong");
        }
      } else {
        setError((res as any).message ?? t("play.revealFailed"));
      }
    } catch (e: any) {
      setError(e?.message ?? t("play.revealFailed"));
    } finally {
      setRevealing(false);
    }
  };

  /* -------- Next -------- */
  const handleNext = async () => {
    setAdvancing(true);
    setError(null);
    try {
      const res = await nextQuestion(sessionId);
      if (isOk<SessionPlayState>(res)) {
        const next = res.response;
        setState(next);
        setSelected(next?.question?.selectedAnswerIds ?? []);

        if (next?.completed) {
          playSound("finish");
        }
      } else {
        setError((res as any).message ?? t("play.advanceFailed"));
      }
    } catch (e: any) {
      setError(e?.message ?? t("play.advanceFailed"));
    } finally {
      setAdvancing(false);
    }
  };

  /* -------- AI: explain further -------- */
  const handleExplainFurther = async () => {
    if (!question || aiLoading) return;

    setAiLoading(true);
    setAiError(null);
    setAiExplanation(null);

    try {
      const qcmId = (question as any).qcmId ?? question.id;
      const res = await generateExplanation(qcmId);

      if ((res as any).status === true) {
        // Try every reasonable shape the API might return.
        const raw =
          (res as any).response ??
          (res as any).result ??
          (res as any).data;

        const text =
          (raw && (raw.explanation ?? raw.text ?? raw.content)) ??
          (typeof raw === "string" ? raw : null);

        setAiExplanation(
          text && String(text).trim().length > 0
            ? String(text)
            : t("play.aiEmpty"),
        );
      } else {
        setAiError((res as any).message ?? t("play.aiFailed"));
      }
    } catch (e: any) {
      setAiError(e?.message ?? t("play.aiFailed"));
    } finally {
      setAiLoading(false);
    }
  };



  /* -------- Progress derived -------- */
  const total = state?.session?.totalQuestions ?? 0;
  const currentPosition = question
    ? question.position
    : state?.session?.currentPosition ?? total;
  const correctCount = state?.session?.correctCount ?? 0;
  const progressPct =
    total > 0 ? Math.min(100, (currentPosition / total) * 100) : 0;

  const typedExplanation = useTypewriter(aiExplanation, 8);

  /* =================================================================== */
  /*  Render                                                             */
  /* =================================================================== */

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.sessionModal}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={`${styles.closeButton} ${styles.closeButtonAbs}`}
          onClick={onClose}
          title={t("play.exitTitle")}
        >
          <X size={18} />
        </button>

        {/* ---------- Header ---------- */}
        <div className={styles.sessionModalHeader}>
          <div className={styles.sessionModalTitleBlock}>
            <span className={styles.sessionModalEyebrow}>
              <Sparkles size={12} />
              {t("play.eyebrow")}
            </span>
            <h2 className={styles.sessionModalTitle}>
              {state?.session?.name ?? t("play.session")}
            </h2>
          </div>

          {question && (
            <div className={styles.headerStats}>
              <span className={styles.headerStat}>
                <span className={styles.headerStatValue}>
                  {correctCount}
                </span>
                <span className={styles.headerStatLabel}>
                  {t("play.correct")}
                </span>
              </span>
              <span className={styles.headerStatDivider} />
              <span className={styles.headerStat}>
                <span className={styles.headerStatValue}>{total}</span>
                <span className={styles.headerStatLabel}>
                  {t("play.total")}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* ---------- Loading / Error ---------- */}
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
          /* ---------- Completion screen ---------- */
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
                <span className={styles.completionStatValue}>
                  {state.session.correctCount}
                </span>
                <span className={styles.completionStatLabel}>
                  {t("completion.correct")}
                </span>
              </div>
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>
                  {state.session.totalQuestions}
                </span>
                <span className={styles.completionStatLabel}>
                  {t("completion.totalQuestions")}
                </span>
              </div>
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>
                  {state.session.totalQuestions > 0
                    ? Math.round(
                      (state.session.correctCount /
                        state.session.totalQuestions) *
                      100,
                    )
                    : 0}
                  %
                </span>
                <span className={styles.completionStatLabel}>
                  {t("completion.finalScore")}
                </span>
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
                <RefreshCw size={14} style={{ marginRight: 6 }} />
                {t("completion.restartSession")}
              </button>
            </div>
          </div>
        ) : question ? (
          /* ---------- Question screen ---------- */
          <>
            {/* Progress */}
            <div className={styles.progressSection}>
              <div className={styles.progressInfo}>
                <span className={styles.progressLabel}>
                  {t("play.questionOf", {
                    current: currentPosition,
                    total,
                  })}
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

            {/* Question body */}
            <div className={styles.questionSection}>
              <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>
                  {t("play.questionNum", { num: currentPosition })}
                </span>
                {isRevealed && (
                  <span
                    className={`${styles.revealChip} ${question.isCorrect
                      ? styles.revealChipCorrect
                      : styles.revealChipIncorrect
                      }`}
                  >
                    {question.isCorrect ? (
                      <>
                        <CheckCircle2 size={12} /> {t("play.correctChip")}
                      </>
                    ) : (
                      <>
                        <XCircle size={12} /> {t("play.incorrectChip")}
                      </>
                    )}
                  </span>
                )}
              </div>

              <h3 className={styles.questionText}>{question.question}</h3>

              {/* ---------- QCM image (only if available) ---------- */}
              {questionImageUrl && (
                <div
                  style={{
                    margin: "0.75rem 0 1rem",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid var(--border, rgba(0,0,0,0.08))",
                    background: "var(--card, #fff)",
                    display: "flex",
                    justifyContent: "center",
                    maxHeight: "320px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={questionImageUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "auto",
                      maxHeight: "320px",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}

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

              {/* Answers */}
              <div className={styles.answersList}>
                {!question.answers || question.answers.length === 0 ? (
                  <div className={styles.noAnswersWarning}>
                    <p className={styles.noAnswersTitle}>
                      ⚠️ {t("play.noAnswersTitle")}
                    </p>
                    <p className={styles.noAnswersHint}>
                      {t("play.noAnswersHint")}
                    </p>
                  </div>
                ) : (
                  question.answers.map((answer: SessionAnswer) => {
                    const isSelected = selected.includes(answer.id);
                    const showCorrect = isRevealed && answer.isCorrect;
                    const showWrong =
                      isRevealed && isSelected && !answer.isCorrect;

                    let cls = styles.answerButton;
                    if (isRevealed) cls += ` ${styles.answerDisabled}`;
                    if (showCorrect) cls += ` ${styles.answerCorrectRevealed}`;
                    else if (showWrong)
                      cls += ` ${styles.answerIncorrectSelected}`;
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
                                <Check
                                  size={14}
                                  className={styles.answerCheckIcon}
                                />
                              )}
                            </span>
                            <span className={styles.answerText}>
                              {answer.answer}
                            </span>
                          </span>

                          {showCorrect && (
                            <CheckCircle2
                              size={20}
                              className={styles.correctIcon}
                            />
                          )}
                          {showWrong && (
                            <XCircle
                              size={20}
                              className={styles.correctIcon}
                              style={{ color: "var(--error)" }}
                            />
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
                  })
                )}
              </div>

              {/* ---------- AI explanation panel ---------- */}
              {isRevealed && (aiLoading || aiExplanation || aiError) && (
                <div className={styles.aiCard}>
                  <div className={styles.aiCardHeader}>
                    <div className={styles.aiCardIconWrap}>
                      <Sparkles size={14} />
                    </div>
                    <div className={styles.aiCardTitleBlock}>
                      <span className={styles.aiCardTitle}>
                        {t("play.aiTitle")}
                      </span>
                      <span className={styles.aiCardSubtitle}>
                        {t("play.aiSubtitle")}
                      </span>
                    </div>

                  </div>

                  <div className={styles.aiCardBody}>
                    {aiLoading ? (
                      <div className={styles.aiLoading}>
                        <div className={styles.aiLoadingDots}>
                          <span />
                          <span />
                          <span />
                        </div>
                        <span className={styles.aiLoadingText}>
                          {t("play.aiThinking")}
                        </span>
                      </div>
                    ) : aiError ? (
                      <div className={styles.aiError}>
                        <XCircle size={14} />
                        <span>{aiError}</span>
                        <button
                          type="button"
                          className={styles.aiRetryBtn}
                          onClick={handleExplainFurther}
                        >
                          {t("play.aiRetry")}
                        </button>
                      </div>
                    ) : (
                      <p className={styles.aiText}>
                        {typedExplanation}
                        {typedExplanation !== aiExplanation && (
                          <span className={styles.aiCursor}>▍</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ---------- Navigation ---------- */}
              <div className={styles.questionNavigation}>
                {!isRevealed ? (
                  <button
                    className={styles.submitAnswerButton}
                    disabled={selected.length === 0 || revealing}
                    onClick={handleReveal}
                  >
                    {revealing ? (
                      <>
                        <Loader2 size={14} className={styles.spinner} />{" "}
                        {t("play.checking")}
                      </>
                    ) : (
                      <>
                        {t("play.revealAnswer")} <Check size={14} />
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    {/* Explain further — only if there's no AI text yet */}
                    {!aiExplanation && !aiLoading && !aiError && (
                      <button
                        type="button"
                        className={styles.explainFurtherButton}
                        onClick={handleExplainFurther}
                      >
                        <Sparkles size={15} />
                        {t("play.explainFurther")}
                      </button>
                    )}

                    <button
                      className={styles.nextButton}
                      disabled={advancing}
                      onClick={handleNext}
                    >
                      {advancing ? (
                        <>
                          <Loader2 size={14} className={styles.spinner} />{" "}
                          {t("play.loading")}
                        </>
                      ) : currentPosition >= total ? (
                        <>
                          {t("play.finishSession")}{" "}
                          <CheckCircle2 size={14} />
                        </>
                      ) : (
                        <>
                          {t("play.nextQuestion")} <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </>
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