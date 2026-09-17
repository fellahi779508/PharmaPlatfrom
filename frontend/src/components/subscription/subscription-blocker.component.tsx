"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, Lock } from "lucide-react";

import styles from "./subscription-blocker.module.css";

interface SubscriptionBlockerProps {
    /** Where the "Renew subscription" button points. */
    href?: string;
    /** Optional overrides for the copy (falls back to translations). */
    title?: string;
    description?: string;
    ctaLabel?: string;
    /** Optional second small line under the button. */
    hint?: string;
}

/**
 * Full-screen blocker overlay.
 * Renders on top of the page; the page remains visible underneath,
 * but pointer-events are captured so nothing can be clicked or typed.
 *
 * No internal logic — the parent decides whether to render it.
 */
export default function SubscriptionBlocker({
    href = "/dashboard/subscription",
    title,
    description,
    ctaLabel,
    hint,
}: SubscriptionBlockerProps) {
    const t = useTranslations("SubscriptionBlocker");
    const shouldReduceMotion = useReducedMotion();

    return (
        <div
            className={styles.overlay}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sub-blocker-title"
            aria-describedby="sub-blocker-desc"
        >
            {/* Semi-transparent blurred backdrop → contents visible but dimmed */}
            <div className={styles.backdrop} aria-hidden="true" />

            <motion.div
                className={styles.card}
                initial={
                    shouldReduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.97 }
                }
                animate={
                    shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }
                }
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                <div className={styles.iconWrap}>
                    <Lock size={22} strokeWidth={2.3} />
                </div>

                <h2 id="sub-blocker-title" className={styles.title}>
                    {title ?? t("title")}
                </h2>

                <p id="sub-blocker-desc" className={styles.description}>
                    {description ?? t("description")}
                </p>

                <Link href={href} className={styles.cta}>
                    <span>{ctaLabel ?? t("cta")}</span>
                    <ArrowRight size={16} />
                </Link>

                <div className={styles.hint}>
                    <AlertTriangle size={13} />
                    <span>{hint ?? t("hint")}</span>
                </div>
            </motion.div>
        </div>
    );
}