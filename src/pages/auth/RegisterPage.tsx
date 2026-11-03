import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/services';
import { CountryPhoneInput, COUNTRIES } from '../../components/auth/CountryPhoneInput';
import type { Country } from '../../components/auth/CountryPhoneInput';
import { validateContactInput, validateOtpCode } from '../../utils/validators';
import { initiateGoogleSignIn } from '../../utils/googleAuth';
import {
  Store,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerStreamlined, loginGoogle, isAuthenticated, isLoading: isStoreLoading, error: storeError, clearError } = useAuthStore();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Phase: 1 = Store Name (Minimal), 2 = Contact & OTP, 3 = Account & Password
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  // Phase 1 State (Store / Brand Name)
  const [storeName, setStoreName] = useState('');
  const customSlug = '';

  // Phase 2 State (Contact & OTP)
  const [rawIdentifier, setRawIdentifier] = useState('');
  const [formattedIdentifier, setFormattedIdentifier] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Phase 3 State (Account & Password)
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const targetIdentifier = (formattedIdentifier || rawIdentifier).trim();

  // Auto-generate slug from storeName
  const derivedSlug = (customSlug || storeName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'your-store';

  // OTP resend timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Phase 1 Submit -> Proceed to Contact
  const handleStoreNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    const cleanName = storeName.trim();
    if (!cleanName || cleanName.length < 2) {
      setUiError('Please enter a shop or brand name (at least 2 characters).');
      return;
    }

    setPhase(2);
  };

  // Phase 2 Step A -> Send OTP
  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setUiError(null);
    clearError();

    const validation = validateContactInput(rawIdentifier, selectedCountry.code);
    if (!validation.isValid) {
      setUiError(validation.errorMessage || 'Please enter a valid mobile number or email.');
      return;
    }

    const validatedIdentifier = validation.cleanValue;
    setFormattedIdentifier(validatedIdentifier);

    setIsSubmitting(true);
    try {
      await api.sendOtp({
        identifier: validatedIdentifier,
        type: 'REGISTER'
      });

      setResendCooldown(45);
      setIsOtpSent(true);
    } catch (err: any) {
      setUiError(err.message || 'Failed to send verification code. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 2 Step B -> Verify OTP & Proceed to Phase 3
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);

    const otpValidation = validateOtpCode(otpCode);
    if (!otpValidation.isValid) {
      setUiError(otpValidation.errorMessage || 'Please enter the 6-digit verification code.');
      return;
    }

    const contactValidation = validateContactInput(rawIdentifier, selectedCountry.code);
    const identifierToVerify = contactValidation.isValid ? contactValidation.cleanValue : targetIdentifier;

    setIsSubmitting(true);
    try {
      await api.verifyOtp({
        identifier: identifierToVerify,
        code: otpCode.trim(),
        type: 'REGISTER'
      });

      setPhase(3);
    } catch (err: any) {
      setUiError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 3 Submit -> Complete registration & launch
  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    if (!password || password.length < 6) {
      setUiError('Password must be at least 6 characters.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setUiError('Passwords do not match.');
      return;
    }

    const contactValidation = validateContactInput(rawIdentifier, selectedCountry.code);
    const finalIdentifier = contactValidation.isValid ? contactValidation.cleanValue : targetIdentifier;

    setIsSubmitting(true);
    try {
      const res = await registerStreamlined({
        storeName: storeName.trim(),
        slug: derivedSlug,
        identifier: finalIdentifier,
        capabilityMode: 'COMMERCE',
        fullName: fullName.trim() || storeName.trim(),
        password: password.trim()
      });

      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else if (res.error) {
        setUiError(res.error);
      }
    } catch (err: any) {
      setUiError(err.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth Handler
  const handleGoogleAuth = async () => {
    setUiError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await initiateGoogleSignIn(
        async (credential) => {
          const res = await loginGoogle({ credential });
          setIsSubmitting(false);
          if (res.success) {
            navigate('/dashboard', { replace: true });
          } else if (res.error) {
            setUiError(res.error);
          }
        },
        (err) => {
          setIsSubmitting(false);
          setUiError(err);
        }
      );
    } catch (err: any) {
      setIsSubmitting(false);
      setUiError(err.message || 'Google sign-in could not be completed.');
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Brand Header */}
      <Link to="/" className="auth-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <img 
          src="/billionbiz-logo.png" 
          alt="BillionBiz" 
          style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
        />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Business Platform
        </span>
      </Link>

      {/* Main Register Card */}
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        {/* Error Alert */}
        {(uiError || storeError) && (
          <div className="auth-alert-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>{uiError || storeError}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 1: MINIMAL SHOP NAME & BRAND                       */}
        {/* ======================================================== */}
        {phase === 1 && (
          <div>
            <div className="auth-card-header">
              <h1 className="auth-card-title">Create Your Store</h1>
              <p className="auth-card-desc">
                Enter your brand or shop name to get started.
              </p>
            </div>

            <form onSubmit={handleStoreNameSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">Shop Name</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Store style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Aura Studio, Zenith Apparel"
                    className="auth-input"
                    autoFocus
                    required
                  />
                </div>
                {storeName.trim() && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                    Store link: <span style={{ color: '#083e47', fontWeight: 600 }}>{derivedSlug}.stores.chandraprakash.codes</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!storeName.trim() || storeName.trim().length < 2}
                className="auth-btn-primary"
              >
                <span>Continue</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">Or</span>
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting || isStoreLoading}
              className="auth-google-btn"
            >
              <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 2: CONTACT & VERIFICATION                          */}
        {/* ======================================================== */}
        {phase === 2 && (
          <div>
            <button
              type="button"
              onClick={() => {
                setPhase(1);
                setIsOtpSent(false);
                setOtpCode('');
                setUiError(null);
              }}
              className="auth-back-btn"
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>Back to shop name</span>
            </button>

            <div className="auth-card-header" style={{ marginTop: '0.5rem' }}>
              <h1 className="auth-card-title">
                {isOtpSent ? 'Enter Verification Code' : 'Contact Information'}
              </h1>
              <p className="auth-card-desc">
                {isOtpSent
                  ? `Enter the 6-digit code sent to ${targetIdentifier}`
                  : 'Enter your mobile number or email to secure your account.'}
              </p>
            </div>

            {!isOtpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="auth-form-group">
                  <label className="auth-label">Mobile Number or Email</label>
                  <CountryPhoneInput
                    value={rawIdentifier}
                    onChange={(raw, _isMail, formatted, country) => {
                      setRawIdentifier(raw);
                      setFormattedIdentifier(formatted);
                      if (country) setSelectedCountry(country);
                    }}
                    onCountryChange={setSelectedCountry}
                    placeholder="Enter your mobile number or email"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !rawIdentifier.trim()}
                  className="auth-btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="auth-form-group">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="auth-otp-input"
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '0.5rem', color: '#64748b' }}>
                    <button
                      type="button"
                      onClick={() => setIsOtpSent(false)}
                      style={{ color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Change contact
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={() => handleSendOtp()}
                      style={{
                        color: resendCooldown > 0 ? '#94a3b8' : '#2563eb',
                        fontWeight: 600,
                        border: 'none',
                        background: 'none',
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="auth-btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 3: SET PASSWORD & LAUNCH                           */}
        {/* ======================================================== */}
        {phase === 3 && (
          <div>
            <button
              type="button"
              onClick={() => {
                setPhase(2);
                setUiError(null);
              }}
              className="auth-back-btn"
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>Back to contact</span>
            </button>

            <div className="auth-card-header" style={{ marginTop: '0.5rem' }}>
              <h1 className="auth-card-title">Set Your Password</h1>
              <p className="auth-card-desc">
                Create a secure password for <strong style={{ color: '#083e47' }}>{storeName}</strong>.
              </p>
            </div>

            <form onSubmit={handleFinalSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">Your Full Name (Optional)</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <User style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Lock style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="auth-input"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ paddingRight: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <div className="auth-input-icon">
                    <Lock style={{ width: 18, height: 18 }} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="auth-input"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isStoreLoading || !password || password.length < 6}
                className="auth-btn-primary"
              >
                {isSubmitting || isStoreLoading ? (
                  <>
                    <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                    Launching Store...
                  </>
                ) : (
                  <>
                    <span>Create Store & Go to Dashboard</span>
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer: Sign in link */}
      <p className="auth-footer-link">
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
