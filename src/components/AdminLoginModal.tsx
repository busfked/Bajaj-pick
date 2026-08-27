import React, { useState } from 'react';
import { ShieldCheck, Mail, Phone, LockOpen, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { AppLanguage, ColorTheme } from '../types';
import { COLOR_THEMES } from '../utils/colors';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: AppLanguage;
  colorTheme: ColorTheme;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
  colorTheme,
}) => {
  const [email, setEmail] = useState('busfkedmurdu21@gmail.com');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const activeColor = COLOR_THEMES[colorTheme] || COLOR_THEMES.emerald;

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthorized(true);
        sessionStorage.setItem('bajaj_admin_authenticated', 'true');
        sessionStorage.setItem('bajaj_admin_email', email.trim());
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setError(data.error || 'Access denied. Only registered coordinator email can access.');
      }
    } catch {
      setError('Connection error. Please verify network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {lang === 'am' ? 'የአድሚን መግቢያ' : 'Coordinator Admin Access'}
              </h3>
              <p className="text-xs text-slate-300">
                {lang === 'am' ? 'የተፈቀደለት ኢሜይል እና ስልክ ብቻ (ምንም የይለፍ ቃል አያስፈልግም)' : 'Authorized Email & Phone only (No password needed)'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <div className="p-6">
          {isAuthorized ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'am' ? 'እንኳን ደህና መጡ!' : 'Access Granted!'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'am' ? 'ወደ አስተዳዳሪ ዳሽቦርድ በመግባት ላይ...' : 'Opening Admin Dashboard...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Admin Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{lang === 'am' ? 'የአድሚን ኢሜይል' : 'Coordinator Admin Email'}</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="busfkedmurdu21@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'am' ? 'የተመዘገበው ዋና ኢሜይል፡ busfkedmurdu21@gmail.com' : 'Default Admin: busfkedmurdu21@gmail.com'}
                </p>
              </div>

              {/* Admin Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{lang === 'am' ? 'የአድሚን ስልክ ቁጥር' : 'Coordinator Phone Number'}</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0911234567"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50`}
                >
                  <LockOpen className="w-4 h-4" />
                  <span>
                    {isLoading
                      ? (lang === 'am' ? 'በማረጋገጥ ላይ...' : 'Verifying Access...')
                      : (lang === 'am' ? 'አረጋግጥና ግባ' : 'Verify & Enter Admin')}
                  </span>
                </button>
              </div>

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  🔒 {lang === 'am' ? 'ቀጥታ መግቢያ (ያለ ይለፍ ቃል)' : 'Password-free direct verified login'}
                </span>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
