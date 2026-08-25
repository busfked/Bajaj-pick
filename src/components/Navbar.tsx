import React from 'react';
import { AppRole, AppLanguage, AppTheme } from '../types';
import { 
  Car, 
  PhoneCall, 
  UserCheck, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Moon,
  Sun,
  Globe,
  Phone
} from 'lucide-react';
import { t } from '../utils/translations';

interface NavbarProps {
  currentRole: AppRole;
  onSelectRole: (role: AppRole) => void;
  onlineDriversCount: number;
  activeTripsCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetDemo: () => void;
  villageName: string;
  supportPhone?: string;
  lang: AppLanguage;
  onToggleLanguage: (lang: AppLanguage) => void;
  theme: AppTheme;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  onlineDriversCount,
  activeTripsCount,
  soundEnabled,
  onToggleSound,
  onResetDemo,
  villageName,
  supportPhone,
  lang,
  onToggleLanguage,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Village Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectRole('passenger')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-500/20">
              🛺
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-['Outfit']">
                  BajajLink
                </span>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                  {onlineDriversCount} {lang === 'am' ? 'ባጃጆች ዝግጁ' : 'Online'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-none">
                {villageName} • {lang === 'am' ? 'የኮንትራት ጥሪ ማዕከል' : 'Village Contrat Dispatch'}
              </p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium">
            <button
              id="nav-tab-passenger"
              onClick={() => onSelectRole('passenger')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                currentRole === 'passenger'
                  ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>{t(lang, 'bookContrat')}</span>
              {activeTripsCount > 0 && currentRole !== 'passenger' && (
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping ml-1"></span>
              )}
            </button>

            <button
              id="nav-tab-driver"
              onClick={() => onSelectRole('driver')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                currentRole === 'driver'
                  ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>{t(lang, 'driverMode')}</span>
            </button>

            <button
              id="nav-tab-register"
              onClick={() => onSelectRole('driver_register' as unknown as AppRole)}
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                (currentRole as string) === 'driver_register'
                  ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{t(lang, 'registerBajaj')}</span>
            </button>

            <button
              id="nav-tab-admin"
              onClick={() => onSelectRole('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                currentRole === 'admin'
                  ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t(lang, 'adminPanel')}</span>
            </button>
          </nav>

          {/* Quick Utility Actions: Language, Dark Mode, Sound & Reset */}
          <div className="flex items-center space-x-2">
            
            {/* Language Switcher */}
            <button
              onClick={() => onToggleLanguage(lang === 'en' ? 'am' : 'en')}
              title="Switch Language / ቋንቋ ቀይር"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'en' ? 'አማ' : 'EN'}</span>
            </button>

            {/* Dark Mode Switcher */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs flex items-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Audio Toggle */}
            <button
              id="btn-sound-toggle"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Alerts' : 'Enable Alerts'}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Support Call Quick Button */}
            {supportPhone && (
              <a
                href={`tel:${supportPhone}`}
                title={`Call Coordinator: ${supportPhone}`}
                className="hidden xl:flex p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 text-xs items-center transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            {/* Reset / Fresh State */}
            <button
              id="btn-reset-demo"
              onClick={onResetDemo}
              title="Refresh State"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
