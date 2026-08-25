import { LocationCoord, VillageLandmark, VillageDistrict, BajajDriver, VillageSettings } from '../types';

/**
 * Calculates distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistanceKm(
  from?: LocationCoord | null,
  to?: LocationCoord | null
): number {
  if (
    !from ||
    !to ||
    typeof from.lat !== 'number' ||
    typeof from.lng !== 'number' ||
    typeof to.lat !== 'number' ||
    typeof to.lng !== 'number' ||
    isNaN(from.lat) ||
    isNaN(to.lat) ||
    isNaN(from.lng) ||
    isNaN(to.lng)
  ) {
    return 0;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculates estimated driving time in minutes for village Bajaj (avg 25 km/h + pickup)
 */
export function calculateEstimatedMinutes(distanceKm: number): number {
  const avgSpeedKmH = 25;
  const driveTimeMin = (distanceKm / avgSpeedKmH) * 60;
  return Math.max(2, Math.ceil(driveTimeMin + 1));
}

/**
 * Calculate recommended negotiation price range based on distance
 */
export function calculateNegotiationRange(
  distanceKm: number,
  settings: VillageSettings
): { min: number; max: number } {
  const base = settings.baseContractFare || 40;
  const perKm = settings.ratePerKm || 20;
  const calculated = base + Math.max(0.5, distanceKm) * perKm;
  
  const min = Math.max(base, Math.round((calculated * 0.9) / 5) * 5);
  const max = Math.round((calculated * 1.25) / 5) * 5;
  return { min, max };
}

// ----------------------------------------------------
// DEFAULT DISTRICTS (With active/suspended status)
// ----------------------------------------------------

export const DEFAULT_DISTRICTS: VillageDistrict[] = [
  {
    id: 'dist-gerji',
    name: 'Gerji District',
    description: 'Internal village streets around Roba, Unity, and Sunshine (Safe inner network)',
    center: { lat: 8.9806, lng: 38.8020 },
    maxRadiusKm: 3.0,
    status: 'active',
    colorTag: '#10B981', // Emerald
    landmarks: [
      {
        id: 'lm-gerji-1',
        name: 'Gerji Taxi & Bajaj Stand (Roba Bakery)',
        category: 'station',
        lat: 8.9806,
        lng: 38.8020,
        description: 'Main neighborhood passenger hub and commercial square',
        districtId: 'dist-gerji',
      },
      {
        id: 'lm-gerji-2',
        name: 'Unity University Campus Gate',
        category: 'school',
        lat: 8.9850,
        lng: 38.8045,
        description: 'Student drop zone & residential alleyway',
        districtId: 'dist-gerji',
      },
      {
        id: 'lm-gerji-3',
        name: 'Gerji Giorgis Church Square',
        category: 'religious',
        lat: 8.9772,
        lng: 38.7990,
        description: 'Upper village crossroads & residential hub',
        districtId: 'dist-gerji',
      },
      {
        id: 'lm-gerji-4',
        name: 'Sunshine Real Estate Village Gate',
        category: 'residential',
        lat: 8.9835,
        lng: 38.8110,
        description: 'Internal residential compound entrance',
        districtId: 'dist-gerji',
      },
      {
        id: 'lm-gerji-5',
        name: 'Mebrat Hail Residential Crossroads',
        category: 'residential',
        lat: 8.9740,
        lng: 38.8070,
        description: 'South neighborhood cluster and local shops',
        districtId: 'dist-gerji',
      },
    ],
  },
  {
    id: 'dist-salitemihret',
    name: 'Salitemihret District',
    description: 'Local roads around Salitemihret, Figa, and Goro neighborhoods',
    center: { lat: 9.0210, lng: 38.8260 },
    maxRadiusKm: 3.0,
    status: 'active',
    colorTag: '#3B82F6', // Blue
    landmarks: [
      {
        id: 'lm-salite-1',
        name: 'Salitemihret Church Square & Stand',
        category: 'religious',
        lat: 9.0210,
        lng: 38.8260,
        description: 'Central church plaza & local pickup station',
        districtId: 'dist-salitemihret',
      },
      {
        id: 'lm-salite-2',
        name: 'Figa Market & Local Shops',
        category: 'market',
        lat: 9.0160,
        lng: 38.8205,
        description: 'Daily fresh market and neighborhood hub',
        districtId: 'dist-salitemihret',
      },
      {
        id: 'lm-salite-3',
        name: 'Goro Local Ring Road Stand',
        category: 'station',
        lat: 9.0270,
        lng: 38.8310,
        description: 'Connecting inner streets to Goro quarters',
        districtId: 'dist-salitemihret',
      },
      {
        id: 'lm-salite-4',
        name: 'CMC Behind Residential Cluster',
        category: 'residential',
        lat: 9.0245,
        lng: 38.8390,
        description: 'Quiet residential inner road area',
        districtId: 'dist-salitemihret',
      },
    ],
  },
  {
    id: 'dist-jackros',
    name: 'Jackros District',
    description: 'Jackros local neighborhood inner lanes and Meta quarters',
    center: { lat: 8.9950, lng: 38.8180 },
    maxRadiusKm: 3.0,
    status: 'active',
    colorTag: '#8B5CF6', // Purple
    landmarks: [
      {
        id: 'lm-jackros-1',
        name: 'Jackros Central Stand',
        category: 'station',
        lat: 8.9950,
        lng: 38.8180,
        description: 'Main center of Jackros neighborhood',
        districtId: 'dist-jackros',
      },
      {
        id: 'lm-jackros-2',
        name: 'Meta Brewery Local Quarter',
        category: 'commercial',
        lat: 8.9920,
        lng: 38.8230,
        description: 'Inner access street',
        districtId: 'dist-jackros',
      },
    ],
  },
];

export const INITIAL_SETTINGS: VillageSettings = {
  villageName: 'Gerji & Salitemihret Village Network',
  activeDistrictId: 'dist-gerji',
  districts: DEFAULT_DISTRICTS,
  currency: 'ETB (Birr)',
  currencySymbol: 'Br',
  annualCommissionPercent: 2, // 2% once a year
  maxDispatchRangeKm: 3.0, // 3 KM max calling range
  ringTimeoutSeconds: 120, // 2 minutes wait
  adminPassword: 'admin', // default admin password
  supportPhone: '+251 91 123 4567',
  supportEmail: 'coordinator@villagebajaj.et',
  baseContractFare: 40,
  ratePerKm: 20,
  villageCenter: DEFAULT_DISTRICTS[0].center,
  landmarks: DEFAULT_DISTRICTS.flatMap(d => d.landmarks),
};

// CLEAN SLATE: NO DEMO DRIVERS. Real drivers register themselves or are added by admin.
export const INITIAL_DRIVERS: BajajDriver[] = [];

/**
 * Find closest landmark to coordinates
 */
export function findClosestLandmark(
  coords?: LocationCoord | null,
  landmarks?: VillageLandmark[] | null
): VillageLandmark | null {
  if (!landmarks || landmarks.length === 0 || !coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return null;
  }
  let closest: VillageLandmark | null = null;
  let minDistance = Infinity;

  for (const lm of landmarks) {
    if (!lm || typeof lm.lat !== 'number' || typeof lm.lng !== 'number') continue;
    const d = calculateDistanceKm(coords, lm);
    if (d < minDistance) {
      minDistance = d;
      closest = lm;
    }
  }
  return closest || landmarks[0] || null;
}

/**
 * Find closest district to coordinates
 */
export function findClosestDistrict(
  coords?: LocationCoord | null,
  districts?: VillageDistrict[] | null
): VillageDistrict | null {
  if (!districts || districts.length === 0 || !coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return null;
  }
  let closest: VillageDistrict | null = null;
  let minDistance = Infinity;

  for (const dist of districts) {
    if (!dist || !dist.center || typeof dist.center.lat !== 'number' || typeof dist.center.lng !== 'number') continue;
    const d = calculateDistanceKm(coords, dist.center);
    if (d < minDistance) {
      minDistance = d;
      closest = dist;
    }
  }
  return closest || districts[0] || null;
}
