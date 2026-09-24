"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    BookOpen,
    Calendar,
    ChevronDown,
    GraduationCap,
    Lightbulb,
    Maximize2,
    Pill,
    Sparkles,
    X,
} from "lucide-react";

import { getTodayFlashcard } from "@/utils/server/flashcard-api";
import styles from "./flashcard.module.css";
import { IsActived } from "@/utils/server/user-api";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface FlashcardAnswer {
    id: number;
    answer: string;
    isCorrect: boolean;
    explanation: string | null;
}

interface QcmData {
    id: number;
    question: string;
    answers: FlashcardAnswer[];
    course: { id: number; name: string } | null;
    td: { id: number; name: string } | null;
    tp: { id: number; name: string } | null;
}

interface MedicamentData {
    id: number;
    name: string;
    dci: string | null;
    therapeuticClass: string | null;
    form: string | null;
    dosage: string | null;
    indication: string | null;
    contraindications: string | null;
    sideEffects: string | null;
    posology: string | null;
    notes: string | null;
    image: { id: number; url: string; width: number; height: number } | null;
}

interface FlashcardData {
    id: number;
    date: string;
    semesterNumber: number | null;
    year: { id: number; name: string } | null;
    qcm: QcmData | null;
    medicament: MedicamentData | null;
}

/* ------------------------------------------------------------------ */
/* localStorage                                                        */
/* ------------------------------------------------------------------ */

const STORAGE_PREFIX = "pharmaplus:flashcard:seen:";

function hasSeenToday(date: string): boolean {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem(STORAGE_PREFIX + date) === "1";
    } catch {
        return false;
    }
}

function markSeenToday(date: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_PREFIX + date, "1");
    } catch {
        // ignore
    }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function FlashcardComponent() {
    const t = useTranslations("Flashcard");
    const shouldReduceMotion = useReducedMotion();

    const [card, setCard] = useState<FlashcardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [revealedQcm, setRevealedQcm] = useState(false);
    const [revealedMedicament, setRevealedMedicament] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [canRender, setCanRender] = useState(false);

    /* ---------------- Load ---------------- */

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await getTodayFlashcard();
                if (cancelled) return;

                if (res.status && res.response) {
                    const data = res.response as FlashcardData;
                    if (hasSeenToday(data.date)) {
                        setHidden(true);
                    } else {
                        setCard(data);
                    }
                }
            } catch {
                // silent
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        const getActivationStatus = async () => {
            const res = await IsActived()
            if (res.status) {
                setCanRender(res.response);
                return
            }
            setCanRender(false);
        }
        getActivationStatus()
    }, [])

    /* ---------------- Escape closes lightbox ---------------- */

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && lightboxUrl) {
                setLightboxUrl(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxUrl]);

    /* ---------------- Actions ---------------- */

    const toggleOpen = () => setOpen((v) => !v);

    const handleDismiss = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (card) markSeenToday(card.date);
            setHidden(true);
        },
        [card],
    );

    const openLightbox = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        setLightboxUrl(url);
    };

    /* ---------------- Render ---------------- */

    if (loading || hidden || !card) return null;

    const hasQcm = !!card.qcm;
    const hasMedicament = !!card.medicament;

    const correctAnswers = card.qcm?.answers.filter((a) => a.isCorrect) ?? [];
    const qcmSource =
        card.qcm?.course?.name ??
        card.qcm?.td?.name ??
        card.qcm?.tp?.name ??
        null;
    if (!canRender) return null;
    return (
        <>
            <div className={styles.root} aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                    {!open ? (
                        /* ============ COLLAPSED PILL ============ */
                        <motion.button
                            key="pill"
                            type="button"
                            className={styles.pill}
                            onClick={toggleOpen}
                            initial={
                                shouldReduceMotion ? undefined : { opacity: 0, y: -20 }
                            }
                            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                            aria-label={t("openAriaLabel")}
                        >
                            <span className={styles.pillIcon} aria-hidden>
                                <Sparkles size={14} />
                            </span>
                            <span className={styles.pillText}>
                                <span className={styles.pillLabel}>{t("badge")}</span>
                                <span className={styles.pillHint}>
                                    {hasQcm && hasMedicament
                                        ? t("pillHintBoth")
                                        : hasQcm
                                            ? t("pillHintQcm")
                                            : t("pillHintMedicament")}
                                </span>
                            </span>
                            <span className={styles.pillDot} aria-hidden />
                        </motion.button>
                    ) : (
                        /* ============ EXPANDED CARD ============ */
                        <motion.aside
                            key="card"
                            className={styles.card}
                            initial={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 0, y: -24, scale: 0.94 }
                            }
                            animate={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 1, y: 0, scale: 1 }
                            }
                            exit={
                                shouldReduceMotion
                                    ? undefined
                                    : { opacity: 0, y: -24, scale: 0.94 }
                            }
                            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                            aria-label={t("ariaLabel")}
                        >
                            <span className={styles.accentBar} aria-hidden />

                            {/* ---------- Header ---------- */}
                            <header className={styles.cardHeader}>
                                <div className={styles.headerLeft}>
                                    <span className={styles.iconWrap} aria-hidden>
                                        <Sparkles size={15} />
                                    </span>
                                    <div className={styles.headerText}>
                                        <span className={styles.eyebrow}>{t("badge")}</span>
                                        <div className={styles.metaRow}>
                                            {card.year?.name && (
                                                <span className={styles.metaChip}>
                                                    <GraduationCap size={10} />
                                                    {card.year.name}
                                                </span>
                                            )}
                                            {card.semesterNumber != null && (
                                                <span className={styles.metaChip}>
                                                    <Calendar size={10} />
                                                    {t("semester")} {card.semesterNumber}
                                                </span>
                                            )}
                                            {qcmSource && (
                                                <span className={styles.metaChip}>
                                                    <BookOpen size={10} />
                                                    {qcmSource}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={styles.closeBtn}
                                    onClick={handleDismiss}
                                    aria-label={t("hide")}
                                    title={t("hide")}
                                >
                                    <X size={14} />
                                </button>
                            </header>

                            {/* ---------- Two columns: QCM + Medicament ---------- */}
                            <div className={styles.dualBody}>
                                {/* ================ QCM side ================ */}
                                {card.qcm ? (
                                    <section className={styles.panel}>
                                        <header className={styles.panelHeader}>
                                            <span className={styles.panelIcon} aria-hidden>
                                                <Sparkles size={13} />
                                            </span>
                                            <span className={styles.panelTitle}>
                                                {t("badgeQcm")}
                                            </span>
                                        </header>

                                        <p className={styles.question}>{card.qcm.question}</p>

                                        {!revealedQcm ? (
                                            <button
                                                type="button"
                                                className={styles.revealBtn}
                                                onClick={() => setRevealedQcm(true)}
                                            >
                                                <Lightbulb size={14} />
                                                <span>{t("revealAnswer")}</span>
                                            </button>
                                        ) : (
                                            <motion.div
                                                className={styles.answerWrap}
                                                initial={
                                                    shouldReduceMotion ? undefined : { opacity: 0, y: 6 }
                                                }
                                                animate={
                                                    shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                                                }
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                            >
                                                <span className={styles.answerLabel}>
                                                    {t("correctAnswer")}
                                                </span>

                                                <ul className={styles.answerList}>
                                                    {correctAnswers.map((a) => (
                                                        <li key={a.id} className={styles.answerItem}>
                                                            {a.answer}
                                                        </li>
                                                    ))}
                                                </ul>

                                                {correctAnswers[0]?.explanation && (
                                                    <p className={styles.explanation}>
                                                        {correctAnswers[0].explanation}
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </section>
                                ) : (
                                    <section className={`${styles.panel} ${styles.panelEmpty}`}>
                                        <div className={styles.panelEmptyIcon}>
                                            <Sparkles size={22} />
                                        </div>
                                        <span className={styles.panelEmptyText}>
                                            {t("noQcmAvailable")}
                                        </span>
                                    </section>
                                )}

                                {/* ================ Medicament side ================ */}
                                {card.medicament ? (
                                    <section className={styles.panel}>
                                        <header className={styles.panelHeader}>
                                            <span className={styles.panelIcon} aria-hidden>
                                                <Pill size={13} />
                                            </span>
                                            <span className={styles.panelTitle}>
                                                {t("badgeMedicament")}
                                            </span>
                                        </header>

                                        <div className={styles.medicamentHeader}>
                                            {card.medicament.image?.url ? (
                                                <button
                                                    type="button"
                                                    className={styles.medicamentImageButton}
                                                    onClick={(e) =>
                                                        openLightbox(e, card.medicament!.image!.url)
                                                    }
                                                    aria-label={t("enlargePhoto")}
                                                    title={t("enlargePhoto")}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={card.medicament.image.url}
                                                        alt={card.medicament.name}
                                                        className={styles.medicamentImage}
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                    <span
                                                        className={styles.medicamentZoomBadge}
                                                        aria-hidden
                                                    >
                                                        <Maximize2 size={12} />
                                                    </span>
                                                </button>
                                            ) : (
                                                <div
                                                    className={styles.medicamentImagePlaceholder}
                                                    aria-hidden
                                                >
                                                    <Pill size={22} />
                                                </div>
                                            )}

                                            <div className={styles.medicamentHeading}>
                                                <h3 className={styles.medicamentName}>
                                                    {card.medicament.name}
                                                </h3>
                                                {card.medicament.dci && (
                                                    <p className={styles.medicamentDci}>
                                                        {card.medicament.dci}
                                                    </p>
                                                )}
                                                <div className={styles.medicamentChips}>
                                                    {card.medicament.therapeuticClass && (
                                                        <span className={styles.metaChip}>
                                                            {card.medicament.therapeuticClass}
                                                        </span>
                                                    )}
                                                    {card.medicament.form && (
                                                        <span className={styles.metaChip}>
                                                            {card.medicament.form}
                                                        </span>
                                                    )}
                                                    {card.medicament.dosage && (
                                                        <span className={styles.metaChip}>
                                                            {card.medicament.dosage}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {!revealedMedicament ? (
                                            <button
                                                type="button"
                                                className={styles.revealBtn}
                                                onClick={() => setRevealedMedicament(true)}
                                            >
                                                <Lightbulb size={14} />
                                                <span>{t("revealMedicament")}</span>
                                            </button>
                                        ) : (
                                            <motion.div
                                                className={styles.medicamentDetails}
                                                initial={
                                                    shouldReduceMotion ? undefined : { opacity: 0, y: 6 }
                                                }
                                                animate={
                                                    shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                                                }
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                            >
                                                {card.medicament.indication && (
                                                    <DetailBlock
                                                        label={t("fields.indication")}
                                                        value={card.medicament.indication}
                                                    />
                                                )}
                                                {card.medicament.posology && (
                                                    <DetailBlock
                                                        label={t("fields.posology")}
                                                        value={card.medicament.posology}
                                                    />
                                                )}
                                                {card.medicament.contraindications && (
                                                    <DetailBlock
                                                        label={t("fields.contraindications")}
                                                        value={card.medicament.contraindications}
                                                        tone="warning"
                                                    />
                                                )}
                                                {card.medicament.sideEffects && (
                                                    <DetailBlock
                                                        label={t("fields.sideEffects")}
                                                        value={card.medicament.sideEffects}
                                                        tone="warning"
                                                    />
                                                )}
                                                {card.medicament.notes && (
                                                    <DetailBlock
                                                        label={t("fields.notes")}
                                                        value={card.medicament.notes}
                                                    />
                                                )}
                                            </motion.div>
                                        )}
                                    </section>
                                ) : (
                                    <section className={`${styles.panel} ${styles.panelEmpty}`}>
                                        <div className={styles.panelEmptyIcon}>
                                            <Pill size={22} />
                                        </div>
                                        <span className={styles.panelEmptyText}>
                                            {t("noMedicamentAvailable")}
                                        </span>
                                    </section>
                                )}
                            </div>

                            {/* Footer collapse */}
                            <button
                                type="button"
                                className={styles.footerToggle}
                                onClick={toggleOpen}
                                aria-label={t("collapse")}
                            >
                                <ChevronDown size={14} />
                            </button>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

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
                            aria-label={t("closeLightbox")}
                            title={t("closeLightbox")}
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
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Detail block                                                        */
/* ------------------------------------------------------------------ */

function DetailBlock({
    label,
    value,
    tone = "default",
}: {
    label: string;
    value: string;
    tone?: "default" | "warning";
}) {
    return (
        <div
            className={`${styles.detailBlock} ${tone === "warning" ? styles.detailBlockWarning : ""
                }`}
        >
            <span className={styles.detailLabel}>{label}</span>
            <p className={styles.detailValue}>{value}</p>
        </div>
    );
}