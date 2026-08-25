import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AppRole, 
  BajajDriver, 
  ContractTrip, 
  VillageSettings, 
  VillageDistrict,
  DriverRegistrationForm,
  AppLanguage,
  AppTheme 
} from './types';
import { 
  INITIAL_DRIVERS, 
  INITIAL_SETTINGS 
} from './utils/geo';
import { 
  stopRingSound 
} from './utils/audio';
import { Navbar } from './components/Navbar';
import { PassengerView } from './components/PassengerView';
import { DriverView } from './components/DriverView';
import { DriverRegistrationView } from './components/DriverRegistrationView';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  // Navigation Role
  const [currentRole, setCurrentRole] = useState<AppRole>('passenger');
  
  // Language & Dark Theme Preferences
  const [lang, setLang] = useState<AppLanguage>('en');
  const [theme, setTheme] = useState<AppTheme>('light');

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

  // Action: Cancel active trip
  const handleCancelTrip = async (tripId: string) => {
    await handleUpdateTripStatus(tripId, 'cancelled');
    stopRingSound();
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
            lang={lang}
          />
        )}

        {((currentRole as string) === 'driver_register') && (
          <DriverRegistrationView
            settings={settings}
            onRegisterDriver={handleRegisterDriver}
            onBackToDriverMode={() => setCurrentRole('driver')}
            lang={lang}
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
            lang={lang}
          />
        )}
      </main>

      {/* Sleek Village Dispatch Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">© 2026 {settings.villageName} BajajLink</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span>{lang === 'am' ? 'የሰፈር ውስጥ የኮንትራት ጥሪ' : 'Internal Village Contrat Dispatch'}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span>{lang === 'am' ? '2% ዓመታዊ ሂሳብ' : '2% Annual Settlement'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-medium text-[11px]">
              {lang === 'am' ? 'ድጋፍ፡' : 'Support:'} {settings.supportPhone} {settings.supportEmail ? `• ${settings.supportEmail}` : ''}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
