'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    KeyRound,
    ShieldCheck,
} from 'lucide-react';
import { ForgotPasswordOtp, ResendOTP, VerifyOTP, verifyOtpPassword } from '@/utils/server/auth-api';
import { changePasswordByEmail, getUserByEmail } from '@/utils/server/user-api';
import styles from './forgot-password.module.css';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordComponent() {
    const t = useTranslations('forgotPassword');
    const router = useRouter();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

    /* ---------- Step 1: verify email exists + send OTP ---------- */
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const userCheck = await getUserByEmail(email);
            if (!userCheck.status || !userCheck.response) {
                setError(t('error.emailNotFound'));
                return;
            }

            const otpResponse = await ForgotPasswordOtp(email);
            if (otpResponse.status) {
                setStep('otp');
            } else {
                setError(otpResponse.message || t('error.otpSendFailed'));
            }
        } catch {
            setError(t('error.generic'));
        } finally {
            setLoading(false);
        }
    };

    /* ---------- Step 2: verify OTP ---------- */
    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await verifyOtpPassword(email, otp);
            if (response.status) {
                setStep('password');
            } else {
                setError(response.message || t('error.invalidOtp'));
            }
        } catch {
            setError(t('error.generic'));
        } finally {
            setLoading(false);
        }
    };

    /* ---------- Step 3: reset password ---------- */
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 8) {
            setError(t('error.passwordTooShort'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('error.passwordMismatch'));
            return;
        }

        setLoading(true);
        try {
            const response = await changePasswordByEmail(email, password);
            if (response.status) {
                setSuccess(t('success.passwordReset'));
                setTimeout(() => router.push('/login'), 1500);
            } else {
                setError(response.message || t('error.resetFailed'));
            }
        } catch {
            setError(t('error.generic'));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(value);
    };

    const goBack = (to: Step) => {
        setStep(to);
        setError('');
        setSuccess('');
    };

    /* ---------- Stepper ---------- */
    const steps: { id: Step }[] = [{ id: 'email' }, { id: 'otp' }, { id: 'password' }];

    return (
        <div className={styles.container}>
            <div className={styles.gridBg} aria-hidden="true" />
            <div className={styles.glow} aria-hidden="true" />

            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <Link href="/" className={styles.brand}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="PharmaSpace" className={styles.brandLogo} />
                    <span className={styles.brandName}>
                        Pharma<span className={styles.brandNameAccent}>Space</span>
                    </span>
                </Link>

                {/* Step indicator */}
                <div className={styles.stepper} aria-label={t('stepperLabel')}>
                    {steps.map((s, i) => {
                        const isActive = i === stepIndex;
                        const isComplete = i < stepIndex;
                        return (
                            <div key={s.id} className={styles.stepItem}>
                                <span
                                    className={`${styles.stepDot} ${isActive ? styles.stepDotActive : ''
                                        } ${isComplete ? styles.stepDotComplete : ''}`}
                                    aria-current={isActive ? 'step' : undefined}
                                >
                                    {isComplete ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
                                </span>
                                {i < steps.length - 1 && (
                                    <span
                                        className={`${styles.stepLine} ${isComplete ? styles.stepLineComplete : ''
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {/* ============ STEP 1 — EMAIL ============ */}
                    {step === 'email' && (
                        <motion.div
                            key="email"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={styles.formInner}
                        >
                            <header className={styles.header}>
                                <div className={styles.iconBadge}>
                                    <Mail size={22} />
                                </div>
                                <h1 className={styles.title}>{t('email.title')}</h1>
                                <p className={styles.subtitle}>{t('email.subtitle')}</p>
                            </header>

                            <form onSubmit={handleEmailSubmit} className={styles.form} noValidate>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="email" className={styles.label}>
                                        {t('email.label')}
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <Mail className={styles.inputIcon} size={18} />
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            autoFocus
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={t('email.placeholder')}
                                            className={styles.input}
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

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={loading || !email}
                                >
                                    {loading ? (
                                        <span className={styles.loadingSpinner} />
                                    ) : (
                                        <>
                                            {t('email.submit')}
                                            <ArrowRight size={17} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className={styles.footerPrompt}>
                                {t('rememberPassword')}{' '}
                                <Link href="/login" className={styles.footerLink}>
                                    {t('signIn')}
                                </Link>
                            </p>
                        </motion.div>
                    )}

                    {/* ============ STEP 2 — OTP ============ */}
                    {step === 'otp' && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={styles.formInner}
                        >
                            <header className={styles.header}>
                                <div className={styles.iconBadge}>
                                    <KeyRound size={22} />
                                </div>
                                <h1 className={styles.title}>{t('otp.title')}</h1>
                                <p className={styles.subtitle}>
                                    {t('otp.subtitle', { email })}
                                </p>
                            </header>

                            <form onSubmit={handleOtpSubmit} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="otp" className={styles.label}>
                                        {t('otp.label')}
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
                                            autoFocus
                                            value={otp}
                                            onChange={handleOtpChange}
                                            placeholder={t('otp.placeholder')}
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

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={loading || otp.length !== 6}
                                >
                                    {loading ? (
                                        <span className={styles.loadingSpinner} />
                                    ) : (
                                        <>
                                            {t('otp.submit')}
                                            <ArrowRight size={17} />
                                        </>
                                    )}
                                </button>

                                <div className={styles.stepActions}>
                                    <button
                                        type="button"
                                        onClick={() => goBack('email')}
                                        className={styles.backButton}
                                    >
                                        <ArrowLeft size={15} />
                                        {t('back')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* ============ STEP 3 — NEW PASSWORD ============ */}
                    {step === 'password' && (
                        <motion.div
                            key="password"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={styles.formInner}
                        >
                            <header className={styles.header}>
                                <div className={styles.iconBadge}>
                                    <ShieldCheck size={22} />
                                </div>
                                <h1 className={styles.title}>{t('password.title')}</h1>
                                <p className={styles.subtitle}>{t('password.subtitle')}</p>
                            </header>

                            <form onSubmit={handlePasswordSubmit} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="newPassword" className={styles.label}>
                                        {t('password.newLabel')}
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={18} />
                                        <input
                                            id="newPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            autoFocus
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={t('password.newPlaceholder')}
                                            className={styles.input}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className={styles.passwordToggle}
                                            aria-label={
                                                showPassword ? t('hidePassword') : t('showPassword')
                                            }
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label htmlFor="confirmPassword" className={styles.label}>
                                        {t('password.confirmLabel')}
                                    </label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={18} />
                                        <input
                                            id="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder={t('password.confirmPlaceholder')}
                                            className={styles.input}
                                        />
                                    </div>
                                    <p className={styles.hint}>{t('password.hint')}</p>
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
                                    disabled={loading || !password || !confirmPassword}
                                >
                                    {loading ? (
                                        <span className={styles.loadingSpinner} />
                                    ) : (
                                        <>
                                            {t('password.submit')}
                                            <ArrowRight size={17} />
                                        </>
                                    )}
                                </button>

                                <div className={styles.stepActions}>
                                    <button
                                        type="button"
                                        onClick={() => goBack('otp')}
                                        className={styles.backButton}
                                    >
                                        <ArrowLeft size={15} />
                                        {t('back')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}