"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    BookOpen,
    GraduationCap,
    HelpCircle,
    Target,
    CheckCircle2,
    XCircle,
    Clock,
    PauseCircle,
    Play,
    TrendingUp,
    Award,
    Activity,
    Loader2,
    BarChart3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GetUserStats } from "@/utils/server/user-api";
import { UserStats } from "@/utils/types/allTypes";
import styles from "./statistics.module.css";

export default function StatisticsComponentPage() {
    const t = useTranslations("statistics");
    const [userStat, setUserStat] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const shouldReduceMotion = useReducedMotion();

    async function getData() {
        try {
            setLoading(true);
            const data = await GetUserStats();
            if (data.status) {
                setUserStat(data.response);
            }
        } catch (err) {
            console.error("Failed to fetch user stats:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getData();
    }, []);

    // ---- Derived calculations ----
    const sessions = userStat?.sessions ?? 0;
    const sessionsDone = userStat?.sessionsDone ?? 0;
    const sessionsInProgress = userStat?.sessionsInProgress ?? 0;
    const sessionsNotStarted = userStat?.sessionsNotStarted ?? 0;

    const exams = userStat?.exams ?? 0;
    const examsDone = userStat?.examsDone ?? 0;
    const examsInProgress = userStat?.examsInProgress ?? 0;
    const examsPaused = userStat?.examsPaused ?? 0;

    const correctAnswers = userStat?.correctAnswers ?? 0;
    const wrongAnswers = userStat?.wrongAnswers ?? 0;
    const allQuestions = userStat?.allQuestions ?? 0;

    const accuracy =
        allQuestions > 0 ? (correctAnswers / allQuestions) * 100 : 0;

    const sessionCompletionRate =
        sessions > 0 ? (sessionsDone / sessions) * 100 : 0;
    const examCompletionRate = exams > 0 ? (examsDone / exams) * 100 : 0;

    const completedActivities = sessionsDone + examsDone;
    const totalActivities = sessions + exams;
    const overallProgress =
        totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    const hasData =
        userStat &&
        (totalActivities > 0 || allQuestions > 0);

    // Donut geometry
    const RADIUS = 70;
    const CIRC = 2 * Math.PI * RADIUS;
    const correctLength = (accuracy / 100) * CIRC;

    // ---- Animation config ----
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 },
        },
    };
    const item: any = {
        hidden: shouldReduceMotion ? {} : { opacity: 0, y: 14 },
        show: shouldReduceMotion
            ? {}
            : {
                opacity: 1,
                y: 0,
                transition: { duration: 0.45, ease: "easeOut" },
            },
    };

    return (
        <main className={styles.page}>
            <div className={styles.contentWrapper}>
                {/* Header */}
                <motion.header
                    className={styles.header}
                    initial={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                    animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <span className={styles.badge}>
                        <Activity size={13} />
                        {t("badge")}
                    </span>
                    <h1 className={styles.title}>{t("title")}</h1>
                    <p className={styles.subtitle}>{t("subtitle")}</p>
                </motion.header>

                {loading ? (
                    <div className={styles.loading}>
                        <Loader2 size={32} className={styles.spinner} />
                    </div>
                ) : !hasData ? (
                    <div className={styles.emptyState}>
                        <BarChart3 size={64} className={styles.emptyStateIcon} />
                        <h2 className={styles.emptyStateTitle}>{t("noData")}</h2>
                        <p className={styles.emptyStateText}>{t("noDataText")}</p>
                    </div>
                ) : (
                    <>
                        {/* Overview stat cards */}
                        <motion.section
                            className={styles.statsGrid}
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            <StatCard
                                variants={item}
                                icon={<BookOpen size={20} strokeWidth={2.2} />}
                                accent="primary"
                                label={t("sessions")}
                                value={sessions}
                                footer={
                                    <>
                                        <span className={styles.miniDot} data-tone="success" />
                                        {sessionsDone} {t("done")}
                                        <span className={styles.dotDivider}>·</span>
                                        <Clock size={11} />
                                        {sessionsInProgress}
                                    </>
                                }
                            />
                            <StatCard
                                variants={item}
                                icon={<GraduationCap size={20} strokeWidth={2.2} />}
                                accent="accent"
                                label={t("exams")}
                                value={exams}
                                footer={
                                    <>
                                        <span className={styles.miniDot} data-tone="success" />
                                        {examsDone} {t("done")}
                                        <span className={styles.dotDivider}>·</span>
                                        <PauseCircle size={11} />
                                        {examsPaused}
                                    </>
                                }
                            />
                            <StatCard
                                variants={item}
                                icon={<HelpCircle size={20} strokeWidth={2.2} />}
                                accent="primary"
                                label={t("questions")}
                                value={allQuestions}
                                footer={
                                    <>
                                        <CheckCircle2 size={11} className={styles.iconSuccess} />
                                        {correctAnswers}
                                        <span className={styles.dotDivider}>·</span>
                                        <XCircle size={11} className={styles.iconDanger} />
                                        {wrongAnswers}
                                    </>
                                }
                            />
                            <StatCard
                                variants={item}
                                icon={<Target size={20} strokeWidth={2.2} />}
                                accent="success"
                                label={t("accuracy")}
                                value={`${accuracy.toFixed(1)}%`}
                                footer={
                                    <>
                                        <TrendingUp size={11} />
                                        {t("overallMastery")}
                                    </>
                                }
                            />
                        </motion.section>

                        {/* Charts row */}
                        <motion.section
                            className={styles.chartGrid}
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {/* Donut chart */}
                            <motion.div
                                variants={item}
                                className={styles.chartCard}
                                onPointerMove={(e) => {
                                    if (shouldReduceMotion) return;
                                    const el = e.currentTarget;
                                    const r = el.getBoundingClientRect();
                                    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
                                    el.style.setProperty("--my", `${e.clientY - r.top}px`);
                                }}
                                onPointerLeave={(e) => {
                                    const el = e.currentTarget;
                                    const r = el.getBoundingClientRect();
                                    el.style.setProperty("--mx", `${r.width / 2}px`);
                                    el.style.setProperty("--my", `${r.height / 2}px`);
                                }}
                            >
                                <div className={styles.chartCardHeader}>
                                    <div className={styles.chartCardTitleGroup}>
                                        <div className={styles.chartIcon} data-tone="success">
                                            <Target size={18} />
                                        </div>
                                        <h3 className={styles.chartCardTitle}>
                                            {t("answerAccuracy")}
                                        </h3>
                                    </div>
                                </div>

                                <div className={styles.donutWrapper}>
                                    <svg
                                        viewBox="0 0 200 200"
                                        className={styles.donut}
                                        aria-hidden="true"
                                    >
                                        {/* Base ring (wrong / remaining) */}
                                        <circle
                                            cx="100"
                                            cy="100"
                                            r={RADIUS}
                                            fill="none"
                                            stroke="color-mix(in srgb, #dc2626 22%, var(--border))"
                                            strokeWidth="16"
                                        />
                                        {/* Correct overlay */}
                                        <motion.circle
                                            cx="100"
                                            cy="100"
                                            r={RADIUS}
                                            fill="none"
                                            stroke="var(--success)"
                                            strokeWidth="16"
                                            strokeLinecap="round"
                                            strokeDasharray={CIRC}
                                            initial={{ strokeDashoffset: CIRC }}
                                            animate={{
                                                strokeDashoffset: CIRC - correctLength,
                                            }}
                                            transition={{
                                                duration: 1.3,
                                                ease: "easeOut",
                                                delay: 0.35,
                                            }}
                                            transform="rotate(-90 100 100)"
                                        />
                                    </svg>
                                    <div className={styles.donutCenter}>
                                        <span className={styles.donutValue}>
                                            {accuracy.toFixed(0)}
                                            <small>%</small>
                                        </span>
                                        <span className={styles.donutLabel}>
                                            {t("accuracy")}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.legend}>
                                    <div className={styles.legendItem}>
                                        <span
                                            className={styles.legendSwatch}
                                            data-tone="success"
                                        />
                                        <div className={styles.legendText}>
                                            <strong>{correctAnswers}</strong>
                                            <span>{t("correctAnswers")}</span>
                                        </div>
                                    </div>
                                    <div className={styles.legendItem}>
                                        <span
                                            className={styles.legendSwatch}
                                            data-tone="danger"
                                        />
                                        <div className={styles.legendText}>
                                            <strong>{wrongAnswers}</strong>
                                            <span>{t("wrongAnswers")}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Completion progress bars */}
                            <motion.div variants={item} className={styles.chartCard}>
                                <div className={styles.chartCardHeader}>
                                    <div className={styles.chartCardTitleGroup}>
                                        <div className={styles.chartIcon} data-tone="primary">
                                            <Award size={18} />
                                        </div>
                                        <h3 className={styles.chartCardTitle}>
                                            {t("completionProgress")}
                                        </h3>
                                    </div>
                                    <span className={styles.overallBadge}>
                                        {overallProgress.toFixed(0)}% {t("overall")}
                                    </span>
                                </div>

                                <ProgressRow
                                    label={t("sessionProgress")}
                                    hint={`${sessionsDone} / ${sessions}`}
                                    percent={sessionCompletionRate}
                                    tone="primary"
                                    delay={0.3}
                                />
                                <ProgressRow
                                    label={t("examProgress")}
                                    hint={`${examsDone} / ${exams}`}
                                    percent={examCompletionRate}
                                    tone="accent"
                                    delay={0.45}
                                />
                                <ProgressRow
                                    label={t("answerAccuracy")}
                                    hint={`${correctAnswers} / ${allQuestions}`}
                                    percent={accuracy}
                                    tone="success"
                                    delay={0.6}
                                />
                            </motion.div>
                        </motion.section>

                        {/* Breakdown row */}
                        <motion.section
                            className={styles.breakdownGrid}
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {/* Sessions breakdown */}
                            <motion.div variants={item} className={styles.breakdownCard}>
                                <div className={styles.breakdownHeader}>
                                    <div className={styles.breakdownIcon} data-tone="primary">
                                        <BookOpen size={16} />
                                    </div>
                                    <h3 className={styles.breakdownTitle}>
                                        {t("sessionBreakdown")}
                                    </h3>
                                    <span className={styles.breakdownTotal}>{sessions}</span>
                                </div>
                                <ul className={styles.breakdownList}>
                                    <BreakdownItem
                                        icon={<CheckCircle2 size={14} />}
                                        tone="success"
                                        label={t("done")}
                                        value={sessionsDone}
                                        total={sessions}
                                    />
                                    <BreakdownItem
                                        icon={<Clock size={14} />}
                                        tone="primary"
                                        label={t("inProgress")}
                                        value={sessionsInProgress}
                                        total={sessions}
                                    />
                                    <BreakdownItem
                                        icon={<Play size={14} />}
                                        tone="muted"
                                        label={t("notStarted")}
                                        value={sessionsNotStarted}
                                        total={sessions}
                                    />
                                </ul>
                            </motion.div>

                            {/* Exams breakdown */}
                            <motion.div variants={item} className={styles.breakdownCard}>
                                <div className={styles.breakdownHeader}>
                                    <div className={styles.breakdownIcon} data-tone="accent">
                                        <GraduationCap size={16} />
                                    </div>
                                    <h3 className={styles.breakdownTitle}>
                                        {t("examBreakdown")}
                                    </h3>
                                    <span className={styles.breakdownTotal}>{exams}</span>
                                </div>
                                <ul className={styles.breakdownList}>
                                    <BreakdownItem
                                        icon={<CheckCircle2 size={14} />}
                                        tone="success"
                                        label={t("done")}
                                        value={examsDone}
                                        total={exams}
                                    />
                                    <BreakdownItem
                                        icon={<Clock size={14} />}
                                        tone="primary"
                                        label={t("inProgress")}
                                        value={examsInProgress}
                                        total={exams}
                                    />
                                    <BreakdownItem
                                        icon={<PauseCircle size={14} />}
                                        tone="muted"
                                        label={t("paused")}
                                        value={examsPaused}
                                        total={exams}
                                    />
                                </ul>
                            </motion.div>
                        </motion.section>
                    </>
                )}
            </div>
        </main>
    );
}

/* ------------------------------------------------------------------ */
/* Local sub-components                                                */
/* ------------------------------------------------------------------ */

function StatCard({
    icon,
    label,
    value,
    footer,
    accent,
    variants,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    footer: React.ReactNode;
    accent: "primary" | "accent" | "success";
    variants: any;
}) {
    return (
        <motion.div
            variants={variants}
            className={styles.statCard}
            data-accent={accent}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
        >
            <div className={styles.statCardTop}>
                <div className={styles.statIcon}>{icon}</div>
                <span className={styles.statLabel}>{label}</span>
            </div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statFooter}>{footer}</div>
        </motion.div>
    );
}

function ProgressRow({
    label,
    hint,
    percent,
    tone,
    delay,
}: {
    label: string;
    hint: string;
    percent: number;
    tone: "primary" | "accent" | "success";
    delay: number;
}) {
    const safe = Math.max(0, Math.min(100, percent));
    return (
        <div className={styles.progressRow}>
            <div className={styles.progressRowHead}>
                <span className={styles.progressRowLabel}>{label}</span>
                <span className={styles.progressRowHint}>{hint}</span>
            </div>
            <div className={styles.progressTrack}>
                <motion.div
                    className={styles.progressBar}
                    data-tone={tone}
                    initial={{ width: 0 }}
                    animate={{ width: `${safe}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay }}
                />
            </div>
            <span className={styles.progressRowPercent}>{safe.toFixed(1)}%</span>
        </div>
    );
}

function BreakdownItem({
    icon,
    label,
    value,
    total,
    tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    total: number;
    tone: "primary" | "accent" | "success" | "muted";
}) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <li className={styles.breakdownItem} data-tone={tone}>
            <span className={styles.breakdownItemIcon}>{icon}</span>
            <span className={styles.breakdownItemLabel}>{label}</span>
            <span className={styles.breakdownItemValue}>
                <strong>{value}</strong>
                <em>{pct.toFixed(0)}%</em>
            </span>
        </li>
    );
}