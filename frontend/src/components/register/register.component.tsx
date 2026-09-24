"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
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
  Phone,
} from "lucide-react";
import { Login, Register, ResendOTP, VerifyOTP } from "@/utils/server/auth-api";
import styles from "./register.module.css";

export type CreateUser = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  role: string;
};

export default function RegisterComponent() {
  const t = useTranslations("register");
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");

  const [formData, setFormData] = useState<CreateUser>({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    role: "user",
  });

  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange =
    (field: keyof CreateUser) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await Register(formData);

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
                src="/gifs/register.png"
                alt=""
                width={500}
                height={500}
                priority
                unoptimized
                className={styles.illustration}
              />
            </motion.div>

            <div className={styles.illustrationCaption}>
              <p className={styles.illustrationQuote}>
                “Your pharmacy journey starts here.”
              </p>
              <span className={styles.illustrationTag}>
                Free to join · No card required
              </span>
            </div>
          </div>
        </aside>

        {/* Form side */}
        <section className={styles.formSide}>
          {/* Brand */}
          <Link href="/" className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PharmaSpace" className={styles.brandLogo} />
            <span className={styles.brandName}>
              Pharma<span className={styles.brandNameAccent}>Space</span>
            </span>
          </Link>

          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={styles.formInner}
              >
                <header className={styles.header}>
                  <h1 className={styles.title}>{t("title")}</h1>
                  <p className={styles.subtitle}>{t("subtitle")}</p>
                </header>

                <form onSubmit={handleRegister} className={styles.form} noValidate>
                  {/* Name row */}
                  <div className={styles.nameRow}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="firstName" className={styles.label}>
                        {t("firstNameLabel")}
                      </label>
                      <div className={styles.inputWrapper}>
                        <User className={styles.inputIcon} size={18} />
                        <input
                          id="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={handleChange("firstName")}
                          placeholder={t("firstNamePlaceholder")}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label htmlFor="lastName" className={styles.label}>
                        {t("lastNameLabel")}
                      </label>
                      <div className={styles.inputWrapper}>
                        <User className={styles.inputIcon} size={18} />
                        <input
                          id="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={handleChange("lastName")}
                          placeholder={t("lastNamePlaceholder")}
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className={styles.inputGroup}>
                    <label htmlFor="username" className={styles.label}>
                      {t("usernameLabel")}
                    </label>
                    <div className={styles.inputWrapper}>
                      <User className={styles.inputIcon} size={18} />
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

                  {/* Phone */}
                  <div className={styles.inputGroup}>
                    <label htmlFor="phone" className={styles.label}>
                      {t("phoneLabel")}
                    </label>
                    <div className={styles.inputWrapper}>
                      <Phone className={styles.inputIcon} size={18} />
                      <input
                        id="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange("phone")}
                        placeholder={t("phonePlaceholder")}
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
                      <Mail className={styles.inputIcon} size={18} />
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
                      <Lock className={styles.inputIcon} size={18} />
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
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className={styles.hint}>{t("passwordHint")}</p>
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

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={styles.successMessage}
                      role="status"
                    >
                      <CheckCircle2 size={16} />
                      <span>{success}</span>
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
                        {t("registerButton")}
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                <p className={styles.signupPrompt}>
                  {t("haveAccount")}{" "}
                  <Link href="/login" className={styles.signupLink}>
                    {t("login")}
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={styles.formInner}
              >
                <header className={styles.header}>
                  <div className={styles.otpIconBadge}>
                    <KeyRound size={24} />
                  </div>
                  <h1 className={styles.title}>{t("otp.title")}</h1>
                  <p className={styles.subtitle}>
                    {t("otp.subtitle", { email: formData.email })}
                  </p>
                </header>

                <form onSubmit={handleVerifyOTP} className={styles.form}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="otp" className={styles.label}>
                      {t("otp.label")}
                    </label>
                    <div className={styles.inputWrapper}>
                      <KeyRound className={styles.inputIcon} size={18} />
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
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={styles.errorMessage}
                      role="alert"
                    >
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={styles.successMessage}
                      role="status"
                    >
                      <CheckCircle2 size={16} />
                      <span>{success}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <span className={styles.loadingSpinner} />
                    ) : (
                      <>
                        {t("otp.verifyButton")}
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>

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
                      <ArrowLeft size={15} />
                      {t("otp.backButton")}
                    </button>

                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </motion.div>
    </div>
  );
}