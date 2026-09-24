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
import { NAV_ITEMS } from "./nav-items";
import { useLogout } from "./use-logout";
import { getRole } from "@/utils/server/auth-api";
import FlashcardComponent from "../flashcard.component";

/* ------------------------------------------------------------------ */
/*  Lazy-loaded, layout-stable GIF                                    */
/* ------------------------------------------------------------------ */

function CardGif({ name }: { name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/gifs/${name}.gif`}
      alt=""
      aria-hidden="true"
      width={160}
      height={160}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      draggable={false}
      className={styles.cardGif}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Card shell — one component for every card type                    */
/* ------------------------------------------------------------------ */

interface CardShellProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
  tone: string;
  gif: string;
  index?: number;
  danger?: boolean;
  disabled?: boolean;
  isButton?: boolean;
  onPointerMove?: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (e: PointerEvent<HTMLElement>) => void;
}

function CardShell({
  href,
  onClick,
  icon,
  title,
  description,
  tag,
  tone,
  gif,
  index = 0,
  danger = false,
  disabled = false,
  isButton = false,
  onPointerMove,
  onPointerLeave,
}: CardShellProps) {
  const cardClass = `${styles.card} ${danger ? styles.logout : ""}`;

  const inner = (
    <>
      <CardGif name={gif} />

      <div className={styles.cardHeader}>
        <div className={styles.iconWrap} aria-hidden="true">
          {icon}
        </div>
        <span
          className={`${styles.cardTag} ${danger ? styles.cardTagDanger : ""}`}
        >
          {tag}
        </span>
      </div>

      <div className={styles.cardBody}>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardDesc}>{description}</span>
      </div>


    </>
  );

  const commonProps = {
    className: cardClass,
    style: { "--tone": tone } as CSSProperties,
    onPointerMove,
    onPointerLeave,
  };

  return (
    <div
      className={styles.cardWrap}
      style={{ "--i": index } as CSSProperties}
    >
      {isButton ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-disabled={disabled}
          {...commonProps}
        >
          {inner}
        </button>
      ) : (
        <Link href={href!} {...commonProps}>
          {inner}
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const shouldReduceMotion = useReducedMotion();
  const { isLoggingOut, logout } = useLogout();
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  /* ---------------- Fetch role ---------------- */
  const fetchRole = useCallback(async () => {
    try {
      const role = await getRole();
      setCurrentRole(role ? role.toLowerCase() : "");
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      setCurrentRole("");
    }
  }, []);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  /* ---------------- Pointer tilt + spotlight ---------------- */
  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (shouldReduceMotion) return;
      const el = event.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);

      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3;

      el.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
    },
    [shouldReduceMotion],
  );

  const handlePointerLeave = useCallback((event: PointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${rect.width / 2}px`);
    el.style.setProperty("--my", `${rect.height / 2}px`);
  }, []);

  /* ---------------- Role helpers ---------------- */
  const isTeacher = currentRole === "teacher" || currentRole === "admin" || currentRole === "owner";
  const isAdmin = currentRole === "admin" || currentRole === "owner";

  /* ---------------- Build list ---------------- */
  const navCards = NAV_ITEMS.filter((item) => item.key !== "dashboard");

  let cardIndex = 0;
  const nextIndex = () => cardIndex++;

  return (
    <main className={styles.page}>
      <div className={styles.contentWrapper}>
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

        <motion.nav
          className={styles.bentoGrid}
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          aria-label="Dashboard Main Navigation"
        >
          {navCards.map(({ key, href, icon: Icon, tone }) => (
            <CardShell
              key={key}
              href={href}
              icon={<Icon size={20} strokeWidth={2.2} />}
              title={t(`${key}.title`)}
              description={t(`${key}.description`)}
              tag={t(`${key}.tag`)}
              tone={tone}
              gif={key}
              index={nextIndex()}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            />
          ))}

          {isTeacher && (
            <CardShell
              href="/teacher"
              icon={<GraduationCap size={20} strokeWidth={2.2} />}
              title={t("teacher.title")}
              description={t("teacher.description")}
              tag={t("teacher.tag")}
              tone="var(--primary)"
              gif="teacher"
              index={nextIndex()}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            />
          )}

          {isAdmin && (
            <CardShell
              href="/admin"
              icon={<ShieldCheck size={20} strokeWidth={2.2} />}
              title={t("admin.title")}
              description={t("admin.description")}
              tag={t("admin.tag")}
              tone="var(--error)"
              gif="admin"
              index={nextIndex()}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            />
          )}

          <CardShell
            isButton
            onClick={logout}
            disabled={isLoggingOut}
            icon={
              isLoggingOut ? (
                <Loader2 size={20} className={styles.spinner} />
              ) : (
                <LogOut size={20} strokeWidth={2.2} />
              )
            }
            title={t("logout.title")}
            description={t("logout.description")}
            tag={t("logout.tag")}
            tone="var(--error)"
            gif="logout"
            index={nextIndex()}
            danger
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          />
        </motion.nav>
      </div>
      <FlashcardComponent />
    </main>
  );
}