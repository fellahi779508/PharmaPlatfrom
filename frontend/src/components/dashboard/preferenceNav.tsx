"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe2, Moon, Palette, Sun, X } from "lucide-react";

import styles from "./floating-panel.module.css";
import { Theme, useTheme } from "./use-theme";

const THEME_OPTIONS: { key: Theme; icon: typeof Sun }[] = [
  { key: "light", icon: Sun },
  { key: "dark", icon: Moon },
];

// Each language shows its own name in its own script — a locale switcher's
// options aren't translated, they're the one thing that stays constant.
const LOCALE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

/**
 * A second floating launcher, meant to sit in layout.tsx next to <QuickNav />.
 * Same interaction model — fixed trigger, modal panel, closes on Escape or
 * backdrop click — but for switching theme and language instead of pages,
 * so it opens as a compact popover rather than a full drawer.
 */
export default function PreferencesNav() {
  const t = useTranslations("PreferencesNav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  const handleLocaleChange = (next: string) => {
    if (next === locale) return;
    // Remove current locale from pathname and add new locale
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");
    router.replace(`/${next}${pathWithoutLocale}`);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${styles.triggerStart}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} /> : <Palette size={20} />}
        <span className={styles.triggerLabel}>
          {open ? t("closeLabel") : t("openLabel")}
        </span>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("heading")}
            className={`${styles.panel} ${styles.panelPopover}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelHeading}>{t("heading")}</span>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={t("closeLabel")}
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <span className={styles.sectionLabel}>
              {t("themeSectionLabel")}
            </span>
            <div
              className={styles.list}
              role="radiogroup"
              aria-label={t("themeSectionLabel")}
            >
              {THEME_OPTIONS.map(({ key, icon: Icon }) => {
                const isActive = theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ""}`}
                    style={{ "--tone": "var(--primary)" } as CSSProperties}
                    onClick={() => setTheme(key)}
                  >
                    <span className={styles.itemIcon}>
                      <Icon size={17} />
                    </span>
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{t(key)}</span>
                    </span>
                    {isActive && (
                      <Check size={16} className={styles.itemCheck} />
                    )}
                  </button>
                );
              })}
            </div>

            <span className={styles.sectionLabel}>
              {t("languageSectionLabel")}
            </span>
            <div
              className={styles.list}
              role="radiogroup"
              aria-label={t("languageSectionLabel")}
            >
              {LOCALE_OPTIONS.map(({ code, label }) => {
                const isActive = locale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ""}`}
                    style={{ "--tone": "var(--primary)" } as CSSProperties}
                    onClick={() => handleLocaleChange(code)}
                  >
                    <span className={styles.itemIcon}>
                      <Globe2 size={17} />
                    </span>
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{label}</span>
                    </span>
                    {isActive && (
                      <Check size={16} className={styles.itemCheck} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
