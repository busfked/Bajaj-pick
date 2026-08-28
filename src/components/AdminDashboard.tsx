import React, { useState, useEffect } from 'react';
import { 
  BajajDriver, 
  ContractTrip, 
  VillageSettings, 
  VillageDistrict,
  DriverRegistrationForm,
  DriverRechargeRequest,
  AppLanguage,
  ColorTheme
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
  PlayCircle,
  Gauge,
  PlusCircle,
  MinusCircle,
  LogOut,
  ExternalLink,
  Image as ImageIcon,
  Edit3,
  CheckCheck,
  Shield,
  CheckCircle,
  X,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImageCropModal } from './ImageCropModal';
import { t } from '../utils/translations';
import { COLOR_THEMES } from '../utils/colors';

interface AdminDashboardProps {
  settings: VillageSettings;
  drivers: BajajDriver[];
  trips: ContractTrip[];
  recharges?: DriverRechargeRequest[];
  onUpdateSettings: (newSettings: Partial<VillageSettings>) => Promise<void>;
  onResetDemo: () => void;
  onAddDriver?: (data: DriverRegistrationForm) => Promise<boolean>;
  onUpdateDriver?: (driverId: string, updatedData: Partial<BajajDriver>) => Promise<void>;
  onRemoveDriver?: (driverId: string) => Promise<void>;
  onAddDistrict?: (districtData: Partial<VillageDistrict>) => Promise<void>;
  onDeleteDistrict?: (districtId: string) => Promise<void>;
  onSettleAnnualFee?: (driverId: string) => Promise<void>;
  onExitAdmin?: () => void;
  lang?: AppLanguage;
  colorTheme?: ColorTheme;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  drivers,
  trips,
  recharges: initialRecharges = [],
  onUpdateSettings,
  onResetDemo,
  onAddDriver,
  onUpdateDriver,
  onRemoveDriver,
  onAddDistrict,
  onDeleteDistrict,
  onSettleAnnualFee,
  onExitAdmin,
  lang = 'en',
  colorTheme = 'emerald',
}) => {
  // Check session authorization
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('bajaj_admin_authenticated') === 'true';
  });

  // Recharges list state
  const [rechargesList, setRechargesList] = useState<DriverRechargeRequest[]>(initialRecharges);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'recharges' | 'driver_approvals' | 'fleet' | 'districts' | 'annual_fees' | 'settings' | 'promotion'>('recharges');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Driver Approval & Rejection State
  const [selectedRejectDriver, setSelectedRejectDriver] = useState<BajajDriver | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('ID / Fayda photo is blurry or unreadable');
  const [customRejectNote, setCustomRejectNote] = useState<string>('');
  const [isProcessingDriverApproval, setIsProcessingDriverApproval] = useState(false);

  // Driver Full ID Dossier Modal
  const [selectedDriverDossier, setSelectedDriverDossier] = useState<BajajDriver | null>(null);

  // Driver KM adjustment modal
  const [adjustKmDriver, setAdjustKmDriver] = useState<BajajDriver | null>(null);
  const [kmAdjustAmount, setKmAdjustAmount] = useState<string>('15');
  const [isAdjustingKm, setIsAdjustingKm] = useState(false);

  // Edit Driver Modal State
  const [isEditDriverModalOpen, setIsEditDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<BajajDriver | null>(null);
  const [editDriverData, setEditDriverData] = useState<Partial<BajajDriver>>({});
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  const [quickDistrictChangingId, setQuickDistrictChangingId] = useState<string | null>(null);

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

  // Settings State
  const [villageName, setVillageName] = useState(settings.villageName);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone || '0991154337');
  const [supportTelegram, setSupportTelegram] = useState(settings.supportTelegram || '@Loyalblack');
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || 'busfkedmurdu21@gmail.com');
  const [adminPhone, setAdminPhone] = useState(settings.adminPhone || '0991154337');
  const [telebirrAccount, setTelebirrAccount] = useState(settings.adminPaymentAccounts?.telebirr || settings.telebirrAccount || '0991154337');
  const [cbeAccount, setCbeAccount] = useState(settings.adminPaymentAccounts?.cbe || settings.cbeAccount || '1000123456789');
  const [boaAccount, setBoaAccount] = useState(settings.adminPaymentAccounts?.boa || settings.boaAccount || '887654321');
  const [kmRateBirr, setKmRateBirr] = useState(settings.kmRateBirrPer15Km || 100);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  const activeColor = COLOR_THEMES[colorTheme] || COLOR_THEMES.emerald;

  // Poll recharges
  const fetchRecharges = async () => {
    try {
      const res = await fetch('/api/recharges');
      if (res.ok) {
        const data = await res.json();
        if (data.recharges) {
          setRechargesList(data.recharges);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchRecharges();
    const interval = setInterval(fetchRecharges, 2500);
    return () => clearInterval(interval);
  }, []);

  // Handle Approve Recharge
  const handleApproveRecharge = async (rechargeId: string) => {
    try {
      const res = await fetch(`/api/recharges/${rechargeId}/approve`, { method: 'POST' });
      if (res.ok) {
        confetti({ particleCount: 100, spread: 70 });
        await fetchRecharges();
        onResetDemo();
      }
    } catch {
      // Ignore
    }
  };

  // Handle Reject Recharge
  const handleRejectRecharge = async (rechargeId: string) => {
    const reason = window.prompt(lang === 'am' ? 'የውድቅ ማድረጊያ ምክንያት ያስገቡ፡' : 'Enter rejection reason:', 'Unclear screenshot / Transaction not found');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/recharges/${rechargeId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        await fetchRecharges();
        onResetDemo();
      }
    } catch {
      // Ignore
    }
  };

  // Handle Adjust Driver KM
  const handleAdjustDriverKm = async () => {
    if (!adjustKmDriver) return;
    setIsAdjustingKm(true);
    try {
      const amount = parseFloat(kmAdjustAmount) || 0;
      const res = await fetch(`/api/drivers/${adjustKmDriver.id}/adjust-km`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountKm: amount }),
      });
      if (res.ok) {
        setAdjustKmDriver(null);
        setKmAdjustAmount('15');
        confetti({ particleCount: 60, spread: 50 });
        onResetDemo();
      }
    } catch {
      // Ignore
    } finally {
      setIsAdjustingKm(false);
    }
  };

  // Approve Driver Registration (Activate + 15 KM Starter Credit)
  const handleApproveDriver = async (driverId: string) => {
    setIsProcessingDriverApproval(true);
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        confetti({ particleCount: 90, spread: 70 });
        onResetDemo();
      }
    } catch (err) {
      console.error('Error approving driver:', err);
    } finally {
      setIsProcessingDriverApproval(false);
    }
  };

  // Reject Driver Registration with Clear Feedback
  const handleRejectDriver = async (driverId: string) => {
    setIsProcessingDriverApproval(true);
    const finalReason = rejectReasonInput === 'Other Reason' && customRejectNote.trim()
      ? customRejectNote.trim()
      : rejectReasonInput;

    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      });
      if (res.ok) {
        setSelectedRejectDriver(null);
        setCustomRejectNote('');
        onResetDemo();
      }
    } catch (err) {
      console.error('Error rejecting driver:', err);
    } finally {
      setIsProcessingDriverApproval(false);
    }
  };

  // Open Comprehensive Edit Driver Modal
  const handleOpenEditDriver = (driver: BajajDriver) => {
    setEditingDriver(driver);
    setEditDriverData({
      name: driver.name,
      phone: driver.phone,
      secondaryPhone: driver.secondaryPhone || '',
      bajajPlate: driver.bajajPlate,
      bajajColor: driver.bajajColor || 'Yellow & Black',
      modelYear: driver.modelYear || '2024 TVS King',
      districtId: driver.districtId,
      districtName: driver.districtName,
      villageArea: driver.villageArea || '',
      nationalIdNumber: driver.nationalIdNumber || '',
      faydaNumber: driver.faydaNumber || '',
      kebeleHouseNumber: driver.kebeleHouseNumber || '',
      emergencyContactName: driver.emergencyContactName || '',
      emergencyContactPhone: driver.emergencyContactPhone || '',
      kmBalance: driver.kmBalance ?? 15,
      rating: driver.rating || 5.0,
      photoUrl: driver.photoUrl || '',
      nationalIdPhotoUrl: driver.nationalIdPhotoUrl || '',
      isOnline: driver.isOnline,
      isRegistered: driver.isRegistered,
    });
    setIsEditDriverModalOpen(true);
  };

  // Quick 1-Click Change Driver District
  const handleQuickChangeDistrict = async (driverId: string, newDistrictId: string) => {
    setQuickDistrictChangingId(driverId);
    try {
      const res = await fetch(`/api/drivers/${driverId}/change-district`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ districtId: newDistrictId }),
      });
      if (res.ok) {
        confetti({ particleCount: 50, spread: 50 });
        onResetDemo();
      }
    } catch {
      // Ignore
    } finally {
      setQuickDistrictChangingId(null);
    }
  };

  // Save All Changes to Driver
  const handleSaveEditDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    setIsSavingDriver(true);
    try {
      const res = await fetch(`/api/drivers/${editingDriver.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDriverData),
      });
      if (res.ok) {
        setIsEditDriverModalOpen(false);
        setEditingDriver(null);
        confetti({ particleCount: 70, spread: 60 });
        onResetDemo();
      }
    } catch {
      // Ignore
    } finally {
      setIsSavingDriver(false);
    }
  };

  // Delete Driver with Prompt & Instant Purge
  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    const confirmMsg = lang === 'am'
      ? `አሽከርካሪውን '${driverName}' እና ሁሉንም መረጃዎች በቋሚነት መሰረዝ ይፈልጋሉ?`
      : `Are you sure you want to permanently delete driver '${driverName}' and all associated mileage records?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/drivers/${driverId}`, { method: 'DELETE' });
      if (res.ok) {
        if (onRemoveDriver) {
          await onRemoveDriver(driverId);
        }
        if (isEditDriverModalOpen) {
          setIsEditDriverModalOpen(false);
          setEditingDriver(null);
        }
        onResetDemo();
      }
    } catch {
      // Ignore
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
        onResetDemo();
      }
    } catch {
      // Ignore
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      villageName,
      supportPhone,
      supportTelegram,
      supportEmail,
      adminPhone,
      kmRateBirrPer15Km: Number(kmRateBirr),
      telebirrAccount,
      cbeAccount,
      boaAccount,
      adminPaymentAccounts: {
        telebirr: telebirrAccount,
        cbe: cbeAccount,
        boa: boaAccount,
        awash: boaAccount,
      },
    });
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
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

  // Pending Recharges count
  const pendingRecharges = rechargesList.filter(r => r.status === 'pending');

  // Pending & Rejected Drivers count
  const pendingDrivers = drivers.filter(d => d.approvalStatus === 'pending');
  const rejectedDrivers = drivers.filter(d => d.approvalStatus === 'rejected');

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Top Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2">
          {onExitAdmin && (
            <button
              type="button"
              id="btn-admin-back-passenger"
              onClick={onExitAdmin}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <span>{lang === 'am' ? '← ወደ ተሳፋሪ ገጽ ተመለስ' : '← Back to Passenger Booking'}</span>
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-400">
          {lang === 'am' ? 'የአስተዳዳሪ እና አስተባባሪ ዳሽቦርድ' : 'Administrator & Coordinator Portal'}
        </span>
      </div>

      {/* Top Header Card */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-['Outfit']">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{settings.adminEmail || 'busfkedmurdu21@gmail.com'} (Coordinator)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Outfit']">
            {settings.villageName} Coordinator Panel
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            {lang === 'am'
              ? 'የክፍያ ስክሪንሽቶች ማጽደቂያ (100 ብር = 15 KM)፣ የባጃጆች እና የወረዳዎች አስተዳደር'
              : 'Payment Screenshot Approvals (100 Birr = 15 KM), Fleet Management & District Boundaries'}
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
            onClick={() => {
              sessionStorage.removeItem('bajaj_admin_authenticated');
              if (onExitAdmin) onExitAdmin();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'am' ? 'ውጣ' : 'Exit Admin'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('recharges')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recharges'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{lang === 'am' ? 'የክፍያ ስክሪንሽቶች (100 ብር/15 KM)' : 'Payment Screenshots'}</span>
          {pendingRecharges.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse ml-1">
              {pendingRecharges.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('driver_approvals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'driver_approvals'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{lang === 'am' ? 'የአሽከርካሪ ምዝገባዎች' : 'Driver Approvals'}</span>
          {pendingDrivers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse ml-1">
              {pendingDrivers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'fleet'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>{t(lang, 'fleetRegistry')} ({drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('districts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'districts'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{t(lang, 'districtsTab')} ({settings.districts?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('annual_fees')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'annual_fees'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>{t(lang, 'annualSettlementTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{t(lang, 'settingsTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('promotion')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'promotion'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{t(lang, 'promotionTab')}</span>
        </button>
      </div>

      {/* ================= TAB 0: RECHARGE APPROVALS (PAYMENT SCREENSHOTS) ================= */}
      {activeTab === 'recharges' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                {lang === 'am' ? 'የሾፌሮች የክፍያ ስክሪንሽት ማረጋገጫ' : 'Driver Payment Proof Screenshots'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'am' 
                  ? 'ሾፌሮች በቴሌብር ወይም በባንክ የላኩትን ስክሪንሽት አይተው በ1-ክሊክ ኪሎሜትር ባላንስ ይጨምሩ (100 ብር = 15 KM)' 
                  : 'Review Telebirr/CBE receipts and approve 15 KM mileage credits with 1 click.'}
              </p>
            </div>
            <button
              onClick={fetchRecharges}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'am' ? 'አድስ' : 'Refresh'}</span>
            </button>
          </div>

          {rechargesList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                {lang === 'am' ? 'ምንም የተላከ የክፍያ ስክሪንሽት የለም' : 'No Payment Requests Submitted Yet'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {lang === 'am'
                  ? 'ሾፌሮች ከስክሪናቸው ላይ 100 ብር (15 ኪ.ሜ) ሲሞሉና ስክሪንሽት ሲልኩ እዚህ ወዲያውኑ ይታያል።'
                  : 'When drivers upload a Telebirr or bank screenshot to recharge their KM balance, it will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rechargesList.map((rch) => {
                const isPending = rch.status === 'pending';
                return (
                  <div
                    key={rch.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all ${
                      isPending
                        ? 'border-amber-400 dark:border-amber-500 shadow-md ring-2 ring-amber-400/20'
                        : 'border-slate-200 dark:border-slate-800 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                            {rch.driverName}
                          </span>
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">
                            {rch.driverPlate || 'Bajaj'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{rch.driverPhone}</span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                        rch.status === 'approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : rch.status === 'rejected'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse'
                      }`}>
                        {rch.status}
                      </span>
                    </div>

                    {/* Amount & KM Credit Details */}
                    <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">{lang === 'am' ? 'የተከፈለ መጠን' : 'Amount Paid'}</span>
                        <span className="font-bold text-base font-mono text-emerald-600 dark:text-emerald-400">
                          {rch.amountBirr} Br
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">{lang === 'am' ? 'የሚጨመረው ኪ.ሜ' : 'KM Credit'}</span>
                        <span className="font-bold text-base font-mono text-indigo-600 dark:text-indigo-400">
                          +{rch.kmToCredit} KM
                        </span>
                      </div>
                    </div>

                    {/* Screenshot Thumbnail */}
                    <div className="space-y-1.5 mb-4">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{lang === 'am' ? 'የክፍያ ስክሪንሽት ደረሰኝ (ጠቅ አድርገው ያሳድጉ)' : 'Payment Screenshot (Click to zoom)'}</span>
                      </span>
                      
                      <div
                        onClick={() => setSelectedScreenshotUrl(rch.receiptScreenshotUrl)}
                        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-16/9 flex items-center justify-center cursor-pointer group"
                      >
                        <img
                          src={rch.receiptScreenshotUrl}
                          alt="Receipt Proof"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5">
                          <Eye className="w-4 h-4" />
                          <span>View Full Proof</span>
                        </div>
                      </div>

                      {rch.transactionReference && (
                        <p className="text-[11px] font-mono text-slate-500">
                          Ref: {rch.transactionReference}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {isPending ? (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleRejectRecharge(rch.id)}
                          className="flex-1 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 font-bold text-xs transition-colors cursor-pointer"
                        >
                          {lang === 'am' ? 'ውድቅ አድርግ' : 'Reject'}
                        </button>
                        <button
                          onClick={() => handleApproveRecharge(rch.id)}
                          className="flex-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>{lang === 'am' ? `አጽድቅ (+${rch.kmToCredit} KM ጨምር)` : `Approve & Credit +${rch.kmToCredit} KM`}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 text-right">
                        {rch.status === 'approved' ? '✓ Approved & credited to balance' : `✗ Rejected: ${rch.rejectionReason || ''}`}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ================= TAB: DRIVER REGISTRATION APPROVALS ================= */}
      {activeTab === 'driver_approvals' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                  {lang === 'am' ? 'የአዲስ አሽከርካሪዎች ማመልከቻ ማረጋገጫ' : 'Driver Registration Approvals'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {lang === 'am'
                  ? 'አዳዲስ አሽከርካሪዎች ሲመዘገቡ መታወቂያቸውን እና የባጃጅ መረጃቸውን ይገምግሙ። ሲያጸድቁ 15 ኪ.ሜ የጅማሮ ክሬዲት ይሰጣቸዋል እንዲሁም ከህዝቡ የኮንትራት ጥሪዎችን መቀበል ይጀምራሉ።'
                  : 'Review submitted driver applications and National IDs. Approving grants 15 KM starter balance and enables dispatch ringing alerts.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                {pendingDrivers.length} {lang === 'am' ? 'በጥበቃ ላይ' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Pending Applications Section */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{lang === 'am' ? `በጥበቃ ላይ ያሉ ማመልከቻዎች (${pendingDrivers.length})` : `Pending Review (${pendingDrivers.length})`}</span>
            </h4>

            {pendingDrivers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {lang === 'am' ? 'ምንም ያልጸደቀ የአሽከርካሪ ማመልከቻ የለም' : 'No Pending Driver Applications'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {lang === 'am'
                    ? 'አዳዲስ ሾፌሮች በስልካቸው ሲመዘገቡ ማመልከቻቸው፣ የመታወቂያ ፎቷቸው እና የታርጋ ቁጥራቸው እዚህ ማጽደቂያ ላይ ይታያል።'
                    : 'When new Bajaj drivers register, their ID photos and vehicle documents will appear here for verification.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pendingDrivers.map((driver) => {
                  return (
                    <div
                      key={driver.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-amber-400/80 dark:border-amber-500/80 shadow-md ring-4 ring-amber-400/10 space-y-4"
                    >
                      {/* Driver Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setSelectedDriverDossier(driver)}
                            className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500 shrink-0 bg-slate-800 flex items-center justify-center cursor-pointer group relative"
                          >
                            {driver.photoUrl ? (
                              <img src={driver.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
                            ) : (
                              <Car className="w-6 h-6 text-white" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-1.5">
                              <span>{driver.name}</span>
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {driver.phone}
                              </span>
                              {driver.secondaryPhone && (
                                <span className="text-xs font-mono text-slate-400">
                                  / {driver.secondaryPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 animate-pulse">
                          ⏳ {lang === 'am' ? 'በጥበቃ ላይ' : 'Pending'}
                        </span>
                      </div>

                      {/* District & Vehicle Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">{lang === 'am' ? 'ወረዳና ሰፈር' : 'District & Area'}</span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                            {driver.districtName}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {driver.villageArea || 'Central Stand'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">{lang === 'am' ? 'ታርጋና ሞዴል' : 'Plate & Model'}</span>
                          <span className="font-bold text-xs font-mono text-slate-900 dark:text-white block">
                            {driver.bajajPlate}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {driver.bajajColor} • {driver.modelYear || '2024'}
                          </span>
                        </div>
                      </div>

                      {/* IDs: National ID & Fayda */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{lang === 'am' ? 'መታወቂያ / ፋይዳ' : 'ID / Fayda / Kebele'}</span>
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {driver.nationalIdNumber || driver.faydaNumber || 'ID on file'}
                          </span>
                        </div>
                        {driver.emergencyContactName && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500">
                            <span>{lang === 'am' ? 'ተጠሪ ስም' : 'Emergency'}: {driver.emergencyContactName}</span>
                            <span className="font-mono">{driver.emergencyContactPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* ID Photo Preview */}
                      {driver.nationalIdPhotoUrl && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-bold flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                              <span>{lang === 'am' ? 'የመታወቂያ ፎቶ' : 'National ID Photo'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedScreenshotUrl(driver.nationalIdPhotoUrl || null)}
                              className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px] hover:underline cursor-pointer"
                            >
                              {lang === 'am' ? 'አሳድገው ይመልከቱ' : 'View Full ID'}
                            </button>
                          </div>
                          <div
                            onClick={() => setSelectedScreenshotUrl(driver.nationalIdPhotoUrl || null)}
                            className="h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer group relative"
                          >
                            <img
                              src={driver.nationalIdPhotoUrl}
                              alt="National ID"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                              <Eye className="w-4 h-4" />
                              <span>Inspect ID</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Approval Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRejectDriver(driver);
                            setRejectReasonInput('ID / Fayda photo is blurry or unreadable');
                            setCustomRejectNote('');
                          }}
                          className="flex-1 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{lang === 'am' ? 'ውድቅ አድርግ' : 'Reject'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingDriverApproval}
                          onClick={() => handleApproveDriver(driver.id)}
                          className="flex-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>{lang === 'am' ? 'አጽድቅ (15 KM ጅማሮ)' : 'Approve & Activate (15 KM)'}</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejected Registrations History */}
          {rejectedDrivers.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{lang === 'am' ? `ውድቅ የተደረጉ ማመልከቻዎች (${rejectedDrivers.length})` : `Rejected Applications (${rejectedDrivers.length})`}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rejectedDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/50 space-y-2 opacity-85"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit'] block">
                          {driver.name}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{driver.phone} • {driver.bajajPlate}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                        {lang === 'am' ? 'ውድቅ ተደርጓል' : 'Rejected'}
                      </span>
                    </div>

                    {driver.rejectionReason && (
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                        <span className="font-bold block text-[10px] uppercase text-rose-500">{lang === 'am' ? 'የውድቅ ምክንያት' : 'Rejection Reason'}:</span>
                        <span>{driver.rejectionReason}</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleApproveDriver(driver.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{lang === 'am' ? 'እንደገና ገምግመህ አጽድቅ' : 'Re-review & Approve'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

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
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              >
                <option value="all">{lang === 'am' ? 'ሁሉም ወረዳዎች' : 'All Districts'}</option>
                {settings.districts?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <button
                onClick={() => setIsAddDriverModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'am' ? 'ባጃጅ ጨምር' : 'Add Bajaj'}</span>
              </button>
            </div>
          </div>

          {/* Drivers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((driver) => {
              const km = driver.kmBalance ?? 15;
              return (
                <div
                  key={driver.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500 shrink-0 bg-slate-800 flex items-center justify-center">
                        {driver.photoUrl ? (
                          <img src={driver.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
                        ) : (
                          <Car className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                          {driver.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">{driver.phone}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      driver.isOnline
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {driver.isOnline ? '● Online' : '○ Offline'}
                    </span>
                  </div>

                  {/* KM Balance & Plate Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">{lang === 'am' ? 'የቀረ ኪ.ሜ' : 'KM Balance'}</span>
                      <span className="font-bold text-sm font-mono text-emerald-600 dark:text-emerald-400">
                        {km.toFixed(1)} KM
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">{lang === 'am' ? 'ታርጋ ቁጥር' : 'Plate'}</span>
                      <span className="font-bold text-sm font-mono text-slate-900 dark:text-white">
                        {driver.bajajPlate}
                      </span>
                    </div>
                  </div>

                  {/* District & Location Assignment */}
                  <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        <span>{lang === 'am' ? 'የተመደበበት ወረዳ፡' : 'Assigned District:'}</span>
                      </span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">
                        {driver.districtName}
                      </span>
                    </div>

                    {/* Quick District Switcher */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={driver.districtId}
                        disabled={quickDistrictChangingId === driver.id}
                        onChange={(e) => handleQuickChangeDistrict(driver.id, e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer focus:ring-1 focus:ring-indigo-500"
                        title="Change District"
                      >
                        {settings.districts?.map((d) => (
                          <option key={d.id} value={d.id}>
                            📍 {d.name} {d.status === 'suspended' ? '(Suspended)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {driver.villageArea && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                        {lang === 'am' ? 'መነሻ ፌርማታ፡' : 'Stand:'} {driver.villageArea}
                      </span>
                    )}
                  </div>

                  {/* Actions: Edit Everything, Adjust KM, ID Dossier, Delete */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenEditDriver(driver)}
                      className="flex-1 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Edit all details, district, plate, contact, KM, and info"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{lang === 'am' ? 'ሁሉንም አርትዕ' : 'Edit Everything'}</span>
                    </button>

                    <button
                      onClick={() => setAdjustKmDriver(driver)}
                      className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                      title="Adjust KM Balance"
                    >
                      <Gauge className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSelectedDriverDossier(driver)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title="View ID Dossier"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteDriver(driver.id, driver.name)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                      title="Permanently Delete Driver"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ================= TAB 2: DISTRICT BOUNDARIES ================= */}
      {activeTab === 'districts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                {lang === 'am' ? 'የመንደር ወረዳዎች እና ገደቦች' : 'Village Districts & Geographic Boundaries'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'am' ? 'የኮንትራት ጥሪዎች በ3 ኪ.ሜ ወረዳ ውስጥ ላሉ ባጃጆች ብቻ ይደወላሉ' : 'Dispatch is localized within each 3 KM district range.'}
              </p>
            </div>
            <button
              onClick={() => setIsAddDistrictModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t(lang, 'addNewDistrict')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.districts?.map((d) => (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                    {d.name}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    d.status === 'suspended'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {d.status === 'suspended' ? 'Suspended' : 'Active'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {d.description}
                </p>

                <div className="text-[11px] text-slate-400 font-mono">
                  Center: {d.center?.lat?.toFixed(4)}, {d.center?.lng?.toFixed(4)} • Radius: {d.maxRadiusKm || 3} KM
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleToggleDistrictStatus(d)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {d.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>

                  {onDeleteDistrict && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete district ${d.name}?`)) {
                          onDeleteDistrict(d.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                      title="Delete District"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: 2% ANNUAL SETTLEMENTS ================= */}
      {activeTab === 'annual_fees' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-500" />
              <span>{lang === 'am' ? '2% ዓመታዊ የኮሚሽን ክፍያ ሂሳብ' : '2% Annual Platform Commission Settlement'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {lang === 'am'
                ? 'ሾፌሮች በየቀኑ የሰበሰቡትን 100% ገቢ ሙሉ ለሙሉ በቀጥታ ይወስዳሉ። በዓመት አንድ ጊዜ ብቻ 2% የአስተዳደር ኮሚሽን ይከፍላሉ።'
                : 'Drivers retain 100% of daily fares. The 2% commission is calculated once annually and settled directly.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3.5">Driver</th>
                    <th className="p-3.5">Plate</th>
                    <th className="p-3.5">District</th>
                    <th className="p-3.5">Total Fare Volume</th>
                    <th className="p-3.5">2% Annual Commission</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {drivers.map((d) => {
                    const estEarnings = (d.totalTripsCompleted || 0) * 85;
                    const commission = Math.round(estEarnings * 0.02);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-3.5 font-bold">{d.name}</td>
                        <td className="p-3.5 font-mono">{d.bajajPlate}</td>
                        <td className="p-3.5">{d.districtName}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">{estEarnings} Br</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{commission} Br</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Up to date
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onSettleAnnualFee && onSettleAnnualFee(d.id)}
                            className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          >
                            Mark Settled
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: SETTINGS & PAYMENT ACCOUNTS ================= */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
              {lang === 'am' ? 'የአስተባባሪ ክፍያ አካውንቶችና የመንደር ቅንብሮች' : 'Coordinator Accounts & Village Settings'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'am'
                ? 'ሾፌሮች የ100 ብር (15 KM) ክፍያ የሚልኩባቸውን የቴሌብር እና የባንክ አካውንቶች ያስተካክሉ'
                : 'Configure payment accounts where drivers send 100 Birr mileage recharge receipts.'}
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
            {settingsSavedMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'am' ? 'ቅንብሮቹ በተሳካ ሁኔታ ተቀምጠዋል!' : 'Settings successfully updated!'}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'am' ? 'የመንደር / የሰፈር ስም' : 'Village Name'}
                </label>
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'am' ? 'የአስተባባሪ ስልክ ቁጥር' : 'Coordinator Support Phone'}
                </label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {lang === 'am' ? 'የቴሌግራም ዩዘርኔም (Telegram)' : 'Support Telegram Username'}
                </label>
                <input
                  type="text"
                  value={supportTelegram}
                  onChange={(e) => setSupportTelegram(e.target.value)}
                  placeholder="@Loyalblack"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'am' ? 'የአድሚን ኢሜይል' : 'Admin Email'}
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Telebirr Account No.
                </label>
                <input
                  type="text"
                  value={telebirrAccount}
                  onChange={(e) => setTelebirrAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  CBE Bank Account No.
                </label>
                <input
                  type="text"
                  value={cbeAccount}
                  onChange={(e) => setCbeAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-700 dark:text-amber-500">
                  Bank of Abyssinia (BOA / አቢሲኒያ)
                </label>
                <input
                  type="text"
                  value={boaAccount}
                  onChange={(e) => setBoaAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'am' ? 'የ15 ኪ.ሜ የክሬዲት ዋጋ (ብር)' : 'KM Recharge Rate (Birr per 15 KM)'}
              </label>
              <input
                type="number"
                value={kmRateBirr}
                onChange={(e) => setKmRateBirr(Number(e.target.value))}
                className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {lang === 'am' ? 'ቅንብሮቹን መዝግብ' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 5: PROMOTION ================= */}
      {activeTab === 'promotion' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-500" />
            <span>{t(lang, 'promotionTab')}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'am'
              ? 'ይህንን የQR ኮድ በማተም በመንደርዎ ሱቆች፣ በረንዳዎችና የመንገድ መገናኛዎች ላይ ይለጥፉ!'
              : 'Print and display this QR code at local stands, kiosks, and gates for residents to call rides.'}
          </p>

          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 text-center max-w-sm mx-auto space-y-4">
            <div className="w-48 h-48 bg-white p-4 rounded-2xl mx-auto shadow-md flex items-center justify-center">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white block font-['Outfit']">
              {settings.villageName} BajajLink
            </span>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: ZOOM PAYMENT SCREENSHOT ================= */}
      {selectedScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-4 border border-slate-800 space-y-3 relative shadow-2xl">
            <button
              onClick={() => setSelectedScreenshotUrl(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h4 className="font-bold text-sm text-white px-2 pt-1">
              Payment Confirmation Receipt (Full Zoom)
            </h4>
            <div className="rounded-2xl overflow-hidden bg-black max-h-[75vh] flex items-center justify-center">
              <img src={selectedScreenshotUrl} alt="Receipt Proof Full" className="w-full h-auto max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADJUST DRIVER KM ================= */}
      {adjustKmDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                  Adjust Mileage Credit
                </h3>
                <p className="text-xs text-slate-500">{adjustKmDriver.name} ({adjustKmDriver.bajajPlate})</p>
              </div>
              <button onClick={() => setAdjustKmDriver(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs flex justify-between items-center">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  {(adjustKmDriver.kmBalance || 0).toFixed(1)} KM
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount to Add (+KM) or Deduct (-KM)
                </label>
                <input
                  type="number"
                  step="1"
                  value={kmAdjustAmount}
                  onChange={(e) => setKmAdjustAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setKmAdjustAmount('15')}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                >
                  +15 KM
                </button>
                <button
                  type="button"
                  onClick={() => setKmAdjustAmount('30')}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                >
                  +30 KM
                </button>
                <button
                  type="button"
                  onClick={() => setKmAdjustAmount('-10')}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-rose-500"
                >
                  -10 KM
                </button>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setAdjustKmDriver(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustDriverKm}
                  disabled={isAdjustingKm}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  {isAdjustingKm ? 'Saving...' : 'Apply KM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD DRIVER ================= */}
      {isAddDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
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

            <form onSubmit={handleAddDriverSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t(lang, 'fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newDriverData.name}
                  onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                  placeholder="e.g. Dawit Tadesse"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
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

      {/* ================= MODAL: DRIVER FULL ID DOSSIER ================= */}
      {selectedDriverDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                  Driver Identity Dossier
                </h3>
                <p className="text-xs text-slate-500">{selectedDriverDossier.name} • {selectedDriverDossier.bajajPlate}</p>
              </div>
              <button onClick={() => setSelectedDriverDossier(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500 shrink-0 bg-slate-800">
                <img src={selectedDriverDossier.photoUrl} alt={selectedDriverDossier.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="font-bold text-base text-slate-900 dark:text-white block">{selectedDriverDossier.name}</span>
                <span className="font-mono text-slate-500 block">{selectedDriverDossier.phone}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{selectedDriverDossier.districtName}</span>
              </div>
            </div>

            {selectedDriverDossier.nationalIdPhotoUrl && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">National ID Card:</span>
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 aspect-16/10 flex items-center justify-center">
                  <img src={selectedDriverDossier.nationalIdPhotoUrl} alt="National ID" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DRIVER EVERYTHING ================= */}
      {isEditDriverModalOpen && editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-['Outfit']">
                    {lang === 'am' ? 'የአሽከርካሪ መረጃ እና ወረዳ ማስተካከያ' : 'Edit Driver Dossier & District'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingDriver.name} • {editingDriver.bajajPlate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditDriverModalOpen(false);
                  setEditingDriver(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDriver} className="space-y-4">
              
              {/* DISTRICT ASSIGNMENT (Highlighted) */}
              <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'am' ? 'የተመደበበት ወረዳ (District) ቀይር *' : 'Assigned District (Change Location) *'}</span>
                </label>
                <select
                  required
                  value={editDriverData.districtId}
                  onChange={(e) => {
                    const selectedD = settings.districts?.find(d => d.id === e.target.value);
                    if (selectedD) {
                      setEditDriverData({
                        ...editDriverData,
                        districtId: selectedD.id,
                        districtName: selectedD.name,
                        villageArea: selectedD.landmarks?.[0]?.name || `${selectedD.name} Stand`,
                      });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {settings.districts?.map((d) => (
                    <option key={d.id} value={d.id}>
                      📍 {d.name} ({d.description}) {d.status === 'suspended' ? '⚠️ [SUSPENDED]' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  {lang === 'am' ? 'ወረዳውን ሲቀይሩ ጥሪዎች የሚደርሱት ለአዲሱ ወረዳ ብቻ ነው' : 'Changing district routes contract dispatch calls from that area.'}
                </p>
              </div>

              {/* Basic Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'ሙሉ ስም *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editDriverData.name || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'ዋና ስልክ ቁጥር *' : 'Primary Phone *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={editDriverData.phone || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Secondary Phone & Stand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'ተጨማሪ ስልክ (አማራጭ)' : 'Secondary Phone (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={editDriverData.secondaryPhone || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, secondaryPhone: e.target.value })}
                    placeholder="09..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'መነሻ ፌርማታ / ሰፈር' : 'Village Stand / Kebele Area'}
                  </label>
                  <input
                    type="text"
                    value={editDriverData.villageArea || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, villageArea: e.target.value })}
                    placeholder="e.g. Gerji Main Taxi Stand"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* Bajaj Details: Plate, Color, Model */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'የባጃጅ ታርጋ *' : 'Bajaj Plate *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editDriverData.bajajPlate || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, bajajPlate: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'ቀለም' : 'Bajaj Color'}
                  </label>
                  <input
                    type="text"
                    value={editDriverData.bajajColor || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, bajajColor: e.target.value })}
                    placeholder="Yellow & Blue"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'ሞዴል / ዓ.ም' : 'Model / Year'}
                  </label>
                  <input
                    type="text"
                    value={editDriverData.modelYear || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, modelYear: e.target.value })}
                    placeholder="2024 TVS King"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* KM Balance & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{lang === 'am' ? 'የቀረ ኪ.ሜ (Mileage Balance) *' : 'KM Balance (Mileage) *'}</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editDriverData.kmBalance ?? 15}
                    onChange={(e) => setEditDriverData({ ...editDriverData, kmBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-sm font-bold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{lang === 'am' ? 'የአሽከርካሪ ደረጃ (1 - 5)' : 'Driver Rating (1 - 5)'}</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editDriverData.rating ?? 5.0}
                    onChange={(e) => setEditDriverData({ ...editDriverData, rating: parseFloat(e.target.value) || 5.0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold font-mono"
                  />
                </div>
              </div>

              {/* Identification IDs: National ID, Fayda, Kebele */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'የቀበሌ / ብሔራዊ መታወቂያ' : 'Kebele / National ID'}
                  </label>
                  <input
                    type="text"
                    value={editDriverData.nationalIdNumber || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, nationalIdNumber: e.target.value })}
                    placeholder="ETH-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'ፋይዳ ዲጂታል ቁጥር (Fayda)' : 'Fayda Digital ID'}
                  </label>
                  <input
                    type="text"
                    value={editDriverData.faydaNumber || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, faydaNumber: e.target.value })}
                    placeholder="FAYDA-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'የቤት ቁጥር' : 'House Number'}
                  </label>
                  <input
                    type="text"
                    value={editDriverData.kebeleHouseNumber || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, kebeleHouseNumber: e.target.value })}
                    placeholder="H-124"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              {/* Emergency Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'የአደጋ ጊዜ ተጠሪ ስም' : 'Emergency Contact Name'}
                  </label>
                  <input
                    type="text"
                    value={editDriverData.emergencyContactName || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, emergencyContactName: e.target.value })}
                    placeholder="Contact Name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'am' ? 'የአደጋ ጊዜ ተጠሪ ስልክ' : 'Emergency Contact Phone'}
                  </label>
                  <input
                    type="tel"
                    value={editDriverData.emergencyContactPhone || ''}
                    onChange={(e) => setEditDriverData({ ...editDriverData, emergencyContactPhone: e.target.value })}
                    placeholder="09..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Driver Photo URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'am' ? 'የአሽከርካሪ ፎቶ አድራሻ (Photo URL)' : 'Driver Profile Photo URL'}
                </label>
                <input
                  type="text"
                  value={editDriverData.photoUrl || ''}
                  onChange={(e) => setEditDriverData({ ...editDriverData, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              {/* Status Online/Offline */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'am' ? 'የአሽከርካሪ ዝግጁነት ሁኔታ፡' : 'Active Online Status:'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditDriverData({ ...editDriverData, isOnline: !editDriverData.isOnline })}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    editDriverData.isOnline
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {editDriverData.isOnline ? '● Online (Receiving Calls)' : '○ Offline (Resting)'}
                </button>
              </div>

              {/* Action Buttons: Delete vs Save */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                
                {/* Danger Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteDriver(editingDriver.id, editingDriver.name)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{lang === 'am' ? 'አሽከርካሪውን በቋሚነት ሰርዝ' : 'Permanently Delete Driver'}</span>
                </button>

                {/* Cancel & Save Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditDriverModalOpen(false);
                      setEditingDriver(null);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {lang === 'am' ? 'ሰርዝ' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingDriver}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingDriver ? (lang === 'am' ? 'በማስቀመጥ ላይ...' : 'Saving...') : (lang === 'am' ? 'ለውጦችን መዝግብ' : 'Save Changes')}</span>
                  </button>
                </div>

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

      {/* Driver Application Rejection Feedback Modal */}
      {selectedRejectDriver && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base font-['Outfit']">
                  {lang === 'am' ? 'የአሽከርካሪ ማመልከቻን ውድቅ አድርግ' : 'Reject Driver Registration'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRejectDriver(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                {selectedRejectDriver.photoUrl ? (
                  <img src={selectedRejectDriver.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Car className="w-5 h-5 text-white m-auto" />
                )}
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block font-['Outfit']">
                  {selectedRejectDriver.name}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedRejectDriver.phone} • Plate: {selectedRejectDriver.bajajPlate}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'am'
                ? 'እባክዎ አሽከርካሪው ቅጹን በትክክል አስተካክሎ እንዲልክ ምክንያቱን ይምረጡ ወይም ይጻፉ። ይህ መልዕክት ለአሽከርካሪው በስክሪኑ ላይ ይታያል፡'
                : 'Please select or type the reason for rejection. This notification will be displayed on the driver’s phone so they can correct and resubmit:'}
            </p>

            {/* Preset Reasons */}
            <div className="space-y-2">
              {[
                {
                  key: 'ID / Fayda photo is blurry or unreadable',
                  labelEn: 'National ID / Fayda photo is blurry or unreadable',
                  labelAm: 'የመታወቂያ/የፋይዳ ፎቶው ግልጽ አይደለም፣ እባክዎ ጥራት ያለው ፎቶ አንስተው እንደገና ይላኩ',
                },
                {
                  key: 'Bajaj plate number is invalid or does not match Kebele records',
                  labelEn: 'Plate number is invalid or does not match Kebele records',
                  labelAm: 'የባጃጁ ታርጋ ቁጥር ልክ አይደለም ወይም ከቀበሌ መዝገብ ጋር አይመሳሰልም',
                },
                {
                  key: 'Driver primary/secondary phone is unreachable or incorrect',
                  labelEn: 'Phone number is unreachable or invalid',
                  labelAm: 'የስልክ ቁጥሩ ልክ አይደለም ወይም ጥሪ አይቀበልም',
                },
                {
                  key: 'Selected district is outside our operational service range',
                  labelEn: 'District is outside current service boundary',
                  labelAm: 'የተመረጠው ወረዳ ከአሁኑ የአገልግሎት ክልላችን ውጭ ነው',
                },
                {
                  key: 'Other Reason',
                  labelEn: 'Other specific reason (Type custom note below)',
                  labelAm: 'ሌላ የተለየ ምክንያት (ከታች በዝርዝር ይጻፉ)',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  onClick={() => setRejectReasonInput(item.key)}
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                    rejectReasonInput === item.key
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reject_reason"
                    checked={rejectReasonInput === item.key}
                    onChange={() => setRejectReasonInput(item.key)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="leading-snug">{lang === 'am' ? item.labelAm : item.labelEn}</span>
                </label>
              ))}
            </div>

            {/* Custom Note */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'am' ? 'ተጨማሪ ማብራሪያ (ለአሽከርካሪው የሚላክ)' : 'Additional Instruction Note for Driver:'}
              </label>
              <textarea
                rows={2}
                value={customRejectNote}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder={lang === 'am' ? 'እባክዎ መታወቂያዎን በብርሃን አንስተው ቅጹን በድጋሚ ይላኩ...' : 'e.g. Please retake photo with better lighting and resubmit the form...'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRejectDriver(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {lang === 'am' ? 'ተመለስ' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isProcessingDriverApproval}
                onClick={() => handleRejectDriver(selectedRejectDriver.id)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>{lang === 'am' ? 'ውድቅ ማድረጉን ላክ' : 'Send Rejection Notice'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
