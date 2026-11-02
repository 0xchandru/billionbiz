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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-8 text-slate-900 dark:text-slate-100 font-sans">
      {/* Brand Header */}
      <Link to="/" className="flex items-center gap-2.5 mb-6 text-decoration-none group">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">BillionBiz</span>
          <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Merchant Portal</span>
        </div>
      </Link>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 transition-all">
        {/* Error Alert */}
        {(uiError || authError) && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uiError || authError}</span>
          </div>
        )}

        {/* Dev OTP Preview */}
        {devOtpNotification && (
          <div className="mb-5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-mono font-medium">{devOtpNotification}</span>
          </div>
        )}

        {/* PHASE 1: SINGLE INPUT FIELD (MOBILE NUMBER OR EMAIL) */}
        {phase === 1 && (
          <div>
            <div className="mb-5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign In to Your Store</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your mobile number or email address to access your merchant dashboard.
              </p>
            </div>

            <form onSubmit={handleIdentifierSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Mobile Number or Email
                </label>
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
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Social Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => {
                setUiError('Google Sign-In ready. In production, configure Google Client ID.');
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 mb-5 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-500 dark:text-slate-400">Signing in as:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
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
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0 pl-2"
              >
                Change
              </button>
            </div>

            {/* Mode A: Password Authentication */}
            {authMode === 'PASSWORD' && (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading || !password}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In with Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Login via OTP instead button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSwitchToOtp}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Sending OTP Code...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Login via OTP instead</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Mode B: OTP Authentication */}
            {authMode === 'OTP' && (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Enter 6-Digit OTP Code
                    </label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      Sent via {isEmail ? 'Email' : 'SMS'}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-between text-xs mt-2 px-1">
                    <span className="text-slate-400">Code expires in 10 minutes</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendOtp}
                      className="text-blue-600 font-semibold disabled:opacity-50 disabled:text-slate-400 hover:underline"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading || otpCode.length < 4}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying & Signing In...
                    </>
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Login with Password instead button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('PASSWORD');
                      setOtpCode('');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    <span>Login with password instead</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Security Assurance */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted with TLS 1.3 & Multi-Tenant Data Isolation</span>
        </div>
      </div>

      {/* DISTINCT CARD BELOW LOGIN FORM: REGISTER STORE / GET STARTED */}
      <div className="w-full max-w-md mt-5 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Don't have a store yet?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Launch your store or booking platform in 2 minutes.
          </p>
        </div>
        <Link
          to="/register"
          className="shrink-0 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
