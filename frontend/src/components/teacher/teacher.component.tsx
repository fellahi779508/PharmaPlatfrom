"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  BookOpen,
  GraduationCap,
  FileText,
  ListChecks,
  Loader2,
  Save,
  ChevronRight,
  Home,
  RefreshCw,
  Layers,
  Award,
  Info,
  FlaskConical,
  Beaker,
} from "lucide-react";

import {
  getYears,
  getYear,
  createYear,
  updateYear,
  deleteYear,
} from "@/utils/server/year-api";
import {
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
} from "@/utils/server/semester-api";
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/utils/server/subject-api";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} from "@/utils/server/course-api";
import {
  getQcms,
  getQcm,
  createQcm,
  updateQcm,
  deleteQcm,
} from "@/utils/server/qcm-api";
import {
  getQcmAnswers,
  createQcmAnswer,
  updateQcmAnswer,
  deleteQcmAnswer,
} from "@/utils/server/qcmAnswer-api";
import {
  getTds,
  getTd,
  createTd,
  updateTd,
  deleteTd,
} from "@/utils/server/td-api";
import {
  getTps,
  getTp,
  createTp,
  updateTp,
  deleteTp,
} from "@/utils/server/tp-api";

import styles from "./teacher.module.css";
import {
  Year,
  Semester,
  Subject,
  Course,
  Qcm,
  QcmAnswer,
  Td,
  Tp,
  CreateYear,
  CreateSemester,
  CreateSubject,
  CreateCourse,
  CreateQcm,
  CreateQcmAnswer,
  CreateTd,
  CreateTp,
} from "@/utils/types/allTypes";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type EntityType =
  | "year"
  | "semester"
  | "subject"
  | "course"
  | "td"
  | "tp"
  | "qcm"
  | "answer";

type AnswerDraft = CreateQcmAnswer & { _key: string };

type ViewMode =
  | "years"
  | "year-detail"
  | "subject-detail"
  | "container-detail"
  | "qcm-detail";

/* ------------------------------------------------------------------ */
/* API map                                                             */
/* ------------------------------------------------------------------ */

const API_MAP = {
  year: { create: createYear, update: updateYear, remove: deleteYear },
  semester: {
    create: createSemester,
    update: updateSemester,
    remove: deleteSemester,
  },
  subject: {
    create: createSubject,
    update: updateSubject,
    remove: deleteSubject,
  },
  course: { create: createCourse, update: updateCourse, remove: deleteCourse },
  td: { create: createTd, update: updateTd, remove: deleteTd },
  tp: { create: createTp, update: updateTp, remove: deleteTp },
  qcm: { create: createQcm, update: updateQcm, remove: deleteQcm },
  answer: {
    create: createQcmAnswer,
    update: updateQcmAnswer,
    remove: deleteQcmAnswer,
  },
} as const;

/* ------------------------------------------------------------------ */
/* Response normalizers                                                */
/* ------------------------------------------------------------------ */

const toArray = <T,>(v: any): T[] => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    if (Array.isArray(v.data)) return v.data;
    if (Array.isArray(v.items)) return v.items;
    if (Array.isArray(v.results)) return v.results;
    if (Array.isArray(v.rows)) return v.rows;
    if (Array.isArray(v.tds)) return v.tds;
    if (Array.isArray(v.tps)) return v.tps;
    if (Array.isArray(v.years)) return v.years;
    if (Array.isArray(v.semesters)) return v.semesters;
    if (Array.isArray(v.subjects)) return v.subjects;
    if (Array.isArray(v.courses)) return v.courses;
    if (Array.isArray(v.qcms)) return v.qcms;
    if (Array.isArray(v.answers)) return v.answers;
  }
  return [];
};

const unwrapEntity = <T,>(v: any): T | null => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  if ("id" in v || "name" in v || "number" in v || "question" in v)
    return v as T;
  if (v.data && typeof v.data === "object" && !Array.isArray(v.data)) {
    return v.data as T;
  }
  return v as T;
};

/* ------------------------------------------------------------------ */
/* ID resolution helpers (defensive – fix broken counters)             */
/* ------------------------------------------------------------------ */

const subjectYearId = (s: Subject): number | undefined =>
  s.yearId ?? (s as any).year?.id;
const semesterYearId = (s: Semester): number | undefined =>
  s.yearId ?? (s as any).year?.id;
const courseSubjectId = (c: Course): number | undefined =>
  c.subjectId ?? (c as any).subject?.id;
const courseSemesterId = (c: Course): number | undefined =>
  c.semesterId ?? (c as any).semester?.id;
const qcmCourseId = (q: Qcm): number | undefined =>
  q.courseId ?? (q as any).course?.id;
const qcmTdId = (q: Qcm): number | undefined => q.tdId ?? (q as any).td?.id;
const qcmTpId = (q: Qcm): number | undefined => q.tpId ?? (q as any).tp?.id;
const answerQcmId = (a: QcmAnswer): number | undefined =>
  a.qcmId ?? (a as any).qcm?.id;
const tdSubjectId = (td: Td): number | undefined =>
  td.subjectId ?? (td as any).subject?.id;
const tpSubjectId = (tp: Tp): number | undefined =>
  tp.subjectId ?? (tp as any).subject?.id;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function TeacherPageComponent() {
  const t = useTranslations("teacher");

  /* ---------- Navigation ---------- */
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTd, setSelectedTd] = useState<Td | null>(null);
  const [selectedTp, setSelectedTp] = useState<Tp | null>(null);
  const [selectedQcm, setSelectedQcm] = useState<Qcm | null>(null);

  /* ---------- Detail state ---------- */
  const [yearDetail, setYearDetail] = useState<Year | null>(null);
  const [subjectDetail, setSubjectDetail] = useState<Subject | null>(null);
  const [courseDetail, setCourseDetail] = useState<Course | null>(null);
  const [tdDetail, setTdDetail] = useState<Td | null>(null);
  const [tpDetail, setTpDetail] = useState<Tp | null>(null);
  const [qcmDetail, setQcmDetail] = useState<Qcm | null>(null);

  const [loadingYear, setLoadingYear] = useState(false);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingTd, setLoadingTd] = useState(false);
  const [loadingTp, setLoadingTp] = useState(false);
  const [loadingQcm, setLoadingQcm] = useState(false);

  /* ---------- Flat data ---------- */
  const [years, setYears] = useState<Year[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tds, setTds] = useState<Td[]>([]);
  const [tps, setTps] = useState<Tp[]>([]);
  const [qcms, setQcms] = useState<Qcm[]>([]);
  const [answers, setAnswers] = useState<QcmAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- Modal / form ---------- */
  const [modalType, setModalType] = useState<EntityType | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [answerDrafts, setAnswerDrafts] = useState<AnswerDraft[]>([]);
  const [saving, setSaving] = useState(false);

  /* ---------- Delete / toast ---------- */
  const [confirmDelete, setConfirmDelete] = useState<{
    type: EntityType;
    item: any;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  /* ---------- Fetch all flat lists ---------- */
  const fetchAll = useCallback(
    async (silent = false) => {
      silent ? setRefreshing(true) : setLoading(true);
      try {
        const [y, se, su, c, td, tp, q, a] = await Promise.all([
          getYears(),
          getSemesters(),
          getSubjects(),
          getCourses(),
          getTds(),
          getTps(),
          getQcms(),
          getQcmAnswers(),
        ]);
        if (y.status) setYears(toArray<Year>(y.response));
        if (se.status) setSemesters(toArray<Semester>(se.response));
        if (su.status) setSubjects(toArray<Subject>(su.response));
        if (c.status) setCourses(toArray<Course>(c.response));
        if (td.status) setTds(toArray<Td>(td.response));
        if (tp.status) setTps(toArray<Tp>(tp.response));
        if (q.status) setQcms(toArray<Qcm>(q.response));
        if (a.status) setAnswers(toArray<QcmAnswer>(a.response));
      } catch {
        showToast("error", t("error.generic"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast, t],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------- Detail fetchers ---------- */
  const refreshYearDetail = useCallback(
    async (id: number) => {
      setLoadingYear(true);
      try {
        const res = await getYear(id);
        if (res.status) setYearDetail(unwrapEntity<Year>(res.response));
        else showToast("error", res.message || t("error.generic"));
      } catch {
        showToast("error", t("error.generic"));
      } finally {
        setLoadingYear(false);
      }
    },
    [showToast, t],
  );

  const refreshSubjectDetail = useCallback(
    async (id: number) => {
      setLoadingSubject(true);
      try {
        const res = await getSubject(id);
        if (res.status) setSubjectDetail(unwrapEntity<Subject>(res.response));
        else showToast("error", res.message || t("error.generic"));
      } catch {
        showToast("error", t("error.generic"));
      } finally {
        setLoadingSubject(false);
      }
    },
    [showToast, t],
  );

  const refreshCourseDetail = useCallback(
    async (id: number) => {
      setLoadingCourse(true);
      try {
        const res = await getCourse(id);
        if (res.status) setCourseDetail(unwrapEntity<Course>(res.response));
        else showToast("error", res.message || t("error.generic"));
      } catch {
        showToast("error", t("error.generic"));
      } finally {
        setLoadingCourse(false);
      }
    },
    [showToast, t],
  );

  const refreshTdDetail = useCallback(
    async (id: number) => {
      setLoadingTd(true);
      try {
        const res = await getTd(id);
        if (res.status) setTdDetail(unwrapEntity<Td>(res.response));
        else showToast("error", res.message || t("error.generic"));
      } catch {
        showToast("error", t("error.generic"));
      } finally {
        setLoadingTd(false);
      }
    },
    [showToast, t],
  );

  const refreshTpDetail = useCallback(
    async (id: number) => {
      setLoadingTp(true);
      try {
        const res = await getTp(id);
        if (res.status) setTpDetail(unwrapEntity<Tp>(res.response));
        else showToast("error", res.message || t("error.generic"));
      } catch {
        showToast("error", t("error.generic"));
      } finally {
        setLoadingTp(false);
      }
    },
    [showToast, t],
  );

  const refreshQcmDetail = useCallback(
    async (id: number) => {
      setLoadingQcm(true);
      try {
        const res = await getQcm(id);
        if (res.status) setQcmDetail(unwrapEntity<Qcm>(res.response));
        else showToast("error", res.message || t("error.generic"));
      } catch {
        showToast("error", t("error.generic"));
      } finally {
        setLoadingQcm(false);
      }
    },
    [showToast, t],
  );

  /* ---------- Refresh everything currently loaded ---------- */
  const refreshLoadedDetails = useCallback(async () => {
    await fetchAll(true);
    if (selectedYear) await refreshYearDetail(selectedYear.id);
    if (selectedSubject) await refreshSubjectDetail(selectedSubject.id);
    if (selectedCourse) await refreshCourseDetail(selectedCourse.id);
    if (selectedTd) await refreshTdDetail(selectedTd.id);
    if (selectedTp) await refreshTpDetail(selectedTp.id);
    if (selectedQcm) await refreshQcmDetail(selectedQcm.id);
  }, [
    fetchAll,
    selectedYear,
    selectedSubject,
    selectedCourse,
    selectedTd,
    selectedTp,
    selectedQcm,
    refreshYearDetail,
    refreshSubjectDetail,
    refreshCourseDetail,
    refreshTdDetail,
    refreshTpDetail,
    refreshQcmDetail,
  ]);

  /* ---------- Open helpers ---------- */
  const clearContainers = () => {
    setSelectedCourse(null);
    setSelectedTd(null);
    setSelectedTp(null);
    setSelectedQcm(null);
    setCourseDetail(null);
    setTdDetail(null);
    setTpDetail(null);
    setQcmDetail(null);
  };

  const openYear = useCallback(
    async (year: Year) => {
      setSelectedYear(year);
      setSelectedSubject(null);
      clearContainers();
      setYearDetail(null);
      setSubjectDetail(null);
      await refreshYearDetail(year.id);
    },
    [refreshYearDetail],
  );

  const openSubject = useCallback(
    async (subject: Subject) => {
      setSelectedSubject(subject);
      clearContainers();
      setSubjectDetail(null);
      await refreshSubjectDetail(subject.id);
    },
    [refreshSubjectDetail],
  );

  const openCourse = useCallback(
    async (course: Course) => {
      setSelectedTd(null);
      setSelectedTp(null);
      setSelectedQcm(null);
      setCourseDetail(null);
      setTdDetail(null);
      setTpDetail(null);
      setQcmDetail(null);
      setSelectedCourse(course);
      await refreshCourseDetail(course.id);
    },
    [refreshCourseDetail],
  );

  const openTd = useCallback(
    async (td: Td) => {
      setSelectedCourse(null);
      setSelectedTp(null);
      setSelectedQcm(null);
      setCourseDetail(null);
      setTdDetail(null);
      setTpDetail(null);
      setQcmDetail(null);
      setSelectedTd(td);
      await refreshTdDetail(td.id);
    },
    [refreshTdDetail],
  );

  const openTp = useCallback(
    async (tp: Tp) => {
      setSelectedCourse(null);
      setSelectedTd(null);
      setSelectedQcm(null);
      setCourseDetail(null);
      setTdDetail(null);
      setTpDetail(null);
      setQcmDetail(null);
      setSelectedTp(tp);
      await refreshTpDetail(tp.id);
    },
    [refreshTpDetail],
  );

  const openQcm = useCallback(
    async (qcm: Qcm) => {
      setSelectedQcm(qcm);
      setQcmDetail(null);
      await refreshQcmDetail(qcm.id);
    },
    [refreshQcmDetail],
  );

  /* ---------- Esc key ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!saving && modalType) setModalType(null);
        else if (!deleting && confirmDelete) setConfirmDelete(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalType, confirmDelete, saving, deleting]);

  /* ---------- Derived lists from detail responses (guarded) ---------- */
  const yearSemesters = useMemo<Semester[]>(
    () => (Array.isArray(yearDetail?.semesters) ? yearDetail!.semesters! : []),
    [yearDetail],
  );
  const yearSubjects = useMemo<Subject[]>(
    () => (Array.isArray(yearDetail?.subjects) ? yearDetail!.subjects! : []),
    [yearDetail],
  );
  const subjectCourses = useMemo<Course[]>(
    () =>
      Array.isArray(subjectDetail?.courses) ? subjectDetail!.courses! : [],
    [subjectDetail],
  );
  const subjectTds = useMemo<Td[]>(
    () =>
      Array.isArray((subjectDetail as any)?.tds)
        ? (subjectDetail as any).tds
        : [],
    [subjectDetail],
  );
  const subjectTps = useMemo<Tp[]>(
    () =>
      Array.isArray((subjectDetail as any)?.tps)
        ? (subjectDetail as any).tps
        : [],
    [subjectDetail],
  );
  const courseQcms = useMemo<Qcm[]>(
    () => (Array.isArray(courseDetail?.qcms) ? courseDetail!.qcms! : []),
    [courseDetail],
  );
  const tdQcms = useMemo<Qcm[]>(
    () =>
      Array.isArray((tdDetail as any)?.qcms) ? (tdDetail as any).qcms : [],
    [tdDetail],
  );
  const tpQcms = useMemo<Qcm[]>(
    () =>
      Array.isArray((tpDetail as any)?.qcms) ? (tpDetail as any).qcms : [],
    [tpDetail],
  );
  const qcmAnswers = useMemo<QcmAnswer[]>(
    () => (Array.isArray(qcmDetail?.answers) ? qcmDetail!.answers! : []),
    [qcmDetail],
  );

  /* ---------- Active container (course / td / tp) ---------- */
  const activeContainer = useMemo(() => {
    if (selectedCourse)
      return {
        type: "course" as const,
        item: selectedCourse,
        detail: courseDetail,
        qcms: courseQcms,
        loading: loadingCourse,
      };
    if (selectedTd)
      return {
        type: "td" as const,
        item: selectedTd,
        detail: tdDetail,
        qcms: tdQcms,
        loading: loadingTd,
      };
    if (selectedTp)
      return {
        type: "tp" as const,
        item: selectedTp,
        detail: tpDetail,
        qcms: tpQcms,
        loading: loadingTp,
      };
    return null;
  }, [
    selectedCourse,
    selectedTd,
    selectedTp,
    courseDetail,
    tdDetail,
    tpDetail,
    courseQcms,
    tdQcms,
    tpQcms,
    loadingCourse,
    loadingTd,
    loadingTp,
  ]);

  /* ---------- Open modal ---------- */
  const openCreate = (type: EntityType) => {
    // Prevent QCM creation if no container is selected
    if (type === "qcm" && !selectedCourse && !selectedTd && !selectedTp) {
      showToast("error", "Please select a course, TD, or TP first");
      return;
    }

    setEditing(null);
    setModalType(type);
    const initial: Record<string, any> = {};
    switch (type) {
      case "year":
        initial.name = "";
        break;
      case "semester":
        initial.number = 1;
        break;
      case "subject":
        initial.name = "";
        break;
      case "course":
        initial.name = "";
        initial.semesterId = yearSemesters[0]?.id ?? "";
        break;
      case "td":
      case "tp":
        initial.name = "";
        break;
      case "qcm":
        initial.question = "";
        break;
      case "answer":
        initial.answer = "";
        initial.isCorrect = false;
        initial.explanation = "";
        break;
    }
    setFormState(initial);
    if (type === "qcm" && !editing) {
      setAnswerDrafts([
        {
          _key: `ans-${Date.now()}-1`,
          answer: "",
          isCorrect: true,
          explanation: "",
        },
        {
          _key: `ans-${Date.now()}-2`,
          answer: "",
          isCorrect: false,
          explanation: "",
        },
      ]);
    } else {
      setAnswerDrafts([]);
    }
  };

  const openEdit = (type: EntityType, item: any) => {
    setEditing(item);
    setModalType(type);
    const initial: Record<string, any> = {};
    switch (type) {
      case "year":
      case "subject":
      case "td":
      case "tp":
        initial.name = item.name ?? "";
        break;
      case "semester":
        initial.number = item.number ?? "";
        break;
      case "course":
        initial.name = item.name ?? "";
        initial.semesterId = item.semesterId ?? (item as any).semester?.id;
        break;
      case "qcm":
        initial.question = item.question ?? "";
        break;
      case "answer":
        initial.answer = item.answer ?? "";
        initial.isCorrect = Boolean(item.isCorrect);
        initial.explanation = item.explanation ?? "";
        break;
    }
    setFormState(initial);
    setAnswerDrafts([]);
  };

  /* ---------- QCM answer drafts ---------- */
  const addAnswerDraft = () =>
    setAnswerDrafts((prev) => [
      ...prev,
      {
        _key: `ans-${Date.now()}-${prev.length}`,
        answer: "",
        isCorrect: false,
        explanation: "",
      },
    ]);

  const removeAnswerDraft = (key: string) =>
    setAnswerDrafts((prev) => prev.filter((a) => a._key !== key));

  const updateAnswerDraft = (key: string, patch: Partial<AnswerDraft>) =>
    setAnswerDrafts((prev) =>
      prev.map((a) => (a._key === key ? { ...a, ...patch } : a)),
    );

  /* ---------- Build payload ---------- */
  const buildPayload = (type: EntityType): any => {
    switch (type) {
      case "year":
        return { name: formState.name.trim() } satisfies CreateYear;
      case "semester":
        return {
          number: Number(formState.number),
          yearId: selectedYear!.id,
        } satisfies CreateSemester;
      case "subject":
        return {
          name: formState.name.trim(),
          yearId: selectedYear!.id,
        } satisfies CreateSubject;
      case "course":
        return {
          name: formState.name.trim(),
          subjectId: selectedSubject!.id,
          semesterId: Number(formState.semesterId),
        } satisfies CreateCourse;
      case "td":
        return {
          name: formState.name.trim(),
          subjectId: selectedSubject!.id,
        } satisfies CreateTd;
      case "tp":
        return {
          name: formState.name.trim(),
          subjectId: selectedSubject!.id,
        } satisfies CreateTp;
      case "qcm": {
        const cleanAnswers = answerDrafts
          .filter((a) => a.answer.trim())
          .map(({ _key, ...rest }) => ({
            ...rest,
            answer: rest.answer.trim(),
            explanation: rest.explanation?.trim() || undefined,
          }));
        const payload: any = {
          question: formState.question.trim(),
          answers: cleanAnswers,
        };
        if (selectedCourse) payload.courseId = Number(selectedCourse.id);
        if (selectedTd) payload.tdId = Number(selectedTd.id);
        if (selectedTp) payload.tpId = Number(selectedTp.id);
        return payload;
      }
      case "answer":
        return {
          answer: formState.answer.trim(),
          isCorrect: Boolean(formState.isCorrect),
          explanation: formState.explanation?.trim() || undefined,
          qcmId: selectedQcm!.id,
        };
    }
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;

    if (modalType === "qcm" && !editing) {
      const valid = answerDrafts.filter((a) => a.answer.trim());
      if (valid.length < 2) {
        showToast("error", t("error.minAnswers"));
        return;
      }
      if (!valid.some((a) => a.isCorrect)) {
        showToast("error", t("error.needCorrect"));
        return;
      }
      if (!selectedCourse && !selectedTd && !selectedTp) {
        showToast("error", "Please select a course, TD, or TP first");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = buildPayload(modalType);
      const api = API_MAP[modalType];
      const res = editing
        ? await (api.update as any)(editing.id, payload)
        : await (api.create as any)(payload);

      if (res.status) {
        showToast(
          "success",
          editing ? t("success.updated") : t("success.created"),
        );
        setModalType(null);
        setEditing(null);
        setAnswerDrafts([]);
        await refreshLoadedDetails();
      } else {
        showToast("error", res.message || t("error.saveFailed"));
      }
    } catch {
      showToast("error", t("error.generic"));
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await (API_MAP[confirmDelete.type].remove as any)(
        confirmDelete.item.id,
      );
      if (res.status) {
        showToast("success", t("success.deleted"));
        setConfirmDelete(null);
        await refreshLoadedDetails();
      } else {
        showToast("error", res.message || t("error.deleteFailed"));
      }
    } catch {
      showToast("error", t("error.generic"));
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- Nav helpers ---------- */
  const goHome = () => {
    setSelectedYear(null);
    setSelectedSubject(null);
    setYearDetail(null);
    setSubjectDetail(null);
    clearContainers();
  };
  const goToYear = () => {
    setSelectedSubject(null);
    setSubjectDetail(null);
    clearContainers();
  };
  const goToSubject = () => {
    clearContainers();
  };
  const goToContainer = () => {
    setSelectedQcm(null);
    setQcmDetail(null);
  };

  /* ---------- View mode ---------- */
  const viewMode: ViewMode = !selectedYear
    ? "years"
    : !selectedSubject
      ? "year-detail"
      : !activeContainer
        ? "subject-detail"
        : !selectedQcm
          ? "container-detail"
          : "qcm-detail";

  /* ---------- Breadcrumbs ---------- */
  const breadcrumbs = useMemo(() => {
    const list: { label: string; onClick: () => void; active: boolean }[] = [
      { label: t("breadcrumb.home"), onClick: goHome, active: !selectedYear },
    ];
    if (selectedYear)
      list.push({
        label: selectedYear.name,
        onClick: goToYear,
        active: !selectedSubject,
      });
    if (selectedSubject)
      list.push({
        label: selectedSubject.name,
        onClick: goToSubject,
        active: !activeContainer,
      });
    if (activeContainer) {
      const label =
        activeContainer.type === "course"
          ? (activeContainer.item as Course).name
          : activeContainer.type === "td"
            ? (activeContainer.item as Td).name
            : (activeContainer.item as Tp).name;
      list.push({
        label,
        onClick: goToContainer,
        active: !selectedQcm,
      });
    }
    if (selectedQcm)
      list.push({
        label:
          selectedQcm.question.length > 30
            ? selectedQcm.question.slice(0, 30) + "…"
            : selectedQcm.question,
        onClick: () => {},
        active: true,
      });
    return list;
  }, [selectedYear, selectedSubject, selectedQcm, activeContainer, t]);

  /* ---------- Card actions ---------- */
  const renderActions = (type: EntityType, item: any, label: string) => (
    <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          openEdit(type, item);
        }}
        className={styles.iconButton}
        aria-label={t("actions.edit")}
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirmDelete({ type, item, label });
        }}
        className={`${styles.iconButton} ${styles.danger}`}
        aria-label={t("actions.delete")}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div className={styles.page}>
      <div className={styles.bgDecoration} aria-hidden />

      <div className={styles.wrapper}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{t("title")}</h1>
            <p className={styles.pageSubtitle}>{t("subtitle")}</p>
          </div>
          <button
            onClick={refreshLoadedDetails}
            className={styles.iconButton}
            aria-label={t("refresh")}
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? styles.spinning : ""}
            />
          </button>
        </header>

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="breadcrumb">
          {breadcrumbs.map((b, i) => (
            <div key={i} className={styles.breadcrumbItem}>
              {i > 0 && (
                <ChevronRight size={15} className={styles.breadcrumbSep} />
              )}
              <button
                onClick={b.onClick}
                className={`${styles.breadcrumbButton} ${
                  b.active ? styles.breadcrumbActive : ""
                }`}
                disabled={b.active}
              >
                {i === 0 && <Home size={13} />}
                <span>{b.label}</span>
              </button>
            </div>
          ))}
        </nav>

        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinning} size={32} />
            <span>{t("loading")}</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ========== YEARS ========== */}
            {viewMode === "years" && (
              <motion.section
                key="years"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SectionHeader
                  title={t("tabs.years")}
                  count={years.length}
                  onCreate={() => openCreate("year")}
                  createLabel={t("actions.create.years")}
                />
                {years.length === 0 ? (
                  <EmptyState
                    icon={<Layers size={52} />}
                    title={t("empty.title")}
                    description={t("empty.yearsHint")}
                    action={
                      <button
                        onClick={() => openCreate("year")}
                        className={styles.primaryButton}
                      >
                        <Plus size={16} />
                        <span>{t("actions.create.years")}</span>
                      </button>
                    }
                  />
                ) : (
                  <ul className={styles.grid}>
                    {years.map((y) => (
                      <motion.li
                        key={y.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`${styles.card} ${styles.clickable}`}
                        onClick={() => openYear(y)}
                      >
                        <div className={styles.cardBody}>
                          <div className={styles.cardIcon}>
                            <Calendar size={20} />
                          </div>
                          <div className={styles.cardText}>
                            <h3 className={styles.cardTitle}>{y.name}</h3>
                          </div>
                        </div>
                        <div className={styles.cardRight}>
                          {renderActions("year", y, y.name)}
                          <ChevronRight size={18} className={styles.chevron} />
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.section>
            )}

            {/* ========== YEAR DETAIL ========== */}
            {viewMode === "year-detail" && selectedYear && (
              <motion.section
                key={`year-${selectedYear.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {loadingYear ? (
                  <div className={styles.loadingState}>
                    <Loader2 className={styles.spinning} size={32} />
                    <span>{t("loading")}</span>
                  </div>
                ) : (
                  <div className={styles.twoColumn}>
                    {/* Semesters */}
                    <div className={styles.column}>
                      <SectionHeader
                        title={t("tabs.semesters")}
                        count={yearSemesters.length}
                        onCreate={() => openCreate("semester")}
                        createLabel={t("actions.create.semesters")}
                        small
                      />
                      {yearSemesters.length === 0 ? (
                        <EmptyState
                          icon={<Calendar size={32} />}
                          title={t("empty.title")}
                          description={t("empty.semestersHint")}
                          small
                        />
                      ) : (
                        <ul className={styles.list}>
                          {yearSemesters
                            .slice()
                            .sort((a, b) => Number(a.number) - Number(b.number))
                            .map((s) => (
                              <motion.li
                                key={s.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={styles.listItem}
                              >
                                <div className={styles.listItemBody}>
                                  <div className={styles.listItemIcon}>
                                    <Calendar size={16} />
                                  </div>
                                  <div>
                                    <h4 className={styles.listItemTitle}>
                                      {t("labels.semester")} {s.number}
                                    </h4>
                                  </div>
                                </div>
                                {renderActions(
                                  "semester",
                                  s,
                                  `${t("labels.semester")} ${s.number}`,
                                )}
                              </motion.li>
                            ))}
                        </ul>
                      )}
                    </div>

                    {/* Subjects */}
                    <div className={styles.column}>
                      <SectionHeader
                        title={t("tabs.subjects")}
                        count={yearSubjects.length}
                        onCreate={() => openCreate("subject")}
                        createLabel={t("actions.create.subjects")}
                        small
                      />
                      {yearSubjects.length === 0 ? (
                        <EmptyState
                          icon={<BookOpen size={32} />}
                          title={t("empty.title")}
                          description={t("empty.subjectsHint")}
                          small
                        />
                      ) : (
                        <ul className={styles.list}>
                          {yearSubjects.map((s) => (
                            <motion.li
                              key={s.id}
                              layout
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`${styles.listItem} ${styles.clickable}`}
                              onClick={() => openSubject(s)}
                            >
                              <div className={styles.listItemBody}>
                                <div className={styles.listItemIcon}>
                                  <BookOpen size={16} />
                                </div>
                                <div>
                                  <h4 className={styles.listItemTitle}>
                                    {s.name}
                                  </h4>
                                </div>
                              </div>
                              <div className={styles.listItemRight}>
                                {renderActions("subject", s, s.name)}
                                <ChevronRight
                                  size={16}
                                  className={styles.chevron}
                                />
                              </div>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* ========== SUBJECT DETAIL ========== */}
            {viewMode === "subject-detail" && selectedSubject && (
              <motion.section
                key={`subject-${selectedSubject.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {loadingSubject ? (
                  <div className={styles.loadingState}>
                    <Loader2 className={styles.spinning} size={32} />
                    <span>{t("loading")}</span>
                  </div>
                ) : (
                  <div className={styles.stackedSections}>
                    {/* Courses */}
                    <div>
                      <SectionHeader
                        title={t("tabs.courses")}
                        count={subjectCourses.length}
                        onCreate={() => openCreate("course")}
                        createLabel={t("actions.create.courses")}
                        disabled={yearSemesters.length === 0}
                        disabledHint={t("hints.needSemesterFirst")}
                      />
                      {subjectCourses.length === 0 ? (
                        <EmptyState
                          icon={<GraduationCap size={36} />}
                          title={t("empty.title")}
                          description={
                            yearSemesters.length === 0
                              ? t("hints.needSemesterFirst")
                              : t("empty.coursesHint")
                          }
                          small
                        />
                      ) : (
                        <div className={styles.groupList}>
                          {yearSemesters
                            .slice()
                            .sort((a, b) => Number(a.number) - Number(b.number))
                            .map((sem) => {
                              const semCourses = subjectCourses.filter(
                                (c) => courseSemesterId(c) === sem.id,
                              );
                              if (semCourses.length === 0) return null;
                              return (
                                <div key={sem.id} className={styles.group}>
                                  <h3 className={styles.groupTitle}>
                                    <Calendar size={16} />
                                    {t("labels.semester")} {sem.number}
                                  </h3>
                                  <ul className={styles.list}>
                                    {semCourses.map((c) => (
                                      <motion.li
                                        key={c.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`${styles.listItem} ${styles.clickable}`}
                                        onClick={() => openCourse(c)}
                                      >
                                        <div className={styles.listItemBody}>
                                          <div className={styles.listItemIcon}>
                                            <GraduationCap size={16} />
                                          </div>
                                          <div>
                                            <h4
                                              className={styles.listItemTitle}
                                            >
                                              {c.name}
                                            </h4>
                                          </div>
                                        </div>
                                        <div className={styles.listItemRight}>
                                          {renderActions("course", c, c.name)}
                                          <ChevronRight
                                            size={16}
                                            className={styles.chevron}
                                          />
                                        </div>
                                      </motion.li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}

                          {subjectCourses.some((c) => !courseSemesterId(c)) && (
                            <div className={styles.group}>
                              <h3 className={styles.groupTitle}>
                                <Info size={16} />
                                {t("labels.unassigned")}
                              </h3>
                              <ul className={styles.list}>
                                {subjectCourses
                                  .filter((c) => !courseSemesterId(c))
                                  .map((c) => (
                                    <motion.li
                                      key={c.id}
                                      layout
                                      initial={{ opacity: 0, y: 15 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className={`${styles.listItem} ${styles.clickable}`}
                                      onClick={() => openCourse(c)}
                                    >
                                      <div className={styles.listItemBody}>
                                        <div className={styles.listItemIcon}>
                                          <GraduationCap size={16} />
                                        </div>
                                        <div>
                                          <h4 className={styles.listItemTitle}>
                                            {c.name}
                                          </h4>
                                        </div>
                                      </div>
                                      <div className={styles.listItemRight}>
                                        {renderActions("course", c, c.name)}
                                        <ChevronRight
                                          size={16}
                                          className={styles.chevron}
                                        />
                                      </div>
                                    </motion.li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* TDs */}
                    <div>
                      <SectionHeader
                        title={t("tabs.tds")}
                        count={subjectTds.length}
                        onCreate={() => openCreate("td")}
                        createLabel={t("actions.create.tds")}
                      />
                      {subjectTds.length === 0 ? (
                        <EmptyState
                          icon={<FlaskConical size={36} />}
                          title={t("empty.title")}
                          description={t("empty.tdsHint")}
                          small
                        />
                      ) : (
                        <ul className={styles.list}>
                          {subjectTds.map((td) => (
                            <motion.li
                              key={td.id}
                              layout
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`${styles.listItem} ${styles.clickable}`}
                              onClick={() => openTd(td)}
                            >
                              <div className={styles.listItemBody}>
                                <div className={styles.listItemIcon}>
                                  <FlaskConical size={16} />
                                </div>
                                <div>
                                  <h4 className={styles.listItemTitle}>
                                    {td.name}
                                  </h4>
                                </div>
                              </div>
                              <div className={styles.listItemRight}>
                                {renderActions("td", td, td.name)}
                                <ChevronRight
                                  size={16}
                                  className={styles.chevron}
                                />
                              </div>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* TPs */}
                    <div>
                      <SectionHeader
                        title={t("tabs.tps")}
                        count={subjectTps.length}
                        onCreate={() => openCreate("tp")}
                        createLabel={t("actions.create.tps")}
                      />
                      {subjectTps.length === 0 ? (
                        <EmptyState
                          icon={<Beaker size={36} />}
                          title={t("empty.title")}
                          description={t("empty.tpsHint")}
                          small
                        />
                      ) : (
                        <ul className={styles.list}>
                          {subjectTps.map((tp) => (
                            <motion.li
                              key={tp.id}
                              layout
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`${styles.listItem} ${styles.clickable}`}
                              onClick={() => openTp(tp)}
                            >
                              <div className={styles.listItemBody}>
                                <div className={styles.listItemIcon}>
                                  <Beaker size={16} />
                                </div>
                                <div>
                                  <h4 className={styles.listItemTitle}>
                                    {tp.name}
                                  </h4>
                                </div>
                              </div>
                              <div className={styles.listItemRight}>
                                {renderActions("tp", tp, tp.name)}
                                <ChevronRight
                                  size={16}
                                  className={styles.chevron}
                                />
                              </div>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* ========== CONTAINER DETAIL (QCMs of course / td / tp) ========== */}
            {viewMode === "container-detail" && activeContainer && (
              <motion.section
                key={`container-${activeContainer.type}-${(activeContainer.item as any).id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeContainer.loading ? (
                  <div className={styles.loadingState}>
                    <Loader2 className={styles.spinning} size={32} />
                    <span>{t("loading")}</span>
                  </div>
                ) : (
                  <>
                    <SectionHeader
                      title={t("tabs.qcms")}
                      count={activeContainer.qcms.length}
                      onCreate={() => openCreate("qcm")}
                      createLabel={t("actions.create.qcms")}
                      disabled={!activeContainer}
                      disabledHint="Select a course, TD, or TP first"
                    />
                    {activeContainer.qcms.length === 0 ? (
                      <EmptyState
                        icon={<FileText size={52} />}
                        title={t("empty.title")}
                        description={
                          !activeContainer
                            ? "Select a course, TD, or TP first"
                            : t("empty.qcmsHint")
                        }
                        action={
                          <button
                            onClick={() => openCreate("qcm")}
                            className={styles.primaryButton}
                            disabled={!activeContainer}
                          >
                            <Plus size={16} />
                            <span>{t("actions.create.qcms")}</span>
                          </button>
                        }
                      />
                    ) : (
                      <ul className={styles.list}>
                        {activeContainer.qcms.map((q) => {
                          return (
                            <motion.li
                              key={q.id}
                              layout
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`${styles.listItem} ${styles.clickable}`}
                              onClick={() => openQcm(q)}
                            >
                              <div className={styles.listItemBody}>
                                <div className={styles.listItemIcon}>
                                  <FileText size={16} />
                                </div>
                                <div>
                                  <h4 className={styles.listItemTitle}>
                                    {q.question}
                                  </h4>
                                </div>
                              </div>
                              <div className={styles.listItemRight}>
                                {renderActions(
                                  "qcm",
                                  q,
                                  q.question.slice(0, 60),
                                )}
                                <ChevronRight
                                  size={16}
                                  className={styles.chevron}
                                />
                              </div>
                            </motion.li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </motion.section>
            )}

            {/* ========== QCM DETAIL (Answers) ========== */}
            {viewMode === "qcm-detail" && selectedQcm && (
              <motion.section
                key={`qcm-${selectedQcm.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {loadingQcm ? (
                  <div className={styles.loadingState}>
                    <Loader2 className={styles.spinning} size={32} />
                    <span>{t("loading")}</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.questionBanner}>
                      <div className={styles.questionBannerIcon}>
                        <Award size={20} />
                      </div>
                      <p className={styles.questionBannerText}>
                        {selectedQcm.question}
                      </p>
                    </div>

                    <SectionHeader
                      title={t("tabs.qcmAnswers")}
                      count={qcmAnswers.length}
                      onCreate={() => openCreate("answer")}
                      createLabel={t("actions.create.qcmAnswers")}
                    />
                    {qcmAnswers.length === 0 ? (
                      <EmptyState
                        icon={<ListChecks size={52} />}
                        title={t("empty.title")}
                        description={t("empty.answersHint")}
                        action={
                          <button
                            onClick={() => openCreate("answer")}
                            className={styles.primaryButton}
                          >
                            <Plus size={16} />
                            <span>{t("actions.create.qcmAnswers")}</span>
                          </button>
                        }
                      />
                    ) : (
                      <ul className={styles.list}>
                        {qcmAnswers.map((a) => (
                          <motion.li
                            key={a.id}
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={styles.listItem}
                          >
                            <div className={styles.listItemBody}>
                              <div
                                className={`${styles.listItemIcon} ${
                                  a.isCorrect
                                    ? styles.iconCorrect
                                    : styles.iconIncorrect
                                }`}
                              >
                                {a.isCorrect ? (
                                  <CheckCircle2 size={16} />
                                ) : (
                                  <X size={16} />
                                )}
                              </div>
                              <div>
                                <h4 className={styles.listItemTitle}>
                                  {a.answer}
                                </h4>
                                {a.explanation && (
                                  <p className={styles.listItemSubtitle}>
                                    {a.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className={styles.listItemRight}>
                              <span
                                className={
                                  a.isCorrect
                                    ? styles.badgeCorrect
                                    : styles.badgeIncorrect
                                }
                              >
                                {a.isCorrect
                                  ? t("labels.correct")
                                  : t("labels.incorrect")}
                              </span>
                              {renderActions("answer", a, a.answer)}
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ==================== Modal: create/edit ==================== */}
      <AnimatePresence>
        {modalType && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setModalType(null)}
          >
            <motion.div
              className={`${styles.modal} ${
                modalType === "qcm" && !editing ? styles.modalWide : ""
              }`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editing
                    ? t(`actions.editEntity.${modalType}`)
                    : t(
                        `actions.create.${
                          modalType === "answer"
                            ? "qcmAnswers"
                            : modalType === "td"
                              ? "tds"
                              : modalType === "tp"
                                ? "tps"
                                : modalType + "s"
                        }`,
                      )}
                </h2>
                <button
                  onClick={() => !saving && setModalType(null)}
                  className={styles.iconButton}
                  aria-label={t("actions.close")}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                {modalType === "year" && (
                  <TextField
                    label={t("fields.name")}
                    value={formState.name ?? ""}
                    onChange={(v) => setFormState({ ...formState, name: v })}
                    required
                  />
                )}

                {modalType === "semester" && (
                  <TextField
                    label={t("fields.number")}
                    value={formState.number ?? ""}
                    onChange={(v) => setFormState({ ...formState, number: v })}
                    type="number"
                    required
                  />
                )}

                {modalType === "subject" && (
                  <TextField
                    label={t("fields.name")}
                    value={formState.name ?? ""}
                    onChange={(v) => setFormState({ ...formState, name: v })}
                    required
                  />
                )}

                {(modalType === "td" || modalType === "tp") && (
                  <TextField
                    label={t("fields.name")}
                    value={formState.name ?? ""}
                    onChange={(v) => setFormState({ ...formState, name: v })}
                    required
                  />
                )}

                {modalType === "course" && (
                  <>
                    <TextField
                      label={t("fields.name")}
                      value={formState.name ?? ""}
                      onChange={(v) => setFormState({ ...formState, name: v })}
                      required
                    />
                    <SelectField
                      label={t("fields.semester")}
                      value={formState.semesterId ?? ""}
                      onChange={(v) =>
                        setFormState({ ...formState, semesterId: v })
                      }
                      options={yearSemesters.map((s) => ({
                        value: s.id,
                        label: `${t("labels.semester")} ${s.number}`,
                      }))}
                      placeholder={t("selectPlaceholder")}
                      required
                    />
                  </>
                )}

                {modalType === "qcm" && (
                  <>
                    <TextField
                      label={t("fields.question")}
                      value={formState.question ?? ""}
                      onChange={(v) =>
                        setFormState({ ...formState, question: v })
                      }
                      textarea
                      required
                    />

                    {!editing && (
                      <div className={styles.answerBuilder}>
                        <div className={styles.answerBuilderHeader}>
                          <span className={styles.answerBuilderLabel}>
                            {t("qcm.answersLabel")}
                          </span>
                          <button
                            type="button"
                            onClick={addAnswerDraft}
                            className={styles.ghostButton}
                          >
                            <Plus size={14} />
                            {t("qcm.addAnswer")}
                          </button>
                        </div>

                        <AnimatePresence initial={false}>
                          {answerDrafts.map((draft, idx) => (
                            <motion.div
                              key={draft._key}
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className={styles.answerRow}
                            >
                              <div className={styles.answerRowTop}>
                                <span className={styles.answerRowIndex}>
                                  #{idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={draft.answer}
                                  onChange={(e) =>
                                    updateAnswerDraft(draft._key, {
                                      answer: e.target.value,
                                    })
                                  }
                                  placeholder={t("qcm.answerPlaceholder")}
                                  className={styles.input}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAnswerDraft(draft._key, {
                                      isCorrect: !draft.isCorrect,
                                    })
                                  }
                                  className={`${styles.toggleCorrect} ${
                                    draft.isCorrect
                                      ? styles.toggleCorrectOn
                                      : ""
                                  }`}
                                  aria-label={t("fields.isCorrect")}
                                  title={t("fields.isCorrect")}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeAnswerDraft(draft._key)}
                                  className={`${styles.iconButton} ${styles.danger}`}
                                  aria-label={t("actions.delete")}
                                  disabled={answerDrafts.length <= 2}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={draft.explanation ?? ""}
                                onChange={(e) =>
                                  updateAnswerDraft(draft._key, {
                                    explanation: e.target.value,
                                  })
                                }
                                placeholder={t("qcm.explanationPlaceholder")}
                                className={`${styles.input} ${styles.inputSmall}`}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </>
                )}

                {modalType === "answer" && (
                  <>
                    <TextField
                      label={t("fields.answer")}
                      value={formState.answer ?? ""}
                      onChange={(v) =>
                        setFormState({ ...formState, answer: v })
                      }
                      required
                    />
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={Boolean(formState.isCorrect)}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            isCorrect: e.target.checked,
                          })
                        }
                        className={styles.checkbox}
                      />
                      <span>{t("fields.isCorrect")}</span>
                    </label>
                    <TextField
                      label={t("fields.explanation")}
                      value={formState.explanation ?? ""}
                      onChange={(v) =>
                        setFormState({ ...formState, explanation: v })
                      }
                      textarea
                    />
                  </>
                )}

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => !saving && setModalType(null)}
                    className={styles.secondaryButton}
                    disabled={saving}
                  >
                    {t("actions.cancel")}
                  </button>
                  <motion.button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={saving}
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.98 }}
                  >
                    {saving ? (
                      <Loader2 className={styles.spinning} size={16} />
                    ) : (
                      <>
                        <Save size={16} />
                        <span>
                          {editing
                            ? t("actions.save")
                            : t("actions.createShort")}
                        </span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== Confirm delete ==================== */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setConfirmDelete(null)}
          >
            <motion.div
              className={styles.modalSmall}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmIcon}>
                <AlertCircle size={32} />
              </div>
              <h2 className={styles.confirmTitle}>
                {t("confirmDelete.title")}
              </h2>
              <p className={styles.confirmText}>
                {t("confirmDelete.message", { name: confirmDelete.label })}
              </p>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className={styles.secondaryButton}
                  disabled={deleting}
                >
                  {t("actions.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  className={styles.dangerButton}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className={styles.spinning} size={16} />
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>{t("actions.delete")}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== Toast ==================== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`${styles.toast} ${
              toast.type === "success" ? styles.toastSuccess : styles.toastError
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({
  title,
  count,
  onCreate,
  createLabel,
  small,
  disabled,
  disabledHint,
}: {
  title: string;
  count: number;
  onCreate: () => void;
  createLabel: string;
  small?: boolean;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <div
      className={`${styles.sectionHeader} ${small ? styles.sectionHeaderSmall : ""}`}
    >
      <div className={styles.sectionHeaderLeft}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <span className={styles.sectionCount}>{count}</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.25rem",
        }}
      >
        {disabled && disabledHint && (
          <span
            style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}
          >
            {disabledHint}
          </span>
        )}
        <button
          onClick={onCreate}
          className={styles.primaryButton}
          disabled={disabled}
          title={disabled ? disabledHint : undefined}
        >
          <Plus size={14} />
          <span>{createLabel}</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
  small,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div
      className={`${styles.emptyState} ${small ? styles.emptyStateSmall : ""}`}
    >
      <div className={styles.emptyIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <span className={styles.statPill}>
      {icon}
      <b>{value}</b>
      <span>{label}</span>
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  textarea,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  required?: boolean;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={3}
          className={styles.textarea}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={styles.input}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: { value: number | string; label: string }[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={styles.select}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
