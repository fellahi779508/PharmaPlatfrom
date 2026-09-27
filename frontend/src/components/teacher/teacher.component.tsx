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
  Network,
  Languages,
  Image as ImageIcon,
  Upload,
  Pill,
  Search,
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
import {
  createMindMap,
  createSummary,
  deleteMindMap,
  deleteSummary,
  deleteSummaryImage,
  getMindMapByCourseId,
  getSummaryByCourse,
  getSummaryImage,
  updateMindMap,
  updateSummary,
  uploadSummaryImage,
} from "@/utils/server/summary-api";
import {
  getMedicaments,
  createMedicament,
  updateMedicament,
  deleteMedicament,
  uploadMedicamentImage,
  getMedicamentImage,
  deleteMedicamentImage,
  type Medicament,
  type CreateMedicament,
} from "@/utils/server/medicament-api";

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
import { Summary } from "@/utils/types/summary.types";
import { Mindmap } from "@/utils/types/mindmap.types";

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

type MindMapTerm = {
  _key: string;
  french: string;
  english: string;
  definition: string;
};

type MindMapContent = {
  terms: {
    french: string;
    english: string;
    definition: string;
  }[];
};

type SummaryImage = {
  id: number;
  url: string;
  publicId?: string;
  format?: string | null;
  width?: number;
  height?: number;
  bytes?: number;
  originalName?: string | null;
};

type MedicamentImage = {
  id: number;
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
};

type MedicamentFormData = CreateMedicament & { id?: number };

type TopView = "curriculum" | "medicaments";

type ViewMode =
  | "years"
  | "year-detail"
  | "subject-detail"
  | "container-detail"
  | "qcm-detail"
  | "medicaments";

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
    if (Array.isArray(v.medicaments)) return v.medicaments;
  }
  return [];
};

const unwrapEntity = <T,>(v: any): T | null => {
  if (v == null) return null;

  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    return (v[0] as T) ?? null;
  }

  if (typeof v !== "object") return null;

  if (
    "id" in v ||
    "name" in v ||
    "number" in v ||
    "question" in v ||
    "text" in v
  ) {
    return v as T;
  }

  if (v.data && typeof v.data === "object" && !Array.isArray(v.data)) {
    return v.data as T;
  }

  return v as T;
};

/* ------------------------------------------------------------------ */
/* ID resolution helpers                                               */
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
/* Helpers for mindmap content                                         */
/* ------------------------------------------------------------------ */

const emptyTerm = (i = 0): MindMapTerm => ({
  _key: `term-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
  french: "",
  english: "",
  definition: "",
});

function readTermsFromMindmap(mindmap: Mindmap | null): MindMapTerm[] {
  if (!mindmap) return [];

  let content: any =
    (mindmap as any).jsonContent ??
    (mindmap as any).json ??
    (mindmap as any).content ??
    (mindmap as any).data;

  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      return [];
    }
  }

  if (!content || typeof content !== "object") return [];

  const rawTerms = Array.isArray(content.terms)
    ? content.terms
    : Array.isArray(content)
      ? content
      : [];

  return rawTerms
    .map((t: any, i: number) => ({
      _key: `term-load-${i}-${Math.random().toString(36).slice(2, 7)}`,
      french: String(t?.french ?? ""),
      english: String(t?.english ?? ""),
      definition: String(t?.definition ?? ""),
    }))
    .filter((t: any) => t.french || t.english || t.definition);
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function TeacherPageComponent() {
  const t = useTranslations("teacher");

  /* ---------- Top-level navigation ---------- */
  const [topView, setTopView] = useState<TopView>("curriculum");

  /* ---------- Curriculum navigation ---------- */
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

  /* ---------- Summary + Mindmap + Image (course only) ---------- */
  const [courseSummary, setCourseSummary] = useState<Summary | null>(null);
  const [courseMindmap, setCourseMindmap] = useState<Mindmap | null>(null);
  const [courseImage, setCourseImage] = useState<SummaryImage | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [mindmapName, setMindmapName] = useState("");
  const [terms, setTerms] = useState<MindMapTerm[]>([]);
  const [savingSummary, setSavingSummary] = useState(false);
  const [deletingSummary, setDeletingSummary] = useState(false);
  const [confirmDeleteSummary, setConfirmDeleteSummary] = useState(false);

  /* ---------- Summary image upload ---------- */
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  /* ---------- Medicaments ---------- */
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [medicamentSearch, setMedicamentSearch] = useState("");
  const [medicamentModalOpen, setMedicamentModalOpen] = useState(false);
  const [editingMedicament, setEditingMedicament] =
    useState<MedicamentFormData | null>(null);
  const [medicamentForm, setMedicamentForm] = useState<MedicamentFormData>({
    name: "",
    dci: "",
    therapeuticClass: "",
    form: "",
    dosage: "",
    indication: "",
    contraindications: "",
    sideEffects: "",
    posology: "",
    notes: "",
  });
  const [confirmDeleteMedicament, setConfirmDeleteMedicament] =
    useState<Medicament | null>(null);

  const [medicamentImagePreview, setMedicamentImagePreview] = useState<
    string | null
  >(null);
  const [medicamentPendingFile, setMedicamentPendingFile] =
    useState<File | null>(null);
  const [medicamentImage, setMedicamentImage] =
    useState<MedicamentImage | null>(null);
  const [uploadingMedicamentImage, setUploadingMedicamentImage] =
    useState(false);

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

  /* ------------------------------------------------------------------ */
  /* Summary + Mindmap + Image loaders                                  */
  /* ------------------------------------------------------------------ */

  const loadCourseSummary = useCallback(async (courseId: number) => {
    setLoadingSummary(true);
    try {
      const [summaryRes, mindmapRes] = await Promise.all([
        getSummaryByCourse(courseId),
        getMindMapByCourseId(courseId),
      ]);

      /* ---- Summary ---- */
      let loadedSummary: Summary | null = null;
      if (summaryRes.status) {
        const raw: any = summaryRes.response;
        loadedSummary =
          unwrapEntity<Summary>(raw) ??
          unwrapEntity<Summary>(raw?.summary) ??
          unwrapEntity<Summary>(raw?.data?.summary) ??
          unwrapEntity<Summary>(raw?.data) ??
          null;
      }
      setCourseSummary(loadedSummary);

      /* ---- Mindmap ---- */
      let loadedMindmap: Mindmap | null = null;
      if (mindmapRes.status) {
        const raw: any = mindmapRes.response;
        loadedMindmap =
          unwrapEntity<Mindmap>(raw) ??
          unwrapEntity<Mindmap>(raw?.mindmap) ??
          unwrapEntity<Mindmap>(raw?.data?.mindmap) ??
          unwrapEntity<Mindmap>(raw?.data) ??
          null;
      }
      if (!loadedMindmap && loadedSummary) {
        const s: any = loadedSummary;
        loadedMindmap = s.mindmap ?? s.mindMap ?? s.Mindmap ?? null;
      }
      setCourseMindmap(loadedMindmap);

      /* ---- Image ---- */
      if (loadedSummary?.id) {
        try {
          const imgRes = await getSummaryImage(loadedSummary.id);
          if (imgRes.status) {
            const img = unwrapEntity<SummaryImage>(imgRes.response);
            setCourseImage(img ?? null);
          } else {
            setCourseImage(null);
          }
        } catch {
          setCourseImage(null);
        }
      } else {
        setCourseImage(null);
      }
    } catch (e) {
      console.error("Failed to load summary/mindmap", e);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* Open summary modal                                                 */
  /* ------------------------------------------------------------------ */

  const openSummaryModal = useCallback(() => {
    setSummaryText(courseSummary?.text ?? "");
    setMindmapName(courseMindmap?.name ?? "");
    const loaded = readTermsFromMindmap(courseMindmap);
    setTerms(loaded.length > 0 ? loaded : [emptyTerm(0), emptyTerm(1)]);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setPendingImageFile(null);
    setSummaryModalOpen(true);
  }, [courseSummary, courseMindmap, imagePreview]);

  /* ------------------------------------------------------------------ */
  /* Mindmap term helpers                                               */
  /* ------------------------------------------------------------------ */

  const addTerm = () => setTerms((prev) => [...prev, emptyTerm(prev.length)]);

  const removeTerm = (key: string) =>
    setTerms((prev) => prev.filter((x) => x._key !== key));

  const updateTerm = (key: string, patch: Partial<MindMapTerm>) =>
    setTerms((prev) =>
      prev.map((x) => (x._key === key ? { ...x, ...patch } : x)),
    );

  /* ------------------------------------------------------------------ */
  /* Image pick / clear (summary)                                       */
  /* ------------------------------------------------------------------ */

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image must be under 5 MB");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPendingImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearPendingImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setPendingImageFile(null);
  };

  const handleRemoveExistingImage = async () => {
    if (!courseSummary?.id) return;
    try {
      const res = await deleteSummaryImage(courseSummary.id);
      if (!res.status) throw new Error(res.message ?? "Failed to remove image");
      setCourseImage(null);
      showToast("success", t("success.deleted"));
    } catch (e: any) {
      showToast("error", e?.message ?? t("error.generic"));
    }
  };

  /* ------------------------------------------------------------------ */
  /* Save summary + mindmap + image                                     */
  /* ------------------------------------------------------------------ */

  const handleSaveSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    if (!summaryText.trim()) {
      showToast("error", "Summary text is required");
      return;
    }

    setSavingSummary(true);
    try {
      let summaryId = courseSummary?.id;
      if (summaryId) {
        const res = await updateSummary(summaryId, {
          text: summaryText.trim(),
        });
        if (!res.status)
          throw new Error(res.message ?? "Failed to update summary");
      } else {
        const res = await createSummary({
          text: summaryText.trim(),
          courseId: selectedCourse.id,
        });
        if (!res.status)
          throw new Error(res.message ?? "Failed to create summary");
        const created = unwrapEntity<Summary>(res.response);
        summaryId = created?.id;
      }

      if (!summaryId) throw new Error("Could not resolve summary id");

      if (pendingImageFile) {
        setUploadingImage(true);
        const imgRes = await uploadSummaryImage(summaryId, pendingImageFile);
        setUploadingImage(false);
        if (!imgRes.status) {
          throw new Error(imgRes.message ?? "Failed to upload image");
        }
        const saved = unwrapEntity<SummaryImage>(imgRes.response);
        if (saved) setCourseImage(saved);
        clearPendingImage();
      }

      const cleanTerms = terms
        .filter(
          (x) =>
            x.french.trim().length > 0 ||
            x.english.trim().length > 0 ||
            x.definition.trim().length > 0,
        )
        .map((x) => ({
          french: x.french.trim(),
          english: x.english.trim(),
          definition: x.definition.trim(),
        }));

      const content: MindMapContent = { terms: cleanTerms };
      const name = mindmapName.trim() || "Mind Map";

      if (courseMindmap?.id) {
        const res = await updateMindMap(courseMindmap.id, {
          name,
          jsonContent: content as any,
        });
        if (!res.status)
          throw new Error(res.message ?? "Failed to update mindmap");
      } else {
        const res = await createMindMap({
          name,
          jsonContent: content as any,
          summaryId,
        });
        if (!res.status)
          throw new Error(res.message ?? "Failed to create mindmap");
      }

      showToast("success", t("success.updated"));
      setSummaryModalOpen(false);
      clearPendingImage();
      await loadCourseSummary(selectedCourse.id);
    } catch (e: any) {
      showToast("error", e?.message ?? t("error.generic"));
    } finally {
      setSavingSummary(false);
      setUploadingImage(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Delete summary + mindmap + image                                   */
  /* ------------------------------------------------------------------ */

  const handleDeleteSummary = async () => {
    if (!selectedCourse) return;

    setDeletingSummary(true);
    try {
      if (courseSummary?.id) {
        const imgRes = await deleteSummaryImage(courseSummary.id);
        if (!imgRes.status && !/not.*found/i.test(imgRes.message ?? "")) {
          console.warn("Image delete failed:", imgRes.message);
        }
      }

      if (courseMindmap?.id) {
        const res = await deleteMindMap(courseMindmap.id);
        if (!res.status && !/not.*found/i.test(res.message ?? "")) {
          throw new Error(res.message ?? "Failed to delete mindmap");
        }
      }

      if (courseSummary?.id) {
        const res = await deleteSummary(courseSummary.id);
        if (!res.status && !/not.*found/i.test(res.message ?? "")) {
          throw new Error(res.message ?? "Failed to delete summary");
        }
      }

      setCourseSummary(null);
      setCourseMindmap(null);
      setCourseImage(null);
      clearPendingImage();
      setConfirmDeleteSummary(false);
      setSummaryModalOpen(false);

      showToast("success", t("success.deleted"));
      await loadCourseSummary(selectedCourse.id);
    } catch (e: any) {
      showToast("error", e?.message ?? t("error.generic"));
    } finally {
      setDeletingSummary(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Medicament handlers                                                */
  /* ------------------------------------------------------------------ */

  const emptyMedicamentForm = (): MedicamentFormData => ({
    name: "",
    dci: "",
    therapeuticClass: "",
    form: "",
    dosage: "",
    indication: "",
    contraindications: "",
    sideEffects: "",
    posology: "",
    notes: "",
  });

  const openCreateMedicament = () => {
    setEditingMedicament(null);
    setMedicamentForm(emptyMedicamentForm());
    setMedicamentImage(null);
    setMedicamentImagePreview(null);
    setMedicamentPendingFile(null);
    setMedicamentModalOpen(true);
  };

  const openEditMedicament = async (medicament: Medicament) => {
    setEditingMedicament(medicament as any);
    setMedicamentForm({
      id: medicament.id,
      name: medicament.name ?? "",
      dci: medicament.dci ?? "",
      therapeuticClass: medicament.therapeuticClass ?? "",
      form: medicament.form ?? "",
      dosage: medicament.dosage ?? "",
      indication: medicament.indication ?? "",
      contraindications: medicament.contraindications ?? "",
      sideEffects: medicament.sideEffects ?? "",
      posology: medicament.posology ?? "",
      notes: medicament.notes ?? "",
    });
    setMedicamentImagePreview(null);
    setMedicamentPendingFile(null);

    try {
      const res = await getMedicamentImage(medicament.id);
      if (res.status) {
        const img = unwrapEntity<MedicamentImage>(res.response);
        setMedicamentImage(img);
      } else {
        setMedicamentImage(null);
      }
    } catch {
      setMedicamentImage(null);
    }

    setMedicamentModalOpen(true);
  };

  const handlePickMedicamentImage = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image must be under 5 MB");
      return;
    }

    if (medicamentImagePreview) URL.revokeObjectURL(medicamentImagePreview);
    setMedicamentPendingFile(file);
    setMedicamentImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const clearMedicamentPendingImage = () => {
    if (medicamentImagePreview) URL.revokeObjectURL(medicamentImagePreview);
    setMedicamentImagePreview(null);
    setMedicamentPendingFile(null);
  };

  const handleRemoveMedicamentImage = async () => {
    if (!editingMedicament?.id) return;
    try {
      const res = await deleteMedicamentImage(editingMedicament.id);
      if (!res.status) throw new Error(res.message ?? "Failed to remove image");
      setMedicamentImage(null);
      showToast("success", t("success.deleted"));
    } catch (e: any) {
      showToast("error", e?.message ?? t("error.generic"));
    }
  };

  const handleSaveMedicament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicamentForm.name.trim()) {
      showToast("error", "Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {};
      (
        [
          "name",
          "dci",
          "therapeuticClass",
          "form",
          "dosage",
          "indication",
          "contraindications",
          "sideEffects",
          "posology",
          "notes",
        ] as const
      ).forEach((k) => {
        const v = (medicamentForm as any)[k];
        if (typeof v === "string" && v.trim()) payload[k] = v.trim();
        else if (k === "name") payload[k] = "";
      });

      let medicamentId = editingMedicament?.id;

      if (medicamentId) {
        const res = await updateMedicament(medicamentId, payload);
        if (!res.status)
          throw new Error(res.message ?? "Failed to update medicament");
      } else {
        const res = await createMedicament(payload);
        if (!res.status)
          throw new Error(res.message ?? "Failed to create medicament");
        const created = unwrapEntity<Medicament>(res.response);
        medicamentId = created?.id;
      }

      if (!medicamentId) throw new Error("Could not resolve medicament id");

      if (medicamentPendingFile) {
        setUploadingMedicamentImage(true);
        const imgRes = await uploadMedicamentImage(
          medicamentId,
          medicamentPendingFile,
        );
        setUploadingMedicamentImage(false);
        if (!imgRes.status) {
          throw new Error(imgRes.message ?? "Failed to upload image");
        }
        clearMedicamentPendingImage();
      }

      showToast(
        "success",
        editingMedicament ? t("success.updated") : t("success.created"),
      );
      setMedicamentModalOpen(false);
      setEditingMedicament(null);
      clearMedicamentPendingImage();
      await fetchAll(true);
    } catch (e: any) {
      showToast("error", e?.message ?? t("error.generic"));
    } finally {
      setSaving(false);
      setUploadingMedicamentImage(false);
    }
  };

  const handleDeleteMedicament = async () => {
    if (!confirmDeleteMedicament) return;
    setDeleting(true);
    try {
      const imgRes = await deleteMedicamentImage(confirmDeleteMedicament.id);
      if (!imgRes.status && !/not.*found/i.test(imgRes.message ?? "")) {
        console.warn("Image delete failed:", imgRes.message);
      }

      const res = await deleteMedicament(confirmDeleteMedicament.id);
      if (!res.status) throw new Error(res.message ?? "Failed to delete");

      showToast("success", t("success.deleted"));
      setConfirmDeleteMedicament(null);
      await fetchAll(true);
    } catch (e: any) {
      showToast("error", e?.message ?? t("error.generic"));
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Fetch all flat lists                                                */
  /* ------------------------------------------------------------------ */

  const fetchAll = useCallback(
    async (silent = false) => {
      silent ? setRefreshing(true) : setLoading(true);
      try {
        const [y, se, su, c, td, tp, q, a, meds] = await Promise.all([
          getYears(),
          getSemesters(),
          getSubjects(),
          getCourses(),
          getTds(),
          getTps(),
          getQcms(),
          getQcmAnswers(),
          getMedicaments(),
        ]);
        if (y.status) setYears(toArray<Year>(y.response));
        if (se.status) setSemesters(toArray<Semester>(se.response));
        if (su.status) setSubjects(toArray<Subject>(su.response));
        if (c.status) setCourses(toArray<Course>(c.response));
        if (td.status) setTds(toArray<Td>(td.response));
        if (tp.status) setTps(toArray<Tp>(tp.response));
        if (q.status) setQcms(toArray<Qcm>(q.response));
        if (a.status) setAnswers(toArray<QcmAnswer>(a.response));
        if (meds.status) setMedicaments(toArray<Medicament>(meds.response));
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
    if (selectedCourse) {
      await refreshCourseDetail(selectedCourse.id);
      await loadCourseSummary(selectedCourse.id);
    }
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
    loadCourseSummary,
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
    setCourseSummary(null);
    setCourseMindmap(null);
    setCourseImage(null);
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
      await Promise.all([
        refreshCourseDetail(course.id),
        loadCourseSummary(course.id),
      ]);
    },
    [refreshCourseDetail, loadCourseSummary],
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
      setCourseSummary(null);
      setCourseMindmap(null);
      setCourseImage(null);
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
      setCourseSummary(null);
      setCourseMindmap(null);
      setCourseImage(null);
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
        else if (!saving && medicamentModalOpen) setMedicamentModalOpen(false);
        else if (!savingSummary && summaryModalOpen) setSummaryModalOpen(false);
        else if (!deletingSummary && confirmDeleteSummary)
          setConfirmDeleteSummary(false);
        else if (!deleting && confirmDeleteMedicament)
          setConfirmDeleteMedicament(null);
        else if (!deleting && confirmDelete) setConfirmDelete(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    modalType,
    confirmDelete,
    saving,
    deleting,
    summaryModalOpen,
    savingSummary,
    confirmDeleteSummary,
    deletingSummary,
    medicamentModalOpen,
    confirmDeleteMedicament,
  ]);

  /* ---------- Derived lists ---------- */
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

  /* ---------- Active container ---------- */
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

  /* ---------- Open modal (create/edit entity) ---------- */
  const openCreate = (type: EntityType) => {
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
    if (type === "qcm") {
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

  /* ---------- Submit (create/edit entity) ---------- */
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

  /* ---------- Delete entity ---------- */
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
  const viewMode: ViewMode =
    topView === "medicaments"
      ? "medicaments"
      : !selectedYear
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
        onClick: () => { },
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
        {/* ============ Header with view tabs ============ */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{t("title")}</h1>
            <p className={styles.pageSubtitle}>{t("subtitle")}</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.viewTabs}>
              <button
                type="button"
                onClick={() => setTopView("curriculum")}
                className={`${styles.viewTab} ${topView === "curriculum" ? styles.viewTabActive : ""
                  }`}
              >
                <GraduationCap size={14} />
                <span>Curriculum</span>
              </button>
              <button
                type="button"
                onClick={() => setTopView("medicaments")}
                className={`${styles.viewTab} ${topView === "medicaments" ? styles.viewTabActive : ""
                  }`}
              >
                <Pill size={14} />
                <span>Medicaments</span>
                {medicaments.length > 0 && (
                  <span className={styles.viewTabCount}>
                    {medicaments.length}
                  </span>
                )}
              </button>
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
          </div>
        </header>

        {/* ============ Breadcrumb (curriculum only) ============ */}
        {topView === "curriculum" && (
          <nav className={styles.breadcrumb} aria-label="breadcrumb">
            {breadcrumbs.map((b, i) => (
              <div key={i} className={styles.breadcrumbItem}>
                {i > 0 && (
                  <ChevronRight size={15} className={styles.breadcrumbSep} />
                )}
                <button
                  onClick={b.onClick}
                  className={`${styles.breadcrumbButton} ${b.active ? styles.breadcrumbActive : ""
                    }`}
                  disabled={b.active}
                >
                  {i === 0 && <Home size={13} />}
                  <span>{b.label}</span>
                </button>
              </div>
            ))}
          </nav>
        )}

        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 className={styles.spinning} size={32} />
            <span>{t("loading")}</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ==================== MEDICAMENTS ==================== */}
            {viewMode === "medicaments" && (
              <motion.section
                key="medicaments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <h2 className={styles.sectionTitle}>Medicaments</h2>
                    <span className={styles.sectionCount}>
                      {medicaments.length}
                    </span>
                  </div>
                  <button
                    onClick={openCreateMedicament}
                    className={styles.primaryButton}
                  >
                    <Plus size={14} />
                    <span>New medicament</span>
                  </button>
                </div>

                <div className={styles.filters} style={{ marginBottom: "1.25rem" }}>
                  <div className={styles.searchBox}>
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search by name or DCI…"
                      value={medicamentSearch}
                      onChange={(e) => setMedicamentSearch(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                </div>

                {medicaments.length === 0 ? (
                  <EmptyState
                    icon={<Pill size={52} />}
                    title="No medicaments yet"
                    description="Add your first medicament — it will appear in the daily flashcard."
                    action={
                      <button
                        onClick={openCreateMedicament}
                        className={styles.primaryButton}
                      >
                        <Plus size={16} />
                        <span>New medicament</span>
                      </button>
                    }
                  />
                ) : (
                  <ul className={styles.medicamentGrid}>
                    {medicaments
                      .filter((m) => {
                        if (!medicamentSearch.trim()) return true;
                        const q = medicamentSearch.toLowerCase();
                        return (
                          m.name?.toLowerCase().includes(q) ||
                          (m.dci ?? "").toLowerCase().includes(q)
                        );
                      })
                      .map((m) => (
                        <motion.li
                          key={m.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={styles.medicamentCard}
                        >
                          <div className={styles.medicamentImageBox}>
                            {m.image?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.image.url}
                                alt={m.name}
                                className={styles.medicamentImage}
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className={styles.medicamentImageEmpty}>
                                <Pill size={24} />
                              </div>
                            )}
                          </div>

                          <div className={styles.medicamentInfo}>
                            <h3 className={styles.medicamentName}>{m.name}</h3>
                            {m.dci && (
                              <p className={styles.medicamentDci}>{m.dci}</p>
                            )}
                            <div className={styles.medicamentChips}>
                              {m.therapeuticClass && (
                                <span className={styles.chip}>
                                  {m.therapeuticClass}
                                </span>
                              )}
                              {m.form && (
                                <span className={styles.chip}>{m.form}</span>
                              )}
                              {m.dosage && (
                                <span className={styles.chip}>{m.dosage}</span>
                              )}
                            </div>
                          </div>

                          <div className={styles.medicamentActions}>
                            <button
                              onClick={() => openEditMedicament(m)}
                              className={styles.iconButton}
                              aria-label={t("actions.edit")}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteMedicament(m)}
                              className={`${styles.iconButton} ${styles.danger}`}
                              aria-label={t("actions.delete")}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.li>
                      ))}
                  </ul>
                )}
              </motion.section>
            )}

            {/* ==================== YEARS ==================== */}
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
                          <ChevronRight
                            size={18}
                            className={styles.chevron}
                          />
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.section>
            )}

            {/* ==================== YEAR DETAIL ==================== */}
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
                            .sort(
                              (a, b) => Number(a.number) - Number(b.number),
                            )
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

            {/* ==================== SUBJECT DETAIL ==================== */}
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
                            .sort(
                              (a, b) => Number(a.number) - Number(b.number),
                            )
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
                              );
                            })}

                          {subjectCourses.some(
                            (c) => !courseSemesterId(c),
                          ) && (
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

            {/* ==================== CONTAINER DETAIL ==================== */}
            {viewMode === "container-detail" && activeContainer && (
              <motion.section
                key={`container-${activeContainer.type}-${(activeContainer.item as any).id
                  }`}
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
                    {/* Summary + Mind Map (course only) */}
                    {activeContainer.type === "course" && (
                      <div className={styles.summarySection}>
                        <div className={styles.summaryHeader}>
                          <div className={styles.summaryHeaderLeft}>
                            <div className={styles.summaryHeaderIcon}>
                              <FileText size={18} />
                            </div>
                            <div>
                              <h2 className={styles.summaryTitle}>
                                {t.has("summary.title")
                                  ? t("summary.title")
                                  : "Summary & Mind Map"}
                              </h2>
                              <p className={styles.summarySubtitle}>
                                {courseSummary
                                  ? t.has("summary.subtitleExisting")
                                    ? t("summary.subtitleExisting")
                                    : "Edit the summary and its mind map"
                                  : t.has("summary.subtitleEmpty")
                                    ? t("summary.subtitleEmpty")
                                    : "Add a text summary and structured mind map for this course"}
                              </p>
                            </div>
                          </div>

                          <div className={styles.summaryHeaderActions}>
                            <button
                              onClick={openSummaryModal}
                              className={styles.primaryButton}
                              disabled={loadingSummary}
                            >
                              {courseSummary ? (
                                <>
                                  <Pencil size={14} />
                                  <span>
                                    {t.has("summary.edit")
                                      ? t("summary.edit")
                                      : "Edit"}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} />
                                  <span>
                                    {t.has("summary.add")
                                      ? t("summary.add")
                                      : "Add summary"}
                                  </span>
                                </>
                              )}
                            </button>

                            {courseSummary && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSummary(true)}
                                className={styles.dangerButton}
                                disabled={deletingSummary}
                                aria-label={
                                  t.has("summary.delete")
                                    ? t("summary.delete")
                                    : "Delete summary"
                                }
                                title={
                                  t.has("summary.delete")
                                    ? t("summary.delete")
                                    : "Delete summary"
                                }
                              >
                                {deletingSummary ? (
                                  <Loader2
                                    size={14}
                                    className={styles.spinning}
                                  />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                                <span>
                                  {t.has("summary.delete")
                                    ? t("summary.delete")
                                    : "Delete"}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {loadingSummary ? (
                          <div className={styles.summaryLoading}>
                            <Loader2 className={styles.spinning} size={22} />
                          </div>
                        ) : !courseSummary ? (
                          <div className={styles.summaryEmpty}>
                            <div className={styles.summaryEmptyIcon}>
                              <Network size={30} />
                            </div>
                            <p>
                              {t.has("summary.emptyText")
                                ? t("summary.emptyText")
                                : "No summary yet — click “Add summary” to create one."}
                            </p>
                          </div>
                        ) : (
                          <div className={styles.summaryBody}>
                            {courseImage?.url && (
                              <div className={styles.summaryImageWrap}>
                                <img
                                  src={courseImage.url}
                                  alt={courseSummary.text.slice(0, 60)}
                                  className={styles.summaryImage}
                                  loading="lazy"
                                />
                              </div>
                            )}

                            <p className={styles.summaryText}>
                              {courseSummary.text}
                            </p>

                            {courseMindmap &&
                              Array.isArray(
                                (courseMindmap.jsonContent as any)?.terms,
                              ) &&
                              (courseMindmap.jsonContent as any).terms
                                .length > 0 && (
                                <div className={styles.mindmapWrap}>
                                  <div className={styles.mindmapHeader}>
                                    <div className={styles.mindmapHeaderIcon}>
                                      <Network size={14} />
                                    </div>
                                    <span className={styles.mindmapName}>
                                      {courseMindmap.name ||
                                        (t.has("summary.mindmap")
                                          ? t("summary.mindmap")
                                          : "Mind Map")}
                                    </span>
                                    <span className={styles.mindmapCount}>
                                      {
                                        (courseMindmap.jsonContent as any)
                                          .terms.length
                                      }{" "}
                                      {t.has("summary.terms")
                                        ? t("summary.terms")
                                        : "terms"}
                                    </span>
                                  </div>

                                  <ul className={styles.mindmapTerms}>
                                    {(
                                      (courseMindmap.jsonContent as any)
                                        .terms as any[]
                                    ).map((term, i) => (
                                      <motion.li
                                        key={i}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className={styles.mindmapTerm}
                                      >
                                        <div
                                          className={styles.mindmapTermHeader}
                                        >
                                          <span
                                            className={
                                              styles.mindmapTermFrench
                                            }
                                          >
                                            {term.french || "—"}
                                          </span>
                                          <span
                                            className={styles.mindmapArrow}
                                            aria-hidden
                                          >
                                            →
                                          </span>
                                          <span
                                            className={
                                              styles.mindmapTermEnglish
                                            }
                                          >
                                            {term.english || "—"}
                                          </span>
                                        </div>
                                        {term.definition && (
                                          <p
                                            className={
                                              styles.mindmapTermDefinition
                                            }
                                          >
                                            {term.definition}
                                          </p>
                                        )}
                                      </motion.li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* QCMs */}
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
                        {activeContainer.qcms.map((q) => (
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
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </motion.section>
            )}

            {/* ==================== QCM DETAIL ==================== */}
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
                                className={`${styles.listItemIcon} ${a.isCorrect
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

      {/* ==================== Modal: create/edit entity ==================== */}
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
              className={`${styles.modal} ${modalType === "qcm" && !editing ? styles.modalWide : ""
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
                      `actions.create.${modalType === "answer"
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
                    onChange={(v) =>
                      setFormState({ ...formState, number: v })
                    }
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
                                  className={`${styles.toggleCorrect} ${draft.isCorrect
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
                                  onClick={() =>
                                    removeAnswerDraft(draft._key)
                                  }
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
                                placeholder={t(
                                  "qcm.explanationPlaceholder",
                                )}
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

      {/* ==================== Medicament Modal ==================== */}
      <AnimatePresence>
        {medicamentModalOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setMedicamentModalOpen(false)}
          >
            <motion.div
              className={`${styles.modal} ${styles.modalWide}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingMedicament ? "Edit medicament" : "New medicament"}
                </h2>
                <button
                  onClick={() => !saving && setMedicamentModalOpen(false)}
                  className={styles.iconButton}
                  aria-label={t("actions.close")}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMedicament} className={styles.form}>
                {/* Image uploader */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Photo</label>
                  <div className={styles.imageUploader}>
                    {medicamentImagePreview || medicamentImage?.url ? (
                      <div className={styles.imagePreviewWrap}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={medicamentImagePreview ?? medicamentImage?.url}
                          alt=""
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          className={styles.imageRemove}
                          onClick={async () => {
                            if (medicamentPendingFile) {
                              clearMedicamentPendingImage();
                              return;
                            }
                            await handleRemoveMedicamentImage();
                          }}
                          aria-label="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className={styles.imageDropZone}>
                        {uploadingMedicamentImage ? (
                          <Loader2 size={22} className={styles.spinning} />
                        ) : (
                          <Upload size={22} />
                        )}
                        <span>
                          Click to upload an image (JPG, PNG, WebP — max 5 MB)
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className={styles.imageInput}
                          onChange={handlePickMedicamentImage}
                          disabled={uploadingMedicamentImage || saving}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <TextField
                    label="Commercial name"
                    value={medicamentForm.name ?? ""}
                    onChange={(v) =>
                      setMedicamentForm({ ...medicamentForm, name: v })
                    }
                    required
                  />
                  <TextField
                    label="DCI (molecule)"
                    value={medicamentForm.dci ?? ""}
                    onChange={(v) =>
                      setMedicamentForm({ ...medicamentForm, dci: v })
                    }
                  />
                </div>

                <div className={styles.formRow3}>
                  <TextField
                    label="Therapeutic class"
                    value={medicamentForm.therapeuticClass ?? ""}
                    onChange={(v) =>
                      setMedicamentForm({
                        ...medicamentForm,
                        therapeuticClass: v,
                      })
                    }
                  />
                  <TextField
                    label="Form"
                    value={medicamentForm.form ?? ""}
                    onChange={(v) =>
                      setMedicamentForm({ ...medicamentForm, form: v })
                    }
                  />
                  <TextField
                    label="Dosage"
                    value={medicamentForm.dosage ?? ""}
                    onChange={(v) =>
                      setMedicamentForm({ ...medicamentForm, dosage: v })
                    }
                  />
                </div>

                <TextField
                  label="Indication"
                  value={medicamentForm.indication ?? ""}
                  onChange={(v) =>
                    setMedicamentForm({ ...medicamentForm, indication: v })
                  }
                  textarea
                />

                <TextField
                  label="Posology"
                  value={medicamentForm.posology ?? ""}
                  onChange={(v) =>
                    setMedicamentForm({ ...medicamentForm, posology: v })
                  }
                  textarea
                />

                <TextField
                  label="Contraindications"
                  value={medicamentForm.contraindications ?? ""}
                  onChange={(v) =>
                    setMedicamentForm({
                      ...medicamentForm,
                      contraindications: v,
                    })
                  }
                  textarea
                />

                <TextField
                  label="Side effects"
                  value={medicamentForm.sideEffects ?? ""}
                  onChange={(v) =>
                    setMedicamentForm({ ...medicamentForm, sideEffects: v })
                  }
                  textarea
                />

                <TextField
                  label="Notes"
                  value={medicamentForm.notes ?? ""}
                  onChange={(v) =>
                    setMedicamentForm({ ...medicamentForm, notes: v })
                  }
                  textarea
                />

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() => !saving && setMedicamentModalOpen(false)}
                    className={styles.secondaryButton}
                    disabled={saving}
                  >
                    {t("actions.cancel")}
                  </button>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={saving || uploadingMedicamentImage}
                  >
                    {saving ? (
                      <Loader2 className={styles.spinning} size={16} />
                    ) : (
                      <>
                        <Save size={16} />
                        <span>
                          {editingMedicament
                            ? t("actions.save")
                            : t("actions.createShort")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== Summary + Mindmap Modal ==================== */}
      <AnimatePresence>
        {summaryModalOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !savingSummary && setSummaryModalOpen(false)}
          >
            <motion.div
              className={`${styles.modal} ${styles.modalWide}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {courseSummary
                    ? t.has("summary.modalEditTitle")
                      ? t("summary.modalEditTitle")
                      : "Edit summary & mind map"
                    : t.has("summary.modalCreateTitle")
                      ? t("summary.modalCreateTitle")
                      : "New summary & mind map"}
                </h2>
                <button
                  onClick={() => !savingSummary && setSummaryModalOpen(false)}
                  className={styles.iconButton}
                  aria-label={t("actions.close")}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSummary} className={styles.form}>
                {/* Cover image uploader */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    {t.has("summary.coverImage")
                      ? t("summary.coverImage")
                      : "Cover image"}
                  </label>
                  <div className={styles.imageUploader}>
                    {imagePreview || courseImage?.url ? (
                      <div className={styles.imagePreviewWrap}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview ?? courseImage?.url}
                          alt=""
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          className={styles.imageRemove}
                          onClick={async () => {
                            if (pendingImageFile) {
                              clearPendingImage();
                              return;
                            }
                            await handleRemoveExistingImage();
                          }}
                          aria-label="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className={styles.imageDropZone}>
                        {uploadingImage ? (
                          <Loader2 size={22} className={styles.spinning} />
                        ) : (
                          <Upload size={22} />
                        )}
                        <span>
                          Click to upload an image (JPG, PNG, WebP — max 5 MB)
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className={styles.imageInput}
                          onChange={handlePickImage}
                          disabled={uploadingImage || savingSummary}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Summary text */}
                <TextField
                  label={
                    t.has("summary.textLabel")
                      ? t("summary.textLabel")
                      : "Summary text"
                  }
                  value={summaryText}
                  onChange={setSummaryText}
                  textarea
                  required
                />

                {/* Mindmap name */}
                <TextField
                  label={
                    t.has("summary.mindmapName")
                      ? t("summary.mindmapName")
                      : "Mind map name"
                  }
                  value={mindmapName}
                  onChange={setMindmapName}
                />

                {/* Terms builder */}
                <div className={styles.answerBuilder}>
                  <div className={styles.answerBuilderHeader}>
                    <span className={styles.answerBuilderLabel}>
                      {t.has("summary.termsLabel")
                        ? t("summary.termsLabel")
                        : `Terms (${terms.length})`}
                    </span>
                    <button
                      type="button"
                      onClick={addTerm}
                      className={styles.ghostButton}
                    >
                      <Plus size={14} />
                      {t.has("summary.addTerm")
                        ? t("summary.addTerm")
                        : "Add term"}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {terms.map((term, idx) => (
                      <motion.div
                        key={term._key}
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
                            value={term.french}
                            onChange={(e) =>
                              updateTerm(term._key, {
                                french: e.target.value,
                              })
                            }
                            placeholder="French"
                            className={styles.input}
                          />
                          <input
                            type="text"
                            value={term.english}
                            onChange={(e) =>
                              updateTerm(term._key, {
                                english: e.target.value,
                              })
                            }
                            placeholder="English"
                            className={styles.input}
                          />
                          <button
                            type="button"
                            onClick={() => removeTerm(term._key)}
                            className={`${styles.iconButton} ${styles.danger}`}
                            aria-label={t("actions.delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={term.definition}
                          onChange={(e) =>
                            updateTerm(term._key, {
                              definition: e.target.value,
                            })
                          }
                          placeholder="Definition"
                          className={`${styles.input} ${styles.inputSmall}`}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    onClick={() =>
                      !savingSummary && setSummaryModalOpen(false)
                    }
                    className={styles.secondaryButton}
                    disabled={savingSummary}
                  >
                    {t("actions.cancel")}
                  </button>
                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={savingSummary || uploadingImage}
                  >
                    {savingSummary || uploadingImage ? (
                      <Loader2 className={styles.spinning} size={16} />
                    ) : (
                      <>
                        <Save size={16} />
                        <span>
                          {courseSummary
                            ? t("actions.save")
                            : t("actions.createShort")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== Confirm delete entity ==================== */}
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

      {/* ==================== Confirm delete medicament ==================== */}
      <AnimatePresence>
        {confirmDeleteMedicament && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setConfirmDeleteMedicament(null)}
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
              <h2 className={styles.confirmTitle}>Delete medicament?</h2>
              <p className={styles.confirmText}>
                "{confirmDeleteMedicament.name}" and its photo will be
                permanently removed. This action cannot be undone.
              </p>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setConfirmDeleteMedicament(null)}
                  className={styles.secondaryButton}
                  disabled={deleting}
                >
                  {t("actions.cancel")}
                </button>
                <button
                  onClick={handleDeleteMedicament}
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

      {/* ==================== Confirm delete summary ==================== */}
      <AnimatePresence>
        {confirmDeleteSummary && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              !deletingSummary && setConfirmDeleteSummary(false)
            }
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
                {t.has("summary.deleteTitle")
                  ? t("summary.deleteTitle")
                  : "Delete summary?"}
              </h2>
              <p className={styles.confirmText}>
                {t.has("summary.deleteMessage")
                  ? t("summary.deleteMessage")
                  : "This will permanently delete the summary, its mind map, and its cover image. This action cannot be undone."}
              </p>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSummary(false)}
                  className={styles.secondaryButton}
                  disabled={deletingSummary}
                >
                  {t("actions.cancel")}
                </button>
                <button
                  onClick={handleDeleteSummary}
                  className={styles.dangerButton}
                  disabled={deletingSummary}
                >
                  {deletingSummary ? (
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
            className={`${styles.toast} ${toast.type === "success"
              ? styles.toastSuccess
              : styles.toastError
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
      className={`${styles.sectionHeader} ${small ? styles.sectionHeaderSmall : ""
        }`}
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
            style={{
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
            }}
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
      className={`${styles.emptyState} ${small ? styles.emptyStateSmall : ""
        }`}
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