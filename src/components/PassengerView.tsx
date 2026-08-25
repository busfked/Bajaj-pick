import React, { useState, useEffect } from 'react';
import { 
  ContractTrip, 
  LocationCoord, 
  VillageSettings, 
  BajajDriver,
  AppLanguage
} from '../types';
import { VillageMap } from './VillageMap';
import { 
  calculateDistanceKm, 
  calculateEstimatedMinutes, 
  calculateNegotiationRange,
  findClosestDistrict
} from '../utils/geo';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Users, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  XCircle,
  Shield,
  Star,
  Compass,
  ArrowRight,
  RotateCcw,
  Zap,
  LocateFixed
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { t } from '../utils/translations';

interface PassengerViewProps {
  settings: VillageSettings;
  drivers: BajajDriver[];
  activeTrip: ContractTrip | null;
  onRequestTrip: (tripData: Partial<ContractTrip>) => Promise<void>;
  onCancelTrip: (tripId: string) => Promise<void>;
  onCompleteTrip: (tripId: string, agreedPrice?: number) => Promise<void>;
  onSwitchToDriverRole: () => void;
  onAcceptTripAsDriver?: (tripId: string, driverId: string) => Promise<void>;
  lang?: AppLanguage;
}

export const PassengerView: React.FC<PassengerViewProps> = ({
  settings,
  drivers,
  activeTrip,
  onRequestTrip,
  onCancelTrip,
  onCompleteTrip,
  onSwitchToDriverRole,
  onAcceptTripAsDriver,
  lang = 'en',
}) => {
  const districts = settings.districts?.filter(d => d.status !== 'suspended') || [];
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    settings.activeDistrictId || districts[0]?.id || 'dist-gerji'
  );

  const currentDistrict = districts.find(d => d.id === selectedDistrictId) || districts[0];
  const districtLandmarks = currentDistrict?.landmarks || settings.landmarks || [];

  // Safe fallback coordinates
  const fallbackCenterLat = currentDistrict?.center?.lat ?? settings.villageCenter?.lat ?? 8.9806;
  const fallbackCenterLng = currentDistrict?.center?.lng ?? settings.villageCenter?.lng ?? 38.8020;

  // Form State
  const [passengerName, setPassengerName] = useState('Almaz Haile');
  const [passengerPhone, setPassengerPhone] = useState('+251 91 555 7890');
  
  // Default pickup & dropoff
  const [pickupLandmarkId, setPickupLandmarkId] = useState<string>(districtLandmarks[0]?.id || '');
  const [dropoffLandmarkId, setDropoffLandmarkId] = useState<string>(districtLandmarks[1]?.id || '');
  
  const [pickupAddress, setPickupAddress] = useState(districtLandmarks[0]?.name || 'Gerji Stand');
  const [pickupCoords, setPickupCoords] = useState<LocationCoord>(
    districtLandmarks[0] 
      ? { lat: districtLandmarks[0].lat, lng: districtLandmarks[0].lng }
      : { lat: fallbackCenterLat, lng: fallbackCenterLng }
  );
  
  const [dropoffAddress, setDropoffAddress] = useState(districtLandmarks[1]?.name || 'Unity University Gate');
  const [dropoffCoords, setDropoffCoords] = useState<LocationCoord>(
    districtLandmarks[1] 
      ? { lat: districtLandmarks[1].lat, lng: districtLandmarks[1].lng }
      : {
          lat: fallbackCenterLat + 0.005,
          lng: fallbackCenterLng + 0.004,
        }
  );

  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [hasLuggage, setHasLuggage] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [mapSelectionMode, setMapSelectionMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  // 2-Minute (120s) Ringing Countdown Timer State
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);

  // When activeTrip changes, sync countdown timer
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'ringing') {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, activeTrip.ringingExpiresAt - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      setSecondsRemaining(remainingSec);
    }, 500);

    return () => clearInterval(interval);
  }, [activeTrip?.id, activeTrip?.status, activeTrip?.ringingExpiresAt]);

  // When district changes, update default landmark points
  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    const dist = districts.find(d => d.id === distId);
    if (dist && dist.landmarks && dist.landmarks.length > 0) {
      setPickupLandmarkId(dist.landmarks[0].id);
      setPickupAddress(dist.landmarks[0].name);
      setPickupCoords({ lat: dist.landmarks[0].lat, lng: dist.landmarks[0].lng });

      if (dist.landmarks[1]) {
        setDropoffLandmarkId(dist.landmarks[1].id);
        setDropoffAddress(dist.landmarks[1].name);
        setDropoffCoords({ lat: dist.landmarks[1].lat, lng: dist.landmarks[1].lng });
      } else {
        const centerLat = dist.center?.lat ?? 8.9806;
        const centerLng = dist.center?.lng ?? 38.8020;
        setDropoffCoords({ lat: centerLat + 0.005, lng: centerLng + 0.004 });
      }
    }
  };

  // Auto-Detect GPS Location
  const handleDetectGPSLocation = () => {
    setIsLocatingGPS(true);
    setGpsStatusMessage(lang === 'am' ? 'የGPS መገኛዎን በመፈለግ ላይ...' : 'Acquiring your GPS coordinates...');

    if (!navigator.geolocation) {
      setGpsStatusMessage(lang === 'am' ? 'GPS በስልክዎ ላይ አይደገፍም' : 'GPS not supported on this browser.');
      setIsLocatingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: LocationCoord = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        // Find closest district
        const closestDist = findClosestDistrict(coords, districts);
        if (closestDist) {
          setSelectedDistrictId(closestDist.id);
        }

        const distName = closestDist?.name || 'Village';

        setPickupCoords(coords);
        setPickupAddress(
          lang === 'am' 
            ? `${distName} ውስጥ የGPS መገኛ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` 
            : `Live GPS Location in ${distName} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
        );
        setPickupLandmarkId('gps');
        setIsLocatingGPS(false);
        setGpsStatusMessage(lang === 'am' ? `መገኛዎ በ${distName} ተገኝቷል!` : `Location detected in ${distName}!`);
        setTimeout(() => setGpsStatusMessage(null), 4000);
      },
      (error) => {
        setGpsStatusMessage(lang === 'am' ? 'የGPS ፈቃድ አልተገኘም' : `GPS unavailable: ${error.message}`);
        setIsLocatingGPS(false);
        setTimeout(() => setGpsStatusMessage(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Calculate live dynamic distance & pricing range
  const distanceKm = calculateDistanceKm(pickupCoords, dropoffCoords);
  const estimatedMinutes = calculateEstimatedMinutes(distanceKm);
  const { min: suggestedMin, max: suggestedMax } = calculateNegotiationRange(distanceKm, settings);

  // Online active registered drivers within 3km of pickup
  const maxRangeKm = settings.maxDispatchRangeKm || 3.0;
  const nearbyOnlineDrivers = (drivers || []).filter(d => {
    if (!d || !d.isOnline || !d.isRegistered || !d.currentLocation) return false;
    const dist = calculateDistanceKm(pickupCoords, d.currentLocation);
    return dist <= maxRangeKm;
  });

  // Handle Preset Landmark selection
  const handleSelectPickupLandmark = (landmarkId: string) => {
    setPickupLandmarkId(landmarkId);
    const lm = districtLandmarks.find(l => l.id === landmarkId) || (settings.landmarks || []).find(l => l.id === landmarkId);
    if (lm && typeof lm.lat === 'number' && typeof lm.lng === 'number') {
      setPickupAddress(lm.name);
      setPickupCoords({ lat: lm.lat, lng: lm.lng });
    }
  };

  const handleSelectDropoffLandmark = (landmarkId: string) => {
    setDropoffLandmarkId(landmarkId);
    const lm = districtLandmarks.find(l => l.id === landmarkId) || (settings.landmarks || []).find(l => l.id === landmarkId);
    if (lm && typeof lm.lat === 'number' && typeof lm.lng === 'number') {
      setDropoffAddress(lm.name);
      setDropoffCoords({ lat: lm.lat, lng: lm.lng });
    }
  };

  // Handle Map Click
  const handleMapClick = (coords: LocationCoord) => {
    if (mapSelectionMode === 'pickup') {
      setPickupCoords(coords);
      setPickupAddress(`${currentDistrict?.name || 'Village'} Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
      setPickupLandmarkId('custom');
      setMapSelectionMode(null);
    } else if (mapSelectionMode === 'dropoff') {
      setDropoffCoords(coords);
      setDropoffAddress(`${currentDistrict?.name || 'Village'} Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
      setDropoffLandmarkId('custom');
      setMapSelectionMode(null);
    }
  };

  // Submit trip request
  const handleSubmitContractRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName || !passengerPhone || !pickupAddress || !dropoffAddress) return;
    
    setIsSubmitting(true);
    try {
      await onRequestTrip({
        passengerName,
        passengerPhone,
        districtId: currentDistrict?.id || 'dist-gerji',
        districtName: currentDistrict?.name || 'Gerji District',
        pickupAddress,
        pickupCoords,
        dropoffAddress,
        dropoffCoords,
        passengerCount,
        hasLuggage,
        notes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format timer minutes:seconds
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner Notice with District Badges */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md shadow-emerald-500/20">
            🛺
          </div>
          <div className="space-y-1">
            <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg font-['Outfit'] flex items-center space-x-2">
              <span>{t(lang, 'heroTitle')}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
                ≤ 3.0 KM
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'am'
                ? `በ${currentDistrict?.name || 'መንደር'} ውስጥ በ3 ኪ.ሜ ራዲየስ ላሉ ባጃጆች የቀጥታ ጥሪ ይልካል። ዝምተኛ የ2 ደቂቃ ራዳር ቁጥጥር።`
                : `Serving internal village roads in ${currentDistrict?.name || 'Village'}. Broadcasts directly to online Bajajs within 3 KM.`}
            </p>
          </div>
        </div>

        {/* District Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {districts.map((d) => {
            const isSelected = selectedDistrictId === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleDistrictChange(d.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{d.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS Status Toast */}
      {gpsStatusMessage && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-md animate-in fade-in">
          <LocateFixed className="w-4 h-4 animate-spin" />
          <span>{gpsStatusMessage}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Map & Live Tracking */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm font-['Outfit']">
                    {currentDistrict?.name} {lang === 'am' ? 'ካርታ' : 'Bajaj Map & Stand'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {nearbyOnlineDrivers.length} {lang === 'am' ? 'ባጃጆች በ3 ኪ.ሜ ውስጥ ይገኛሉ' : 'Bajajs online within 3.0 KM'}
                  </span>
                </div>
              </div>

              {/* Pin Controls */}
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMapSelectionMode(mapSelectionMode === 'pickup' ? null : 'pickup')}
                  className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                    mapSelectionMode === 'pickup'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  📍 {lang === 'am' ? 'መነሻ ጠቁም' : 'Pin Pickup'}
                </button>
                <button
                  type="button"
                  onClick={() => setMapSelectionMode(mapSelectionMode === 'dropoff' ? null : 'dropoff')}
                  className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
                    mapSelectionMode === 'dropoff'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🏁 {lang === 'am' ? 'መድረሻ ጠቁም' : 'Pin Destination'}
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Map with 3km radius circle & GPS button */}
            <VillageMap
              center={currentDistrict?.center || settings.villageCenter}
              landmarks={districtLandmarks}
              drivers={drivers}
              districts={districts}
              activeDistrictId={selectedDistrictId}
              pickupCoords={pickupCoords}
              dropoffCoords={dropoffCoords}
              distanceKm={distanceKm}
              selectionMode={mapSelectionMode}
              onMapClick={handleMapClick}
              onLocateMe={handleDetectGPSLocation}
              heightClass="h-72 sm:h-96"
              activeDriverId={activeTrip?.acceptedByDriverId}
            />

            {/* Route Summary Stats */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-center">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  {lang === 'am' ? 'የርቀት ርዝመት' : 'Est. Road Distance'}
                </p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200 font-['Outfit'] mt-0.5">{distanceKm} KM</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 rounded-2xl text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  {lang === 'am' ? 'የሚወስደው ጊዜ' : 'Estimated Time'}
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-['Outfit'] mt-0.5">~{estimatedMinutes} min</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-2xl text-center">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                  {lang === 'am' ? 'የዋጋ መነሻ' : 'Fair Guide Price'}
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-200 font-['Outfit'] mt-0.5 truncate">
                  {suggestedMin} - {suggestedMax} {settings.currencySymbol}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Simulation Bar for Self-Testing */}
          <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-emerald-500 text-white rounded-xl font-bold text-sm">🧪</span>
              <div>
                <p className="text-xs font-bold text-white font-['Outfit']">
                  {lang === 'am' ? 'የሙከራ እና የሾፌር መቆጣጠሪያ' : 'Live Driver Mode & Self-Test'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {lang === 'am' ? 'ወደ ሾፌር ስክሪን በመቀየር ጥሪዎችን ይቀበሉ' : 'Switch to Driver Mode to hear the ringing alert and accept'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSwitchToDriverRole}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer font-['Outfit']"
            >
              {lang === 'am' ? 'የሾፌር ስክሪን ክፈት →' : 'Open Driver Screen →'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Booking Form & Active Ringing Flow */}
        <div className="lg:col-span-5 space-y-4">

          {/* STATE 1: ACTIVE RINGING RADAR (2-MIN TIMEOUT COUNTDOWN) */}
          {activeTrip && activeTrip.status === 'ringing' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-emerald-400 shadow-xl space-y-5">
              <div className="text-center space-y-2">
                
                <div className="inline-flex relative my-2">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-xl shadow-emerald-500/30 animate-pulse">
                    📞
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
                  </span>
                </div>

                {/* 2-Minute Timer Display */}
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-sm">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{lang === 'am' ? 'የቀረው ጊዜ፡' : 'Time Remaining:'} {formatTimer(secondsRemaining)}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit'] mt-2">
                    {t(lang, 'callingBajajs')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {lang === 'am'
                      ? `በ${activeTrip.districtName} ውስጥ በ3 ኪ.ሜ ላሉ ${activeTrip.targetDriverIds.length} ባጃጆች ጥሪው እየደረሰ ነው...`
                      : `Calling ${activeTrip.targetDriverIds.length} nearest Bajaj drivers within 3 KM in ${activeTrip.districtName}.`}
                  </p>
                </div>
              </div>

              {/* Trip Summary Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 font-medium">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">{t(lang, 'passengerName')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeTrip.passengerName} ({activeTrip.passengerPhone})</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">{t(lang, 'pickupLocation')}</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{activeTrip.pickupAddress}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">{t(lang, 'dropoffLocation')}</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{activeTrip.dropoffAddress}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Est. Range & Fare</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeTrip.distanceKm} KM (~{activeTrip.suggestedNegotiationMin}-{activeTrip.suggestedNegotiationMax} {activeTrip.currency})</span>
                </div>
              </div>

              {/* Instant Simulation Buttons */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Instant Testing Actions:</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const candidate = drivers.find(d => activeTrip.targetDriverIds.includes(d.id)) || drivers[0];
                      if (candidate && onAcceptTripAsDriver) {
                        onAcceptTripAsDriver(activeTrip.id, candidate.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>⚡ Pick as Driver</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(`/api/trips/${activeTrip.id}/expire-now`, { method: 'POST' });
                        onCancelTrip(activeTrip.id);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-[11px] transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>⏱ Fast-forward 2-min</span>
                  </button>
                </div>
              </div>

              {/* Cancel Call */}
              <button
                type="button"
                onClick={() => onCancelTrip(activeTrip.id)}
                className="w-full py-3 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>{lang === 'am' ? 'ጥሪውን ሰርዝ' : 'Cancel Contract Call'}</span>
              </button>
            </div>
          )}

          {/* STATE 1B: TIMED OUT / OUT OF RANGE FALLBACK MESSAGE */}
          {activeTrip && activeTrip.status === 'expired' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-rose-300 dark:border-rose-900 shadow-xl text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
                ⚠️
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
                  {lang === 'am' ? 'ይቅርታ፣ በአቅራቢያዎ ባጃጅ አልተገኘም' : 'No Bajaj Answered (Out of Range)'}
                </h3>
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 leading-relaxed max-w-sm mx-auto font-medium">
                  {t(lang, 'outOfRangeMsg')}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'am'
                    ? 'ባጃጆች በ3 ኪ.ሜ የሰፈር ውስጥ መንገድ ብቻ ይሰራሉ።'
                    : `Note: Bajajs only operate within a 3.0 KM internal road range around ${activeTrip.districtName || currentDistrict?.name}.`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onCancelTrip(activeTrip.id)}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'am' ? 'እንደገና ይሞክሩ' : 'Try Again / Call Again'}</span>
                </button>
                <a
                  href={`tel:${settings.supportPhone}`}
                  className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'am' ? 'አስተባባሪውን ደውሉ' : 'Call Stand Coordinator'}</span>
                </a>
              </div>
            </div>
          )}

          {/* STATE 2: DRIVER ACCEPTED (LIVE MATCH) */}
          {activeTrip && ['accepted', 'en_route', 'arrived'].includes(activeTrip.status) && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-emerald-500 shadow-xl space-y-5 animate-in zoom-in-95">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                    {activeTrip.status === 'accepted' && (lang === 'am' ? 'ባጃጅ ጥሪዎን ተቀብሏል!' : 'Bajaj Accepted Your Call!')}
                    {activeTrip.status === 'en_route' && (lang === 'am' ? 'ባጃጁ በመንገድ ላይ ነው' : 'Bajaj On The Way')}
                    {activeTrip.status === 'arrived' && (lang === 'am' ? 'ባጃጁ ደርሷል!' : 'Bajaj Arrived at Your Gate!')}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {lang === 'am' ? 'ተገናኝቷል' : 'Direct Match'}
                </span>
              </div>

              {/* Driver Details Card */}
              {activeTrip.acceptedDriver ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center space-x-3.5">
                    {activeTrip.acceptedDriver.photoUrl ? (
                      <img
                        src={activeTrip.acceptedDriver.photoUrl}
                        alt={activeTrip.acceptedDriver.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-sm shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                        🛺
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base truncate font-['Outfit']">
                          {activeTrip.acceptedDriver.name}
                        </h4>
                        <span className="flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                          <Star className="w-3 h-3 fill-emerald-500 text-emerald-500 mr-1" />
                          {activeTrip.acceptedDriver.rating || '4.9'}
                        </span>
                      </div>
                      <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        Plate: <span className="text-emerald-600 dark:text-emerald-400">{activeTrip.acceptedDriver.bajajPlate}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {activeTrip.acceptedDriver.districtName} ({activeTrip.acceptedDriver.villageArea})
                      </p>
                    </div>
                  </div>

                  {/* Direct Calling & Phone Number */}
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t(lang, 'driverPhone')}</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">{activeTrip.acceptedDriver.phone}</span>
                    </div>
                    <a
                      href={`tel:${activeTrip.acceptedDriver.phone}`}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t(lang, 'callDriverBtn')}</span>
                    </a>
                  </div>
                </div>
              ) : null}

              {/* Complete Trip Action */}
              <button
                type="button"
                onClick={() => {
                  onCompleteTrip(activeTrip.id, activeTrip.agreedFare || activeTrip.estimatedFare);
                  confetti({ particleCount: 90, spread: 70 });
                }}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer font-['Outfit']"
              >
                {t(lang, 'completeTrip')}
              </button>
            </div>
          )}

          {/* STATE 3: DEFAULT BOOKING FORM */}
          {(!activeTrip || activeTrip.status === 'completed' || activeTrip.status === 'cancelled') && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit'] flex items-center space-x-2">
                  <span>{t(lang, 'bookContratRide')}</span>
                  <span className="text-emerald-500 text-xs">✨</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'am'
                    ? 'ስልክዎንና መድረሻዎን ያስገቡ፤ በ3 ኪ.ሜ ላሉ ባጃጆች በቀጥታ ይጠራል'
                    : 'Enter your pickup and destination; online drivers in 3 KM will be alerted.'}
                </p>
              </div>

              <form onSubmit={handleSubmitContractRequest} className="space-y-4">
                
                {/* Passenger Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t(lang, 'passengerName')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t(lang, 'passengerPhone')} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="+251 9..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Pickup Location */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{t(lang, 'pickupLocation')} *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGPSLocation}
                      disabled={isLocatingGPS}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                    >
                      <LocateFixed className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                      <span>{isLocatingGPS ? 'Locating...' : t(lang, 'useLiveGps')}</span>
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Enter pickup address or landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Preset Landmarks Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {districtLandmarks.slice(0, 3).map((lm) => (
                      <button
                        key={lm.id}
                        type="button"
                        onClick={() => handleSelectPickupLandmark(lm.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                          pickupLandmarkId === lm.id
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {lm.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dropoff Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>{t(lang, 'dropoffLocation')} *</span>
                  </label>
                  
                  <input
                    type="text"
                    required
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    placeholder="Enter destination in village"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Preset Dropoff Landmarks Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {districtLandmarks.slice(1, 4).map((lm) => (
                      <button
                        key={lm.id}
                        type="button"
                        onClick={() => handleSelectDropoffLandmark(lm.id)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                          dropoffLandmarkId === lm.id
                            ? 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-700 dark:text-rose-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {lm.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options: Passengers & Luggage */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t(lang, 'passengerCount')}</span>
                    </label>
                    <select
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
                    >
                      <option value={1}>1 Person</option>
                      <option value={2}>2 Persons</option>
                      <option value={3}>3 Persons (Full Bajaj)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t(lang, 'hasLuggage')}</span>
                    </label>
                    <div className="flex items-center space-x-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="hasLuggageCheck"
                        checked={hasLuggage}
                        onChange={(e) => setHasLuggage(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded-md border-slate-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="hasLuggageCheck" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        {lang === 'am' ? 'ሻንጣ አለኝ' : 'Yes, have bags'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !passengerName || !passengerPhone || !pickupAddress || !dropoffAddress}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-transform active:scale-98 cursor-pointer flex items-center justify-center space-x-2 font-['Outfit'] mt-2"
                >
                  <span>{isSubmitting ? (lang === 'am' ? 'በመደወል ላይ...' : 'Calling Bajajs...') : t(lang, 'callBajajBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
