import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang
}) => {
  const t = translations[lang];
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter the admin password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify with server endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || t.admin_login_error);
        inputRef.current?.select();
      }
    } catch (err: any) {
      // Fallback direct check if offline or network error
      if (password.trim() === 'YouthConf26$') {
        onSuccess();
      } else {
        setError(t.admin_login_error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div 
        id="admin-login-modal"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative overflow-hidden text-stone-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Top gold banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
          aria-label={t.cancel}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 mt-1">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-lg leading-tight">
              {t.admin_login}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === 'ar' ? 'تسجيل دخول مسؤولي المؤتمر والخدام' : 'Conference Servants & Admins Portal'}
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-600 mb-5 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/80">
          {t.admin_password_help}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              {t.admin_password_label}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                id="input-admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                placeholder={t.admin_password_placeholder}
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              id="btn-submit-admin-login"
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.admin_login_submit}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
