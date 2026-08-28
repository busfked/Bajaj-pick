import React, { useState, useEffect } from 'react';
import { 
  BajajDriver, 
  ContractTrip, 
  VillageSettings, 
  DriverRingtoneOption,
  AppLanguage,
  ColorTheme
} from '../types';
import { VillageMap } from './VillageMap';
import { 
  Phone, 
  Car, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  MessageSquare,
  Users,
  Briefcase,
  Volume2,
  Play,
  Crosshair,
  UserPlus,
  Gauge,
  PlusCircle,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  startDriverAlertSound, 
  stopRingSound, 
  previewRingtone, 
  playAcceptChime, 
  playDriverMissedChime 
} from '../utils/audio';
import confetti from 'canvas-confetti';
import { t } from '../utils/translations';
import { COLOR_THEMES } from '../utils/colors';
import { DriverRechargeModal } from './DriverRechargeModal';

interface DriverViewProps {
  drivers: BajajDriver[];
  activeTrip: ContractTrip | null;
  settings: VillageSettings;
  onAcceptTrip: (tripId: string, driverId: string) => Promise<boolean>;
  onUpdateTripStatus: (tripId: string, status: ContractTrip['status'], agreedPrice?: number) => Promise<void>;
  onToggleDriverOnline: (driverId: string, isOnline: boolean) => Promise<void>;
  onRegisterDriverClick: () => void;
  onBackToPassenger?: () => void;
  onCancelTrip?: (tripId: string, reason?: string, cancelledBy?: 'passenger' | 'driver' | 'admin') => Promise<void>;
  lang?: AppLanguage;
  colorTheme?: ColorTheme;
}

export const DriverView: React.FC<DriverViewProps> = ({
  drivers,
  activeTrip,
  settings,
  onAcceptTrip,
  onUpdateTripStatus,
  onToggleDriverOnline,
  onRegisterDriverClick,
  onBackToPassenger,
  onCancelTrip,
  lang = 'en',
  colorTheme = 'emerald',
}) => {
  // Current active driver selected in this session
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || '');
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [negotiatedPrice, setNegotiatedPrice] = useState<string>('');
  
  // Driver cancellation state
  const [isDriverCancelModalOpen, setIsDriverCancelModalOpen] = useState(false);
  const [driverCancelReason, setDriverCancelReason] = useState<string>('Passenger did not show up');
  const [isCancellingTrip, setIsCancellingTrip] = useState(false);
  
  // Audio Ringtone Selection
  const [selectedRingtone, setSelectedRingtone] = useState<DriverRingtoneOption>('bajaj_voice');

  // Live GPS tracking state
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationStatusText, setLocationStatusText] = useState<string | null>(null);

  // Recharge modal
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  const activeColor = COLOR_THEMES[colorTheme] || COLOR_THEMES.emerald;

  // Sync selected driver if drivers array changes
  useEffect(() => {
    if (!selectedDriverId && drivers.length > 0) {
      setSelectedDriverId(drivers[0].id);
    } else if (selectedDriverId && !drivers.some(d => d.id === selectedDriverId) && drivers.length > 0) {
      setSelectedDriverId(drivers[0].id);
    }
  }, [drivers, selectedDriverId]);

  const currentDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];

  // Check if incoming ring applies to this driver
  const isIncomingRing = Boolean(
    activeTrip &&
    activeTrip.status === 'ringing' &&
    currentDriver?.isOnline &&
    (activeTrip.targetDriverIds.length === 0 || activeTrip.targetDriverIds.includes(currentDriver.id))
  );

  // Trigger ringtone when trip is ringing
  useEffect(() => {
    if (isIncomingRing) {
      startDriverAlertSound(selectedRingtone, lang);
    } else {
      stopRingSound();
    }
    return () => {
      stopRingSound();
    };
  }, [isIncomingRing, selectedRingtone, lang]);

  // Determine if this driver currently has an accepted active trip
  const isMyActiveTrip = Boolean(
    activeTrip &&
    ['accepted', 'en_route', 'arrived'].includes(activeTrip.status) &&
    activeTrip.acceptedByDriverId === currentDriver?.id
  );

  // Handle Quick Accept
  const handleQuickAccept = async () => {
    if (!activeTrip || !currentDriver) return;
    
    // Check if driver has sufficient KM balance
    if ((currentDriver.kmBalance || 0) <= 0) {
      setErrorMessage(lang === 'am' ? 'የኪሎሜትር ባላንስ አልቆቦታል! እባክዎ 100 ብር (15 ኪ.ሜ) ይሙሉ' : 'KM Balance is 0! Please recharge 100 Birr for 15 KM first.');
      return;
    }

    setIsAccepting(true);
    setErrorMessage(null);
    try {
      const success = await onAcceptTrip(activeTrip.id, currentDriver.id);
      if (success) {
        stopRingSound();
        playAcceptChime();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } else {
        stopRingSound();
        playDriverMissedChime();
        setErrorMessage(lang === 'am' ? 'ሌላ ባጃጅ ቀድሞ ወስዶታል!' : 'Another Bajaj picked this ride first! Stay tuned.');
      }
    } catch {
      setErrorMessage(lang === 'am' ? 'ጉዞውን መቀበል አልተቻለም' : 'Could not accept ride.');
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle Real-time Geolocation Sync
  const handleToggleRealtimeLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusText(lang === 'am' ? 'GPS በስልክዎ ላይ አይደገፍም' : 'Geolocation is not supported by your browser');
      return;
    }

    if (isTrackingLocation) {
      setIsTrackingLocation(false);
      setLocationStatusText(null);
      return;
    }

    setIsTrackingLocation(true);
    setLocationStatusText(lang === 'am' ? 'የGPS መገኛ በመፈለግ ላይ...' : 'Acquiring GPS fix...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (currentDriver) {
          try {
            await fetch(`/api/drivers/${currentDriver.id}/location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
            setLocationStatusText(
              lang === 'am' 
                ? `GPS ተገናኝቷል፡ ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
                : `Live GPS synced: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            );
          } catch {
            setLocationStatusText('Failed to sync location to server');
          }
        }
      },
      (err) => {
        setLocationStatusText(`GPS Error: ${err.message}`);
        setIsTrackingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // If no driver registered in clean state
  if (drivers.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          <div className={`w-16 h-16 rounded-2xl ${activeColor.primaryLight} ${activeColor.textPrimary} mx-auto flex items-center justify-center`}>
            <Car className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              {lang === 'am' ? 'ምንም የተመዘገበ ባጃጅ የለም' : 'No Bajaj Drivers Registered'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {lang === 'am'
                ? 'ምዝገባው 100% ነፃ ነው! ባጃጅዎን በመመዝገብ የ15 ኪ.ሜ ነፃ ስጦታ ያግኙና ጥሪ መቀበል ይጀምሩ።'
                : 'Registration is 100% free! Register your Bajaj now, receive 15 KM starter balance, and begin receiving passenger calls.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onBackToPassenger && (
              <button
                type="button"
                onClick={onBackToPassenger}
                className="flex-1 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-['Outfit'] cursor-pointer"
              >
                {lang === 'am' ? '← ወደ ተሳፋሪ ገጽ' : '← Back to Passenger'}
              </button>
            )}
            <button
              onClick={onRegisterDriverClick}
              className={`flex-1 py-3.5 rounded-2xl ${activeColor.primaryBg} hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer font-['Outfit']`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t(lang, 'registerBajajBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kmBalance = currentDriver?.kmBalance ?? 15;
  const isKmLow = kmBalance < 5;
  const isKmEmpty = kmBalance <= 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">

      {/* Top Driver Navigation & Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2">
          {onBackToPassenger && (
            <button
              type="button"
              id="btn-driver-back-passenger"
              onClick={onBackToPassenger}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <span>{lang === 'am' ? '← ወደ ተሳፋሪ ገጽ ተመለስ' : '← Back to Passenger Booking'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onRegisterDriverClick}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{lang === 'am' ? '+ አዲስ ባጃጅ መዝግብ' : '+ Register New Bajaj'}</span>
        </button>
      </div>

      {/* Top Driver Bar: Profile Selector, Online Toggle, and Mileage Credit Status */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Driver Avatar & Select */}
          <div className="flex items-center space-x-3.5">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 bg-slate-800 flex items-center justify-center">
              {currentDriver?.photoUrl ? (
                <img
                  src={currentDriver.photoUrl}
                  alt={currentDriver.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Car className="w-6 h-6 text-white" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="font-bold text-sm sm:text-base text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-hidden cursor-pointer font-['Outfit']"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id} className="text-slate-900 bg-white dark:bg-slate-900">
                      {d.name} ({d.districtName}) - {d.bajajPlate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono">{currentDriver?.phone}</span>
                <span>•</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentDriver?.districtName}</span>
                <span>•</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">
                  {currentDriver?.bajajPlate}
                </span>
              </div>
            </div>
          </div>

          {/* Mileage / KM Balance Card & Quick Recharge Button */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* KM Balance Pill */}
            <div className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl border ${
              isKmEmpty 
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : isKmLow
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}>
              <Gauge className="w-4 h-4 shrink-0" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    {lang === 'am' ? 'የቀረ ኪሎሜትር' : 'Mileage Balance'}
                  </span>
                </div>
                <span className="font-bold font-mono text-sm sm:text-base leading-tight">
                  {kmBalance.toFixed(1)} KM
                </span>
              </div>
            </div>

            {/* Direct Recharge Button (100 Birr = 15 KM) */}
            <button
              onClick={() => setIsRechargeModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'am' ? 'ኪሎሜትር ሙላ (100 ብር)' : 'Recharge KM (100 Br)'}</span>
            </button>

            {/* Online Status Toggle */}
            {currentDriver && (
              <button
                disabled={currentDriver.approvalStatus !== 'approved'}
                onClick={() => {
                  if (currentDriver.approvalStatus !== 'approved') return;
                  onToggleDriverOnline(currentDriver.id, !currentDriver.isOnline);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer font-['Outfit'] ${
                  currentDriver.approvalStatus !== 'approved'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-75'
                    : currentDriver.isOnline
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
                title={
                  currentDriver.approvalStatus === 'pending'
                    ? 'Pending Coordinator Approval'
                    : currentDriver.approvalStatus === 'rejected'
                      ? 'Application Rejected - Fix Errors First'
                      : 'Toggle Online/Offline'
                }
              >
                {currentDriver.approvalStatus === 'pending'
                  ? (lang === 'am' ? '⏳ በማጽደቅ ላይ...' : '⏳ Under Review')
                  : currentDriver.approvalStatus === 'rejected'
                    ? (lang === 'am' ? '⚠️ ውድቅ ተደርጓል' : '⚠️ Rejected')
                    : currentDriver.isOnline
                      ? `● ${t(lang, 'online')}`
                      : `○ ${t(lang, 'offline')}`}
              </button>
            )}

            {/* Sync GPS */}
            <button
              onClick={handleToggleRealtimeLocation}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center transition-colors cursor-pointer ${
                isTrackingLocation
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Sync GPS Location"
            >
              <Crosshair className={`w-4 h-4 ${isTrackingLocation ? 'text-emerald-500 animate-spin' : ''}`} />
            </button>

          </div>

        </div>

        {locationStatusText && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900">
            {locationStatusText}
          </p>
        )}

        {/* Ringtone Selection & Test */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t(lang, 'ringtoneChoice')}:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedRingtone('bajaj_voice')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRingtone === 'bajaj_voice'
                  ? `${activeColor.primaryBg} text-white`
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {t(lang, 'ringtoneBajajVoice')}
            </button>

            <button
              onClick={() => setSelectedRingtone('village_chime')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedRingtone === 'village_chime'
                  ? `${activeColor.primaryBg} text-white`
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {t(lang, 'ringtoneMelodicChime')}
            </button>

            <button
              onClick={() => previewRingtone(selectedRingtone, lang)}
              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center space-x-1 cursor-pointer"
              title="Test Sound"
            >
              <Play className="w-3 h-3" />
              <span>{t(lang, 'testSound')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Driver Registration Status: Rejected Notification */}
      {currentDriver?.approvalStatus === 'rejected' && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base font-['Outfit']">
                {lang === 'am' ? 'የባጃጅ ማመልከቻዎ ማስተካከያ ተጠይቆበታል' : 'Application Needs Correction'}
              </h4>
              <p className="text-xs text-rose-800 dark:text-rose-200">
                {lang === 'am' ? 'አስተባባሪው (busfkedmurdu21@gmail.com) የሰጠው ማብራሪያ፡' : 'Coordinator (busfkedmurdu21@gmail.com) feedback:'}
              </p>
              <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
                "{currentDriver.rejectionReason || (lang === 'am' ? 'እባክዎ ቅጹን እና መታወቂያዎን በትክክል ሞልተው እንደገና ይላኩ።' : 'Please fill the registration form properly and upload valid documents.')}"
              </div>
            </div>
          </div>
          <button
            onClick={onRegisterDriverClick}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 font-['Outfit']"
          >
            <span>{lang === 'am' ? 'ቅጹን አስተካክለህ እንደገና ላክ ↵' : 'Fix & Resubmit Form ↵'}</span>
          </button>
        </div>
      )}

      {/* Driver Registration Status: Under Review Notification */}
      {currentDriver?.approvalStatus === 'pending' && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm sm:text-base font-['Outfit']">
                {lang === 'am' ? 'የባጃጅ ማመልከቻዎ በመገምገም ላይ ነው' : 'Registration Under Coordinator Review'}
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                {lang === 'am'
                  ? `የባጃጅ ታርጋዎ (${currentDriver.bajajPlate}) በአስተባባሪው busfkedmurdu21@gmail.com እየተረጋገጠ ነው። ልክ እንደጸደቀ 15 ኪ.ሜ የጅማሮ ክሬዲት ይሰጥዎታል እንዲሁም የቀጥታ የኮንትራት ጥሪዎች ይከፈቱልዎታል።`
                  : `Your Bajaj (Plate: ${currentDriver.bajajPlate}) is awaiting verification by coordinator busfkedmurdu21@gmail.com. Once approved, you will receive 15 KM starter mileage.`}
              </p>
            </div>
          </div>
          <button
            onClick={onRegisterDriverClick}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 bg-white/70 dark:bg-slate-900/70 hover:bg-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <span>{lang === 'am' ? 'መረጃ አርትዕ' : 'Edit Details'}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 PROBLEM 1 RESOLUTION: DEDICATED INCOMING CALLER INFORMATION SCREEN */}
      {/* ========================================================================= */}
      {isIncomingRing && activeTrip && (
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-emerald-300 animate-pulse space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center text-2xl shadow-lg">
                <Phone className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-200 block">
                  {lang === 'am' ? 'የደዋይ ተሳፋሪ መረጃ' : 'INCOMING PASSENGER CALL'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">
                  {activeTrip.passengerName}
                </h2>
              </div>
            </div>

            {/* Direct 1-Tap Call to Passenger */}
            <a
              href={`tel:${activeTrip.passengerPhone}`}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-sm flex items-center space-x-2 shadow-xl cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'am' ? 'ደውልለት' : 'Call Caller'}: {activeTrip.passengerPhone}</span>
            </a>
          </div>

          {/* Caller Route Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Pickup Location */}
            <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-400/40 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{lang === 'am' ? 'የመነሻ ቦታ (Pickup)' : 'PICKUP LOCATION'}</span>
              </div>
              <p className="text-lg font-bold text-white font-['Outfit']">
                {activeTrip.pickupAddress}
              </p>
              <span className="text-xs text-emerald-200 block">
                {lang === 'am' ? 'ወረዳ፡' : 'District:'} <b>{activeTrip.districtName || 'Village Zone'}</b>
              </span>
            </div>

            {/* Dropoff Destination */}
            <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-400/40 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold">
                <Navigation className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{lang === 'am' ? 'የመድረሻ ቦታ (Destination)' : 'DESTINATION'}</span>
              </div>
              <p className="text-lg font-bold text-white font-['Outfit']">
                {activeTrip.dropoffAddress}
              </p>
              <span className="text-xs text-emerald-200 block">
                {lang === 'am' ? 'ርቀት፡' : 'Distance:'} <b>{activeTrip.distanceKm.toFixed(1)} KM</b>
              </span>
            </div>

          </div>

          {/* Quick Stats: Fare, Passenger Count, KM Cost */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-900/50 rounded-2xl border border-emerald-400/30">
              <span className="text-[11px] text-emerald-200 block">{lang === 'am' ? 'የሚገመት ክፍያ' : 'Est. Fare'}</span>
              <span className="font-bold text-xl font-mono text-amber-300">{activeTrip.estimatedFare} Br</span>
            </div>

            <div className="p-3 bg-emerald-900/50 rounded-2xl border border-emerald-400/30">
              <span className="text-[11px] text-emerald-200 block">{lang === 'am' ? 'የተሳፋሪ ብዛት' : 'Passengers'}</span>
              <span className="font-bold text-base flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-4 h-4 text-emerald-300" />
                <span>{activeTrip.passengerCount || 1}</span>
                {activeTrip.hasLuggage && <Briefcase className="w-3.5 h-3.5 text-amber-300 ml-1" />}
              </span>
            </div>

            <div className="p-3 bg-emerald-900/50 rounded-2xl border border-emerald-400/30">
              <span className="text-[11px] text-emerald-200 block">{lang === 'am' ? 'ከባላንስ የሚቀነስ' : 'KM Cost'}</span>
              <span className="font-bold text-base text-rose-300 font-mono">-{activeTrip.distanceKm.toFixed(1)} KM</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-900/80 border border-rose-400 text-white font-bold text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Big Action Buttons: Accept or Ignore */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleQuickAccept}
              disabled={isAccepting}
              className="flex-1 py-4 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-lg shadow-2xl transition-transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer font-['Outfit']"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>{isAccepting ? (lang === 'am' ? 'በመቀበል ላይ...' : 'Accepting...') : (lang === 'am' ? 'ጥሪውን ተቀበል / ACCEPT' : 'ACCEPT RIDE NOW')}</span>
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVE ACCEPTED TRIP MANAGEMENT CARD WITH FULL CALLER DETAILS */}
      {/* ========================================================================= */}
      {isMyActiveTrip && activeTrip && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 block">
                  {lang === 'am' ? 'ገባሪ የኮንትራት ጉዞ' : 'Active Contract in Progress'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  {activeTrip.pickupAddress} → {activeTrip.dropoffAddress}
                </h3>
              </div>
            </div>

            {/* Direct Call Button */}
            <a
              href={`tel:${activeTrip.passengerPhone}`}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20"
            >
              <Phone className="w-4 h-4" />
              <span>{t(lang, 'callPassenger')}: {activeTrip.passengerPhone}</span>
            </a>
          </div>

          {/* Caller Details Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                {lang === 'am' ? 'የደዋይ ተሳፋሪ ስም' : 'Passenger Name'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-base block">{activeTrip.passengerName}</span>
              <span className="block text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">{activeTrip.passengerPhone}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                {lang === 'am' ? 'የጉዞ ርቀት' : 'Trip Distance'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-base block">
                {(activeTrip.distanceKm || 1.8).toFixed(1)} KM
              </span>
              <span className="block text-[11px] text-slate-500">{activeTrip.districtName}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                {lang === 'am' ? 'የክፍያ ሂሳብ' : 'Fare Amount'}
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg font-mono block">
                {activeTrip.agreedPrice || activeTrip.suggestedNegotiationMin || 40} Br
              </span>
              <span className="block text-[10px] text-slate-400">{lang === 'am' ? '100% የእርስዎ ገቢ' : '100% Driver Fare'}</span>
            </div>
          </div>

          {/* Quick Status Progression Tabs */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateTripStatus(activeTrip.id, 'en_route')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTrip.status === 'en_route'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{lang === 'am' ? '1. ወደ ተሳፋሪው እየሄድኩ ነው' : '1. Heading to Pickup'}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateTripStatus(activeTrip.id, 'arrived')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTrip.status === 'arrived'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{lang === 'am' ? '2. ተሳፋሪው በር ላይ ደርሻለሁ' : '2. Arrived at Doorstep'}</span>
              </button>

              {onCancelTrip && (
                <button
                  type="button"
                  id="btn-driver-cancel-trip"
                  onClick={() => setIsDriverCancelModalOpen(true)}
                  className="ml-auto px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  title="Cancel and release this ride"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'am' ? 'ጉዞውን ሰርዝ' : 'Cancel Ride'}</span>
                </button>
              )}
            </div>

            {/* UNCONDITIONAL, PROMINENT COMPLETE TRIP ACTION CARD */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'am' ? 'ጉዞውን አጠናቅቅ እና ሂሳብ ተቀበል' : 'Finish Trip & Collect Fare'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'am'
                    ? `ከባላንስዎ ${(activeTrip.distanceKm || 1.8).toFixed(1)} KM ይቀነሳል`
                    : `Deducts ${(activeTrip.distanceKm || 1.8).toFixed(1)} KM from your mileage balance`}
                </p>
              </div>

              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                <div className="w-full sm:w-36 space-y-0.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    {lang === 'am' ? 'የተቀበሉት ብር' : 'Fare (Br)'}
                  </label>
                  <input
                    type="number"
                    placeholder={String(activeTrip.agreedPrice || activeTrip.suggestedNegotiationMin || 40)}
                    value={negotiatedPrice}
                    onChange={(e) => setNegotiatedPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  id="btn-driver-complete-trip"
                  onClick={async () => {
                    const price = negotiatedPrice ? parseFloat(negotiatedPrice) : (activeTrip.agreedPrice || activeTrip.suggestedNegotiationMin || 40);
                    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
                    await onUpdateTripStatus(activeTrip.id, 'completed', price);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{lang === 'am' ? '✅ ጉዞው ተጠናቋል (ተቀብያለሁ)' : '✅ Complete Trip & Collect Fare'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Main Map View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2 font-['Outfit']">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'am' ? 'የመንደሩ ካርታ እና የባጃጅ መገኛ' : 'Village Dispatch Map & Online Bajaj Fleet'}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {drivers.filter(d => d.isOnline).length} {lang === 'am' ? 'ባጃጆች ዝግጁ ናቸው' : 'online now'}
          </span>
        </div>

        <VillageMap
          center={currentDriver?.currentLocation || settings.villageCenter || { lat: 8.9806, lng: 38.8020 }}
          landmarks={settings.landmarks || []}
          districts={settings.districts || []}
          drivers={drivers}
          activeDistrictId={currentDriver?.districtId}
          pickupCoords={activeTrip?.pickupCoords || null}
          dropoffCoords={activeTrip?.dropoffCoords || null}
          activeDriverId={currentDriver?.id}
          heightClass="h-72 sm:h-96"
        />
      </div>

      {/* Recharge Modal */}
      {currentDriver && (
        <DriverRechargeModal
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          driver={currentDriver}
          settings={settings}
          lang={lang}
          colorTheme={colorTheme}
        />
      )}

      {/* Driver Cancel Modal */}
      {isDriverCancelModalOpen && activeTrip && onCancelTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-xl shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base font-['Outfit']">
                    {lang === 'am' ? 'ጉዞውን መሰረዝ ይፈልጋሉ?' : 'Cancel Active Trip?'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'am' ? 'ጉዞውን ከሰረዙ ጥሪው እንደገና ለሌሎች ባጃጆች ክፍት ይሆናል ወይም ይሰረዛል።' : 'Cancelling will release the ride back or abort the dispatch request.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDriverCancelModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Select Driver Cancellation Reason */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {lang === 'am' ? 'የመሰረዣ ምክንያት ይምረጡ' : 'Reason for Cancellation'}
              </label>

              <div className="space-y-2">
                {[
                  {
                    key: 'no_show',
                    label: lang === 'am' ? 'ተሳፋሪው አልተገኘም / ስልክ አያነሳም' : 'Passenger did not show up / unreachable'
                  },
                  {
                    key: 'breakdown',
                    label: lang === 'am' ? 'የባጃጅ ብልሽት / የቴክኒክ ችግር' : 'Bajaj mechanical issue or breakdown'
                  },
                  {
                    key: 'passenger_cancelled',
                    label: lang === 'am' ? 'ተሳፋሪው በቃል እንደሰረዘው ነገረኝ' : 'Passenger verbally asked to cancel'
                  },
                  {
                    key: 'other',
                    label: lang === 'am' ? 'ሌላ ምክንያት' : 'Other reason'
                  }
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      driverCancelReason === item.label
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-900 dark:text-rose-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="driver_cancel_reason"
                      value={item.label}
                      checked={driverCancelReason === item.label}
                      onChange={() => setDriverCancelReason(item.label)}
                      className="text-rose-500 focus:ring-rose-400"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDriverCancelModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                {lang === 'am' ? 'ተመለስ (ጉዞውን ቀጥል)' : 'Go Back (Keep Trip)'}
              </button>

              <button
                type="button"
                disabled={isCancellingTrip}
                onClick={async () => {
                  setIsCancellingTrip(true);
                  try {
                    await onCancelTrip(activeTrip.id, driverCancelReason, 'driver');
                    setIsDriverCancelModalOpen(false);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsCancellingTrip(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer text-center flex items-center justify-center space-x-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isCancellingTrip ? (lang === 'am' ? 'እየተሰረዘ ነው...' : 'Cancelling...') : (lang === 'am' ? 'አዎ፣ ጉዞውን ሰርዝ' : 'Yes, Cancel Trip')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
