"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Moon, Sun, Globe, Menu, X } from "lucide-react";
import styles from "./topBar.module.css";
import { setLanguage } from "@/utils/server/lang-api";

export default function TopBar() {
  const t = useTranslations("topbar");
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const switchLocale = async (locale: any) => {
    // Assuming locale is like 'en', 'fr', 'ar'
    const segments = pathname.split("/").filter(Boolean);
    // Replace or add locale
    if (segments[0] && ["en", "fr", "ar"].includes(segments[0])) {
      segments[0] = locale;
      await setLanguage(locale);
      console.log("Locale switched to:", locale);
    } else {
      segments.unshift(locale);
    }
    const newPath = "/" + segments.join("/");
    router.push(newPath);
    setLangDropdownOpen(false);
  };

  const currentLocale = pathname.split("/")[1] || "en";

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo / Brand */}
        <a href="/" className={styles.logo}>
          <span className={styles.logoIcon}>💊</span>
          <span className={styles.logoText}>PharmaExam</span>
        </a>

        {/* Desktop navigation (optional; placeholders) */}
        <nav className={styles.desktopNav}>
          <a href="/dashboard" className={styles.navLink}>
            {t("dashboard")}
          </a>
          <a href="/exams" className={styles.navLink}>
            {t("exams")}
          </a>
          <a href="/dashboard/profile" className={styles.navLink}>
            {t("profile")}
          </a>
        </nav>

        {/* Actions: theme toggle, language switcher */}
        <div className={styles.actions}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={styles.iconButton}
            aria-label={
              theme === "light" ? t("switchToDark") : t("switchToLight")
            }
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Language switcher */}
          <div className={styles.langWrapper}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={styles.iconButton}
              aria-label={t("changeLanguage")}
            >
              <Globe size={20} />
              <span className={styles.langCode}>
                {currentLocale.toUpperCase()}
              </span>
            </button>

            {langDropdownOpen && (
              <motion.ul
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.langDropdown}
              >
                {["en", "fr", "ar"].map((locale) => (
                  <li key={locale}>
                    <button
                      onClick={() => switchLocale(locale)}
                      className={`${styles.langOption} ${
                        currentLocale === locale ? styles.activeLang : ""
                      }`}
                    >
                      {t(`locales.${locale}`)}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`${styles.iconButton} ${styles.mobileMenuButton}`}
            aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={styles.mobileNav}
        >
          <a href="/dashboard" className={styles.mobileNavLink}>
            {t("dashboard")}
          </a>
          <a href="/exams" className={styles.mobileNavLink}>
            {t("exams")}
          </a>
          <a href="/profile" className={styles.mobileNavLink}>
            {t("profile")}
          </a>
        </motion.nav>
      )}
    </header>
  );
}
