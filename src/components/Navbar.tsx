import React, { useState } from 'react';
import { AppRole, AppLanguage, AppTheme, ColorTheme } from '../types';
import { 
  Car, 
  PhoneCall, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Moon,
  Sun,
  Globe,
  Palette,
  Check
} from 'lucide-react';
import { t } from '../utils/translations';
import { COLOR_THEMES } from '../utils/colors';

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
  colorTheme?: ColorTheme;
  onSelectColorTheme?: (ct: ColorTheme) => void;
  onChangeColorTheme?: (ct: ColorTheme) => void;
  isAdminLoggedIn?: boolean;
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
  lang,
  onToggleLanguage,
  theme,
  onToggleTheme,
  colorTheme = 'emerald',
  onSelectColorTheme,
  onChangeColorTheme,
  isAdminLoggedIn,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const activeColor = COLOR_THEMES[colorTheme] || COLOR_THEMES.emerald;

  const handleColorChange = (themeKey: ColorTheme) => {
    if (typeof onSelectColorTheme === 'function') {
      onSelectColorTheme(themeKey);
    } else if (typeof onChangeColorTheme === 'function') {
      onChangeColorTheme(themeKey);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Village Name */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" onClick={() => onSelectRole('passenger')}>
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${activeColor.primaryBg} text-white flex items-center justify-center font-bold text-xl shadow-md transition-colors`}>
              🛺
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-['Outfit']">
                  BajajLink
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold ${activeColor.primaryLight} ${activeColor.textPrimary} border ${activeColor.borderPrimary}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                  {onlineDriversCount} {lang === 'am' ? 'ባጃጅ' : 'Drivers'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] sm:max-w-none">
                {villageName} • {lang === 'am' ? 'የኮንትራት ጥሪ' : 'Village Dispatch'}
              </p>
            </div>
          </div>

          {/* Role Navigation Tabs (Admin is hidden from public tabs) */}
          <nav className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium">
            <button
              id="nav-tab-passenger"
              onClick={() => onSelectRole('passenger')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                currentRole === 'passenger'
                  ? `${activeColor.primaryBg} text-white font-bold shadow-md`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{t(lang, 'bookContrat')}</span>
              <span className="xs:hidden">{lang === 'am' ? 'ጥሪ' : 'Ride'}</span>
              {activeTripsCount > 0 && currentRole !== 'passenger' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1"></span>
              )}
            </button>

            <button
              id="nav-tab-driver"
              onClick={() => onSelectRole('driver')}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                currentRole === 'driver'
                  ? `${activeColor.primaryBg} text-white font-bold shadow-md`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{t(lang, 'driverMode')}</span>
              <span className="xs:hidden">{lang === 'am' ? 'አሽከርካሪ' : 'Driver'}</span>
            </button>

            <button
              id="nav-tab-register"
              onClick={() => onSelectRole('driver_register' as unknown as AppRole)}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all cursor-pointer font-['Outfit'] ${
                (currentRole as string) === 'driver_register'
                  ? `${activeColor.primaryBg} text-white font-bold shadow-md`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t(lang, 'registerBajaj')}</span>
              <span className="sm:hidden">{lang === 'am' ? 'መዝግብ' : 'Register'}</span>
            </button>

            {/* If admin is actively logged in, show quick active badge */}
            {isAdminLoggedIn && currentRole === 'admin' && (
              <button
                id="nav-tab-admin-active"
                onClick={() => onSelectRole('admin')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all bg-indigo-600 text-white font-bold shadow-md text-xs`}
              >
                <span>👑 Admin</span>
              </button>
            )}
          </nav>

          {/* Quick Utility Actions: Color Theme Grid, Language, Dark Mode, Sound & Reset */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Color Theme Grid Selector */}
            <div className="relative">
              <button
                id="btn-color-theme"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Choose Team / App Accent Color"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs flex items-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: activeColor.previewHex }}></div>
              </button>

              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 sm:w-64 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-emerald-500" />
                        {lang === 'am' ? 'የቀለም ገፅታ ምረጥ' : 'Team / Accent Color'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(COLOR_THEMES) as ColorTheme[]).map((themeKey) => {
                        const ct = COLOR_THEMES[themeKey];
                        const isSelected = colorTheme === themeKey;
                        return (
                          <button
                            key={themeKey}
                            onClick={() => {
                              handleColorChange(themeKey);
                              setShowColorPicker(false);
                            }}
                            className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-700/80 shadow-xs font-bold'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white mb-1 shadow-xs" style={{ backgroundColor: ct.previewHex }}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-[10px] text-slate-700 dark:text-slate-200 truncate w-full">
                              {ct.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => onToggleLanguage(lang === 'en' ? 'am' : 'en')}
              title="Switch Language / ቋንቋ ቀይር"
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Globe className={`w-3.5 h-3.5 ${activeColor.textPrimary}`} />
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
                  ? `${activeColor.primaryLight} ${activeColor.borderPrimary} ${activeColor.textPrimary}`
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Refresh State */}
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

