"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Users,
  Loader2,
  XCircle,
} from "lucide-react";

import {
  createRoom,
  findRoomByCode,
} from "@/utils/server/room-api";
import { CreateRoomDto } from "@/utils/types/room.types";
import { getSubjectsByStudent } from "@/utils/server/subject-api";
import { getCoursesBySubject } from "@/utils/server/course-api";
import { getTdsBySubject } from "@/utils/server/td-api";
import { getTpsBySubject } from "@/utils/server/tp-api";
import { Subject } from "@/utils/types/allTypes";

import styles from "./challenges.module.css";
import GameRoom from "./game-room.component";

// ===========================================================================
// Main Component — landing view with two big action cards
// ===========================================================================

export default function ChallengesComponent() {
  const t = useTranslations("challenges");
  const searchParams = useSearchParams();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  useEffect(() => {
    const roomId = searchParams.get("roomId");
    if (roomId) setActiveRoomId(roomId);
  }, [searchParams]);

  const handleCreateRoom = (roomId: string) => {
    setShowCreate(false);
    setActiveRoomId(roomId);
  };

  const handleJoinRoom = (roomId: string) => {
    setShowJoin(false);
    setActiveRoomId(roomId);
  };

  const handleCloseGameRoom = useCallback(() => {
    setActiveRoomId(null);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <span className={styles.badge}>
            <Users size={14} /> {t("badge")}
          </span>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </header>

        <div className={styles.actionGrid}>
          <button
            type="button"
            className={`${styles.actionCard} ${styles.actionCardCreate}`}
            onClick={() => setShowCreate(true)}
          >
            <span className={styles.actionCardIcon}>
              <Plus size={28} strokeWidth={2.25} />
            </span>
            <span className={styles.actionCardTitle}>{t("createRoom")}</span>
            <span className={styles.actionCardHint}>{t("subtitle")}</span>
          </button>

          <button
            type="button"
            className={`${styles.actionCard} ${styles.actionCardJoin}`}
            onClick={() => setShowJoin(true)}
          >
            <span className={styles.actionCardIcon}>
              <Users size={28} strokeWidth={2.25} />
            </span>
            <span className={styles.actionCardTitle}>{t("joinRoom")}</span>
            <span className={styles.actionCardHint}>{t("roomCode")}</span>
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreateRoom}
        />
      )}

      {showJoin && (
        <JoinRoomModal
          onClose={() => setShowJoin(false)}
          onJoined={handleJoinRoom}
        />
      )}

      {activeRoomId && (
        <GameRoom
          roomId={activeRoomId}
          onClose={handleCloseGameRoom}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Room Modal — unchanged from your version
// ---------------------------------------------------------------------------

function CreateRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (roomId: string) => void;
}) {
  const t = useTranslations("challenges");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [tds, setTds] = useState<any[]>([]);
  const [tps, setTps] = useState<any[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [selectedTdIds, setSelectedTdIds] = useState<number[]>([]);
  const [selectedTpIds, setSelectedTpIds] = useState<number[]>([]);
  const [qcmCount, setQcmCount] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(30);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId) loadSubjectContent(selectedSubjectId);
  }, [selectedSubjectId]);

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    const res = await getSubjectsByStudent();
    if (res.status && res.response) setSubjects(res.response);
    setLoadingSubjects(false);
  };

  const loadSubjectContent = async (subjectId: number) => {
    setLoadingContent(true);
    try {
      const [coursesRes, tdsRes, tpsRes] = await Promise.all([
        getCoursesBySubject(subjectId),
        getTdsBySubject(subjectId),
        getTpsBySubject(subjectId),
      ]);

      if (coursesRes.status && coursesRes.response) setCourses(coursesRes.response);
      if (tdsRes.status && tdsRes.response) setTds(tdsRes.response);
      if (tpsRes.status && tpsRes.response) setTps(tpsRes.response);
    } catch (e) {
      console.error("Failed to load content", e);
    } finally {
      setLoadingContent(false);
    }
  };

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const toggleTd = (tdId: number) => {
    setSelectedTdIds((prev) =>
      prev.includes(tdId) ? prev.filter((id) => id !== tdId) : [...prev, tdId]
    );
  };

  const toggleTp = (tpId: number) => {
    setSelectedTpIds((prev) =>
      prev.includes(tpId) ? prev.filter((id) => id !== tpId) : [...prev, tpId]
    );
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedSubjectId) {
      setError(t("selectSubjectRequired"));
      return;
    }

    const payload: CreateRoomDto = {
      mode: "exam_simulation",
      qcmCount,
      timerSeconds,
      content: {
        subjectId: selectedSubjectId,
        courseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
        tdIds: selectedTdIds.length > 0 ? selectedTdIds : undefined,
        tpIds: selectedTpIds.length > 0 ? selectedTpIds : undefined,
      },
    };

    setSubmitting(true);
    const res = await createRoom(payload);
    setSubmitting(false);

    if (res.status && res.response) {
      onCreated(res.response.id);
    } else {
      setError(res.message || t("createFailed"));
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t("createRoomTitle")}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <XCircle size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>{t("selectSubject")}</label>
            {loadingSubjects ? (
              <div className={styles.loading}>
                <Loader2 size={16} className={styles.spinner} />
              </div>
            ) : (
              <select
                className={styles.select}
                value={selectedSubjectId || ""}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              >
                <option value="">{t("selectSubjectPlaceholder")}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedSubjectId && !loadingContent && (
            <>
              {courses.length > 0 && (
                <div className={styles.field}>
                  <label className={styles.label}>{t("selectCourses")}</label>
                  <div className={styles.contentGrid}>
                    {courses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`${styles.contentItem} ${selectedCourseIds.includes(c.id) ? styles.contentItemSelected : ""}`}
                        onClick={() => toggleCourse(c.id)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tds.length > 0 && (
                <div className={styles.field}>
                  <label className={styles.label}>{t("selectTDs")}</label>
                  <div className={styles.contentGrid}>
                    {tds.map((td) => (
                      <button
                        key={td.id}
                        type="button"
                        className={`${styles.contentItem} ${selectedTdIds.includes(td.id) ? styles.contentItemSelected : ""}`}
                        onClick={() => toggleTd(td.id)}
                      >
                        {td.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tps.length > 0 && (
                <div className={styles.field}>
                  <label className={styles.label}>{t("selectTPs")}</label>
                  <div className={styles.contentGrid}>
                    {tps.map((tp) => (
                      <button
                        key={tp.id}
                        type="button"
                        className={`${styles.contentItem} ${selectedTpIds.includes(tp.id) ? styles.contentItemSelected : ""}`}
                        onClick={() => toggleTp(tp.id)}
                      >
                        {tp.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label}>{t("qcmCount")}</label>
            <input
              type="number"
              min={1}
              max={100}
              className={styles.input}
              value={qcmCount}
              onChange={(e) => setQcmCount(Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t("timerSeconds")}</label>
            <input
              type="number"
              min={0}
              className={styles.input}
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Math.max(0, Number(e.target.value)))}
            />
            <span className={styles.hint}>{t("timerHint")}</span>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={submitting}
          >
            {t("cancel")}
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className={styles.spinner} />
                {t("creating")}
              </>
            ) : (
              t("create")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Join Room Modal — unchanged
// ---------------------------------------------------------------------------

function JoinRoomModal({
  onClose,
  onJoined,
}: {
  onClose: () => void;
  onJoined: (roomId: string) => void;
}) {
  const t = useTranslations("challenges");

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError(t("codeRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await findRoomByCode(code.trim());
    setSubmitting(false);

    if (res.status && res.response) {
      onJoined(res.response.id);
    } else {
      setError(res.message || t("roomNotFound"));
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{t("joinRoomTitle")}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <XCircle size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>{t("roomCode")}</label>
            <input
              type="text"
              className={styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              style={{
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontSize: "24px",
                textAlign: "center",
              }}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={submitting}
          >
            {t("cancel")}
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className={styles.spinner} />
                {t("joining")}
              </>
            ) : (
              t("join")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}