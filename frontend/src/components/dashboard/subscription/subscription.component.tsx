"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, MotionConfig, useReducedMotion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
    CheckCircle2,
    Loader2,
    Lock,
    ShieldCheck,
    Sparkles,
    Ticket,
    AlertTriangle,
    X,
    KeyRound,
    Calendar,
    Crown,
    Clock,
    MailWarning,
    ArrowRight,
    UserCircle2,
    GraduationCap,
    BookOpen,
    Check,
} from "lucide-react";

import {
    assignUserToDemoYear,
    GetUserProfile,
    isVerifedUser,
    RedeemCode,
    revokeSubscription,
} from "@/utils/server/user-api";
import { getDemoYears } from "@/utils/server/year-api";
import styles from "./subscription.module.css";
import { User, Year } from "@/utils/types/allTypes";

export default function SubscriptionComponent() {
    const t = useTranslations("Subscription");
    const shouldReduceMotion = useReducedMotion();

    const [isMounted, setIsMounted] = useState(false);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [showRevoke, setShowRevoke] = useState(false);
    const [password, setPassword] = useState("");
    const [revoking, setRevoking] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const [activeTab, setActiveTab] = useState<"redeem" | "demo">("redeem");

    /* ------------------------------------------------------------------ */
    /*  Mount Check                                                       */
    /* ------------------------------------------------------------------ */

    useEffect(() => {
        setIsMounted(true);
    }, []);

    /* ------------------------------------------------------------------ */
    /*  Load status + profile + verification (parallel)                   */
    /* ------------------------------------------------------------------ */

    const refreshProfile = async () => {
        try {
            const profileRes = await GetUserProfile();
            if (profileRes.status && profileRes.response) {
                setUser(profileRes.response);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!isMounted) return;

        (async () => {
            try {
                const [profileRes, verifiedRes] = await Promise.all([
                    GetUserProfile(),
                    isVerifedUser(),
                ]);

                if (profileRes.status && profileRes.response) {
                    const userData: User = profileRes.response;
                    setUser(userData);
                    if (userData.isDemo && userData.demoYear && !userData.redeemCode) {
                        setActiveTab("demo");
                    }
                } else if (profileRes.message) {
                    setError(profileRes.message);
                }

                if (verifiedRes.status) {
                    setIsVerified(verifiedRes.response);
                } else {
                    setIsVerified(false);
                    setError(verifiedRes.message ?? "");
                }
            } catch (err) {
                console.error(err);
                setError(t("errors.generic"));
                setIsVerified(false);
            } finally {
                setLoading(false);
            }
        })();
    }, [isMounted, t]);

    // An activated user is strictly one with an active redeem code
    const isActivatedUser = Boolean(user?.isActive && user?.redeemCode);

    /* ------------------------------------------------------------------ */
    /*  Redeem                                                             */
    /* ------------------------------------------------------------------ */

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || submitting) return;
        setError("");
        setSubmitting(true);
        try {
            const response = await RedeemCode(code.trim());
            if (response.status) {
                setCode("");
                await refreshProfile();
            } else {
                setError(response.message ?? t("errors.redeemFailed"));
            }
        } catch (err) {
            console.error(err);
            setError(t("errors.generic"));
        } finally {
            setSubmitting(false);
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Revoke                                                             */
    /* ------------------------------------------------------------------ */

    const handleRevoke = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || revoking) return;
        setError("");
        setRevoking(true);
        try {
            const response = await revokeSubscription(password);
            if (response.status) {
                setShowRevoke(false);
                setPassword("");
                await refreshProfile();
            } else {
                setError(response.message ?? t("errors.revokeFailed"));
            }
        } catch (err) {
            console.error(err);
            setError(t("errors.generic"));
        } finally {
            setRevoking(false);
        }
    };

    const closeRevoke = () => {
        if (revoking) return;
        setShowRevoke(false);
        setPassword("");
        setError("");
    };

    if (!isMounted) {
        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */

    return (
        <MotionConfig reducedMotion="user">
            <main className={styles.page} suppressHydrationWarning>
                <div className={styles.contentWrapper}>
                    {/* Header */}
                    <motion.header
                        className={styles.header}
                        initial={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <span className={styles.badge}>
                            <Crown size={13} />
                            {t("badge")}
                        </span>
                        <h1 className={styles.title}>{t("title")}</h1>
                        <p className={styles.subtitle}>{t("subtitle")}</p>
                    </motion.header>

                    {/* Card */}
                    <motion.section
                        className={styles.card}
                        initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                        animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                    >
                        {loading || isVerified === null ? (
                            <div className={styles.loading}>
                                <Loader2 size={26} className={styles.spinner} />
                                <span>{t("loading")}</span>
                            </div>
                        ) : !isVerified ? (
                            <VerifyEmailView t={t} />
                        ) : isActivatedUser ? (
                            <ActivatedView
                                t={t}
                                user={user}
                                onRevoke={() => setShowRevoke(true)}
                            />
                        ) : (
                            <div>
                                {/* Tabs Navigation for Non-Activated Users */}
                                <div className={styles.tabsNav} role="tablist">
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === "redeem"}
                                        className={`${styles.tabItem} ${activeTab === "redeem" ? styles.tabItemActive : ""
                                            }`}
                                        onClick={() => {
                                            setActiveTab("redeem");
                                            setError("");
                                        }}
                                    >
                                        <Ticket size={16} />
                                        <span>{t("tabs.redeem")}</span>
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === "demo"}
                                        className={`${styles.tabItem} ${activeTab === "demo" ? styles.tabItemActive : ""
                                            }`}
                                        onClick={() => {
                                            setActiveTab("demo");
                                            setError("");
                                        }}
                                    >
                                        <Sparkles size={16} />
                                        <span>{t("tabs.demo")}</span>
                                        {user?.demoYear && (
                                            <span className={styles.tabActiveBadge}>
                                                {user.demoYear.name}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {activeTab === "redeem" ? (
                                    <RedeemView
                                        t={t}
                                        code={code}
                                        setCode={setCode}
                                        onSubmit={handleRedeem}
                                        submitting={submitting}
                                        user={user}
                                    />
                                ) : (
                                    <DemoView
                                        t={t}
                                        user={user}
                                        onDemoAssigned={refreshProfile}
                                    />
                                )}
                            </div>
                        )}

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    className={styles.errorBox}
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <AlertTriangle size={15} />
                                    <span>{error}</span>
                                    <button
                                        type="button"
                                        className={styles.errorClose}
                                        onClick={() => setError("")}
                                        aria-label={t("errors.dismiss")}
                                    >
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.section>
                </div>

                {/* Revoke confirmation modal */}
                <AnimatePresence>
                    {showRevoke && isVerified && (
                        <div className={styles.modalOverlay} onClick={closeRevoke}>
                            <motion.div
                                className={styles.confirmModal}
                                initial={
                                    shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }
                                }
                                animate={
                                    shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }
                                }
                                exit={
                                    shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }
                                }
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className={styles.confirmIcon}>
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className={styles.confirmTitle}>
                                    {t("revokeModal.title")}
                                </h3>
                                <p className={styles.confirmText}>
                                    {t("revokeModal.description")}
                                </p>

                                <form onSubmit={handleRevoke}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="revokePassword" className={styles.formLabel}>
                                            {t("revokeModal.passwordLabel")}
                                        </label>
                                        <div className={styles.inputWithIcon}>
                                            <KeyRound size={16} className={styles.inputIcon} />
                                            <input
                                                id="revokePassword"
                                                type="password"
                                                className={styles.formInput}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={t("revokeModal.passwordPlaceholder")}
                                                autoComplete="current-password"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.confirmActions}>
                                        <button
                                            type="button"
                                            className={styles.cancelButton}
                                            onClick={closeRevoke}
                                            disabled={revoking}
                                        >
                                            {t("revokeModal.cancel")}
                                        </button>
                                        <button
                                            type="submit"
                                            className={styles.dangerButton}
                                            disabled={revoking || !password}
                                        >
                                            {revoking ? (
                                                <>
                                                    <Loader2 size={15} className={styles.spinner} />
                                                    {t("revokeModal.revoking")}
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={15} />
                                                    {t("revokeModal.confirm")}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </MotionConfig>
    );
}

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

function formatDate(iso?: string): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function daysUntil(iso?: string): number | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const diff = d.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ------------------------------------------------------------------ */
/*  Verify email view                                                  */
/* ------------------------------------------------------------------ */

function VerifyEmailView({ t }: { t: any }) {
    return (
        <div className={styles.stateWrap}>
            <div className={`${styles.stateIcon} ${styles.stateIconWarning}`}>
                <MailWarning size={28} strokeWidth={2.2} />
            </div>

            <h2 className={styles.stateTitle}>{t("verifyRequired.title")}</h2>
            <p className={styles.stateText}>{t("verifyRequired.description")}</p>

            <ol className={styles.verifySteps}>
                <li>
                    <span className={styles.verifyStepNum}>1</span>
                    {t("verifyRequired.step1")}
                </li>
                <li>
                    <span className={styles.verifyStepNum}>2</span>
                    {t("verifyRequired.step2")}
                </li>
                <li>
                    <span className={styles.verifyStepNum}>3</span>
                    {t("verifyRequired.step3")}
                </li>
            </ol>

            <Link href="/dashboard/profile" className={styles.primaryButton}>
                <UserCircle2 size={16} />
                <span>{t("verifyRequired.cta")}</span>
                <ArrowRight size={14} />
            </Link>

            <p className={styles.verifyFootnote}>
                {t("verifyRequired.footnote")}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Activated view                                                     */
/* ------------------------------------------------------------------ */

function ActivatedView({
    t,
    user,
    onRevoke,
}: {
    t: any;
    user: User | null;
    onRevoke: () => void;
}) {
    const activation = formatDate(user?.activationDate);
    const expiry = formatDate(user?.endDate);
    const remaining = daysUntil(user?.endDate);

    const isExpiringSoon =
        remaining !== null && remaining > 0 && remaining <= 30;
    const isExpired = remaining !== null && remaining <= 0;

    return (
        <div className={styles.stateWrap}>
            <div className={`${styles.stateIcon} ${styles.stateIconSuccess}`}>
                <ShieldCheck size={28} strokeWidth={2.2} />
            </div>

            <h2 className={styles.stateTitle}>{t("activated.title")}</h2>
            <p className={styles.stateText}>{t("activated.description")}</p>

            {(activation || expiry) && (
                <div className={styles.periodCard}>
                    <div className={styles.periodRow}>
                        <div className={styles.periodItem}>
                            <div className={styles.periodIconWrap}>
                                <Calendar size={15} />
                            </div>
                            <div className={styles.periodText}>
                                <span className={styles.periodLabel}>
                                    {t("activated.activatedOn")}
                                </span>
                                <span className={styles.periodValue}>
                                    {activation ?? "—"}
                                </span>
                            </div>
                        </div>

                        <div className={styles.periodDivider} aria-hidden="true" />

                        <div className={styles.periodItem}>
                            <div className={styles.periodIconWrap}>
                                <Calendar size={15} />
                            </div>
                            <div className={styles.periodText}>
                                <span className={styles.periodLabel}>
                                    {t("activated.expiresOn")}
                                </span>
                                <span className={styles.periodValue}>{expiry ?? "—"}</span>
                            </div>
                        </div>
                    </div>

                    {remaining !== null && (
                        <div
                            className={`${styles.remainingBar} ${isExpired
                                    ? styles.remainingBarExpired
                                    : isExpiringSoon
                                        ? styles.remainingBarWarning
                                        : styles.remainingBarOk
                                }`}
                        >
                            <Clock size={13} />
                            <span>
                                {isExpired
                                    ? t("activated.expired")
                                    : remaining === 1
                                        ? t("activated.oneDayLeft")
                                        : t("activated.daysLeft", { count: remaining })}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <ul className={styles.featureList}>
                <li>
                    <CheckCircle2 size={15} /> {t("activated.feature1")}
                </li>
                <li>
                    <CheckCircle2 size={15} /> {t("activated.feature2")}
                </li>
                <li>
                    <CheckCircle2 size={15} /> {t("activated.feature3")}
                </li>
            </ul>

            <button
                type="button"
                className={styles.ghostDangerBtn}
                onClick={onRevoke}
            >
                <Lock size={15} />
                {t("activated.revoke")}
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Redeem view                                                        */
/* ------------------------------------------------------------------ */

function RedeemView({
    t,
    code,
    setCode,
    onSubmit,
    submitting,
    user,
}: {
    t: any;
    code: string;
    setCode: (v: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitting: boolean;
    user: User | null;
}) {
    return (
        <div className={styles.stateWrap}>
            <div className={`${styles.stateIcon} ${styles.stateIconAccent}`}>
                <Ticket size={28} strokeWidth={2.2} />
            </div>

            <h2 className={styles.stateTitle}>{t("inactive.title")}</h2>
            <p className={styles.stateText}>{t("inactive.description")}</p>

            {user?.demoYear && (
                <div className={styles.demoBanner}>
                    <Sparkles size={18} className={styles.demoBannerIcon} />
                    <span className={styles.demoBannerText}>
                        {t("demo.activeBanner", { year: user.demoYear.name })}
                    </span>
                </div>
            )}

            <form onSubmit={onSubmit} className={styles.redeemForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="redeemCode" className={styles.formLabel}>
                        {t("inactive.codeLabel")}
                    </label>
                    <div className={styles.inputWithIcon}>
                        <Ticket size={16} className={styles.inputIcon} />
                        <input
                            id="redeemCode"
                            type="text"
                            className={`${styles.formInput} ${styles.codeInput}`}
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder={t("inactive.codePlaceholder")}
                            autoComplete="off"
                            spellCheck={false}
                            required
                        />
                    </div>
                    <p className={styles.helper}>{t("inactive.helper")}</p>
                </div>

                <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={submitting || !code.trim()}
                >
                    {submitting ? (
                        <>
                            <Loader2 size={16} className={styles.spinner} />
                            {t("inactive.submitting")}
                        </>
                    ) : (
                        <>
                            <Ticket size={16} />
                            {t("inactive.submit")}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Demo view                                                          */
/* ------------------------------------------------------------------ */

function DemoView({
    t,
    user,
    onDemoAssigned,
}: {
    t: any;
    user: User | null;
    onDemoAssigned: () => Promise<void>;
}) {
    const [demoYears, setDemoYears] = useState<Year[]>([]);
    const [loadingYears, setLoadingYears] = useState(true);
    const [subscribingId, setSubscribingId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingYears(true);
            try {
                const res = await getDemoYears();
                if (mounted) {
                    if (res.status && Array.isArray(res.response)) {
                        setDemoYears(res.response);
                    } else {
                        setErrorMsg(res.message ?? t("errors.generic"));
                    }
                }
            } catch (err) {
                if (mounted) {
                    setErrorMsg(t("errors.generic"));
                }
            } finally {
                if (mounted) setLoadingYears(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [t]);

    const handleSelectDemoYear = async (yearId: number) => {
        if (subscribingId !== null) return;
        setSubscribingId(yearId);
        setErrorMsg("");
        setSuccessMessage("");
        try {
            const res = await assignUserToDemoYear(yearId);
            if (res.status) {
                setSuccessMessage(t("demo.success"));
                await onDemoAssigned();
            } else {
                setErrorMsg(res.message ?? t("errors.generic"));
            }
        } catch (err) {
            setErrorMsg(t("errors.generic"));
        } finally {
            setSubscribingId(null);
        }
    };

    return (
        <div className={styles.stateWrap}>
            <div className={`${styles.stateIcon} ${styles.stateIconAccent}`}>
                <GraduationCap size={28} strokeWidth={2.2} />
            </div>

            <h2 className={styles.stateTitle}>{t("demo.title")}</h2>
            <p className={styles.stateText}>{t("demo.description")}</p>

            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        className={styles.demoSuccessBox}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <CheckCircle2 size={18} color="var(--success)" />
                            <span>{successMessage}</span>
                        </div>
                        <Link href="/dashboard/sessions" className={styles.demoSessionsBtn}>
                            <span>{t("demo.goToSessions")}</span>
                            <ArrowRight size={13} />
                        </Link>
                    </motion.div>
                )}

                {errorMsg && (
                    <motion.div
                        className={styles.errorBox}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                    >
                        <AlertTriangle size={15} />
                        <span>{errorMsg}</span>
                        <button
                            type="button"
                            className={styles.errorClose}
                            onClick={() => setErrorMsg("")}
                            aria-label={t("errors.dismiss")}
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {loadingYears ? (
                <div className={styles.loading}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>{t("loading")}</span>
                </div>
            ) : demoYears.length === 0 ? (
                <p className={styles.stateText} style={{ marginTop: "1rem" }}>
                    {t("demo.noYears")}
                </p>
            ) : (
                <div className={styles.demoYearsGrid}>
                    {demoYears.map((year) => {
                        const isCurrent = user?.demoYear?.id === year.id;
                        const isBusy = subscribingId === year.id;

                        return (
                            <div
                                key={year.id}
                                className={`${styles.demoYearCard} ${isCurrent ? styles.demoYearCardActive : ""
                                    }`}
                            >
                                <div className={styles.demoYearCardHeader}>
                                    <div className={styles.demoYearIconWrap}>
                                        <BookOpen size={20} />
                                    </div>
                                    {isCurrent && (
                                        <span className={styles.demoYearActivePill}>
                                            <Check size={12} strokeWidth={3} />
                                            {t("demo.currentYear")}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className={styles.demoYearTitle}>{year.name}</h3>
                                    <p className={styles.demoYearDesc}>
                                        {t("demo.features")}
                                    </p>
                                </div>

                                {isCurrent ? (
                                    <Link
                                        href="/dashboard/sessions"
                                        className={`${styles.demoYearButton} ${styles.demoYearButtonSecondary}`}
                                    >
                                        <span>{t("demo.goToSessions")}</span>
                                        <ArrowRight size={14} />
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleSelectDemoYear(year.id)}
                                        className={`${styles.demoYearButton} ${styles.demoYearButtonPrimary}`}
                                    >
                                        {isBusy ? (
                                            <>
                                                <Loader2 size={15} className={styles.spinner} />
                                                <span>{t("demo.subscribing")}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={15} />
                                                <span>{t("demo.subscribe")}</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}