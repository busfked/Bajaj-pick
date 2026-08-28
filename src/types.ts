export type AppRole = 'passenger' | 'driver' | 'admin' | 'driver_register';
export type AppLanguage = 'en' | 'am';
export type AppTheme = 'light' | 'dark';
export type ColorTheme = 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate';
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

export interface DriverRechargeRequest {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverPlate: string;
  amountBirr: number; // e.g. 100 Birr
  kmToCredit: number; // 15 KM per 100 Birr
  paymentMethod: 'telebirr' | 'cbe' | 'awash' | 'cash';
  receiptScreenshotUrl: string; // Screenshot proof
  transactionReference?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedAt?: number;
  rejectionReason?: string;
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
  
  // Mileage / KM Credit Balance (100 Birr = 15 KM credit)
  kmBalance: number; // Available KM for receiving calls & driving
  totalKmPurchased: number;
  totalKmDriven: number;
  lastRechargeDate?: string;
  
  // Full ID & Verification Data (Optional for simple registration)
  nationalIdNumber?: string;
  nationalIdPhotoUrl?: string;
  faydaNumber?: string;
  kebeleHouseNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Financial Model: Annual 2% commission from total trips
  annualCommissionRatePercent: number; // 2%
  totalTripsCompleted: number;
  totalEstimatedEarnings: number; // Total volume in ETB
  annualCommissionDue: number;
  annualCommissionPaid: boolean;
  annualSettlementYear: number;
  lastAnnualPaymentDate?: string;

  // Approval & Verification by Village Coordinator
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  reviewedAt?: number;
  rejectionReason?: string;

  registrationDate: string;
  rating: number;
  photoUrl?: string;
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
  cancelledBy?: 'passenger' | 'driver' | 'admin' | 'system';
  cancellationReason?: string;
  createdAt: number;
  ringingExpiresAt: number; // 120s (2 minutes)
  targetDriverIds: string[]; // Online drivers within <= 3km in district with kmBalance > 0
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
  adminEmail: string; // busfkedmurdu21@gmail.com
  adminPhone: string;
  kmRateBirrPer15Km: number; // Default 100 Birr for 15 KM
  annualCommissionPercent: number; // default 2%
  maxDispatchRangeKm: number; // default 3.0 km
  ringTimeoutSeconds: number; // default 120s (2 minutes)
  adminPassword?: string;
  supportPhone: string;
  supportEmail: string;
  supportTelegram?: string; // @Loyalblack
  telebirrAccount: string;
  cbeAccount: string;
  boaAccount?: string; // Bank of Abyssinia (BOA)
  awashAccount?: string; // Legacy fallback
  accountHolderName: string;
  adminPaymentAccounts?: {
    telebirr?: string;
    cbe?: string;
    boa?: string;
    awash?: string;
  };
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
  initialRechargeBirr?: number; // Optional initial mileage recharge (e.g. 100 Birr)
  receiptScreenshotUrl?: string; // Optional payment screenshot
}



