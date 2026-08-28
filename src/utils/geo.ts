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
// DEFAULT DISTRICTS (With active/suspended status & realistic spread)
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
        lat: 8.9890,
        lng: 38.8080,
        description: 'Student drop zone & residential alleyway (~1.2 KM)',
        districtId: 'dist-gerji',
      },
      {
        id: 'lm-gerji-3',
        name: 'Gerji Giorgis Church Square',
        category: 'religious',
        lat: 8.9720,
        lng: 38.7950,
        description: 'Upper village crossroads & residential hub (~1.5 KM)',
        districtId: 'dist-gerji',
      },
      {
        id: 'lm-gerji-4',
        name: 'Sunshine Real Estate Village Gate',
        category: 'residential',
        lat: 8.9880,
        lng: 38.8210,
        description: 'Internal residential compound entrance (~2.3 KM)',
        districtId: 'dist-gerji',
      },
      {
        id: 'lm-gerji-5',
        name: 'Mebrat Hail Residential Crossroads',
        category: 'residential',
        lat: 8.9660,
        lng: 38.8140,
        description: 'South neighborhood cluster and local shops (~2.8 KM)',
        districtId: 'dist-gerji',
      },
      {
        id: 'lm-gerji-6',
        name: 'Kadisco Junction & General Hospital Area',
        category: 'station',
        lat: 8.9590,
        lng: 38.8030,
        description: 'Kadisco crossroads and healthcare center (~3.1 KM)',
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
        lat: 9.0140,
        lng: 38.8160,
        description: 'Daily fresh market and neighborhood hub (~1.3 KM)',
        districtId: 'dist-salitemihret',
      },
      {
        id: 'lm-salite-3',
        name: 'Goro Local Ring Road Stand',
        category: 'station',
        lat: 9.0320,
        lng: 38.8370,
        description: 'Connecting inner streets to Goro quarters (~2.0 KM)',
        districtId: 'dist-salitemihret',
      },
      {
        id: 'lm-salite-4',
        name: 'CMC Behind Residential Cluster',
        category: 'residential',
        lat: 9.0280,
        lng: 38.8470,
        description: 'Quiet residential inner road area (~2.5 KM)',
        districtId: 'dist-salitemihret',
      },
      {
        id: 'lm-salite-5',
        name: 'Civil Service University Back Gate',
        category: 'school',
        lat: 9.0110,
        lng: 38.8350,
        description: 'Student campus gate and residential quarter (~2.1 KM)',
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
        lat: 8.9890,
        lng: 38.8280,
        description: 'Inner access street (~1.4 KM)',
        districtId: 'dist-jackros',
      },
      {
        id: 'lm-jackros-3',
        name: 'Summit Condominium Gate 1',
        category: 'residential',
        lat: 9.0060,
        lng: 38.8320,
        description: 'Residential condominium gate entrance (~2.3 KM)',
        districtId: 'dist-jackros',
      },
      {
        id: 'lm-jackros-4',
        name: 'Salite Mihret Connector Lane',
        category: 'station',
        lat: 9.0110,
        lng: 38.8210,
        description: 'Village connecting crossroads (~2.1 KM)',
        districtId: 'dist-jackros',
      },
    ],
  },
  {
    id: 'dist-bole',
    name: 'Bole District',
    description: 'Bole sub-city area around Bole Atlas, Medhanialem, and Bulbula',
    center: { lat: 8.9806, lng: 38.7986 },
    maxRadiusKm: 3.0,
    status: 'active',
    colorTag: '#F59E0B',
    landmarks: [
      {
        id: 'lm-bole-1',
        name: 'Bole Medhanialem Church Area',
        category: 'religious',
        lat: 8.9920,
        lng: 38.7890,
        description: 'Main Bole Medhanialem center',
        districtId: 'dist-bole',
      },
      {
        id: 'lm-bole-2',
        name: 'Edna Mall / Bole Atlas Inner Lane',
        category: 'commercial',
        lat: 8.9880,
        lng: 38.7830,
        description: 'Commercial quarter and taxi hub (~1.2 KM)',
        districtId: 'dist-bole',
      },
      {
        id: 'lm-bole-3',
        name: 'Bole Bulbula Roundabout Stand',
        category: 'station',
        lat: 8.9680,
        lng: 38.7950,
        description: 'Local neighborhood passenger station (~2.4 KM)',
        districtId: 'dist-bole',
      },
      {
        id: 'lm-bole-4',
        name: 'Brass Hospital & Japan Embassy Village',
        category: 'residential',
        lat: 8.9820,
        lng: 38.7750,
        description: 'Quiet residential quarter (~2.6 KM)',
        districtId: 'dist-bole',
      },
    ],
  },
  {
    id: 'dist-yeka',
    name: 'Yeka District',
    description: 'Yeka sub-city around Kotebe, CMC, and Shola area',
    center: { lat: 9.0200, lng: 38.8100 },
    maxRadiusKm: 3.0,
    status: 'active',
    colorTag: '#EF4444',
    landmarks: [
      {
        id: 'lm-yeka-1',
        name: 'Kotebe Roundabout Stand',
        category: 'station',
        lat: 9.0220,
        lng: 38.8150,
        description: 'Main Kotebe junction and transport hub',
        districtId: 'dist-yeka',
      },
      {
        id: 'lm-yeka-2',
        name: 'Shola Market Area',
        category: 'market',
        lat: 9.0140,
        lng: 38.7980,
        description: 'Local market and residential neighborhood (~2.1 KM)',
        districtId: 'dist-yeka',
      },
      {
        id: 'lm-yeka-3',
        name: 'Yeka Mikael Church Square',
        category: 'religious',
        lat: 9.0340,
        lng: 38.8040,
        description: 'Highland residential crossroads (~2.3 KM)',
        districtId: 'dist-yeka',
      },
    ],
  },
  {
    id: 'dist-kolfe',
    name: 'Kolfe District',
    description: 'Kolfe Keranyo area and surrounding neighborhoods',
    center: { lat: 9.0350, lng: 38.7350 },
    maxRadiusKm: 3.0,
    status: 'active',
    colorTag: '#06B6D4',
    landmarks: [
      {
        id: 'lm-kolfe-1',
        name: 'Kolfe Keranyo Main Stand',
        category: 'station',
        lat: 9.0350,
        lng: 38.7350,
        description: 'Central Kolfe intersection and bajaj stand',
        districtId: 'dist-kolfe',
      },
      {
        id: 'lm-kolfe-2',
        name: 'Gofa Sefer Local Market',
        category: 'residential',
        lat: 9.0230,
        lng: 38.7480,
        description: 'Dense residential and local shops (~2.0 KM)',
        districtId: 'dist-kolfe',
      },
    ],
  },
  {
    id: 'dist-kirkos',
    name: 'Kirkos District',
    description: 'Kirkos sub-city around Mexico Square and Lideta area',
    center: { lat: 9.0050, lng: 38.7600 },
    maxRadiusKm: 3.0,
    status: 'active',
    colorTag: '#EC4899',
    landmarks: [
      {
        id: 'lm-kirkos-1',
        name: 'Mexico Square Area Stand',
        category: 'station',
        lat: 9.0050,
        lng: 38.7550,
        description: 'Mexico roundabout and local bajaj staging',
        districtId: 'dist-kirkos',
      },
      {
        id: 'lm-kirkos-2',
        name: 'Lideta Church Road & Condominium',
        category: 'religious',
        lat: 9.0140,
        lng: 38.7420,
        description: 'Residential quarter (~1.9 KM)',
        districtId: 'dist-kirkos',
      },
    ],
  },
  {
    id: 'dist-lafto',
    name: 'Lafto District',
    description: 'Nifas Silk Lafto sub-city around Woreda and Lebu area',
    center: { lat: 9.0100, lng: 38.7300 },
    maxRadiusKm: 3.0,
    status: 'active',
    colorTag: '#84CC16',
    landmarks: [
      {
        id: 'lm-lafto-1',
        name: 'Lebu Roundabout Stand',
        category: 'station',
        lat: 9.0100,
        lng: 38.7300,
        description: 'Main Lebu commercial intersection',
        districtId: 'dist-lafto',
      },
      {
        id: 'lm-lafto-2',
        name: 'Jemo 1 Condominium Gate',
        category: 'residential',
        lat: 8.9960,
        lng: 38.7180,
        description: 'Residential complex and shops (~2.2 KM)',
        districtId: 'dist-lafto',
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
  adminEmail: 'busfkedmurdu21@gmail.com',
  adminPhone: '0991154337',
  kmRateBirrPer15Km: 100, // 100 Birr = 15 KM credit
  annualCommissionPercent: 2, // 2% once a year
  maxDispatchRangeKm: 3.0, // 3 KM max calling range
  ringTimeoutSeconds: 120, // 2 minutes wait
  adminPassword: '',
  supportPhone: '0991154337',
  supportEmail: 'busfkedmurdu21@gmail.com',
  supportTelegram: '@Loyalblack',
  telebirrAccount: '0991154337',
  cbeAccount: '1000123456789',
  boaAccount: '887654321', // Bank of Abyssinia (BOA)
  awashAccount: '887654321',
  accountHolderName: 'Village Bajaj Dispatch',
  adminPaymentAccounts: {
    telebirr: '0991154337',
    cbe: '1000123456789',
    boa: '887654321',
  },
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

/**
 * Intelligent address & landmark resolver.
 * Maps typed neighborhood names or custom addresses to accurate coordinates and guarantees realistic trip distances.
 */
export function resolveLocationFromText(
  text?: string | null,
  district?: VillageDistrict | null,
  isDropoff: boolean = false
): LocationCoord {
  const defaultCenter = district?.center || DEFAULT_DISTRICTS[0].center;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    // If no text, return default district center or offset
    return isDropoff
      ? { lat: defaultCenter.lat + 0.015, lng: defaultCenter.lng + 0.012 }
      : { lat: defaultCenter.lat, lng: defaultCenter.lng };
  }

  const query = text.toLowerCase().trim();
  const allLandmarks = (district?.landmarks && district.landmarks.length > 0)
    ? [...district.landmarks, ...DEFAULT_DISTRICTS.flatMap(d => d.landmarks)]
    : DEFAULT_DISTRICTS.flatMap(d => d.landmarks);

  // 1. Direct or partial landmark match
  for (const lm of allLandmarks) {
    const lmName = lm.name.toLowerCase();
    if (query === lmName || lmName.includes(query) || query.includes(lmName)) {
      return { lat: lm.lat, lng: lm.lng };
    }
  }

  // 2. Keyword-based neighborhood dictionary matching
  const knownLocations: { keywords: string[]; lat: number; lng: number }[] = [
    { keywords: ['roba', 'gerji stand', 'taxi stand'], lat: 8.9806, lng: 38.8020 },
    { keywords: ['unity', 'campus', 'university gate'], lat: 8.9890, lng: 38.8080 },
    { keywords: ['giorgis', 'church', 'st. george', 'orthodox'], lat: 8.9720, lng: 38.7950 },
    { keywords: ['sunshine', 'compound', 'real estate', 'meri'], lat: 8.9880, lng: 38.8210 },
    { keywords: ['mebrat', 'hail', 'condo', 'south gerji'], lat: 8.9660, lng: 38.8140 },
    { keywords: ['kadisco', 'hospital', 'junction', 'crossroads'], lat: 8.9590, lng: 38.8030 },
    { keywords: ['salitemihret', 'salite', 'mihret'], lat: 9.0210, lng: 38.8260 },
    { keywords: ['figa', 'market', 'fresh'], lat: 9.0140, lng: 38.8160 },
    { keywords: ['goro', 'ring road'], lat: 9.0320, lng: 38.8370 },
    { keywords: ['cmc', 'mikael', 'michael'], lat: 9.0280, lng: 38.8470 },
    { keywords: ['jackros', 'meta', 'brewery'], lat: 8.9950, lng: 38.8180 },
    { keywords: ['summit', 'condominium'], lat: 9.0060, lng: 38.8320 },
    { keywords: ['bole', 'medhanialem', 'atlas', 'edna'], lat: 8.9920, lng: 38.7890 },
    { keywords: ['bulbula', 'japan', 'brass'], lat: 8.9680, lng: 38.7950 },
    { keywords: ['kotebe', 'shola', 'yeka'], lat: 9.0220, lng: 38.8150 },
    { keywords: ['mexico', 'lideta', 'kirkos'], lat: 9.0050, lng: 38.7550 },
    { keywords: ['lebu', 'jemo', 'lafto'], lat: 9.0100, lng: 38.7300 },
  ];

  for (const loc of knownLocations) {
    if (loc.keywords.some(k => query.includes(k))) {
      return { lat: loc.lat, lng: loc.lng };
    }
  }

  // 3. Deterministic hash offset for any other custom text
  // Guarantees consistent, realistic distinct coordinates within the district
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash |= 0;
  }
  const normHash = Math.abs(hash);
  const latOffset = ((normHash % 25) - 12) * 0.0012 + (isDropoff ? 0.012 : -0.006);
  const lngOffset = (((normHash >> 3) % 25) - 12) * 0.0012 + (isDropoff ? 0.010 : -0.005);

  return {
    lat: Number((defaultCenter.lat + latOffset).toFixed(5)),
    lng: Number((defaultCenter.lng + lngOffset).toFixed(5)),
  };
}

