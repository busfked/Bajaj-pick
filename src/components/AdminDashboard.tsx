import React, { useState } from 'react';
import { 
  BajajDriver, 
  ContractTrip, 
  VillageSettings, 
  VillageDistrict,
  DriverRegistrationForm,
  AppLanguage 
} from '../types';
import { 
  ShieldCheck, 
  DollarSign, 
  Users, 
  Car, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Settings, 
  Share2, 
  QrCode, 
  Phone, 
  Mail,
  Copy, 
  Sparkles,
  RefreshCw,
  Award,
  ChevronRight,
  Printer,
  Lock,
  Unlock,
  Plus,
  Trash2,
  MapPin,
  Camera,
  Crop,
  FileText,
  Upload,
  Check,
  Eye,
  Percent,
  Search,
  KeyRound,
  AlertTriangle,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImageCropModal } from './ImageCropModal';
import { t } from '../utils/translations';

interface AdminDashboardProps {
  settings: VillageSettings;
  drivers: BajajDriver[];
  trips: ContractTrip[];
  onUpdateSettings: (newSettings: Partial<VillageSettings>) => Promise<void>;
  onResetDemo: () => void;
  onAddDriver?: (data: DriverRegistrationForm) => Promise<boolean>;
  onRemoveDriver?: (driverId: string) => Promise<void>;
  onAddDistrict?: (districtData: Partial<VillageDistrict>) => Promise<void>;
  onDeleteDistrict?: (districtId: string) => Promise<void>;
  onSettleAnnualFee?: (driverId: string) => Promise<void>;
  lang?: AppLanguage;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  drivers,
  trips,
  onUpdateSettings,
  onResetDemo,
  onAddDriver,
  onRemoveDriver,
  onAddDistrict,
  onDeleteDistrict,
  onSettleAnnualFee,
  lang = 'en',
}) => {
  // Password Lock Screen State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'fleet' | 'districts' | 'annual_fees' | 'promotion' | 'settings' | 'trips'>('fleet');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Driver Full ID Dossier Modal
  const [selectedDriverDossier, setSelectedDriverDossier] = useState<BajajDriver | null>(null);

  // Add Bajaj Modal State
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [newDriverData, setNewDriverData] = useState<DriverRegistrationForm>({
    name: '',
    phone: '',
    secondaryPhone: '',
    bajajPlate: '',
    bajajColor: 'Yellow & Black',
    districtId: settings.districts?.[0]?.id || 'dist-gerji',
    districtName: settings.districts?.[0]?.name || 'Gerji District',
    villageArea: settings.districts?.[0]?.landmarks?.[0]?.name || 'Gerji Stand',
    nationalIdNumber: '',
    faydaNumber: '',
    kebeleHouseNumber: '',
    modelYear: '2024 TVS King',
    emergencyContactName: '',
    emergencyContactPhone: '',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    nationalIdPhotoUrl: '',
  });

  // Cropper modal state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<'add_driver' | 'dossier_driver'>('add_driver');
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);

  // Add District Modal State
  const [isAddDistrictModalOpen, setIsAddDistrictModalOpen] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictDescription, setNewDistrictDescription] = useState('');
  const [newDistrictLat, setNewDistrictLat] = useState('8.9806');
  const [newDistrictLng, setNewDistrictLng] = useState('38.8020');
  const [newDistrictRadius, setNewDistrictRadius] = useState('3.0');

  // Change Password State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState<string | null>(null);
  const [passChangeError, setPassChangeError] = useState<string | null>(null);

  // Settings State
  const [villageName, setVillageName] = useState(settings.villageName);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || 'coordinator@villagebajaj.et');
  const [annualCommissionPercent, setAnnualCommissionPercent] = useState(settings.annualCommissionPercent || 2);
  const [baseContractFare, setBaseContractFare] = useState(settings.baseContractFare || 40);
  const [ratePerKm, setRatePerKm] = useState(settings.ratePerKm || 20);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Handle Login Check
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        setPasswordError(lang === 'am' ? 'የተሳሳተ የይለፍ ቃል' : 'Incorrect Admin Password');
      }
    } catch {
      setPasswordError(lang === 'am' ? 'ስህተት ተከስቷል' : 'Authentication failed');
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeError(null);
    setPassChangeSuccess(null);

    if (newPassInput !== confirmPassInput) {
      setPassChangeError(lang === 'am' ? 'አዲሱ የይለፍ ቃል አይመሳሰልም' : 'New passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassInput,
          newPassword: newPassInput,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassChangeSuccess(lang === 'am' ? 'የይለፍ ቃሉ በተሳካ ሁኔታ ተቀይሯል!' : 'Admin password successfully updated!');
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
        setTimeout(() => setPassChangeSuccess(null), 4000);
      } else {
        setPassChangeError(data.error || 'Failed to update password');
      }
    } catch {
      setPassChangeError('Network error updating password');
    }
  };

  // Handle District Suspend / Activate Toggle
  const handleToggleDistrictStatus = async (district: VillageDistrict) => {
    const nextStatus = district.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`/api/districts/${district.id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          suspendedReason: nextStatus === 'suspended' ? 'Temporarily suspended by coordinator' : undefined,
        }),
      });
      if (res.ok) {
        onResetDemo(); // triggers state refresh
      }
    } catch {
      // Ignore
    }
  };

  // Handle Save Support Phone & Email
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      villageName,
      supportPhone,
      supportEmail,
      annualCommissionPercent: Number(annualCommissionPercent),
      baseContractFare: Number(baseContractFare),
      ratePerKm: Number(ratePerKm),
    });
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  // Handle Clear All Data (Fresh Blank Start)
  const handleClearAllData = async () => {
    if (!window.confirm(lang === 'am' ? 'ሁሉንም የሙከራ ሾፌሮችና ጉዞዎች ማጽዳት ይፈልጋሉ?' : 'Are you sure you want to clear all data and start with 0 drivers?')) return;
    try {
      const res = await fetch('/api/admin/reset-clean', { method: 'POST' });
      if (res.ok) {
        onResetDemo();
      }
    } catch {
      // Ignore
    }
  };

  // Handle Add Driver Submit
  const handleAddDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverData.name || !newDriverData.phone || !newDriverData.bajajPlate) return;
    setIsSubmittingDriver(true);
    try {
      if (onAddDriver) {
        const ok = await onAddDriver(newDriverData);
        if (ok) {
          setIsAddDriverModalOpen(false);
          setNewDriverData({
            name: '',
            phone: '',
            secondaryPhone: '',
            bajajPlate: '',
            bajajColor: 'Yellow & Black',
            districtId: settings.districts?.[0]?.id || 'dist-gerji',
            districtName: settings.districts?.[0]?.name || 'Gerji District',
            villageArea: settings.districts?.[0]?.landmarks?.[0]?.name || 'Gerji Stand',
            nationalIdNumber: '',
            faydaNumber: '',
            kebeleHouseNumber: '',
            modelYear: '2024 TVS King',
            emergencyContactName: '',
            emergencyContactPhone: '',
            photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            nationalIdPhotoUrl: '',
          });
          confetti({ particleCount: 80, spread: 60 });
        }
      }
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  // Handle Add District Submit
  const handleAddDistrictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictName) return;
    if (onAddDistrict) {
      await onAddDistrict({
        name: newDistrictName.trim(),
        description: newDistrictDescription || `${newDistrictName} internal neighborhood streets`,
        center: { lat: parseFloat(newDistrictLat) || 8.9806, lng: parseFloat(newDistrictLng) || 38.8020 },
        maxRadiusKm: parseFloat(newDistrictRadius) || 3.0,
      });
      setIsAddDistrictModalOpen(false);
      setNewDistrictName('');
      setNewDistrictDescription('');
    }
  };

  // Update Driver Profile Photo directly from Dossier modal crop
  const handleCropCompleteForDossier = async (croppedDataUrl: string) => {
    if (cropTarget === 'add_driver') {
      setNewDriverData(prev => ({ ...prev, photoUrl: croppedDataUrl }));
    } else if (cropTarget === 'dossier_driver' && selectedDriverDossier) {
      try {
        const res = await fetch(`/api/drivers/${selectedDriverDossier.id}/update-photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: croppedDataUrl }),
        });
        if (res.ok) {
          selectedDriverDossier.photoUrl = croppedDataUrl;
          onResetDemo();
        }
      } catch {
        // Ignore
      }
    }
  };

  // Password Gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-950 text-emerald-400 mx-auto flex items-center justify-center text-2xl shadow-inner border border-slate-800">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              {t(lang, 'adminLocked')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'am'
                ? 'የመንደር አስተባባሪ የይለፍ ቃልዎን ያስገቡ (መደበኛ፡ admin)'
                : 'Enter your coordinator password to access admin controls (default: admin)'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'am' ? 'የአስተዳዳሪ የይለፍ ቃል' : 'Admin Password'}
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {passwordError && (
              <p className="text-xs font-bold text-red-500 text-left flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{passwordError}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-98 cursor-pointer"
            >
              {lang === 'am' ? 'ክፈትና ግባ' : 'Unlock Dashboard'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            {lang === 'am' ? 'የይለፍ ቃልዎን በቅንብሮች ውስጥ መቀየር ይችላሉ' : 'You can change this password anytime in Admin Settings.'}
          </div>
        </div>
      </div>
    );
  }

  // Filtered drivers list
  const filteredDrivers = drivers.filter((d) => {
    const matchDistrict = districtFilter === 'all' || d.districtId === districtFilter;
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.bajajPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.nationalIdNumber && d.nationalIdNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchDistrict && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-['Outfit']">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t(lang, 'adminUnlocked')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Outfit']">
            {settings.villageName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            {lang === 'am'
              ? 'የወረዳዎች ቁጥጥር፣ የባጃጅ ምዝገባ፣ የይለፍ ቃል ለውጥ እና የድጋፍ ስልክ/ኢሜይል አስተዳደር'
              : 'District Boundaries, Driver ID Verification, Support Contacts & 2% Annual Settlements'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddDriverModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t(lang, 'addNewBajaj')}</span>
          </button>
          
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'fleet'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t(lang, 'fleetRegistry')} ({drivers.length})
        </button>

        <button
          onClick={() => setActiveTab('districts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'districts'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t(lang, 'districtsTab')} ({settings.districts?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('annual_fees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'annual_fees'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t(lang, 'annualSettlementTab')}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t(lang, 'settingsTab')}
        </button>

        <button
          onClick={() => setActiveTab('promotion')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'promotion'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t(lang, 'promotionTab')}
        </button>
      </div>

      {/* ================= TAB 1: FLEET REGISTRY ================= */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'am' ? 'በስም፣ ስልክ፣ ታርጋ ወይም መታወቂያ ፈልግ...' : 'Search by name, phone, plate, ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                {lang === 'am' ? 'ወረዳ፡' : 'District:'}
              </span>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
              >
                <option value="all">{lang === 'am' ? 'ሁሉም ወረዳዎች' : 'All Districts'}</option>
                {settings.districts?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.status === 'suspended' ? ' (Suspended)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drivers Grid */}
          {filteredDrivers.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Car className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">
                {lang === 'am' ? 'ምንም የተመዘገበ ባጃጅ የለም' : 'No Bajaj Drivers Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'am'
                  ? 'እርስዎ እራስዎ መመዝገብ ይችላሉ ወይም ከላይ "+ አዲስ ባጃጅ መዝግብ" የሚለውን ይጫኑ።'
                  : 'You have a clean slate! Register your own driver account to test the system live.'}
              </p>
              <button
                onClick={() => setIsAddDriverModalOpen(true)}
                className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600"
              >
                + {t(lang, 'addNewBajaj')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition-all space-y-4 cursor-pointer"
                  onClick={() => setSelectedDriverDossier(driver)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0 bg-slate-800 flex items-center justify-center">
                      <img
                        src={driver.photoUrl}
                        alt={driver.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate font-['Outfit']">
                          {driver.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          driver.isOnline 
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {driver.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{driver.phone}</p>
                      <span className="inline-block text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-bold mt-1">
                        {driver.districtName}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Plate:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{driver.bajajPlate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">National ID:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">
                        {driver.nationalIdNumber || 'Uploaded'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{lang === 'am' ? 'መታወቂያ ፋይል ክፈት' : 'View Full ID Dossier'}</span>
                    </span>

                    {onRemoveDriver && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Remove ${driver.name}?`)) {
                            onRemoveDriver(driver.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ================= TAB 2: DISTRICTS & SUSPENSION ================= */}
      {activeTab === 'districts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                {t(lang, 'districtsTab')}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'am'
                  ? 'የመንደር ወረዳዎችን ማስተዳደር፣ አዲስ መጨመር፣ ወይም ለጊዜው ማገድ/ማንቃት'
                  : 'Manage inner-road zones, add new neighborhood perimeters, or suspend/activate districts'}
              </p>
            </div>

            <button
              onClick={() => setIsAddDistrictModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t(lang, 'addNewDistrict')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.districts?.map((district) => {
              const driverCount = drivers.filter((d) => d.districtId === district.id).length;
              const isSuspended = district.status === 'suspended';

              return (
                <div
                  key={district.id}
                  className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-xs space-y-4 transition-all ${
                    isSuspended 
                      ? 'border-amber-400/60 bg-amber-50/10' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                          isSuspended
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {isSuspended ? t(lang, 'districtSuspended') : t(lang, 'districtActive')}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                        {district.name}
                      </h3>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {district.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Registered Fleet:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{driverCount} Bajajs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Max Radius:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{district.maxRadiusKm} KM</span>
                    </div>
                  </div>

                  {/* Actions: Suspend/Activate & Delete */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleToggleDistrictStatus(district)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                        isSuspended
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {isSuspended ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>{t(lang, 'activateDistrict')}</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>{t(lang, 'suspendDistrict')}</span>
                        </>
                      )}
                    </button>

                    {onDeleteDistrict && (settings.districts?.length || 0) > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${district.name}?`)) {
                            onDeleteDistrict(district.id);
                          }
                        }}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: 2% ANNUAL SETTLEMENT ================= */}
      {activeTab === 'annual_fees' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl p-6 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
            <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm flex items-center space-x-2 font-['Outfit']">
              <Percent className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'am' ? 'የ2% ዓመታዊ የኮሚሽን አከፋፈል መርህ' : 'Zero Daily Commission • 2% Annual Settlement Policy'}</span>
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300/80 leading-relaxed">
              {lang === 'am'
                ? 'አሽከርካሪዎች የየዕለቱን የኮንትራት ዋጋ 100% በሙሉ በቀጥታ ይወስዳሉ። በዓመት አንድ ጊዜ ከጠቅላላ የጉዞ መጠን 2% ብቻ ይከፍላሉ።'
                : 'Drivers keep 100% of their daily passenger cash / Telebirr fares. Coordinator collects only 2% once per year during annual settlement.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
              {lang === 'am' ? 'የ2026 ዓ.ም የባጃጆች የሂሳብ መዝገብ' : '2026 Annual Settlement Ledger'}
            </div>

            {drivers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {lang === 'am' ? 'ምንም አሽከርካሪ አልተመዘገበም' : 'No drivers registered yet.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {drivers.map((driver) => (
                  <div key={driver.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <img src={driver.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700" />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{driver.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{driver.bajajPlate} • {driver.districtName}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Trips:</span>
                        <span className="font-bold">{driver.totalTripsCompleted || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Est. Earnings:</span>
                        <span className="font-bold font-mono">{(driver.totalEstimatedEarnings || 0).toLocaleString()} Br</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">2% Due:</span>
                        <span className="font-bold text-emerald-600 font-mono">{(driver.annualCommissionDue || 0).toLocaleString()} Br</span>
                      </div>

                      {onSettleAnnualFee && (
                        <button
                          onClick={() => onSettleAnnualFee(driver.id)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                        >
                          {t(lang, 'markSettled')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: SETTINGS, PASSWORD & SUPPORT CONTACTS ================= */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Change Admin Password Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <KeyRound className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                {t(lang, 'changePassword')}
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t(lang, 'currentPassword')}
                </label>
                <input
                  type="password"
                  required
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t(lang, 'newPassword')}
                </label>
                <input
                  type="password"
                  required
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t(lang, 'confirmPassword')}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {passChangeSuccess && (
                <p className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{passChangeSuccess}</span>
                </p>
              )}

              {passChangeError && (
                <p className="text-xs font-bold text-red-500 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{passChangeError}</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t(lang, 'updatePasswordBtn')}
              </button>
            </form>
          </div>

          {/* Support Contacts & Village Rates */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Settings className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                {lang === 'am' ? 'የድጋፍ ስልክ፣ ኢሜይል እና ተመን' : 'Support Contacts & Rate Calibration'}
              </h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t(lang, 'supportPhoneLabel')}</span>
                </label>
                <input
                  type="text"
                  required
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+251 9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t(lang, 'supportEmailLabel')}</span>
                </label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="coordinator@villagebajaj.et"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Base Fare (Br)</label>
                  <input
                    type="number"
                    value={baseContractFare}
                    onChange={(e) => setBaseContractFare(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rate / KM (Br)</label>
                  <input
                    type="number"
                    value={ratePerKm}
                    onChange={(e) => setRatePerKm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {settingsSavedMsg && (
                <p className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'am' ? 'ቅንብሮቹ ተቀምጠዋል!' : 'Settings successfully saved!'}</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {t(lang, 'saveSettingsBtn')}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleClearAllData}
                className="w-full py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition-colors cursor-pointer"
              >
                {t(lang, 'clearAllDemoData')}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 5: PROMOTION IN VILLAGE ================= */}
      {activeTab === 'promotion' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">
                {lang === 'am' ? 'በመንደሩ ውስጥ ማስተዋወቂያ ኪት' : 'Village Promotion Noticeboard Flyer'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'am' ? 'የQR ኮድ ያለው ፖስተር አትመው በሰፈር መግቢያዎችና በባጃጅ ማቆሚያዎች ይለጥፉ' : 'Print and stick noticeboard flyers at village gates & stands'}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'am' ? 'ፖስተሩን አትም' : 'Print Noticeboard Flyer'}</span>
            </button>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto text-center space-y-4">
            <div className="inline-block px-3 py-1 bg-emerald-500 text-white rounded-full font-bold text-xs">
              {settings.villageName}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              {lang === 'am' ? 'የኮንትራት ባጃጅ ከቤትዎ ይጥሩ!' : 'Call Contrat Bajaj Right From Home!'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {lang === 'am'
                ? `ስልክ፡ ${settings.supportPhone} • በ3 ኪ.ሜ ውስጥ ለሚገኙ ባጃጆች በቀጥታ ይጠራል`
                : `Coordinator: ${settings.supportPhone} • Instant 3 KM Bajaj Calling`}
            </p>

            <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-md mx-auto flex items-center justify-center border border-slate-200">
              <QrCode className="w-32 h-32 text-slate-900" />
            </div>

            <p className="text-[11px] text-slate-400">
              Scan with phone camera to open village dispatch instantly.
            </p>
          </div>
        </div>
      )}

      {/* ================= MODAL: DRIVER FULL ID DOSSIER ================= */}
      {selectedDriverDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                  {t(lang, 'driverDossier')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDriverDossier(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0 bg-slate-800">
                <img
                  src={selectedDriverDossier.photoUrl}
                  alt={selectedDriverDossier.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                  {selectedDriverDossier.name}
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedDriverDossier.districtName} ({selectedDriverDossier.villageArea})
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Primary: {selectedDriverDossier.phone}
                </p>
              </div>
            </div>

            {/* National ID Photo Display & Cropper Trigger */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t(lang, 'nationalIdCard')}
                </span>
                {selectedDriverDossier.nationalIdPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCropImageSrc(selectedDriverDossier.nationalIdPhotoUrl!);
                      setCropTarget('dossier_driver');
                      setIsCropModalOpen(true);
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>{t(lang, 'cropProfilePhoto')}</span>
                  </button>
                )}
              </div>

              {selectedDriverDossier.nationalIdPhotoUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 aspect-16/9 bg-slate-900 flex items-center justify-center">
                  <img
                    src={selectedDriverDossier.nationalIdPhotoUrl}
                    alt="National ID"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No National ID photo image stored.</p>
              )}
            </div>

            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">National / Kebele ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedDriverDossier.nationalIdNumber || 'Verified in person'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Bajaj Plate Number:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedDriverDossier.bajajPlate}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Color & Model:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedDriverDossier.bajajColor} • {selectedDriverDossier.modelYear || '2024'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Secondary Contact:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedDriverDossier.secondaryPhone || selectedDriverDossier.emergencyContactPhone || 'None'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDriverDossier(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
              >
                Close
              </button>
              
              <a
                href={`tel:${selectedDriverDossier.phone}`}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: ADD NEW BAJAJ (ADMIN) ================= */}
      {isAddDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                {t(lang, 'addNewBajaj')}
              </h3>
              <button
                onClick={() => setIsAddDriverModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDriverSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t(lang, 'fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newDriverData.name}
                  onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                  placeholder="e.g. Dawit Bekele"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'phoneNumber')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newDriverData.phone}
                    onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                    placeholder="+251 9..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'plateNumber')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDriverData.bajajPlate}
                    onChange={(e) => setNewDriverData({ ...newDriverData, bajajPlate: e.target.value.toUpperCase() })}
                    placeholder="AA-3-45129"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t(lang, 'selectDistrict')} *
                </label>
                <select
                  value={newDriverData.districtId}
                  onChange={(e) => {
                    const d = settings.districts?.find(dist => dist.id === e.target.value);
                    if (d) {
                      setNewDriverData({
                        ...newDriverData,
                        districtId: d.id,
                        districtName: d.name,
                        villageArea: d.landmarks?.[0]?.name || `${d.name} Stand`,
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  {settings.districts?.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* National ID Photo Upload & Crop Trigger */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t(lang, 'uploadNationalId')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setNewDriverData(prev => ({
                            ...prev,
                            nationalIdPhotoUrl: reader.result as string,
                          }));
                          setCropImageSrc(reader.result as string);
                          setCropTarget('add_driver');
                          setIsCropModalOpen(true);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDriverModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDriver}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  {isSubmittingDriver ? 'Saving...' : 'Add Bajaj to Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD DISTRICT ================= */}
      {isAddDistrictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                {t(lang, 'addNewDistrict')}
              </h3>
              <button
                onClick={() => setIsAddDistrictModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDistrictSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">District Name *</label>
                <input
                  type="text"
                  required
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  placeholder="e.g. Bole Bulbula"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Road Description</label>
                <input
                  type="text"
                  value={newDistrictDescription}
                  onChange={(e) => setNewDistrictDescription(e.target.value)}
                  placeholder="Internal village lanes & local stands"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Center Lat</label>
                  <input
                    type="text"
                    value={newDistrictLat}
                    onChange={(e) => setNewDistrictLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Center Lng</label>
                  <input
                    type="text"
                    value={newDistrictLng}
                    onChange={(e) => setNewDistrictLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDistrictModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Create District
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Image Cropper Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        lang={lang}
        onCropComplete={handleCropCompleteForDossier}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropImageSrc(null);
        }}
      />

    </div>
  );
};
