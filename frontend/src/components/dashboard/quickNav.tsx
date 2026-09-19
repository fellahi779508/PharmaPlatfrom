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

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * 1. Core Fetch Logic
   * Wrapped in useCallback so it can be safely used in multiple effects.
   */
  const fetchRole = useCallback(async () => {
    try {
      const role = await getRole();
      // Use fallback to "" so logging out properly clears the UI if role is null/undefined.
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

  /**
   * 2. Trigger on Interactions & Navigation
   * Re-evaluates role whenever the panel is opened, or the user changes routes.
   */
  useEffect(() => {
    fetchRole();
    fetchToken();
  }, [fetchRole, fetchToken, open, pathname]);

  /**
   * 3. Global & Cross-Tab Sync
   * Listens for window focus (cross-tab sync) or custom manual events emitted from other components.
   */
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

  /**
   * Close whenever the person actually navigates.
   */
  useEffect(() => {
    setOpen(false);
  }, [pathname, currentLocale]);

  useEffect(() => {
    if (open) {
      triggerRef.current?.focus();
    }
  }, [open]);

  /**
   * Escape-to-close, background scroll lock, and focus handling while open.
   */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  const switchLocale = async (locale: string) => {
    if (locale === currentLocale) {
      setOpen(false);
      return;
    }
    await setLanguage(locale);
    router.replace(pathname, { locale });
    setOpen(false);
  };

  const panelVariantClass =
    variant === "sidebar" ? styles.panelSidebar : styles.panelTopbar;

  return (
    <>
      {!open && (
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? null : <LayoutGrid size={20} />}
          <span className={styles.triggerLabel}>
            {open ? null : t("openLabel")}
          </span>
        </button>
      )}

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("heading")}
            className={`${styles.panel} ${panelVariantClass}`}
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
                /* IF AUTHENTICATED */
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

                  {currentRole === "admin" && (
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

                  {(currentRole === "teacher" || currentRole === "admin") && (
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
              {/* Theme */}
              <div className={styles.preferenceRow}>
                <div className={styles.langHeader}>
                  <Sun size={14} />
                  <span>
                    {t("themeLabel", {
                      fallback: "Theme",
                    })}
                  </span>
                </div>

                <div
                  className={styles.segmented}
                  role="radiogroup"
                  aria-label={t("themeLabel", {
                    fallback: "Theme",
                  })}
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

              {/* Logout (Only visible if token is present) */}
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
