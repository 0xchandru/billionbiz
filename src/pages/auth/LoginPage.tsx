import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/services';
import { CountryPhoneInput } from '../../components/auth/CountryPhoneInput';
import {
  Store,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  KeyRound,
  MessageSquare
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUnified, isAuthenticated, isLoading: isAuthLoading, error: authError, clearError } = useAuthStore();

  // Read return url if redirected from protected route
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already authenticated, redirect straight to target portal
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Phases: 1 = Single Input (Email or Mobile), 2 = Authentication (Password or OTP)
  const [phase, setPhase] = useState<1 | 2>(1);
  const [authMode, setAuthMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Input states
  const [rawIdentifier, setRawIdentifier] = useState('');
  const [isEmail, setIsEmail] = useState(true);
  const [formattedIdentifier, setFormattedIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpNotification, setDevOtpNotification] = useState<string | null>(null);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Phase 1: Submit identifier to proceed to authentication phase
  const handleIdentifierSubmit = (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    const target = formattedIdentifier || rawIdentifier;
    if (!target || target.trim().length === 0) {
      setUiError('Please enter your email or mobile number.');
      return;
    }

    setPhase(2);
    setAuthMode('PASSWORD'); // Default to password
  };

  // Switch to OTP login mode and send OTP
  const handleSwitchToOtp = async () => {
    setUiError(null);
    clearError();
    setIsSubmitting(true);

    const target = formattedIdentifier || rawIdentifier;
    try {
      const res = await api.sendOtp({
        identifier: target,
        type: 'LOGIN'
      });

      if (res.devOtpPreview) {
        setDevOtpNotification(`[Dev Mode] Verification code: ${res.devOtpPreview}`);
        setOtpCode(res.devOtpPreview);
      }

      setResendCooldown(45);
      setAuthMode('OTP');
    } catch (err: any) {
      setUiError(err.message || 'Failed to send OTP code. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    await handleSwitchToOtp();
  };

  // Phase 2: Submit password or OTP to authenticate
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    clearError();

    const target = formattedIdentifier || rawIdentifier;

    if (authMode === 'PASSWORD') {
      if (!password) {
        setUiError('Please enter your account password.');
        return;
      }
      const res = await loginUnified(target, { password });
      if (res.success) {
        navigate(res.destination || from, { replace: true });
      } else if (res.error) {
        setUiError(res.error);
      }
    } else {
      if (!otpCode || otpCode.trim().length < 4) {
        setUiError('Please enter the verification code sent to your device.');
        return;
      }
      const res = await loginUnified(target, { otp: otpCode.trim() });
      if (res.success) {
        navigate(res.destination || from, { replace: true });
      } else if (res.error) {
        setUiError(res.error);
      }
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Brand Header */}
      <Link to="/" className="auth-brand">
        <div className="auth-brand-logo">
          <Store style={{ width: 22, height: 22 }} />
        </div>
        <div className="auth-brand-text">
          <span className="auth-brand-title">BillionBiz</span>
          <span className="auth-brand-subtitle">Merchant Portal</span>
        </div>
      </Link>

      {/* Main Login Card */}
      <div className="auth-card">
        {/* Error Alert */}
        {(uiError || authError) && (
          <div className="auth-alert-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
            <span>{uiError || authError}</span>
          </div>
        )}

        {/* Dev OTP Preview */}
        {devOtpNotification && (
          <div className="auth-alert-info">
            <Sparkles style={{ width: 16, height: 16, flexShrink: 0, color: '#2563eb' }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{devOtpNotification}</span>
          </div>
        )}

        {/* PHASE 1: SINGLE INPUT FIELD (MOBILE NUMBER OR EMAIL) */}
        {phase === 1 && (
          <div>
            <div className="auth-card-header">
              <h1 className="auth-card-title">Sign In to Your Store</h1>
              <p className="auth-card-desc">
                Enter your mobile number or email address to access your merchant dashboard.
              </p>
            </div>

            <form onSubmit={handleIdentifierSubmit}>
              <div className="auth-form-group">
                <label className="auth-label">Mobile Number or Email</label>
                <CountryPhoneInput
                  value={rawIdentifier}
                  onChange={(raw, isMail, formatted) => {
                    setRawIdentifier(raw);
                    setIsEmail(isMail);
                    setFormattedIdentifier(formatted);
                  }}
                  placeholder="name@business.com or mobile number"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!rawIdentifier.trim()}
                className="auth-btn-primary"
              >
                <span>Continue</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </form>

            {/* Social Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">Or continue with</span>
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => {
                setUiError('Google Sign-In ready. In production, configure Google Client ID.');
              }}
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

        {/* PHASE 2: PASSWORD OR OTP AUTHENTICATION */}
        {phase === 2 && (
          <div>
            {/* Account pill with change button */}
            <div className="auth-account-pill">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <span style={{ color: '#64748b' }}>Signing in as:</span>
                <span style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {formattedIdentifier || rawIdentifier}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhase(1);
                  setPassword('');
                  setOtpCode('');
                }}
                style={{ color: '#2563eb', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Change
              </button>
            </div>

            {/* Mode A: Password Authentication */}
            {authMode === 'PASSWORD' && (
              <form onSubmit={handleAuthSubmit}>
                <div className="auth-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                    <Link
                      to="/forgot-password"
                      style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 500 }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <Lock style={{ width: 18, height: 18 }} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="auth-input"
                      autoFocus
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

                <button
                  type="submit"
                  disabled={isAuthLoading || !password}
                  className="auth-btn-primary"
                >
                  {isAuthLoading ? (
                    <>
                      <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In with Password
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>

                {/* Login via OTP instead button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSwitchToOtp}
                  className="auth-btn-secondary"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw style={{ width: 16, height: 16, color: '#2563eb' }} className="animate-spin" />
                      <span>Sending OTP Code...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare style={{ width: 16, height: 16, color: '#2563eb' }} />
                      <span>Login via OTP instead</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Mode B: OTP Authentication */}
            {authMode === 'OTP' && (
              <form onSubmit={handleAuthSubmit}>
                <div className="auth-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="auth-label" style={{ marginBottom: 0 }}>Enter 6-Digit OTP Code</label>
                    <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                      Sent via {isEmail ? 'Email' : 'SMS'}
                    </span>
                  </div>
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
                    <span>Code expires in 10 mins</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendOtp}
                      style={{ color: '#2563eb', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading || otpCode.length < 4}
                  className="auth-btn-primary"
                >
                  {isAuthLoading ? (
                    <>
                      <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" />
                      Verifying & Signing In...
                    </>
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>

                {/* Login with Password instead button */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('PASSWORD');
                    setOtpCode('');
                  }}
                  className="auth-btn-secondary"
                >
                  <KeyRound style={{ width: 16, height: 16, color: '#2563eb' }} />
                  <span>Login with password instead</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Security Assurance */}
        <div className="auth-security-footer">
          <ShieldCheck style={{ width: 16, height: 16, color: '#10b981' }} />
          <span>Encrypted with TLS 1.3 & Multi-Tenant Data Isolation</span>
        </div>
      </div>

      {/* DISTINCT CARD BELOW LOGIN FORM: REGISTER STORE / GET STARTED */}
      <div className="auth-bottom-card">
        <div>
          <h2 className="auth-bottom-card-title">Don't have a store yet?</h2>
          <p className="auth-bottom-card-desc">
            Launch your store or booking platform in 2 minutes.
          </p>
        </div>
        <Link to="/register" className="auth-bottom-card-btn">
          <span>Get Started</span>
          <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
    </div>
  );
}
