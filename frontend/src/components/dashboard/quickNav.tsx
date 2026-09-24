"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { useTranslations, useLocale } from "next-intl";

import {
  LayoutGrid,
  LogOut,
  Loader2,
  X,
  Globe,
  Sun,
  Moon,
  Shield,
  LayersArrowDownIcon,
  Home,
  LogIn,
  UserPlus,
} from "lucide-react";

import styles from "./quick-nav.module.css";

import { NAV_ITEMS } from "./nav-items";
import { useLogout } from "./use-logout";
import { useTheme, type Theme } from "./use-theme";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getRole, GetToken } from "@/utils/server/auth-api";
import { setLanguage } from "@/utils/server/lang-api";

type QuickNavProps = {
  variant?: "sidebar" | "topbar";
};

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
];

const THEMES: { key: Theme; icon: typeof Sun }[] = [
  { key: "light", icon: Sun },
  { key: "dark", icon: Moon },
];

/** Must match the duration of the exit animations in the CSS. */
const CLOSE_DURATION_MS = 240;

// Define unauthenticated navigation items
const UNAUTH_NAV_ITEMS = [
  { key: "home", href: "/", icon: Home, tone: "var(--primary)" },
  { key: "login", href: "/login", icon: LogIn, tone: "var(--accent)" },
  {
    key: "register",
    href: "/register",
    icon: UserPlus,
    tone: "var(--success)",
  },
];

export default function QuickNav({ variant = "sidebar" }: QuickNavProps) {
  const t = useTranslations("QuickNav");
  const tDash = useTranslations("Dashboard");

  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();

  const { isLoggingOut, logout } = useLogout();
  const { theme, setTheme } = useTheme();

  const [currentRole, setRole] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  /* ------------------------------------------------------------------ */
  /* Fetch user + token                                                  */
  /* ------------------------------------------------------------------ */

  const fetchRole = useCallback(async () => {
    try {
      const role = await getRole();
      setRole(role || "");
    } catch (error) {
      console.error("Failed to fetch user role:", error);
    }
  }, []);

  const fetchToken = useCallback(async () => {
    try {
      const fetchedToken = await GetToken();
      setToken(fetchedToken || "");
    } catch (error) {
      console.error("Failed to fetch user token:", error);
    }
  }, []);

  useEffect(() => {
    fetchRole();
    fetchToken();
  }, [fetchRole, fetchToken, open, pathname]);

  useEffect(() => {
    window.addEventListener("focus", fetchRole);
    window.addEventListener("focus", fetchToken);
    window.addEventListener("role-updated", fetchRole);
    window.addEventListener("role-updated", fetchToken);

    return () => {
      window.removeEventListener("focus", fetchRole);
      window.removeEventListener("focus", fetchToken);
      window.removeEventListener("role-updated", fetchRole);
      window.removeEventListener("role-updated", fetchToken);
    };
  }, [fetchRole, fetchToken]);

  /* ------------------------------------------------------------------ */
  /* Open / close with exit animation                                    */
  /* ------------------------------------------------------------------ */

  const openPanel = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsClosing(false);
    setOpen(true);
  }, []);

  /**
   * Starts the closing animation. The panel stays mounted for
   * CLOSE_DURATION_MS, then unmounts. Repeated calls while already
   * closing are ignored.
   */
  const closePanel = useCallback(() => {
    if (isClosing) return;

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsClosing(false);
      setOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DURATION_MS);
  }, [isClosing]);

  /* Cleanup timer on unmount */
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  /* Close whenever the person actually navigates (animates too) */
  useEffect(() => {
    if (!open) return;
    closePanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentLocale]);

  /* Focus trigger once fully closed */
  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
    }
  }, [open]);

  /* Escape-to-close, scroll lock while open */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePanel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closePanel]);

  const switchLocale = async (locale: string) => {
    if (locale === currentLocale) {
      closePanel();
      return;
    }
    await setLanguage(locale);
    router.replace(pathname, { locale });
    closePanel();
  };

  const panelVariantClass =
    variant === "sidebar" ? styles.panelSidebar : styles.panelTopbar;

  const panelClosingClass =
    variant === "sidebar"
      ? styles.panelSidebarClosing
      : styles.panelTopbarClosing;

  const triggerVisible = !open;

  return (
    <>
      {triggerVisible && (
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openPanel}
        >
          <LayoutGrid size={20} />
          {/* <span className={styles.triggerLabel}>{t("openLabel")}</span> */}
        </button>
      )}

      {open && (
        <div
          className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""
            }`}
          onClick={closePanel}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("heading")}
            className={`${styles.panel} ${panelVariantClass} ${isClosing ? panelClosingClass : ""
              }`}
            onClick={(event) => event.stopPropagation()}
          >
            {/* ---------------- Brand ---------------- */}
            {/* ---------------- Brand ---------------- */}
            <div className={styles.brand}>
              <Link
                href="/"
                className={styles.brandLink}
                onClick={closePanel}
                aria-label="PharmaSpace — home"
              >
                <span className={styles.brandLogoWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className={styles.brandLogo}
                    draggable={false}
                  />
                </span>

                <span className={styles.brandText}>
                  <span className={styles.brandName}>
                    Pharma
                    <span className={styles.brandNameAccent}>Space</span>
                  </span>
                  <span className={styles.brandTag}>{t("heading")}</span>
                </span>
              </Link>

              <button
                type="button"
                className={styles.iconButton}
                aria-label={t("closeLabel")}
                onClick={closePanel}
              >
                <X size={16} />
              </button>
            </div>

            <nav className={styles.list} aria-label={t("heading")}>
              {/* IF UNAUTHENTICATED */}
              {!token ? (
                UNAUTH_NAV_ITEMS.map(
                  ({ key, href, icon: Icon, tone }, index) => {
                    const isActive = pathname === href;

                    return (
                      <Link
                        key={key}
                        href={href}
                        className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ""
                          }`}
                        style={
                          {
                            "--tone": tone,
                            "--i": index,
                          } as CSSProperties
                        }
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className={styles.itemIcon}>
                          <Icon size={17} />
                        </span>

                        <span className={styles.itemText}>
                          <span className={styles.itemTitle}>
                            {tDash(`${key}.title`)}
                          </span>
                          <span className={styles.itemTag}>
                            {tDash(`${key}.tag`)}
                          </span>
                        </span>
                      </Link>
                    );
                  },
                )
              ) : (
                <>
                  {NAV_ITEMS.map(({ key, href, icon: Icon, tone }, index) => {
                    const isActive = pathname === href;

                    return (
                      <Link
                        key={key}
                        href={href}
                        className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ""
                          }`}
                        style={
                          {
                            "--tone": tone,
                            "--i": index,
                          } as CSSProperties
                        }
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className={styles.itemIcon}>
                          <Icon size={17} />
                        </span>

                        <span className={styles.itemText}>
                          <span className={styles.itemTitle}>
                            {tDash(`${key}.title`)}
                          </span>
                          <span className={styles.itemTag}>
                            {tDash(`${key}.tag`)}
                          </span>
                        </span>
                      </Link>
                    );
                  })}

                  {(currentRole === "admin" || currentRole === "owner") && (
                    <Link
                      key="admin"
                      href="/admin"
                      className={`${styles.item}`}
                      style={
                        {
                          "--tone": "var(--accent)",
                          "--i": NAV_ITEMS.length,
                        } as CSSProperties
                      }
                      aria-current="page"
                    >
                      <span className={styles.itemIcon}>
                        <Shield size={17} />
                      </span>

                      <span className={styles.itemText}>
                        <span className={styles.itemTitle}>
                          {tDash(`admin.title`)}
                        </span>
                        <span className={styles.itemTag}>
                          {tDash(`admin.tag`)}
                        </span>
                      </span>
                    </Link>
                  )}

                  {(currentRole === "teacher" ||
                    currentRole === "admin" ||
                    currentRole === "owner") && (
                      <Link
                        key="teacher"
                        href="/teacher"
                        className={`${styles.item}`}
                        style={
                          {
                            "--tone": "var(--accent)",
                            "--i": NAV_ITEMS.length,
                          } as CSSProperties
                        }
                        aria-current="page"
                      >
                        <span className={styles.itemIcon}>
                          <LayersArrowDownIcon size={17} />
                        </span>

                        <span className={styles.itemText}>
                          <span className={styles.itemTitle}>
                            {tDash(`teacher.title`)}
                          </span>
                          <span className={styles.itemTag}>
                            {tDash(`teacher.tag`)}
                          </span>
                        </span>
                      </Link>
                    )}
                </>
              )}
            </nav>

            <div className={styles.bottomActions}>
              {/* Theme + Language on one row */}
              <div className={styles.preferencesRow}>
                {/* Theme */}
                <div className={styles.preferenceRow}>
                  <div className={styles.langHeader}>
                    <Sun size={14} />
                    <span>{t("themeLabel", { fallback: "Theme" })}</span>
                  </div>

                  <div
                    className={styles.segmented}
                    role="radiogroup"
                    aria-label={t("themeLabel", { fallback: "Theme" })}
                  >
                    {THEMES.map(({ key, icon: Icon }) => {
                      const isActive = theme === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          aria-label={t(key, { fallback: key })}
                          className={`${styles.segment} ${isActive ? styles.segmentActive : ""
                            }`}
                          onClick={() => setTheme(key)}
                        >
                          <Icon size={15} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language */}
                <div className={styles.preferenceRow}>
                  <div className={styles.langHeader}>
                    <Globe size={14} />
                    <span>{t("language", { fallback: "Language" })}</span>
                  </div>

                  <div className={styles.langButtons}>
                    {LOCALES.map((loc) => {
                      const isActive = currentLocale === loc.code;
                      return (
                        <button
                          key={loc.code}
                          type="button"
                          onClick={() => switchLocale(loc.code)}
                          className={`${styles.langBtn} ${isActive ? styles.langBtnActive : ""
                            }`}
                          aria-pressed={isActive}
                        >
                          {loc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Logout (unchanged) */}
              {token && (
                <button
                  type="button"
                  className={`${styles.item} ${styles.logout}`}
                  style={{ "--tone": "var(--error)" } as CSSProperties}
                  onClick={logout}
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut}
                >
                  <span className={styles.itemIcon}>
                    {isLoggingOut ? (
                      <Loader2 size={17} className={styles.spin} />
                    ) : (
                      <LogOut size={17} />
                    )}
                  </span>

                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>
                      {tDash("logout.title")}
                    </span>
                    <span
                      className={`${styles.itemTag} ${styles.itemTagDanger}`}
                    >
                      {isLoggingOut
                        ? tDash("logout.signingOut")
                        : tDash("logout.signOut")}
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}