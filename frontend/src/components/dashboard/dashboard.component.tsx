"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  GraduationCap,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import styles from "./dashboard.module.css";
import { NAV_ITEMS, type NavKey } from "./nav-items";
import { useLogout } from "./use-logout";
import { getRole } from "@/utils/server/auth-api";

/* ------------------------------------------------------------------ */
/*  Grid placement mapping.                                           */
/* ------------------------------------------------------------------ */
const GRID_CLASS: Record<string, string> = {
  dashboard: styles.cardDashboard,
  statistics: styles.cardStats,
  sessions: styles.cardSessions,
  exams: styles.cardExams,
  todos: styles.cardTodos,
  profile: styles.cardProfile,
};

/* ------------------------------------------------------------------ */
/*  Dashboard Component                                               */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const shouldReduceMotion = useReducedMotion();
  const { isLoggingOut, logout } = useLogout();
  const [currentRole, setCurrentRole] = useState("");

  /* ---------------------------------------------------------------- */
  /*  Fetch current user role                                         */
  /* ---------------------------------------------------------------- */
  const fetchRole = useCallback(async () => {
    let isMounted = true;
    try {
      const role = await getRole();
      if (role && isMounted) {
        setCurrentRole(role.toLowerCase());
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = fetchRole();
    return () => {
      cleanup.then((fn) => fn());
    };
  }, [fetchRole]);

  /* ---------------------------------------------------------------- */
  /*  Pointer spotlight + tilt                                        */
  /* ---------------------------------------------------------------- */
  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (shouldReduceMotion) return;

      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);

      // Calculate tilt limits (-3deg to 3deg)
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3;

      el.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
    },
    [shouldReduceMotion],
  );

  const handlePointerLeave = useCallback((event: PointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    // Reset rotations smoothly
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    // Center spotlight gracefully
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${rect.width / 2}px`);
    el.style.setProperty("--my", `${rect.height / 2}px`);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Role helpers                                                    */
  /* ---------------------------------------------------------------- */
  const isTeacher = currentRole === "teacher" || currentRole === "admin";
  const isAdmin = currentRole === "admin";

  return (
    <main className={styles.page}>
      <div className={styles.contentWrapper}>
        {/* ---------------- Header ---------------- */}
        <motion.header
          className={styles.header}
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className={styles.badge}>
            <Sparkles size={13} />
            {t("badge")}
          </span>
          <h1 className={styles.title}>{t("title")}</h1>
          <p className={styles.subtitle}>{t("subtitle")}</p>
        </motion.header>

        {/* ---------------- Navigation Grid ---------------- */}
        <motion.nav
          className={styles.bentoGrid}
          initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
          aria-label="Dashboard Main Navigation"
        >
          {/*  Normal navigation cards */}
          {NAV_ITEMS.map(({ key, href, icon: Icon, tone }) =>
            key === "dashboard" ? null : (
              <div
                key={key}
                className={`${styles.cardWrap} ${GRID_CLASS[key] || ""}`}
              >
                <Link
                  href={href}
                  className={styles.card}
                  style={{ "--tone": tone } as CSSProperties}
                  onPointerMove={handlePointerMove}
                  onPointerLeave={handlePointerLeave}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.iconWrap} aria-hidden="true">
                      <Icon size={20} strokeWidth={2.2} />
                    </div>
                    <span className={styles.cardTag}>{t(`${key}.tag`)}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <span className={styles.cardTitle}>
                      {t(`${key}.title`)}
                    </span>
                    <span className={styles.cardDesc}>
                      {t(`${key}.description`)}
                    </span>
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.actionText}>{t("navigate")}</span>
                    <div className={styles.arrowWrap}>
                      <ArrowUpRight className={styles.arrow} size={16} />
                    </div>
                  </div>
                </Link>
              </div>
            ),
          )}

          {/*  Teacher Card */}
          {isTeacher && (
            <div className={`${styles.cardWrap} ${styles.cardTeacher}`}>
              <Link
                href="/teacher"
                className={styles.card}
                style={{ "--tone": "var(--primary)" } as CSSProperties}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrap} aria-hidden="true">
                    <GraduationCap size={20} strokeWidth={2.2} />
                  </div>
                  <span className={styles.cardTag}>{t("teacher.tag")}</span>
                </div>

                <div className={styles.cardBody}>
                  <span className={styles.cardTitle}>{t("teacher.title")}</span>
                  <span className={styles.cardDesc}>
                    {t("teacher.description")}
                  </span>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.actionText}>{t("navigate")}</span>
                  <div className={styles.arrowWrap}>
                    <ArrowUpRight className={styles.arrow} size={16} />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/*  Admin Card */}
          {isAdmin && (
            <div className={`${styles.cardWrap} ${styles.cardAdmin}`}>
              <Link
                href="/admin"
                className={styles.card}
                style={{ "--tone": "var(--error)" } as CSSProperties}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrap} aria-hidden="true">
                    <ShieldCheck size={20} strokeWidth={2.2} />
                  </div>
                  <span className={styles.cardTag}>{t("admin.tag")}</span>
                </div>

                <div className={styles.cardBody}>
                  <span className={styles.cardTitle}>{t("admin.title")}</span>
                  <span className={styles.cardDesc}>
                    {t("admin.description")}
                  </span>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.actionText}>{t("navigate")}</span>
                  <div className={styles.arrowWrap}>
                    <ArrowUpRight className={styles.arrow} size={16} />
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/*  Logout Card */}
          <div className={`${styles.cardWrap} ${styles.cardLogout}`}>
            <button
              type="button"
              onClick={logout}
              disabled={isLoggingOut}
              aria-disabled={isLoggingOut}
              className={`${styles.card} ${styles.logout}`}
              style={{ "--tone": "var(--error)" } as CSSProperties}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              <div className={styles.cardHeader}>
                <div className={styles.iconWrap} aria-hidden="true">
                  {isLoggingOut ? (
                    <Loader2 size={20} className={styles.spinner} />
                  ) : (
                    <LogOut size={20} strokeWidth={2.2} />
                  )}
                </div>
                <span className={`${styles.cardTag} ${styles.cardTagDanger}`}>
                  {t("logout.tag")}
                </span>
              </div>

              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{t("logout.title")}</span>
                <span className={styles.cardDesc}>
                  {t("logout.description")}
                </span>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.actionText}>
                  {isLoggingOut ? t("logout.signingOut") : t("logout.signOut")}
                </span>
                <div className={styles.arrowWrap}>
                  <ArrowUpRight className={styles.arrow} size={16} />
                </div>
              </div>
            </button>
          </div>
        </motion.nav>
      </div>
    </main>
  );
}
