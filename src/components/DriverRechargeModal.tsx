import React, { useState, useRef } from 'react';
import { 
  CreditCard, 
  Upload, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles, 
  X, 
  AlertCircle,
  FileImage,
  Gauge
} from 'lucide-react';
import { VillageSettings, AppLanguage, ColorTheme, BajajDriver } from '../types';
import { COLOR_THEMES } from '../utils/colors';

interface DriverRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: BajajDriver;
  settings: VillageSettings;
  lang: AppLanguage;
  colorTheme: ColorTheme;
  onRechargeSubmitted?: () => void;
}

export const DriverRechargeModal: React.FC<DriverRechargeModalProps> = ({
  isOpen,
  onClose,
  driver,
  settings,
  lang,
  colorTheme,
  onRechargeSubmitted,
}) => {
  const [selectedKmPackage, setSelectedKmPackage] = useState<{ birr: number; km: number }>({ birr: 100, km: 15 });
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeColor = COLOR_THEMES[colorTheme] || COLOR_THEMES.emerald;

  if (!isOpen) return null;

  const packages = [
    { birr: 100, km: 15, label: lang === 'am' ? '100 ብር (15 ኪ.ሜ)' : '100 ETB (15 KM)', tag: 'Starter' },
    { birr: 200, km: 30, label: lang === 'am' ? '200 ብር (30 ኪ.ሜ)' : '200 ETB (30 KM)', tag: 'Popular' },
    { birr: 300, km: 45, label: lang === 'am' ? '300 ብር (45 ኪ.ሜ)' : '300 ETB (45 KM)', tag: 'Value' },
    { birr: 500, km: 75, label: lang === 'am' ? '500 ብር (75 ኪ.ሜ)' : '500 ETB (75 KM)', tag: 'Best Value' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScreenshotUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotUrl) {
      setError(lang === 'am' ? 'እባክዎ የክፍያ ስክሪንሽት (Payment Screenshot) ያያይዙ' : 'Please upload payment confirmation screenshot');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/recharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          driverName: driver.name,
          driverPhone: driver.phone,
          bajajPlate: driver.bajajPlate,
          amountBirr: selectedKmPackage.birr,
          requestedKm: selectedKmPackage.km,
          paymentProofUrl: screenshotUrl,
          transactionRef: transactionRef.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        if (onRechargeSubmitted) onRechargeSubmitted();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit recharge');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className={`p-5 sm:p-6 ${activeColor.primaryBg} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white text-2xl shadow-inner">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>100 Birr = 15 KM</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] mt-0.5">
                {lang === 'am' ? 'የኪሎሜትር ባላንስ መሙያ' : 'Recharge Mileage (KM)'}
              </h3>
              <p className="text-xs text-white/80">
                {driver.name} • {driver.bajajPlate}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {success ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  {lang === 'am' ? 'የክፍያ ስክሪንሽቱ ተልኳል!' : 'Screenshot Submitted!'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  {lang === 'am'
                    ? `የ${selectedKmPackage.birr} ብር ክፍያ ስክሪንሽት ለአድሚን ደርሷል። አድሚኑ እንደተመለከተው ወዲያውኑ +${selectedKmPackage.km} ኪ.ሜ ወደ ሂሳብዎ ይጨመራል!`
                    : `Your payment proof of ${selectedKmPackage.birr} Birr for +${selectedKmPackage.km} KM has been sent to admin approval. Balance will update instantly upon confirmation.`}
                </p>
              </div>

              <button
                onClick={onClose}
                className={`px-6 py-2.5 rounded-xl ${activeColor.primaryBg} hover:opacity-90 text-white font-bold text-xs shadow-md transition-all cursor-pointer`}
              >
                {lang === 'am' ? 'እሺ፣ ተመለስ' : 'Done / Back'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Select Package */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{lang === 'am' ? '1. የኪሎሜትር ፓኬጅ ይምረጡ' : '1. Select Mileage Package'}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                    {lang === 'am' ? 'የአሁኑ ባላንስ፡' : 'Current Balance:'} <b>{(driver.kmBalance || 0).toFixed(1)} KM</b>
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {packages.map((pkg) => {
                    const isSelected = selectedKmPackage.birr === pkg.birr;
                    return (
                      <button
                        key={pkg.birr}
                        type="button"
                        onClick={() => setSelectedKmPackage(pkg)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? `${activeColor.primaryLight} ${activeColor.borderPrimary} ring-2 ring-emerald-500/30`
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                          {pkg.tag}
                        </span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                            +{pkg.km} KM
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {pkg.birr} Br
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Admin Payment Accounts (Telebirr, CBE) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{lang === 'am' ? '2. በዚህ የክፍያ አካውንት ይላኩ (100 ብር = 15 KM)' : '2. Send Payment to Admin Accounts'}</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Telebirr */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">TELEBIRR</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {settings.adminPaymentAccounts?.telebirr || '0911234567'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.adminPaymentAccounts?.telebirr || '0911234567', 'telebirr')}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title="Copy Telebirr"
                    >
                      {copiedAccount === 'telebirr' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Commercial Bank of Ethiopia (CBE) */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">CBE (ንግድ ባንክ)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                        {settings.adminPaymentAccounts?.cbe || '1000123456789'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.adminPaymentAccounts?.cbe || '1000123456789', 'cbe')}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title="Copy CBE Account"
                    >
                      {copiedAccount === 'cbe' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Upload Screenshot Proof */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{lang === 'am' ? '3. የክፍያ ስክሪንሽት ፎቶ ይጫኑ *' : '3. Attach Payment Screenshot Proof *'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Telebirr / CBE SMS</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {screenshotUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-16/9 flex items-center justify-center">
                    <img
                      src={screenshotUrl}
                      alt="Payment Proof"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-black/70 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {lang === 'am' ? 'ቀይር' : 'Change Photo'}
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      {lang === 'am' ? 'የስክሪንሽት ፎቶውን እዚህ ይጫኑ' : 'Click to Upload Payment Screenshot'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {lang === 'am' ? 'የቴሌብር ወይም የባንክ ደረሰኝ' : 'Telebirr SMS receipt / CBE transaction screenshot'}
                    </span>
                  </div>
                )}
              </div>

              {/* Transaction Ref (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'am' ? 'የትራንዛክሽን ቁጥር (አስፈላጊ ከሆነ)' : 'Transaction ID / Reference (Optional)'}
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. TX-98427189"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !screenshotUrl}
                className={`w-full py-3.5 px-4 rounded-2xl ${activeColor.primaryBg} hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer`}
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? (lang === 'am' ? 'በመላክ ላይ...' : 'Submitting Screenshot...')
                    : (lang === 'am' ? `የ${selectedKmPackage.birr} ብር ስክሪንሽት ላክ (+${selectedKmPackage.km} KM)` : `Submit Proof (+${selectedKmPackage.km} KM)`)}
                </span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
