export type AppRole = 'passenger' | 'driver' | 'admin' | 'driver_register';
export type AppLanguage = 'en' | 'am';
export type AppTheme = 'light' | 'dark';
export type DriverRingtoneOption = 'bajaj_voice' | 'village_chime' | 'subtle_pulse';

export interface LocationCoord {
  lat: number;
  lng: number;
}

export interface VillageLandmark {
  id: string;
  name: string;
  category: 'market' | 'hospital' | 'school' | 'station' | 'residential' | 'religious' | 'commercial';
  lat: number;
  lng: number;
  description?: string;
  districtId?: string;
}

export interface VillageDistrict {
  id: string;
  name: string; // e.g. 'Gerji', 'Salitemihret', 'Jackros', 'Bole Bulbula'
  description: string;
  center: LocationCoord;
  maxRadiusKm: number; // usually 3.0 km for bajaj network
  landmarks: VillageLandmark[];
  colorTag?: string;
  status: 'active' | 'suspended'; // Suspend/Activate capability
  suspendedReason?: string;
}

export interface BajajDriver {
  id: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  bajajPlate: string;
  bajajColor: string;
  modelYear?: string;
  districtId: string;
  districtName: string;
  villageArea: string;
  currentLocation: LocationCoord;
  isOnline: boolean;
  isRegistered: boolean;
  isApproved: boolean; // Admin approval flag
  approvalStatus: 'pending' | 'approved' | 'rejected';
  registrationFeeAmount: number; // 1000 ETB
  registrationFeePaid: boolean;
  paymentReceiptPhotoUrl?: string; // 1000 Birr payment screenshot
  rejectionReason?: string;
  
  // Full ID & Verification Data
  nationalIdNumber?: string;
  nationalIdPhotoUrl?: string; // National ID image card
  faydaNumber?: string;
  kebeleHouseNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Financial Model: Annual 2% commission from total trips
  annualCommissionRatePercent: number; // 2%
  totalTripsCompleted: number;
  totalEstimatedEarnings: number; // Total volume in ETB
  annualCommissionDue: number; // 2% of totalEstimatedEarnings
  annualCommissionPaid: boolean;
  annualSettlementYear: number; // e.g. 2026
  lastAnnualPaymentDate?: string;

  registrationDate: string;
  rating: number;
  photoUrl?: string; // Cropped profile image from ID / camera
  activeTripId?: string | null;
  lastActiveAt?: number;
}

export interface ContractTrip {
  id: string;
  passengerName: string;
  passengerPhone: string;
  districtId: string;
  districtName: string;
  pickupAddress: string;
  pickupCoords: LocationCoord;
  dropoffAddress: string;
  dropoffCoords: LocationCoord;
  distanceKm: number;
  estimatedMinutes: number;
  passengerCount: number;
  hasLuggage: boolean;
  tripType: 'instant_contract' | 'daily_scheduled' | 'special_event';
  notes?: string;
  suggestedNegotiationMin: number;
  suggestedNegotiationMax: number;
  currency: string;
  status: 'ringing' | 'accepted' | 'en_route' | 'arrived' | 'completed' | 'cancelled' | 'expired';
  createdAt: number;
  ringingExpiresAt: number; // 120s (2 minutes)
  targetDriverIds: string[]; // Online drivers within <= 3km in district
  acceptedByDriverId?: string;
  acceptedDriver?: BajajDriver;
  acceptedAt?: number;
  completedAt?: number;
  agreedPrice?: number;
}

export interface VillageSettings {
  villageName: string;
  activeDistrictId: string;
  districts: VillageDistrict[];
  currency: string;
  currencySymbol: string;
  annualCommissionPercent: number; // default 2%
  maxDispatchRangeKm: number; // default 3.0 km
  ringTimeoutSeconds: number; // default 120s (2 minutes)
  adminPassword: string; // e.g. 'admin123'
  supportPhone: string; // Editable anytime
  supportEmail: string; // Editable anytime
  baseContractFare: number;
  ratePerKm: number;
  villageCenter: LocationCoord;
  landmarks: VillageLandmark[];
}

export interface DriverRegistrationForm {
  name: string;
  phone: string;
  secondaryPhone?: string;
  bajajPlate: string;
  bajajColor: string;
  districtId: string;
  districtName: string;
  villageArea: string;
  photoUrl?: string;
  nationalIdPhotoUrl?: string;
  nationalIdNumber?: string;
  faydaNumber?: string;
  kebeleHouseNumber?: string;
  modelYear?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  paymentReceiptPhotoUrl?: string; // 1000 Birr payment screenshot
}


