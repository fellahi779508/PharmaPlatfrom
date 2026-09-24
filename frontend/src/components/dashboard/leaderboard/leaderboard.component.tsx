"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
    AlertCircle,
    Crown,
    Loader2,
    RefreshCw,
    Trophy,
} from "lucide-react";

import styles from "./leaderboard.module.css";
import { GetLeaderboard } from "@/utils/server/user-api";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface LeaderboardEntry {
    username: string;
    correctAnswers: number;
}

interface CurrentUser {
    username: string;
    correctAnswers: number;
    rank: number;
}

interface LeaderboardPayload {
    leaderboard: LeaderboardEntry[];
    currentUser: CurrentUser | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const toNumber = (v: any): number => {
    const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
    return Number.isFinite(n) ? n : 0;
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function LeaderboardComponent() {
    const t = useTranslations("Leaderboard");
    const shouldReduceMotion = useReducedMotion();

    const [data, setData] = useState<LeaderboardPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (silent = false) => {
            silent ? setRefreshing(true) : setLoading(true);
            setError(null);
            try {
                const res = await GetLeaderboard();
                if (res.status && res.response) {
                    const raw = res.response as any;
                    setData({
                        leaderboard: Array.isArray(raw.leaderboard)
                            ? raw.leaderboard.map((e: any) => ({
                                username: String(e?.username ?? "—"),
                                correctAnswers: toNumber(e?.correctAnswers),
                            }))
                            : [],
                        currentUser: raw.currentUser
                            ? {
                                username: String(raw.currentUser.username ?? "—"),
                                correctAnswers: toNumber(raw.currentUser.correctAnswers),
                                rank: toNumber(raw.currentUser.rank),
                            }
                            : null,
                    });
                } else {
                    setError(res.message ?? t("errors.load"));
                }
            } catch (e: any) {
                setError(e?.message ?? t("errors.generic"));
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [t],
    );

    useEffect(() => {
        load();
    }, [load]);

    const leaderboard = data?.leaderboard ?? [];
    const currentUser = data?.currentUser ?? null;

    const topScore = useMemo(
        () => leaderboard[0]?.correctAnswers ?? 0,
        [leaderboard],
    );

    const userInTop10 = useMemo(() => {
        if (!currentUser) return false;
        return leaderboard.some((e) => e.username === currentUser.username);
    }, [leaderboard, currentUser]);

    /* ================================================================== */

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.center}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>{t("loading")}</span>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className={styles.page}>
                <div className={styles.center}>
                    <AlertCircle size={24} color="var(--error)" />
                    <span>{error ?? t("errors.generic")}</span>
                    <button className={styles.retryBtn} onClick={() => load()}>
                        <RefreshCw size={13} /> {t("retry")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.wrapper}>
                {/* ---------------- Header ---------------- */}
                <header className={styles.header}>
                    <div className={styles.headerText}>
                        <h1 className={styles.title}>{t("title")}</h1>
                        <p className={styles.subtitle}>{t("subtitle")}</p>
                    </div>

                    <button
                        onClick={() => load(true)}
                        className={styles.iconButton}
                        aria-label={t("refresh")}
                        title={t("refresh")}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? styles.spinning : ""}
                        />
                    </button>
                </header>

                {/* ---------------- Empty ---------------- */}
                {leaderboard.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Trophy size={26} />
                        </div>
                        <h3>{t("empty.title")}</h3>
                        <p>{t("empty.subtitle")}</p>
                    </div>
                )}

                {/* ---------------- Board ---------------- */}
                {leaderboard.length > 0 && (
                    <div className={styles.board}>
                        {/* Column labels */}
                        <div className={styles.boardHeader}>
                            <span className={styles.colRank}>{t("columns.rank")}</span>
                            <span />
                            <span>{t("columns.player")}</span>
                            <span className={styles.colScore}>{t("columns.score")}</span>
                        </div>

                        <ul className={styles.list}>
                            {leaderboard.map((entry, i) => {
                                const rank = i + 1;
                                const isCurrentUser =
                                    currentUser?.username === entry.username;
                                const initial = entry.username.charAt(0).toUpperCase();
                                const isTop = rank <= 3;

                                return (
                                    <motion.li
                                        key={`${entry.username}-${rank}`}
                                        className={`${styles.row} ${isTop ? styles.rowTop : ""
                                            } ${isCurrentUser ? styles.rowCurrent : ""}`}
                                        initial={
                                            shouldReduceMotion ? undefined : { opacity: 0, y: 6 }
                                        }
                                        animate={
                                            shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                                        }
                                        transition={{
                                            duration: 0.3,
                                            delay: Math.min(i * 0.03, 0.25),
                                        }}
                                    >
                                        {/* Rank */}
                                        <span
                                            className={`${styles.rank} ${rank === 1 ? styles.rank1 : ""
                                                }`}
                                        >
                                            {rank === 1 ? (
                                                <Crown size={13} />
                                            ) : (
                                                <span>{rank}</span>
                                            )}
                                        </span>

                                        {/* Avatar */}
                                        <span className={styles.avatar}>{initial}</span>

                                        {/* Name */}
                                        <span className={styles.name}>
                                            <span className={styles.nameText}>
                                                {entry.username}
                                            </span>
                                            {isCurrentUser && (
                                                <span className={styles.you}>{t("you")}</span>
                                            )}
                                        </span>

                                        {/* Score */}
                                        <span className={styles.score}>
                                            <span className={styles.scoreValue}>
                                                {entry.correctAnswers.toLocaleString()}
                                            </span>
                                            <span className={styles.scoreUnit}>
                                                {t("points")}
                                            </span>
                                        </span>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* ---------------- Current user (outside top 10) ---------------- */}
                {currentUser && !userInTop10 && (
                    <motion.div
                        className={styles.myRow}
                        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                    >
                        <span className={styles.myRank}>{currentUser.rank}</span>

                        <span className={styles.avatar}>
                            {currentUser.username.charAt(0).toUpperCase()}
                        </span>

                        <span className={styles.name}>
                            <span className={styles.nameText}>
                                {currentUser.username}
                            </span>
                            <span className={styles.you}>{t("you")}</span>
                        </span>

                        <span className={styles.score}>
                            <span className={styles.scoreValue}>
                                {currentUser.correctAnswers.toLocaleString()}
                            </span>
                            <span className={styles.scoreUnit}>{t("points")}</span>
                        </span>

                        {topScore > 0 && (
                            <span className={styles.myHint}>
                                {t("toFirst", {
                                    count: Math.max(0, topScore - currentUser.correctAnswers),
                                })}
                            </span>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}