"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import styles from "./login.module.css";
import { Login } from "@/utils/server/auth-api";

export default function LoginPageComponent() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await Login(email, password);
      if (response.status) {
        window.location.href = "/login";
      } else {
        setError(response.message || t("error.invalidCredentials"));
      }
    } catch (err) {
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Dot grid background */}
      <div className={styles.gridBg} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Illustration side */}
        <aside className={styles.illustrationSide}>
          <div className={styles.illustrationInner}>
            <motion.div
              className={styles.illustrationWrapper}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.55, ease: "easeOut" }}
            >
              <Image
                src="/gifs/login.gif"
                alt=""
                width={500}
                height={500}
                priority
                className={styles.illustration}
              />
            </motion.div>

            <div className={styles.illustrationCaption}>
              <p className={styles.illustrationQuote}>
                “Study smarter, not harder.”
              </p>
              <span className={styles.illustrationTag}>
                Built for pharmacy students
              </span>
            </div>
          </div>
        </aside>

        {/* Form side */}
        <section className={styles.formSide}>
          <motion.div
            className={styles.formInner}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          >
            {/* Brand */}
            <Link href="/" className={styles.brand}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="PharmaSpace" className={styles.brandLogo} />
              <span className={styles.brandName}>
                Pharma<span className={styles.brandNameAccent}>Space</span>
              </span>
            </Link>

            <header className={styles.header}>
              <h1 className={styles.title}>{t("title")}</h1>
              <p className={styles.subtitle}>{t("subtitle")}</p>
            </header>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  {t("emailLabel")}
                </label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={18} />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="password" className={styles.label}>
                    {t("passwordLabel")}
                  </label>
                  <Link href="/forgot-password" className={styles.forgotLink}>
                    {t("forgotPassword")}
                  </Link>
                </div>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={18} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorMessage}
                  role="alert"
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className={styles.loadingSpinner} />
                ) : (
                  <>
                    {t("loginButton")}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className={styles.signupPrompt}>
              {t("noAccount")}{" "}
              <Link href="/register" className={styles.signupLink}>
                {t("signup")}
              </Link>
            </p>
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
}