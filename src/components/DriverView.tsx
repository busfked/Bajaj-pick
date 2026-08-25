import React, { useState, useEffect } from 'react';
import { 
  BajajDriver, 
  ContractTrip, 
  VillageSettings, 
  DriverRingtoneOption,
  AppLanguage 
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
  Percent,
  Volume2,
  Play,
  Crosshair,
  UserPlus
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

interface DriverViewProps {
  drivers: BajajDriver[];
  activeTrip: ContractTrip | null;
  settings: VillageSettings;
  onAcceptTrip: (tripId: string, driverId: string) => Promise<boolean>;
  onUpdateTripStatus: (tripId: string, status: ContractTrip['status'], agreedPrice?: number) => Promise<void>;
  onToggleDriverOnline: (driverId: string, isOnline: boolean) => Promise<void>;
  onRegisterDriverClick: () => void;
  lang?: AppLanguage;
}

export const DriverView: React.FC<DriverViewProps> = ({
  drivers,
  activeTrip,
  settings,
  onAcceptTrip,
  onUpdateTripStatus,
  onToggleDriverOnline,
  onRegisterDriverClick,
  lang = 'en',
}) => {
  // Current active driver selected in this session
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || '');
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [negotiatedPrice, setNegotiatedPrice] = useState<string>('');
  
  // Audio Ringtone Selection
  const [selectedRingtone, setSelectedRingtone] = useState<DriverRingtoneOption>('bajaj_voice');

  // Live GPS tracking state
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationStatusText, setLocationStatusText] = useState<string | null>(null);

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

  // Trigger polite ringtone when trip is ringing
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
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Car className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              {lang === 'am' ? 'ምንም የተመዘገበ ባጃጅ የለም' : 'No Bajaj Drivers Registered'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {lang === 'am'
                ? 'እርስዎ እራስዎ የመጀመሪያውን ባጃጅ በመመዝገብ የቀጥታ ጥሪውንና የድምፅ ማሳወቂያውን መሞከር ይችላሉ!'
                : 'Clean slate active! Register your own driver account to test instant contrat calls and voice ringtones live.'}
            </p>
          </div>

          <button
            onClick={onRegisterDriverClick}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer font-['Outfit']"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t(lang, 'registerBajajBtn')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Driver Identity Switcher & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Driver Avatar & Select */}
          <div className="flex items-center space-x-3.5">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 bg-slate-800 flex items-center justify-center">
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
                  className="font-bold text-base text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-hidden cursor-pointer font-['Outfit']"
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

          {/* Online Toggle & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleRealtimeLocation}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isTrackingLocation
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Crosshair className={`w-3.5 h-3.5 ${isTrackingLocation ? 'text-emerald-500 animate-spin' : ''}`} />
              <span>{isTrackingLocation ? 'GPS Tracking Active' : 'Sync Live GPS'}</span>
            </button>

            {currentDriver && (
              <button
                onClick={() => onToggleDriverOnline(currentDriver.id, !currentDriver.isOnline)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer font-['Outfit'] ${
                  currentDriver.isOnline
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                {currentDriver.isOnline ? `● ${t(lang, 'online')}` : `○ ${t(lang, 'offline')}`}
              </button>
            )}

            <button
              onClick={onRegisterDriverClick}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              + {lang === 'am' ? 'ሌላ ባጃጅ መዝግብ' : 'Register New'}
            </button>
          </div>

        </div>

        {locationStatusText && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900">
            {locationStatusText}
          </p>
        )}

        {/* Ringtone Selector & Test Sound Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t(lang, 'ringtoneChoice')}:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedRingtone('bajaj_voice')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRingtone === 'bajaj_voice'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {t(lang, 'ringtoneBajajVoice')}
            </button>

            <button
              onClick={() => setSelectedRingtone('village_chime')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRingtone === 'village_chime'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {t(lang, 'ringtoneMelodicChime')}
            </button>

            <button
              onClick={() => setSelectedRingtone('subtle_pulse')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRingtone === 'subtle_pulse'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {t(lang, 'ringtoneRadarPulse')}
            </button>

            <button
              onClick={() => previewRingtone(selectedRingtone, lang)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center space-x-1 cursor-pointer"
              title="Test Sound"
            >
              <Play className="w-3 h-3" />
              <span>{t(lang, 'testSound')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ================= INCOMING RINGING CALL ALERT CARD ================= */}
      {isIncomingRing && activeTrip && (
        <div className="bg-emerald-600 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-emerald-400 animate-pulse space-y-5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t(lang, 'incomingRideAlert')}</span>
            </div>
            <span className="text-xs font-bold bg-white text-emerald-700 px-3 py-1 rounded-full font-mono">
              {lang === 'am' ? 'በ3 ኪ.ሜ ክልል ውስጥ' : 'Within 3 KM Range'}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
              {activeTrip.pickupAddress} → {activeTrip.dropoffAddress}
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm">
              {lang === 'am' ? 'ተሳፋሪ፡' : 'Passenger:'} <b>{activeTrip.passengerName}</b> ({activeTrip.passengerPhone})
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="p-3 bg-emerald-700/60 rounded-xl">
              <span className="text-emerald-200 block text-[10px]">District:</span>
              <span className="font-bold">{activeTrip.districtName || 'Village'}</span>
            </div>
            <div className="p-3 bg-emerald-700/60 rounded-xl">
              <span className="text-emerald-200 block text-[10px]">Distance:</span>
              <span className="font-bold">{activeTrip.distanceKm.toFixed(1)} KM</span>
            </div>
            <div className="p-3 bg-emerald-700/60 rounded-xl">
              <span className="text-emerald-200 block text-[10px]">Est. Rate:</span>
              <span className="font-bold font-mono">{activeTrip.estimatedFare} Br</span>
            </div>
            <div className="p-3 bg-emerald-700/60 rounded-xl">
              <span className="text-emerald-200 block text-[10px]">Settlement:</span>
              <span className="font-bold">100% Cash / Telebirr</span>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs font-bold bg-red-500 text-white p-2.5 rounded-xl">
              {errorMessage}
            </p>
          )}

          <button
            onClick={handleQuickAccept}
            disabled={isAccepting}
            className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 text-emerald-700 font-bold text-base shadow-xl transition-transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer font-['Outfit']"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{isAccepting ? 'Accepting...' : t(lang, 'acceptContractRide')}</span>
          </button>
        </div>
      )}

      {/* ================= ACTIVE ACCEPTED TRIP MANAGEMENT CARD ================= */}
      {isMyActiveTrip && activeTrip && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-500 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 block">
                  {lang === 'am' ? 'ገባሪ የኮንትራት ጉዞ' : 'Active Contract in Progress'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                  {activeTrip.pickupAddress} → {activeTrip.dropoffAddress}
                </h3>
              </div>
            </div>

            <a
              href={`tel:${activeTrip.passengerPhone}`}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-500/20"
            >
              <Phone className="w-4 h-4" />
              <span>{t(lang, 'callPassenger')}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Passenger</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{activeTrip.passengerName}</span>
              <span className="block text-xs font-mono text-slate-500">{activeTrip.passengerPhone}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Contract Distance</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{activeTrip.distanceKm.toFixed(1)} KM</span>
              <span className="block text-[11px] text-slate-500">{activeTrip.districtName}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fare Settlement</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                {activeTrip.agreedFare || activeTrip.estimatedFare} Br
              </span>
              <span className="block text-[10px] text-slate-400">Direct Passenger Settlement</span>
            </div>
          </div>

          {/* Trip Progress State Controller */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {activeTrip.status === 'accepted' && (
              <button
                onClick={() => onUpdateTripStatus(activeTrip.id, 'en_route')}
                className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition-colors"
              >
                {lang === 'am' ? 'ወደ ተሳፋሪው እየሄድኩ ነው' : 'Heading to Pickup Location →'}
              </button>
            )}

            {activeTrip.status === 'en_route' && (
              <button
                onClick={() => onUpdateTripStatus(activeTrip.id, 'arrived')}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors"
              >
                {lang === 'am' ? 'ተሳፋሪው በር ላይ ደርሻለሁ' : 'I Have Arrived at Doorstep'}
              </button>
            )}

            {activeTrip.status === 'arrived' && (
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="number"
                  placeholder="Final Agreed Fare (Br)"
                  value={negotiatedPrice}
                  onChange={(e) => setNegotiatedPrice(e.target.value)}
                  className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
                <button
                  onClick={() => {
                    const price = negotiatedPrice ? parseFloat(negotiatedPrice) : activeTrip.estimatedFare;
                    onUpdateTripStatus(activeTrip.id, 'completed', price);
                  }}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20"
                >
                  {t(lang, 'completeTrip')}
                </button>
              </div>
            )}
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

    </div>
  );
};
