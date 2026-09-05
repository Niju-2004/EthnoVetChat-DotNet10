import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Globe, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import type { User as UserType } from '../../types';

interface RegisterWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: UserType) => void;
  onSwitchToLogin: () => void;
  apiBaseUrl: string;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
  apiBaseUrl,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Stage 1 Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Stage 2 Fields
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ta'>('en');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Validation for Stage 1
  const validateStage1 = (): boolean => {
    setError(null);
    if (!username.trim() || username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleNextStage1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStage1()) {
      setStep(2);
    }
  };

  const handleNextStage2 = () => {
    setStep(3);
  };

  // Final Stage 3 Submit
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password,
          preferredLanguage: preferredLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error during registration.');
      setStep(1); // Return to first step to fix fields if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-300 m-0">
              Create Farmer Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              {preferredLanguage === 'ta' ? 'பாரம்பரிய கால்நடை மருத்துவ கணக்கு' : 'Save consultations permanently in cloud'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Stage Progress Indicator */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 my-3.5 sm:my-5">
          <div
            className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl border text-[10px] sm:text-xs font-semibold ${
              step === 1
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                : step > 1
                ? 'bg-emerald-100/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white text-[9px] sm:text-[11px] flex items-center justify-center shrink-0">
              1
            </span>
            <span className="truncate">Credentials</span>
          </div>

          <div
            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold ${
              step === 2
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                : step > 2
                ? 'bg-emerald-100/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center shrink-0">
              2
            </span>
            <span className="truncate">Language</span>
          </div>

          <div
            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold ${
              step === 3
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center shrink-0">
              3
            </span>
            <span className="truncate">Confirm</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STAGE 1: Username, Email, Password */}
        {step === 1 && (
          <form onSubmit={handleNextStage1} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Username *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. farmer_ravi"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ravi@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Password (min 6 characters) *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password..."
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-2.5 p-1 rounded-md cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Already have an account? Sign In
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span>Next: Language</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STAGE 2: Preferred Language Selection */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed m-0">
              Select your preferred consultation language. The AI will respond in this language by default:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPreferredLanguage('en')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                  preferredLanguage === 'en'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🇬🇧</span>
                  {preferredLanguage === 'en' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 m-0">English</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">Standard Veterinary Terminology</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPreferredLanguage('ta')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                  preferredLanguage === 'ta'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">🇮🇳</span>
                  {preferredLanguage === 'ta' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 m-0">தமிழ் (Tamil)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">பாரம்பரிய மூலிகை மருத்துவம்</p>
                </div>
              </button>
            </div>

            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl flex items-start gap-2 text-[11px] text-emerald-900 dark:text-emerald-300">
              <Globe className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                💡 <b>Changeable anytime:</b> You can switch languages on the fly at any time via the top header toggle even after logging in!
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextStage2}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span>Next: Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: Review & Final Account Creation */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 m-0">
                Registration Summary
              </h4>

              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Username:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{username}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Default Language:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {preferredLanguage === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Account and consultation history will be securely stored on <b>Neon.tech Serverless PostgreSQL</b>.
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleFinalSubmit}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

