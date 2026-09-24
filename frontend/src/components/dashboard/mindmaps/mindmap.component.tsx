"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    ChevronRight,
    FileText,
    GraduationCap,
    Home,
    Image as ImageIcon,
    Languages,
    Loader2,
    Maximize2,
    Network,
    RefreshCw,
    Search,
    Sparkles,
    X,
    XCircle,
} from "lucide-react";

import { getSubjectsByStudent } from "@/utils/server/subject-api";
import { getCoursesBySubject } from "@/utils/server/course-api";
import {
    getMindMapByCourseId,
    getSummaryByCourse,
    getSummaryImage,
} from "@/utils/server/summary-api";

import styles from "./mindmap.module.css";
import { Subject, Course } from "@/utils/types/allTypes";
import { Summary } from "@/utils/types/summary.types";
import { Mindmap } from "@/utils/types/mindmap.types";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type View = "subjects" | "courses" | "detail";

type SummaryImage = {
    id: number;
    url: string;
    publicId?: string;
    format?: string | null;
    width?: number;
    height?: number;
    bytes?: number;
};

type MindMapTerm = {
    _key: string;
    french: string;
    english: string;
    definition: string;
};

/* ------------------------------------------------------------------ */
/* Response normalizers                                                */
/* ------------------------------------------------------------------ */

const toArray = <T,>(v: any): T[] => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
        if (Array.isArray(v.data)) return v.data;
        if (Array.isArray(v.items)) return v.items;
        if (Array.isArray(v.results)) return v.results;
        if (Array.isArray(v.subjects)) return v.subjects;
        if (Array.isArray(v.courses)) return v.courses;
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

    if ("id" in v || "name" in v || "text" in v) return v as T;

    if (v.data && typeof v.data === "object" && !Array.isArray(v.data)) {
        return v.data as T;
    }

    return v as T;
};

/* ------------------------------------------------------------------ */
/* Mindmap term reader                                                 */
/* ------------------------------------------------------------------ */

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
            _key: `term-${i}-${Math.random().toString(36).slice(2, 7)}`,
            french: String(t?.french ?? "").trim(),
            english: String(t?.english ?? "").trim(),
            definition: String(t?.definition ?? "").trim(),
        }))
        .filter((t: any) => t.french || t.english || t.definition);
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function MindmapComponent() {
    const t = useTranslations("Mindmap");

    /* ---------- Navigation ---------- */
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    /* ---------- Data ---------- */
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseSummary, setCourseSummary] = useState<Summary | null>(null);
    const [courseMindmap, setCourseMindmap] = useState<Mindmap | null>(null);
    const [courseImage, setCourseImage] = useState<SummaryImage | null>(null);

    /* ---------- Loading ---------- */
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    /* ---------- UI ---------- */
    const [search, setSearch] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    /* ================================================================== */
    /* Data fetchers                                                       */
    /* ================================================================== */

    const loadSubjects = useCallback(async () => {
        setLoadingSubjects(true);
        setError(null);
        try {
            const res = await getSubjectsByStudent();
            if (res.status) {
                setSubjects(toArray<Subject>(res.response));
            } else {
                setError(res.message ?? t("errors.loadSubjects"));
            }
        } catch (e: any) {
            setError(e?.message ?? t("errors.generic"));
        } finally {
            setLoadingSubjects(false);
        }
    }, [t]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const loadCourses = useCallback(
        async (subject: Subject) => {
            setLoadingCourses(true);
            setError(null);
            try {
                const res = await getCoursesBySubject(subject.id);
                if (res.status) {
                    setCourses(toArray<Course>(res.response));
                } else {
                    setError(res.message ?? t("errors.loadCourses"));
                    setCourses([]);
                }
            } catch (e: any) {
                setError(e?.message ?? t("errors.generic"));
                setCourses([]);
            } finally {
                setLoadingCourses(false);
            }
        },
        [t],
    );

    const loadDetail = useCallback(
        async (course: Course) => {
            setLoadingDetail(true);
            setError(null);
            setCourseSummary(null);
            setCourseMindmap(null);
            setCourseImage(null);

            try {
                const [summaryRes, mindmapRes] = await Promise.all([
                    getSummaryByCourse(course.id),
                    getMindMapByCourseId(course.id),
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
                    setCourseSummary(loadedSummary);
                }

                /* ---- Mindmap ---- */
                let mm: Mindmap | null = null;
                if (mindmapRes.status) {
                    const raw: any = mindmapRes.response;
                    mm =
                        unwrapEntity<Mindmap>(raw) ??
                        unwrapEntity<Mindmap>(raw?.mindmap) ??
                        unwrapEntity<Mindmap>(raw?.data?.mindmap) ??
                        unwrapEntity<Mindmap>(raw?.data) ??
                        null;
                }

                /* Fallback: mindmap embedded inside summary */
                if (!mm && loadedSummary) {
                    const s: any = loadedSummary;
                    mm = s.mindmap ?? s.mindMap ?? s.Mindmap ?? null;
                }
                setCourseMindmap(mm);

                /* ---- Image (only if a summary exists) ---- */
                if (loadedSummary?.id) {
                    try {
                        const imgRes = await getSummaryImage(loadedSummary.id);
                        if (imgRes.status) {
                            const img = unwrapEntity<SummaryImage>(imgRes.response);
                            setCourseImage(img ?? null);
                        }
                    } catch {
                        setCourseImage(null);
                    }
                }
            } catch (e: any) {
                setError(e?.message ?? t("errors.generic"));
            } finally {
                setLoadingDetail(false);
            }
        },
        [t],
    );

    /* ================================================================== */
    /* Navigation handlers                                                 */
    /* ================================================================== */

    const openSubject = useCallback(
        async (subject: Subject) => {
            setSelectedSubject(subject);
            setSelectedCourse(null);
            setCourses([]);
            setCourseSummary(null);
            setCourseMindmap(null);
            setCourseImage(null);
            setSearch("");
            await loadCourses(subject);
        },
        [loadCourses],
    );

    const openCourse = useCallback(
        async (course: Course) => {
            setSelectedCourse(course);
            await loadDetail(course);
        },
        [loadDetail],
    );

    const goToSubjects = () => {
        setSelectedSubject(null);
        setSelectedCourse(null);
        setCourses([]);
        setCourseSummary(null);
        setCourseMindmap(null);
        setCourseImage(null);
        setSearch("");
    };

    const goToCourses = () => {
        setSelectedCourse(null);
        setCourseSummary(null);
        setCourseMindmap(null);
        setCourseImage(null);
    };

    const refresh = async () => {
        setRefreshing(true);
        try {
            if (selectedCourse) {
                await loadDetail(selectedCourse);
            } else if (selectedSubject) {
                await loadCourses(selectedSubject);
            } else {
                await loadSubjects();
            }
        } finally {
            setRefreshing(false);
        }
    };

    /* ================================================================== */
    /* Escape key — close lightbox                                         */
    /* ================================================================== */

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && lightboxOpen) {
                setLightboxOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxOpen]);

    /* ================================================================== */
    /* Derived                                                             */
    /* ================================================================== */

    const view: View = !selectedSubject
        ? "subjects"
        : !selectedCourse
            ? "courses"
            : "detail";

    const filteredSubjects = useMemo(() => {
        if (!search.trim()) return subjects;
        const q = search.toLowerCase();
        return subjects.filter((s) => s.name.toLowerCase().includes(q));
    }, [subjects, search]);

    const filteredCourses = useMemo(() => {
        if (!search.trim()) return courses;
        const q = search.toLowerCase();
        return courses.filter((c) => c.name.toLowerCase().includes(q));
    }, [courses, search]);

    const terms = useMemo(
        () => readTermsFromMindmap(courseMindmap),
        [courseMindmap],
    );

    const breadcrumbs = useMemo(() => {
        const list: { label: string; onClick: () => void; active: boolean }[] = [
            {
                label: t("breadcrumb.home"),
                onClick: goToSubjects,
                active: !selectedSubject,
            },
        ];

        if (selectedSubject) {
            list.push({
                label: selectedSubject.name,
                onClick: goToCourses,
                active: !selectedCourse,
            });
        }

        if (selectedCourse) {
            list.push({
                label: selectedCourse.name,
                onClick: () => { },
                active: true,
            });
        }

        return list;
    }, [selectedSubject, selectedCourse, t]);

    /* ================================================================== */
    /* Render                                                              */
    /* ================================================================== */

    return (
        <div className={styles.page}>
            <div className={styles.bgDecoration} aria-hidden />

            <div className={styles.wrapper}>
                {/* ---------- Header ---------- */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.badge}>
                            <Sparkles size={13} />
                            {t("badge")}
                        </span>
                        <h1 className={styles.title}>{t("title")}</h1>
                        <p className={styles.subtitle}>{t("subtitle")}</p>
                    </div>

                    <button
                        onClick={refresh}
                        className={styles.iconButton}
                        aria-label={t("refresh")}
                        disabled={refreshing}
                        title={t("refresh")}
                    >
                        <RefreshCw
                            size={18}
                            className={refreshing ? styles.spinning : ""}
                        />
                    </button>
                </header>

                {/* ---------- Breadcrumb ---------- */}
                {view !== "subjects" && (
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

                {/* ---------- Search (subjects + courses views) ---------- */}
                {view !== "detail" && !loadingSubjects && (
                    <div className={styles.searchBar}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={
                                view === "subjects"
                                    ? t("search.subjects")
                                    : t("search.courses")
                            }
                        />
                        {search && (
                            <button
                                type="button"
                                className={styles.searchClear}
                                onClick={() => setSearch("")}
                                aria-label={t("search.clear")}
                            >
                                <XCircle size={16} />
                            </button>
                        )}
                    </div>
                )}

                {/* ---------- Error banner ---------- */}
                {error && (
                    <div className={styles.errorBanner}>
                        <XCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* ---------- Body ---------- */}
                <AnimatePresence mode="wait">
                    {/* ============ SUBJECTS ============ */}
                    {view === "subjects" && (
                        <motion.section
                            key="subjects"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.3 }}
                        >
                            {loadingSubjects ? (
                                <div className={styles.loadingState}>
                                    <Loader2 className={styles.spinning} size={32} />
                                    <span>{t("loading.subjects")}</span>
                                </div>
                            ) : filteredSubjects.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        <BookOpen size={44} />
                                    </div>
                                    <h3>
                                        {search
                                            ? t("empty.noSubjectMatch")
                                            : t("empty.noSubjects")}
                                    </h3>
                                    <p>
                                        {search
                                            ? t("empty.tryDifferentSearch")
                                            : t("empty.noSubjectsHint")}
                                    </p>
                                </div>
                            ) : (
                                <ul className={styles.grid}>
                                    {filteredSubjects.map((subject, i) => (
                                        <motion.li
                                            key={subject.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className={styles.card}
                                            onClick={() => openSubject(subject)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    openSubject(subject);
                                                }
                                            }}
                                        >
                                            <div className={styles.cardGlow} aria-hidden />
                                            <div className={styles.cardIcon}>
                                                <BookOpen size={22} />
                                            </div>
                                            <div className={styles.cardBody}>
                                                <h3 className={styles.cardTitle}>{subject.name}</h3>
                                                <p className={styles.cardHint}>
                                                    {t("cards.openSubjects")}
                                                </p>
                                            </div>
                                            <div className={styles.cardArrow}>
                                                <ChevronRight size={18} />
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </motion.section>
                    )}

                    {/* ============ COURSES ============ */}
                    {view === "courses" && selectedSubject && (
                        <motion.section
                            key={`courses-${selectedSubject.id}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {loadingCourses ? (
                                <div className={styles.loadingState}>
                                    <Loader2 className={styles.spinning} size={32} />
                                    <span>{t("loading.courses")}</span>
                                </div>
                            ) : filteredCourses.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        <GraduationCap size={44} />
                                    </div>
                                    <h3>
                                        {search
                                            ? t("empty.noCourseMatch")
                                            : t("empty.noCourses")}
                                    </h3>
                                    <p>
                                        {search
                                            ? t("empty.tryDifferentSearch")
                                            : t("empty.noCoursesHint")}
                                    </p>
                                </div>
                            ) : (
                                <ul className={styles.courseList}>
                                    {filteredCourses.map((course, i) => (
                                        <motion.li
                                            key={course.id}
                                            layout
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className={styles.courseItem}
                                            onClick={() => openCourse(course)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    openCourse(course);
                                                }
                                            }}
                                        >
                                            <div className={styles.courseIcon}>
                                                <GraduationCap size={18} />
                                            </div>
                                            <div className={styles.courseBody}>
                                                <h3 className={styles.courseTitle}>{course.name}</h3>
                                                <p className={styles.courseHint}>
                                                    {t("cards.openCourse")}
                                                </p>
                                            </div>
                                            <ChevronRight
                                                size={18}
                                                className={styles.courseArrow}
                                            />
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </motion.section>
                    )}

                    {/* ============ DETAIL ============ */}
                    {view === "detail" && selectedCourse && (
                        <motion.section
                            key={`detail-${selectedCourse.id}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {loadingDetail ? (
                                <div className={styles.loadingState}>
                                    <Loader2 className={styles.spinning} size={32} />
                                    <span>{t("loading.detail")}</span>
                                </div>
                            ) : !courseSummary && !courseMindmap && !courseImage ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        <FileText size={44} />
                                    </div>
                                    <h3>{t("empty.noContent")}</h3>
                                    <p>{t("empty.noContentHint")}</p>
                                </div>
                            ) : (
                                <div className={styles.detailWrap}>
                                    {/* ---- Summary card (no image) ---- */}
                                    {courseSummary && (
                                        <motion.div
                                            className={styles.summaryCard}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35 }}
                                        >
                                            <div className={styles.summaryHeader}>
                                                <div className={styles.summaryHeaderIcon}>
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <h2 className={styles.summaryTitle}>
                                                        {t("summary.title")}
                                                    </h2>
                                                    <p className={styles.summarySubtitle}>
                                                        {t("summary.subtitle")}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className={styles.summaryText}>
                                                {courseSummary.text}
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* ---- Mindmap terms card ---- */}
                                    {terms.length > 0 ? (
                                        <motion.div
                                            className={styles.mindmapCard}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: 0.08 }}
                                        >
                                            <div className={styles.mindmapHeader}>
                                                <div className={styles.mindmapHeaderIcon}>
                                                    <Network size={16} />
                                                </div>
                                                <div className={styles.mindmapHeaderText}>
                                                    <h2 className={styles.mindmapTitle}>
                                                        {courseMindmap?.name || t("mindmap.title")}
                                                    </h2>
                                                    <p className={styles.mindmapSubtitle}>
                                                        {t("mindmap.subtitle")}
                                                    </p>
                                                </div>
                                                <span className={styles.mindmapCount}>
                                                    <Languages size={12} />
                                                    {terms.length} {t("mindmap.terms")}
                                                </span>
                                            </div>

                                            <ul className={styles.termsGrid}>
                                                {terms.map((term, i) => (
                                                    <motion.li
                                                        key={term._key}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className={styles.termCard}
                                                    >
                                                        <div className={styles.termHead}>
                                                            <span className={styles.termFrench}>
                                                                {term.french || "—"}
                                                            </span>
                                                            <span className={styles.termArrow} aria-hidden>
                                                                →
                                                            </span>
                                                            <span className={styles.termEnglish}>
                                                                {term.english || "—"}
                                                            </span>
                                                        </div>
                                                        {term.definition && (
                                                            <p className={styles.termDefinition}>
                                                                {term.definition}
                                                            </p>
                                                        )}
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    ) : (
                                        courseSummary &&
                                        !courseImage && (
                                            <motion.div
                                                className={styles.emptyMindmapNotice}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                <Network size={20} />
                                                <span>{t("empty.noMindmap")}</span>
                                            </motion.div>
                                        )
                                    )}

                                    {/* ---- Mindmap image section (click to enlarge) ---- */}
                                    {courseImage?.url && (
                                        <motion.div
                                            className={styles.imageSection}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: 0.15 }}
                                        >
                                            <div className={styles.imageHeader}>
                                                <div className={styles.imageHeaderIcon}>
                                                    <ImageIcon size={16} />
                                                </div>
                                                <div className={styles.imageHeaderText}>
                                                    <h2 className={styles.imageTitle}>
                                                        {t.has("image.title")
                                                            ? t("image.title")
                                                            : "Mindmap"}
                                                    </h2>
                                                    <p className={styles.imageSubtitle}>
                                                        {t.has("image.subtitle")
                                                            ? t("image.subtitle")
                                                            : "visual overview of this course"}
                                                    </p>
                                                </div>
                                                <span className={styles.imageHintChip}>
                                                    <Maximize2 size={12} />
                                                    {t.has("image.clickToZoom")
                                                        ? t("image.clickToZoom")
                                                        : "Click to enlarge"}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.imageButton}
                                                onClick={() => setLightboxOpen(true)}
                                                aria-label={
                                                    t.has("image.clickToZoom")
                                                        ? t("image.clickToZoom")
                                                        : "Click to enlarge"
                                                }
                                            >
                                                <img
                                                    src={courseImage.url}
                                                    alt={
                                                        courseSummary?.text?.slice(0, 60) ??
                                                            t.has("image.title")
                                                            ? t("image.title")
                                                            : "Mindmap"
                                                    }
                                                    className={styles.imageDisplay}
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                                <span className={styles.imageZoomBadge} aria-hidden>
                                                    <Maximize2 size={14} />
                                                </span>
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            {/* ==================== Lightbox ==================== */}
            <AnimatePresence>
                {lightboxOpen && courseImage?.url && (
                    <motion.div
                        className={styles.lightboxOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxOpen(false)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            type="button"
                            className={styles.lightboxClose}
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxOpen(false);
                            }}
                            aria-label="Close"
                            title="Close"
                        >
                            <X size={20} />
                        </button>

                        <motion.img
                            src={courseImage.url}
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