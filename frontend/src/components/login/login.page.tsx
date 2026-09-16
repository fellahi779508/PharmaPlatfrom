"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
  const [rememberMe, setRememberMe] = useState(false);
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
      {/* Decorative background */}
      <div className={styles.backgroundDecoration} aria-hidden="true"></div>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Illustration side */}
        <div className={styles.illustrationSide}>
          <motion.div
            className={styles.illustrationWrapper}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Image
              src="/lottieFiles/Login.svg"
              alt="Pharmacy and medical illustration"
              width={500}
              height={500}
              priority
              unoptimized // SVG animations work best without Next.js optimization
              className={styles.illustration}
            />
          </motion.div>
        </div>

        {/* Form side */}
        <div className={styles.formSide}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className={styles.header}>
              <h1 className={styles.title}>{t("title")}</h1>
              <p className={styles.subtitle}>{t("subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  {t("emailLabel")}
                </label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={20} />
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
                <label htmlFor="password" className={styles.label}>
                  {t("passwordLabel")}
                </label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={20} />
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
                    aria-label={
                      showPassword ? t("hidePassword") : t("showPassword")
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className={styles.optionsRow}>
                <a href="/forgot-password" className={styles.forgotLink}>
                  {t("forgotPassword")}
                </a>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={styles.errorMessage}
                  role="alert"
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <span className={styles.loadingSpinner}></span>
                ) : (
                  <>
                    {t("loginButton")}
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <p className={styles.signupPrompt}>
              {t("noAccount")}{" "}
              <a href="/register" className={styles.signupLink}>
                {t("signup")}
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
