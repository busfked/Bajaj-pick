import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AppRole, 
  BajajDriver, 
  ContractTrip, 
  VillageSettings, 
  VillageDistrict,
  DriverRegistrationForm,
  AppLanguage,
  AppTheme,
  ColorTheme
} from './types';
import { 
  INITIAL_DRIVERS, 
  INITIAL_SETTINGS 
} from './utils/geo';
import { 
  stopRingSound 
} from './utils/audio';
import { ShieldCheck } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { DriverRegistrationView } from './components/DriverRegistrationView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';

export default function App() {
  // Navigation Role
  const [currentRole, setCurrentRole] = useState<AppRole>('passenger');
  
  // Language & Dark Theme Preferences
  const [lang, setLang] = useState<AppLanguage>('en');
  const [theme, setTheme] = useState<AppTheme>('light');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('emerald');

  // Admin modal & direct access
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  const handleOpenAdmin = () => {
    const isAuth = typeof window !== 'undefined' && sessionStorage.getItem('bajaj_admin_authenticated') === 'true';
    if (isAuth) {
      setCurrentRole('admin');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  // State from server / local sync
  const [settings, setSettings] = useState<VillageSettings>(INITIAL_SETTINGS);
  const [drivers, setDrivers] = useState<BajajDriver[]>(INITIAL_DRIVERS);
  const [trips, setTrips] = useState<ContractTrip[]>([]);
  const [activeTrip, setActiveTrip] = useState<ContractTrip | null>(null);
  
  // UI preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Initialize theme and language from localStorage / URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('bajaj_app_lang') as AppLanguage;
      if (savedLang === 'en' || savedLang === 'am') {
        setLang(savedLang);
      }

      const savedTheme = localStorage.getItem('bajaj_app_theme') as AppTheme;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      const savedColorTheme = localStorage.getItem('bajaj_app_color_theme') as ColorTheme;
      if (savedColorTheme) {
        setColorTheme(savedColorTheme);
      }

      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role') as AppRole;
      if (roleParam && ['passenger', 'driver', 'driver_register', 'admin'].includes(roleParam)) {
        setCurrentRole(roleParam);
      }
    }
  }, []);

  // Handle Theme Toggle
  const handleToggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('bajaj_app_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle Language Toggle
  const handleToggleLanguage = (newLang: AppLanguage) => {
    setLang(newLang);
    localStorage.setItem('bajaj_app_lang', newLang);
  };

  // Fetch State from Backend Server
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.drivers) setDrivers(data.drivers);
        if (data.trips) {
          setTrips(data.trips);
          // Find most recent active trip
          const currentActive = data.trips.find((t: ContractTrip) =>
            ['ringing', 'accepted', 'en_route', 'arrived'].includes(t.status)
          );
          setActiveTrip(currentActive || null);
        }
      }
    } catch {
      // Fallback or network pause
    }
  }, []);

  // Initial fetch and fast real-time poll
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500); // 1.5s fast poll for real-time multiplayer feel
    return () => {
      clearInterval(interval);
      stopRingSound();
    };
  }, [fetchState]);

  // Action: Request a new contract trip
  const handleRequestTrip = async (tripData: Partial<ContractTrip>) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/trips/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
      });
      if (res.ok) {
        const result = await res.json();
        setActiveTrip(result.trip);
        await fetchState();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Action: Driver accepts trip (first to accept wins)
  const handleAcceptTrip = async (tripId: string, driverId: string): Promise<boolean> => {
    setIsSyncing(true);
    stopRingSound();
    try {
      const res = await fetch(`/api/trips/${tripId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });
      if (res.ok) {
        const result = await res.json();
        setActiveTrip(result.trip);
        await fetchState();
        return true;
      } else {
        await fetchState();
        return false;
      }
    } catch {
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Action: Update trip status (e.g. en_route, arrived, completed, cancelled)
  const handleUpdateTripStatus = async (
    tripId: string,
    status: ContractTrip['status'],
    agreedPrice?: number
  ) => {
    setIsSyncing(true);
    stopRingSound();
    try {
      const res = await fetch(`/api/trips/${tripId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, agreedPrice }),
      });
      if (res.ok) {
        await fetchState();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Action: Cancel active trip with reason
  const handleCancelTrip = async (
    tripId: string, 
    reason: string = 'Cancelled by user', 
    cancelledBy: 'passenger' | 'driver' | 'admin' = 'passenger'
  ) => {
    setIsSyncing(true);
    stopRingSound();
    try {
      const res = await fetch(`/api/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: reason, cancelledBy }),
      });
      if (res.ok) {
        await fetchState();
      } else {
        await handleUpdateTripStatus(tripId, 'cancelled');
      }
    } catch {
      await handleUpdateTripStatus(tripId, 'cancelled');
    } finally {
      setIsSyncing(false);
    }
  };

  // Action: Complete trip
  const handleCompleteTrip = async (tripId: string, agreedPrice?: number) => {
    await handleUpdateTripStatus(tripId, 'completed', agreedPrice);
    stopRingSound();
  };

  // Action: Register new Bajaj driver
  const handleRegisterDriver = async (formData: DriverRegistrationForm): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/drivers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.driver?.id) {
          localStorage.setItem('village_bajaj_driver_id', data.driver.id);
        }
        await fetchState();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Action: Reapply / update rejected Bajaj driver registration
  const handleReapplyDriver = async (driverId: string, formData: DriverRegistrationForm): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/drivers/${driverId}/reapply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.driver?.id) {
          localStorage.setItem('village_bajaj_driver_id', data.driver.id);
        }
        await fetchState();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Action: Toggle driver online
  const handleToggleDriverOnline = async (driverId: string, isOnline: boolean) => {
    try {
      const res = await fetch(`/api/drivers/${driverId}/toggle-online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline }),
      });
      if (res.ok) {
        await fetchState();
      }
    } catch {
      // Ignore
    }
  };

  // Action: Admin removes Bajaj driver
  const handleRemoveDriver = async (driverId: string) => {
    try {
      const res = await fetch(`/api/drivers/${driverId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchState();
      }
    } catch {
      // Ignore
    }
  };

  // Action: Admin adds District
  const handleAddDistrict = async (districtData: Partial<VillageDistrict>) => {
    try {
      const res = await fetch('/api/districts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(districtData),
      });
      if (res.ok) {
        await fetchState();
      }
    } catch {
      // Ignore
    }
  };

  // Action: Admin deletes District
  const handleDeleteDistrict = async (districtId: string) => {
    try {
      const res = await fetch(`/api/districts/${districtId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchState();
      }
    } catch {
      // Ignore
    }
  };

  // Action: Admin settles 2% Annual Commission
  const handleSettleAnnualFee = async (driverId: string) => {
    try {
      const res = await fetch(`/api/drivers/${driverId}/settle-annual-fee`, { method: 'POST' });
      if (res.ok) {
        await fetchState();
      }
    } catch {
      // Ignore
    }
  };

  // Action: Admin updates village settings
  const handleUpdateSettings = async (newSettings: Partial<VillageSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        await fetchState();
      }
    } catch {
      // Ignore
    }
  };

  // Action: Reset demo state / fresh state
  const handleResetDemo = async () => {
    stopRingSound();
    try {
      await fetch('/api/state');
      await fetchState();
    } catch {
      // Ignore
    }
  };

  const onlineDriversCount = drivers.filter(d => d.isOnline).length;
  const activeTripsCount = activeTrip ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        onlineDriversCount={onlineDriversCount}
        activeTripsCount={activeTripsCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          if (soundEnabled) stopRingSound();
          setSoundEnabled(!soundEnabled);
        }}
        onResetDemo={handleResetDemo}
        villageName={settings.villageName}
        supportPhone={settings.supportPhone}
        lang={lang}
        onToggleLanguage={handleToggleLanguage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        colorTheme={colorTheme}
        onSelectColorTheme={(c) => {
          setColorTheme(c);
          localStorage.setItem('bajaj_app_color_theme', c);
        }}
        onChangeColorTheme={(c) => {
          setColorTheme(c);
          localStorage.setItem('bajaj_app_color_theme', c);
        }}
        isAdminLoggedIn={currentRole === 'admin' || (typeof window !== 'undefined' && sessionStorage.getItem('bajaj_admin_authenticated') === 'true')}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {currentRole === 'passenger' && (
          <PassengerView
            settings={settings}
            drivers={drivers}
            activeTrip={activeTrip}
            onRequestTrip={handleRequestTrip}
            onCancelTrip={handleCancelTrip}
            onCompleteTrip={handleCompleteTrip}
            onSwitchToDriverRole={() => setCurrentRole('driver')}
            onAcceptTripAsDriver={handleAcceptTrip}
            lang={lang}
          />
        )}

        {currentRole === 'driver' && (
          <DriverView
            drivers={drivers}
            activeTrip={activeTrip}
            settings={settings}
            onAcceptTrip={handleAcceptTrip}
            onUpdateTripStatus={handleUpdateTripStatus}
            onToggleDriverOnline={handleToggleDriverOnline}
            onRegisterDriverClick={() => setCurrentRole('driver_register' as unknown as AppRole)}
            onBackToPassenger={() => setCurrentRole('passenger')}
            onCancelTrip={handleCancelTrip}
            lang={lang}
            colorTheme={colorTheme}
          />
        )}

        {((currentRole as string) === 'driver_register') && (
          <DriverRegistrationView
            settings={settings}
            drivers={drivers}
            onRegisterDriver={handleRegisterDriver}
            onReapplyDriver={handleReapplyDriver}
            onBackToDriverMode={() => setCurrentRole('driver')}
            onBackToPassenger={() => setCurrentRole('passenger')}
            lang={lang}
            colorTheme={colorTheme}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboard
            settings={settings}
            drivers={drivers}
            trips={trips}
            onUpdateSettings={handleUpdateSettings}
            onResetDemo={handleResetDemo}
            onAddDriver={handleRegisterDriver}
            onRemoveDriver={handleRemoveDriver}
            onAddDistrict={handleAddDistrict}
            onDeleteDistrict={handleDeleteDistrict}
            onSettleAnnualFee={handleSettleAnnualFee}
            onExitAdmin={() => setCurrentRole('passenger')}
            lang={lang}
            colorTheme={colorTheme}
          />
        )}
      </main>

      {/* Sleek Village Dispatch Footer with Visible Admin Access at Bottom */}
      <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors relative">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">© 2026 {settings.villageName} BajajLink</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span>{lang === 'am' ? 'የሰፈር ውስጥ የኮንትራት ጥሪ' : 'Internal Village Contrat Dispatch'}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span>{lang === 'am' ? '2% ዓመታዊ ሂሳብ' : '2% Annual Settlement'}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3">
            {/* Support Contact Pill */}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-medium text-[11px]">
                {lang === 'am' ? 'ድጋፍ፡' : 'Support:'} {settings.supportPhone}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href={`https://t.me/${(settings.supportTelegram || '@Loyalblack').replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]"
              >
                {settings.supportTelegram || '@Loyalblack'}
              </a>
            </div>

            {/* Clearly Visible Admin Access Button at the Bottom */}
            <button
              id="btn-bottom-admin-portal"
              onClick={handleOpenAdmin}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all shadow-xs cursor-pointer border ${
                currentRole === 'admin'
                  ? 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-600/20 ring-2 ring-indigo-400/40'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              title="Administrator & Coordinator Access"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${currentRole === 'admin' ? 'text-white' : 'text-indigo-500'}`} />
              <span>{lang === 'am' ? 'የአድሚን ገጽ' : 'Admin Panel'}</span>
              {currentRole === 'admin' ? (
                <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider font-semibold ml-1">
                  Active
                </span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 ml-0.5"></span>
              )}
            </button>
          </div>

        </div>
      </footer>

      {/* Admin Login Modal (Email & Phone only, no password) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setCurrentRole('admin');
          setIsAdminLoginModalOpen(false);
        }}
        lang={lang}
        colorTheme={colorTheme}
      />

    </div>
  );
}
