"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, Sparkles } from "lucide-react";

import styles from "./coming-soon.module.css";
import Image from "next/image";

export default function ComingSoonComponent() {
    const t = useTranslations("ComingSoon");
    const shouldReduceMotion = useReducedMotion();

    return (
        <main className={styles.page}>
            <motion.div
                className={styles.content}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Badge */}
                <span className={styles.badge}>
                    <Sparkles size={13} />
                    {t("badge")}
                </span>

                {/* Logo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Image
                    src="/logo.png"
                    alt="PharmaPlus"
                    className={styles.logo}
                    width={200}
                    height={200}
                    priority={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Title + subtitle */}
                <h1 className={styles.title}>{t("title")}</h1>






            </motion.div>
        </main>
    );
}