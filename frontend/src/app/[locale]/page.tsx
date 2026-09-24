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
  | "cta";

interface SectionDef {
  id: SectionId;
  layout: "hero" | "text-left" | "text-right" | "centered" | "pricing";
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
  { id: "cta", layout: "centered", icon: <Trophy size={14} />, accent: "var(--primary)" },
];

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
        </nav>

        <div className={styles.headerActions}>

          <Link href="/login" className={styles.primaryBtn}>
            {t("sections.hero.cta")}
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* ---------- Side dot navigation ---------- */}
      <nav className={styles.dots} aria-label="sections">
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
      </nav>

      {/* ---------- Snap-scroll sections ---------- */}
      <div ref={containerRef} className={styles.scroller}>
        {SECTIONS.map((section) => {
          const Icon = () => <>{section.icon}</>;
          const isHero = section.layout === "hero";
          const isCentered = section.layout === "centered";
          const isPricing = section.layout === "pricing";
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

                    <Link
                      href="/register"
                      className={`${styles.primaryBtnLarge} ${styles.priceBtn}`}
                    >
                      {t("sections.pricing.cta")}
                      <ArrowRight size={16} />
                    </Link>

                    <p className={styles.priceNote}>{t("sections.pricing.note")}</p>
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
    </div>
  );
}