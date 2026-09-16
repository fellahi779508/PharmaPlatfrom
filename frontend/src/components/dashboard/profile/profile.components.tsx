"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Calendar,
  Save,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Send,
} from "lucide-react";

import {
  GetUserProfile,
  UpdateUserProfile,
  ChangePassword,
} from "@/utils/server/user-api";
import styles from "./profile.module.css";
import { authOtp, VerifyOTP } from "@/utils/server/auth-api";

export default function ProfilePage() {
  const t = useTranslations("profile");

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [profile, setProfile] = useState<any>(null);

  const [infoForm, setInfoForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
  });

  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [infoMessage, setInfoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [passMessage, setPassMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    const res = await GetUserProfile();
    if (res.status && res.response) {
      setProfile(res.response);
      setInfoForm({
        firstName: res.response.firstName || "",
        lastName: res.response.lastName || "",
        username: res.response.username || "",
        phone: res.response.phone || "",
      });
    }
    setIsLoading(false);
  };

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfoForm({ ...infoForm, [e.target.name]: e.target.value });
    setInfoMessage(null);
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
    setPassMessage(null);
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    setInfoMessage(null);

    const res = await UpdateUserProfile(infoForm);
    if (res.status) {
      setInfoMessage({
        type: "success",
        text: t("messages.successInfoUpdate"),
      });
      fetchProfile(); // Refresh to get updated data
    } else {
      setInfoMessage({
        type: "error",
        text: res.message || t("messages.errorInfoUpdate"),
      });
    }
    setIsSavingInfo(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMessage({ type: "error", text: t("messages.errorPassMatch") });
      return;
    }

    setIsSavingPassword(true);
    setPassMessage(null);

    const res = await ChangePassword(
      passForm.currentPassword,
      passForm.newPassword,
    );

    if (res.status) {
      setPassMessage({
        type: "success",
        text: t("messages.successPassUpdate"),
      });
      setPassForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setPassMessage({
        type: "error",
        text: res.message || t("messages.errorPassUpdate"),
      });
    }
    setIsSavingPassword(false);
  };

  async function verifyEmail() {
    setIsVerifying(true);
    setVerifyMessage(null);
    try {
      // NOTE: Depending on your authOtp signature, you might need to pass `profile.email`
      // If it uses the bearer token context, () is fine.
      const response = await authOtp();
      if (response.status) {
        setVerifyMessage({ type: "success", text: t("messages.otpSent") });
        setShowOtpInput(true);
      } else {
        setVerifyMessage({
          type: "error",
          text: response.message || t("messages.genericError"),
        });
      }
    } catch (error) {
      setVerifyMessage({ type: "error", text: t("messages.genericError") });
    } finally {
      setIsVerifying(false);
    }
  }

  async function verifyOtp() {
    if (!profile?.email || !otp) return;

    setIsSubmittingOtp(true);
    setVerifyMessage(null);
    try {
      const response = await VerifyOTP(profile.email, otp);
      if (response.status) {
        setVerifyMessage({
          type: "success",
          text: t("messages.accountVerified"),
        });
        setShowOtpInput(false);
        setOtp("");
        fetchProfile(); // Refresh to show the verified badge
      } else {
        setVerifyMessage({
          type: "error",
          text: response.message || t("messages.invalidOtp"),
        });
      }
    } catch (error) {
      setVerifyMessage({ type: "error", text: t("messages.genericError") });
    } finally {
      setIsSubmittingOtp(false);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className={styles.spinIcon} size={40} />
      </div>
    );
  }

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "";

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div className={styles.avatar}>
            <User size={40} color="var(--primary)" />
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>
              {profile?.firstName || profile?.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : t("defaultTitle")}
            </h1>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${styles.badgeRole}`}>
                <ShieldCheck size={14} /> {profile?.role?.toUpperCase()}
              </span>

              {/* Verification Block */}
              {profile?.isVerified ? (
                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                  <CheckCircle2 size={14} /> {t("verified")}
                </span>
              ) : (
                <div className={styles.verifyFlow}>
                  {!showOtpInput ? (
                    <>
                      <span
                        className={`${styles.badge} ${styles.badgeWarning}`}
                      >
                        <ShieldAlert size={14} /> {t("unverified")}
                      </span>
                      <button
                        onClick={verifyEmail}
                        disabled={isVerifying}
                        className={styles.verifyBtn}
                      >
                        {isVerifying ? (
                          <Loader2 size={12} className={styles.spinIcon} />
                        ) : (
                          <Send size={12} />
                        )}
                        {t("verifyNow")}
                      </button>
                    </>
                  ) : (
                    <div className={styles.otpGroup}>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder={t("otpPlaceholder")}
                        className={styles.otpInput}
                        maxLength={6}
                      />
                      <button
                        onClick={verifyOtp}
                        disabled={isSubmittingOtp || otp.length < 6}
                        className={styles.verifyBtn}
                      >
                        {isSubmittingOtp ? (
                          <Loader2 size={12} className={styles.spinIcon} />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        {t("submitOtp")}
                      </button>
                      <button
                        onClick={() => {
                          setShowOtpInput(false);
                          setVerifyMessage(null);
                        }}
                        className={styles.cancelBtn}
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <span className={`${styles.badge} ${styles.badgeMuted}`}>
                <Calendar size={14} /> {t("joined", { date: joinDate })}
              </span>
            </div>

            {/* Verification message popup under badges */}
            <AnimatePresence>
              {verifyMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={
                    verifyMessage.type === "success"
                      ? styles.successText
                      : styles.errorText
                  }
                >
                  {verifyMessage.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main Grid Content */}
        <div className={styles.grid}>
          {/* Form 1: Personal Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t("personalInfoTitle")}</h2>
              <p className={styles.cardSubtitle}>{t("personalInfoSubtitle")}</p>
            </div>

            <form onSubmit={handleUpdateInfo} className={styles.form}>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t("firstNameLabel")}</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={18} />
                    <input
                      type="text"
                      name="firstName"
                      value={infoForm.firstName}
                      onChange={handleInfoChange}
                      className={styles.input}
                      placeholder={t("firstNameLabel")}
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t("lastNameLabel")}</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={18} />
                    <input
                      type="text"
                      name="lastName"
                      value={infoForm.lastName}
                      onChange={handleInfoChange}
                      className={styles.input}
                      placeholder={t("lastNameLabel")}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{t("usernameLabel")}</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={18} />
                  <input
                    type="text"
                    name="username"
                    value={infoForm.username}
                    onChange={handleInfoChange}
                    className={styles.input}
                    placeholder={t("usernameLabel")}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{t("phoneLabel")}</label>
                <div className={styles.inputWrapper}>
                  <Phone className={styles.inputIcon} size={18} />
                  <input
                    type="text"
                    name="phone"
                    value={infoForm.phone}
                    onChange={handleInfoChange}
                    className={styles.input}
                    placeholder={t("phoneLabel")}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{t("emailLabel")}</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={18} />
                  <input
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className={`${styles.input} ${styles.inputDisabled}`}
                  />
                </div>
              </div>

              <AnimatePresence>
                {infoMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={
                      infoMessage.type === "success"
                        ? styles.successMessage
                        : styles.errorMessage
                    }
                  >
                    {infoMessage.type === "success" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    {infoMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSavingInfo}
                className={styles.button}
              >
                {isSavingInfo ? (
                  <Loader2 className={styles.spinIcon} size={18} />
                ) : (
                  <Save size={18} />
                )}
                {t("saveChanges")}
              </button>
            </form>
          </motion.div>

          {/* Form 2: Security & Password */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t("securityTitle")}</h2>
              <p className={styles.cardSubtitle}>{t("securitySubtitle")}</p>
            </div>

            <form onSubmit={handleChangePassword} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {t("currentPasswordLabel")}
                </label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={18} />
                  <input
                    type="password"
                    name="currentPassword"
                    value={passForm.currentPassword}
                    onChange={handlePassChange}
                    required
                    className={styles.input}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{t("newPasswordLabel")}</label>
                <div className={styles.inputWrapper}>
                  <KeyRound className={styles.inputIcon} size={18} />
                  <input
                    type="password"
                    name="newPassword"
                    value={passForm.newPassword}
                    onChange={handlePassChange}
                    required
                    minLength={8}
                    className={styles.input}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {t("confirmPasswordLabel")}
                </label>
                <div className={styles.inputWrapper}>
                  <KeyRound className={styles.inputIcon} size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passForm.confirmPassword}
                    onChange={handlePassChange}
                    required
                    minLength={8}
                    className={styles.input}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <AnimatePresence>
                {passMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={
                      passMessage.type === "success"
                        ? styles.successMessage
                        : styles.errorMessage
                    }
                  >
                    {passMessage.type === "success" ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    {passMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={
                  isSavingPassword ||
                  !passForm.currentPassword ||
                  !passForm.newPassword
                }
                className={styles.button}
              >
                {isSavingPassword ? (
                  <Loader2 className={styles.spinIcon} size={18} />
                ) : (
                  <Lock size={18} />
                )}
                {t("updatePassword")}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
