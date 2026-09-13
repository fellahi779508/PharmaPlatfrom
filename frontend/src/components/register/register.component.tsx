"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { Login, Register, ResendOTP, VerifyOTP } from "@/utils/server/auth-api";
import styles from "./register.module.css";

type RegisterData = {
  username: string;
  email: string;
  password: string;
};

export default function RegisterComponent() {
  const t = useTranslations("register");
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [formData, setFormData] = useState<RegisterData>({
    username: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange =
    (field: keyof RegisterData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await Register(
        formData.username,
        formData.email,
        formData.password,
      );
      if (response.status) {
        setSuccess(t("success.otpSent"));
        setStep("otp");
        await Login(formData.email, formData.password);
      } else {
        setError(response.message || t("error.registrationFailed"));
      }
    } catch (err) {
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await VerifyOTP(formData.email, otp);
      if (response.status) {
        setSuccess(t("success.accountVerified"));
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setError(response.message || t("error.invalidOtp"));
      }
    } catch (err) {
      console.log(err);
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      const response = await ResendOTP(formData.email);
      if (response.status) {
        setSuccess(t("success.otpResent"));
      } else {
        setError(response.message || t("error.resendFailed"));
      }
    } catch (err) {
      setError(t("error.generic"));
    } finally {
      setIsResending(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundDecoration} aria-hidden="true"></div>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Form side (LEFT) */}
        <div className={styles.formSide}>
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className={styles.formWrapper}
              >
                <div className={styles.header}>
                  <h1 className={styles.title}>{t("title")}</h1>
                  <p className={styles.subtitle}>{t("subtitle")}</p>
                </div>

                <form onSubmit={handleRegister} className={styles.form}>
                  {/* Username */}
                  <div className={styles.inputGroup}>
                    <label htmlFor="username" className={styles.label}>
                      {t("usernameLabel")}
                    </label>
                    <div className={styles.inputWrapper}>
                      <User className={styles.inputIcon} size={20} />
                      <input
                        id="username"
                        type="text"
                        required
                        autoComplete="username"
                        value={formData.username}
                        onChange={handleChange("username")}
                        placeholder={t("usernamePlaceholder")}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  {/* Email */}
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
                        value={formData.email}
                        onChange={handleChange("email")}
                        placeholder={t("emailPlaceholder")}
                        className={styles.input}
                      />
                    </div>
                  </div>

                  {/* Password */}
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
                        autoComplete="new-password"
                        minLength={8}
                        value={formData.password}
                        onChange={handleChange("password")}
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
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    <p className={styles.hint}>{t("passwordHint")}</p>
                  </div>

                  {/* Error */}
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

                  {/* Success */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={styles.successMessage}
                      role="status"
                    >
                      <CheckCircle2 size={18} />
                      <span>{success}</span>
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
                        {t("registerButton")}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>
                </form>

                <p className={styles.signupPrompt}>
                  {t("haveAccount")}{" "}
                  <a href="/login" className={styles.signupLink}>
                    {t("login")}
                  </a>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className={styles.formWrapper}
              >
                <div className={styles.header}>
                  <div className={styles.otpIconBadge}>
                    <KeyRound size={28} />
                  </div>
                  <h1 className={styles.title}>{t("otp.title")}</h1>
                  <p className={styles.subtitle}>
                    {t("otp.subtitle", { email: formData.email })}
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="otp" className={styles.label}>
                      {t("otp.label")}
                    </label>
                    <div className={styles.inputWrapper}>
                      <KeyRound className={styles.inputIcon} size={20} />
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={handleOTPChange}
                        placeholder={t("otp.placeholder")}
                        className={`${styles.input} ${styles.otpInput}`}
                      />
                    </div>
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

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={styles.successMessage}
                      role="status"
                    >
                      <CheckCircle2 size={18} />
                      <span>{success}</span>
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading || otp.length !== 6}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  >
                    {isLoading ? (
                      <span className={styles.loadingSpinner}></span>
                    ) : (
                      <>
                        {t("otp.verifyButton")}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>

                  <div className={styles.otpActions}>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setError("");
                        setSuccess("");
                        setOtp("");
                      }}
                      className={styles.backButton}
                    >
                      <ArrowLeft size={16} />
                      {t("otp.backButton")}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={isResending}
                      className={styles.resendButton}
                    >
                      <RefreshCw
                        size={16}
                        className={isResending ? styles.spinning : ""}
                      />
                      {t("otp.resendButton")}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Illustration side (RIGHT — mirrored from login) */}
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
              unoptimized
              className={styles.illustration}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
