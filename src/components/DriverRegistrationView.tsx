import React, { useState, useRef } from 'react';
import { DriverRegistrationForm, VillageSettings, AppLanguage } from '../types';
import { 
  MapPin, 
  Sparkles,
  Info,
  Camera,
  Crop,
  FileText,
  Upload,
  CheckCircle,
  Phone,
  User,
  Shield,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImageCropModal } from './ImageCropModal';
import { t } from '../utils/translations';

interface DriverRegistrationViewProps {
  settings: VillageSettings;
  onRegisterDriver: (data: DriverRegistrationForm) => Promise<boolean>;
  onBackToDriverMode: () => void;
  lang?: AppLanguage;
}

export const DriverRegistrationView: React.FC<DriverRegistrationViewProps> = ({
  settings,
  onRegisterDriver,
  onBackToDriverMode,
  lang = 'en',
}) => {
  const districts = settings.districts?.filter(d => d.status !== 'suspended') || [];
  const defaultDistrict = districts[0] || { id: 'dist-gerji', name: 'Gerji District' };

  const [formData, setFormData] = useState<DriverRegistrationForm>({
    name: '',
    phone: '',
    secondaryPhone: '',
    bajajPlate: '',
    bajajColor: 'Yellow & Black',
    districtId: defaultDistrict.id,
    districtName: defaultDistrict.name,
    villageArea: defaultDistrict.landmarks?.[0]?.name || 'Central Village Stand',
    nationalIdNumber: '',
    faydaNumber: '',
    kebeleHouseNumber: '',
    modelYear: '2024 TVS King',
    emergencyContactName: '',
    emergencyContactPhone: '',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    nationalIdPhotoUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  // Cropper Modal state
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropModalTitle, setCropModalTitle] = useState<string>('Crop Profile Picture');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  // Handle District Change
  const handleDistrictChange = (districtId: string) => {
    const selectedDist = settings.districts.find(d => d.id === districtId);
    if (selectedDist) {
      setFormData({
        ...formData,
        districtId: selectedDist.id,
        districtName: selectedDist.name,
        villageArea: selectedDist.landmarks?.[0]?.name || `${selectedDist.name} Stand`,
      });
    }
  };

  // Handle Separate Profile Photo Upload
  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageToCrop(reader.result);
        setCropModalTitle(lang === 'am' ? 'የሾፌር መገለጫ ፎቶ ቆርጠህ አውጣ' : 'Crop Driver Profile Photo');
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle National ID Upload
  const handleNationalIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const idDataUrl = reader.result;
        setFormData((prev) => ({
          ...prev,
          nationalIdPhotoUrl: idDataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger Crop From Uploaded National ID Photo
  const handleCropFromNationalId = () => {
    if (!formData.nationalIdPhotoUrl) return;
    setImageToCrop(formData.nationalIdPhotoUrl);
    setCropModalTitle(lang === 'am' ? 'ከመታወቂያው ላይ ፊትህን ቆርጠህ አውጣ' : 'Crop Profile Face from National ID');
    setIsCropModalOpen(true);
  };

  // Handle Cropped Image Applied
  const handleCropComplete = (croppedDataUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      photoUrl: croppedDataUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.bajajPlate) return;

    setIsSubmitting(true);
    try {
      const ok = await onRegisterDriver(formData);
      if (ok) {
        setRegisteredSuccess(true);
        confetti({ particleCount: 100, spread: 70 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-['Outfit']">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'am' ? 'የአሽከርካሪዎች ምዝገባ' : 'Village Driver Onboarding'}</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Outfit']">
            {lang === 'am' 
              ? `ባጃጅዎን በ${settings.villageName} ይመዝግቡ` 
              : `Register Your Bajaj in ${settings.villageName}`}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {lang === 'am'
              ? 'ባጃጅዎን በመንደርዎ ወረዳ ይመዝግቡ። በ3 ኪ.ሜ ክልል ውስጥ ካሉ ነዋሪዎች የቀጥታ የኮንትራት ጥሪዎችን ይቀበሉ። 100% የየቀኑን ገቢ በቀጥታ ይውሰዱ፤ 2% ዓመታዊ ክፍያ በዓመት አንድ ጊዜ ብቻ!'
              : 'Register under your specific village district. Receive instant home contrat trip ringing alerts within 3 KM. Retain 100% daily fares with 2% annual settlement once a year.'}
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-emerald-400 font-bold text-xs block font-['Outfit']">
              {lang === 'am' ? 'የሰፈር ውስጥ መንገድ ብቻ' : 'Internal Village Roads'}
            </span>
            <span className="text-[11px] text-slate-400">
              {lang === 'am' ? 'ከዋና አስፋልት ውጪ በሰፈር ውስጥ' : 'No main highway or heavy traffic'}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-emerald-400 font-bold text-xs block font-['Outfit']">
              {lang === 'am' ? '2% ዓመታዊ ሂሳብ' : '2% Annual Settlement'}
            </span>
            <span className="text-[11px] text-slate-400">
              {lang === 'am' ? 'የየቀኑን ገቢ 100% በሙሉ ይውሰዱ' : '100% daily fare retention'}
            </span>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
            <span className="text-emerald-400 font-bold text-xs block font-['Outfit']">
              {lang === 'am' ? 'እስከ 3 ኪ.ሜ የቀጥታ ጥሪ' : 'Up to 3 KM Direct Alerts'}
            </span>
            <span className="text-[11px] text-slate-400">
              {lang === 'am' ? 'ቀድሞ የነካ ጉዞውን ያገኛል' : 'First-come, first-served'}
            </span>
          </div>
        </div>
      </div>

      {/* Registration Form / Success Card */}
      {registeredSuccess ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-emerald-200 dark:border-emerald-900/40 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">
              {lang === 'am' ? 'የባጃጅ ምዝገባው በተሳካ ሁኔታ ተጠናቋል!' : 'Bajaj Registration Completed!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {lang === 'am'
                ? `እንኳን ደህና መጡ ${formData.name}! ባጃጅዎ (ታርጋ፡ ${formData.bajajPlate}) በ${formData.districtName} በይፋ ተመዝግቧል።`
                : `Welcome, ${formData.name}! Your Bajaj (Plate: ${formData.bajajPlate}) is officially active in ${formData.districtName}.`}
            </p>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-left text-xs text-emerald-950 dark:text-emerald-200 space-y-1.5 max-w-md mx-auto">
            <div className="font-bold flex items-center space-x-1.5 text-emerald-900 dark:text-emerald-300">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'am' ? 'የጥሪ ስርዓት ዝግጁ ነው' : 'Dispatch Network Ready'}</span>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 leading-relaxed">
              {lang === 'am'
                ? `በ${formData.districtName} ተሳፋሪዎች ባጃጅ ሲጠሩ ስልክዎ በድምጽ ያሳውቅዎታል!`
                : `When residents in ${formData.districtName} request a contract ride within 3 KM, your screen will alert you!`}
            </p>
          </div>

          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={onBackToDriverMode}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-transform active:scale-95 font-['Outfit'] cursor-pointer"
            >
              {lang === 'am' ? 'ወደ ሾፌር ስክሪን ሂድ →' : 'Go to Driver Screen →'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit'] flex items-center space-x-2">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t(lang, 'registerBajajTitle')}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'am'
                ? 'እባክዎ ሙሉ የህጋዊ መታወቂያ መረጃዎን፣ ስልክዎን፣ የባጃጅ ታርጋዎንና ፎቶዎን በትክክል ያስገቡ።'
                : 'Please provide full national ID credentials, phone contacts, plate number, and photos.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* District Selection */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'am' ? 'የመንደር ወረዳ ይምረጡ *' : 'Select Village District (Internal Roads Only) *'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {districts.map((d) => {
                  const isSelected = formData.districtId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDistrictChange(d.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs font-['Outfit']">{d.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 line-clamp-1">
                        {d.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Driver Identity Information */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'am' ? 'የሾፌሩ ሙሉ የግልና መታወቂያ መረጃ' : 'Driver Legal Identification & Phone'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Legal Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={lang === 'am' ? 'ለምሳሌ፡ ዳዊት በቀለ ታደሰ' : 'e.g. Dawit Bekele Tadesse'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Primary Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'phoneNumber')} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251 9..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Secondary Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'secondaryPhone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.secondaryPhone || ''}
                    onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                    placeholder="+251 9..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* National ID / Fayda / Kebele Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'nationalIdNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.nationalIdNumber || ''}
                    onChange={(e) => setFormData({ ...formData, nationalIdNumber: e.target.value })}
                    placeholder="ETH-ID-..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Kebele House / Village Zone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'kebeleHouse')}
                  </label>
                  <input
                    type="text"
                    value={formData.kebeleHouseNumber || ''}
                    onChange={(e) => setFormData({ ...formData, kebeleHouseNumber: e.target.value })}
                    placeholder={lang === 'am' ? 'ቀበሌ 08 / ቤት ቁጥር...' : 'Kebele 08 / House #...'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'emergencyContact')}
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder={lang === 'am' ? 'የአደጋ ጊዜ ሰው ስም እና ስልክ' : 'Contact person name & phone'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Bajaj Vehicle Details */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'am' ? 'የባጃጅ መረጃ' : 'Bajaj Vehicle Specification'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'plateNumber')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bajajPlate}
                    onChange={(e) => setFormData({ ...formData, bajajPlate: e.target.value.toUpperCase() })}
                    placeholder="AA-3-45129"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold tracking-wider focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'bajajColor')}
                  </label>
                  <input
                    type="text"
                    value={formData.bajajColor}
                    onChange={(e) => setFormData({ ...formData, bajajColor: e.target.value })}
                    placeholder="Sky Blue / White"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t(lang, 'modelYear')}
                  </label>
                  <input
                    type="text"
                    value={formData.modelYear || ''}
                    onChange={(e) => setFormData({ ...formData, modelYear: e.target.value })}
                    placeholder="2024 TVS King / Bajaj RE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Photos & National ID Upload with Direct Face Crop */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'am' ? 'የመታወቂያ እና የመገለጫ ፎቶዎች' : 'National ID Photo & Profile Face Crop'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. National ID Card Upload */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t(lang, 'uploadNationalId')}</span>
                    </label>
                  </div>

                  <input
                    type="file"
                    ref={idInputRef}
                    onChange={handleNationalIdFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {formData.nationalIdPhotoUrl ? (
                    <div className="space-y-2.5">
                      <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-900 aspect-16/10 flex items-center justify-center">
                        <img
                          src={formData.nationalIdPhotoUrl}
                          alt="National ID"
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => idInputRef.current?.click()}
                          className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold border border-slate-700"
                        >
                          Change
                        </button>
                      </div>

                      {/* Prominent Button to Crop Profile Photo Directly from this ID Card */}
                      <button
                        type="button"
                        onClick={handleCropFromNationalId}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>{t(lang, 'cropProfilePhoto')}</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => idInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        {lang === 'am' ? 'የመታወቂያ ፎቶ ይጫኑ' : 'Click to Upload National ID Card'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {lang === 'am' ? 'JPG/PNG ይደግፋል' : 'Fayda, Kebele or National ID photo'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Driver Profile Photo (Cropped) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t(lang, 'uploadOrCropProfile')}</span>
                  </label>

                  <input
                    type="file"
                    ref={profileInputRef}
                    onChange={handleProfileFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 bg-slate-800 flex items-center justify-center">
                      <img
                        src={formData.photoUrl}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <button
                        type="button"
                        onClick={() => profileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{lang === 'am' ? 'ፎቶ ይጫኑና ይቁረጡ' : 'Upload Separate Photo'}</span>
                      </button>
                      <p className="text-[10px] text-slate-400">
                        {lang === 'am' ? 'ወይም ከመታወቂያው ላይ በቀላሉ ቆርጠው ማውጣት ይችላሉ' : 'Or crop directly from your uploaded National ID'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Submit Button */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onBackToDriverMode}
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {lang === 'am' ? 'ተመለስ' : 'Back'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.phone || !formData.bajajPlate}
                className="px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-transform active:scale-95 font-['Outfit'] cursor-pointer"
              >
                {isSubmitting 
                  ? (lang === 'am' ? 'በመመዝገብ ላይ...' : 'Registering Driver...') 
                  : t(lang, 'submitRegistration')}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Interactive Image Cropper Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={imageToCrop}
        title={cropModalTitle}
        lang={lang}
        onCropComplete={handleCropComplete}
        onClose={() => {
          setIsCropModalOpen(false);
          setImageToCrop(null);
        }}
      />

    </div>
  );
};
