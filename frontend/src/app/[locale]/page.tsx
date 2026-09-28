"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  LineChart,
  Network,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import styles from "./landing.module.css";
import QuickNav from "@/components/dashboard/quickNav";

/* ------------------------------------------------------------------ */
/* Brand Icons (inline SVG — lucide has no brand logos)               */
/* ------------------------------------------------------------------ */

function TelegramIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.94 4.51a1.5 1.5 0 0 0-1.6-.22L2.9 11.42a1.5 1.5 0 0 0 .09 2.78l3.88 1.42 1.5 4.71a1.5 1.5 0 0 0 2.5.6l2.2-2.2 4.1 3.02a1.5 1.5 0 0 0 2.36-.92l3-14.7a1.5 1.5 0 0 0-.59-1.62ZM9.9 14.83l-.6 3.42-1.02-3.2 8.55-6.62-6.93 6.4Zm7.55 4.55-4.6-3.38 6.2-8.72-1.6 12.1Z" />
    </svg>
  );
}

function InstagramIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Section registry                                                   */
/* ------------------------------------------------------------------ */

type SectionId =
  | "hero"
  | "study"
  | "exams"
  | "mindmaps"
  | "progress"
  | "pricing"
  | "about"
  | "cta";

interface SectionDef {
  id: SectionId;
  layout: "hero" | "text-left" | "text-right" | "centered" | "pricing" | "about";
  gif?: string;
  icon: React.ReactNode;
  accent: string;
}

const SECTIONS: SectionDef[] = [
  { id: "hero", layout: "hero", gif: "section1.png", icon: <Sparkles size={14} />, accent: "var(--primary)" },
  { id: "study", layout: "text-left", gif: "section1.gif", icon: <BookOpen size={14} />, accent: "var(--info)" },
  { id: "exams", layout: "text-right", gif: "section2.png", icon: <Target size={14} />, accent: "var(--accent)" },
  { id: "mindmaps", layout: "text-left", gif: "section4.png", icon: <Network size={14} />, accent: "var(--success)" },
  { id: "progress", layout: "text-right", gif: "progress.png", icon: <LineChart size={14} />, accent: "var(--warning)" },
  { id: "pricing", layout: "pricing", icon: <Trophy size={14} />, accent: "var(--primary)" },
  { id: "about", layout: "about", icon: <Users size={14} />, accent: "var(--info)" },
  { id: "cta", layout: "centered", icon: <Trophy size={14} />, accent: "var(--primary)" },
];

/* ------------------------------------------------------------------ */
/* Contact constants                                                  */
/* ------------------------------------------------------------------ */

const TELEGRAM_URL = "https://t.me/+213540028596";
const TELEGRAM_DISPLAY = "0540028596";
const INSTAGRAM_URL = "https://www.instagram.com/pharmaspace_dz/";
const INSTAGRAM_DISPLAY = "@pharmaspace_dz";

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function LandingComponent() {
  const t = useTranslations("Landing");
  const shouldReduceMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    hero: null,
    study: null,
    exams: null,
    mindmaps: null,
    progress: null,
    pricing: null,
    about: null,
    cta: null,
  });

  const [activeId, setActiveId] = useState<SectionId>("hero");
  const [scrolled, setScrolled] = useState(false);

  /* -------- Track active section + header scroll -------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const scrollTop = container.scrollTop;
      setScrolled(scrollTop > 24);

      let best: SectionId = "hero";
      let bestDist = Infinity;

      SECTIONS.forEach(({ id }) => {
        const el = sectionRefs.current[id];
        if (!el) return;
        const dist = Math.abs(el.offsetTop - scrollTop);
        if (dist < bestDist) {
          bestDist = dist;
          best = id;
        }
      });

      setActiveId(best);
    };

    container.addEventListener("scroll", update, { passive: true });
    update();

    return () => container.removeEventListener("scroll", update);
  }, []);

  /* -------- Jump to a section -------- */
  const scrollTo = useCallback(
    (id: SectionId) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      el.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [shouldReduceMotion]
  );

  /* ================================================================== */
  /* Render                                                             */
  /* ================================================================== */

  return (
    <div className={styles.root}>
      <title>Pharmaspace | main</title>
      {/* ---------- Header ---------- */}
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
        <Link href="/" className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PharmaSpace" className={styles.brandLogo} />
          <span className={styles.brandName}>
            Pharma<span className={styles.brandNameAccent}>Space</span>
          </span>
        </Link>

        <nav className={styles.nav}>
          <button type="button" className={styles.navLink} onClick={() => scrollTo("study")}>
            {t("nav.study")}
          </button>
          <button type="button" className={styles.navLink} onClick={() => scrollTo("exams")}>
            {t("nav.exams")}
          </button>
          <button type="button" className={styles.navLink} onClick={() => scrollTo("mindmaps")}>
            {t("nav.mindmaps")}
          </button>
          <button type="button" className={styles.navLink} onClick={() => scrollTo("pricing")}>
            {t("nav.pricing")}
          </button>
          <button type="button" className={styles.navLink} onClick={() => scrollTo("about")}>
            {t("nav.about")}
          </button>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/login" className={styles.primaryBtn}>
            {t("sections.hero.cta")}
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* ---------- Side dot navigation ---------- */}
      {/* <nav className={styles.dots} aria-label="sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`${styles.dot} ${activeId === s.id ? styles.dotActive : ""}`}
            onClick={() => scrollTo(s.id)}
            aria-label={s.id}
            title={s.id}
          >
            <span className={styles.dotInner} style={{ backgroundColor: s.accent }} />
          </button>
        ))}
      </nav> */}

      {/* ---------- Snap-scroll sections ---------- */}
      <div ref={containerRef} className={styles.scroller}>
        {SECTIONS.map((section) => {
          const Icon = () => <>{section.icon}</>;
          const isHero = section.layout === "hero";
          const isCentered = section.layout === "centered";
          const isPricing = section.layout === "pricing";
          const isAbout = section.layout === "about";
          const textFirst = section.layout === "text-left" || isHero;
          const hasVisual = !!section.gif;

          return (
            <section
              key={section.id}
              ref={(el) => {
                sectionRefs.current[section.id] = el;
              }}
              className={`${styles.section} ${isHero
                ? styles.sectionHero
                : isCentered
                  ? styles.sectionCentered
                  : isPricing
                    ? styles.sectionCentered
                    : isAbout
                      ? styles.sectionCentered
                      : styles.sectionSplit
                }`}
              style={{ ["--section-accent" as any]: section.accent }}
            >
              {isHero ? (
                /* ============ HERO ============ */
                <div className={styles.heroGrid}>
                  <motion.div
                    className={styles.heroText}
                    initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <span className={styles.eyebrow}>
                      <Sparkles size={14} />
                      {t("sections.hero.eyebrow")}
                    </span>

                    <h1 className={styles.heroTitle}>
                      {t("sections.hero.title")}
                      <span className={styles.heroTitleAccent}>
                        {" "}
                        {t("sections.hero.titleAccent")}
                      </span>
                    </h1>

                    <p className={styles.heroSubtitle}>{t("sections.hero.subtitle")}</p>

                    <div className={styles.heroActions}>
                      <Link href="/login" className={styles.primaryBtnLarge}>
                        {t("sections.hero.cta")}
                        <ArrowRight size={16} />
                      </Link>
                      <button
                        type="button"
                        className={styles.ghostBtnLarge}
                        onClick={() => scrollTo("study")}
                      >
                        {t("sections.hero.ctaSecondary")}
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className={styles.heroMeta}>
                      <div className={styles.heroMetaItem}>
                        <Star size={16} />
                        <span>{t("sections.hero.meta1")}</span>
                      </div>
                      <div className={styles.heroMetaItem}>
                        <Users size={16} />
                        <span>{t("sections.hero.meta2")}</span>
                      </div>
                      <div className={styles.heroMetaItem}>
                        <Zap size={16} />
                        <span>{t("sections.hero.meta3")}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className={styles.heroVisual}
                    initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/gifs/${section.gif}`}
                      alt="Hero visualization"
                      loading="eager"
                      decoding="async"
                      className={styles.heroGif}
                    />
                  </motion.div>
                </div>
              ) : isPricing ? (
                /* ============ PRICING ============ */
                <motion.div
                  className={styles.pricingWrap}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className={styles.pricingHead}>
                    <span className={styles.eyebrow}>
                      <Trophy size={14} />
                      {t("sections.pricing.eyebrow")}
                    </span>
                    <h2 className={styles.splitTitle}>{t("sections.pricing.title")}</h2>
                    <p className={styles.splitSubtitle}>{t("sections.pricing.subtitle")}</p>
                  </div>

                  <div className={styles.priceCard}>
                    <span className={styles.priceBadge}>{t("sections.pricing.badge")}</span>

                    <div className={styles.pricePlanName}>{t("sections.pricing.planName")}</div>

                    <div className={styles.priceRow} dir="ltr">
                      <span className={styles.priceAmount}>
                        {t("sections.pricing.priceAmount")}
                      </span>
                      <span className={styles.priceCurrency}>
                        {t("sections.pricing.priceCurrency")}
                      </span>
                      <span className={styles.pricePeriod}>
                        {t("sections.pricing.pricePeriod")}
                      </span>
                    </div>

                    <div className={styles.priceDivider} />

                    <ul className={styles.priceFeatures}>
                      <li className={styles.priceFeature}>
                        <Check size={16} />
                        <span>{t("sections.pricing.feature1")}</span>
                      </li>
                      <li className={styles.priceFeature}>
                        <Check size={16} />
                        <span>{t("sections.pricing.feature2")}</span>
                      </li>
                      <li className={styles.priceFeature}>
                        <Check size={16} />
                        <span>{t("sections.pricing.feature3")}</span>
                      </li>
                      <li className={styles.priceFeature}>
                        <Check size={16} />
                        <span>{t("sections.pricing.feature4")}</span>
                      </li>
                      <li className={styles.priceFeature}>
                        <Check size={16} />
                        <span>{t("sections.pricing.feature5")}</span>
                      </li>
                    </ul>

                    {/* --- Contact actions (Telegram + Instagram) --- */}
                    <div className={styles.priceActions}>
                      <a
                        href={TELEGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.primaryBtnLarge} ${styles.priceBtn}`}
                      >
                        {t("sections.pricing.cta")}
                        <TelegramIcon size={16} />
                      </a>

                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.instaBtn}
                        aria-label="Instagram"
                      >
                        <InstagramIcon size={16} />
                        <span>{INSTAGRAM_DISPLAY}</span>
                      </a>
                    </div>

                    <p className={styles.priceNote}>{t("sections.pricing.note")}</p>
                  </div>
                </motion.div>
              ) : isAbout ? (
                /* ============ ABOUT US ============ */
                <motion.div
                  className={styles.aboutWrap}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className={styles.aboutHead}>
                    <span className={styles.eyebrow}>
                      <Users size={14} />
                      {t("sections.about.eyebrow")}
                    </span>
                    <h2 className={styles.splitTitle}>{t("sections.about.title")}</h2>
                    <p className={styles.splitSubtitle}>{t("sections.about.subtitle")}</p>
                  </div>

                  <p className={styles.aboutBody}>{t("sections.about.body")}</p>

                  <div className={styles.contactGrid}>
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactCard}
                    >
                      <span className={`${styles.contactIcon} ${styles.contactIconTelegram}`}>
                        <TelegramIcon size={18} />
                      </span>
                      <span className={styles.contactInfo}>
                        <span className={styles.contactLabel}>
                          {t("sections.about.telegramLabel")}
                        </span>
                        <span className={styles.contactValue} dir="ltr">
                          {TELEGRAM_DISPLAY}
                        </span>
                      </span>
                      <ArrowUpRight size={16} className={styles.contactArrow} />
                    </a>

                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.contactCard}
                    >
                      <span className={`${styles.contactIcon} ${styles.contactIconInstagram}`}>
                        <InstagramIcon size={18} />
                      </span>
                      <span className={styles.contactInfo}>
                        <span className={styles.contactLabel}>
                          {t("sections.about.instagramLabel")}
                        </span>
                        <span className={styles.contactValue} dir="ltr">
                          {INSTAGRAM_DISPLAY}
                        </span>
                      </span>
                      <ArrowUpRight size={16} className={styles.contactArrow} />
                    </a>
                  </div>
                </motion.div>
              ) : isCentered ? (
                /* ============ FINAL CTA ============ */
                <motion.div
                  className={styles.ctaBox}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className={styles.ctaIconWrap}>
                    <Trophy size={32} strokeWidth={1.5} />
                  </div>
                  <h2 className={styles.ctaTitle}>{t("sections.cta.title")}</h2>
                  <p className={styles.ctaSubtitle}>{t("sections.cta.subtitle")}</p>

                  <div className={styles.heroActions}>
                    <Link href="/register" className={styles.primaryBtnLarge}>
                      {t("sections.cta.cta")}
                      <ArrowRight size={16} />
                    </Link>
                    <Link href="/login" className={styles.ghostBtnLarge}>
                      {t("sections.cta.ctaSecondary")}
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>

                  <p className={styles.ctaFootnote}>{t("sections.cta.footnote")}</p>
                </motion.div>
              ) : (
                /* ============ SPLIT SECTIONS ============ */
                <div className={`${styles.splitGrid} ${textFirst ? "" : styles.splitReverse}`}>
                  <motion.div
                    className={styles.splitText}
                    initial={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 0, x: textFirst ? -20 : 20 }
                    }
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <span className={styles.eyebrow}>
                      <Icon />
                      {t(`sections.${section.id}.eyebrow` as any)}
                    </span>
                    <h2 className={styles.splitTitle}>
                      {t(`sections.${section.id}.title` as any)}
                    </h2>
                    <p className={styles.splitSubtitle}>
                      {t(`sections.${section.id}.subtitle` as any)}
                    </p>

                    <ul className={styles.featureList}>
                      {[1, 2, 3].map((n) => (
                        <li key={n} className={styles.featureItem}>
                          <span className={styles.featureIcon}>
                            <CheckCircle2 size={16} />
                          </span>
                          <span>{t(`sections.${section.id}.feature${n}` as any)}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/register" className={styles.inlineCta}>
                      {t(`sections.${section.id}.cta` as any)}
                      <ArrowRight size={14} />
                    </Link>
                  </motion.div>

                  {hasVisual && (
                    <motion.div
                      className={styles.splitVisual}
                      initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                      whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/gifs/${section.gif}`}
                        alt={t(`sections.${section.id}.title` as any)}
                        loading="lazy"
                        decoding="async"
                        className={styles.splitGif}
                      />
                    </motion.div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <QuickNav variant="sidebar" />
    </div>
  );
}