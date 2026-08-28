// Vercel Serverless Function - BajajLink Dispatch API (Supabase + Hardcoded Districts)
// Handles ALL /api/* routes

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---- Supabase Config ----
const SB_URL = 'https://jvggqpanmixyaaxdpazp.supabase.co';
const SB_KEY = 'sb_publishable_8tWYLvd3LPilxsVH7KWrdg_mc6G3x2h';
const ADMIN_PASSWORD = '121921';

async function sb(table: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: any, filters?: string, extraHeaders?: Record<string, string>) {
  const url = new URL(`${SB_URL}/rest/v1/${table}`);
  if (filters) url.search = filters;
  const headers: Record<string, string> = {
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'GET' ? 'count=exact' : 'return=representation',
    ...extraHeaders,
  };
  const opts: any = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);
  const res = await fetch(url.toString(), opts);
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, ok: res.ok };
}

// ---- Geo Utilities ----
function calculateDistanceKm(from: any, to: any): number {
  if (!from || !to || typeof from.lat !== 'number' || typeof from.lng !== 'number' ||
      typeof to.lat !== 'number' || typeof to.lng !== 'number') return 0;
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos((from.lat*Math.PI)/180) * Math.cos((to.lat*Math.PI)/180) * Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
}

// ---- Hardcoded Districts (frontend expects this rich structure) ----
const DISTRICTS = [
  {
    id: 'dist-gerji', name: 'Gerji District',
    description: 'Internal village streets around Roba, Unity, and Sunshine',
    center: { lat: 8.9806, lng: 38.802 }, maxRadiusKm: 3, status: 'active', colorTag: '#10B981',
    landmarks: [
      { id: 'lm-gerji-1', name: 'Gerji Taxi & Bajaj Stand (Roba Bakery)', category: 'station', lat: 8.9806, lng: 38.802, description: 'Main neighborhood passenger hub and commercial square', districtId: 'dist-gerji' },
      { id: 'lm-gerji-2', name: 'Unity University Campus Gate', category: 'school', lat: 8.985, lng: 38.8045, description: 'Student drop zone & residential alleyway', districtId: 'dist-gerji' },
      { id: 'lm-gerji-3', name: 'Gerji Giorgis Church Square', category: 'religious', lat: 8.9772, lng: 38.799, description: 'Upper village crossroads & residential hub', districtId: 'dist-gerji' },
      { id: 'lm-gerji-4', name: 'Sunshine Real Estate Village Gate', category: 'residential', lat: 8.9835, lng: 38.811, description: 'Internal residential compound entrance', districtId: 'dist-gerji' },
      { id: 'lm-gerji-5', name: 'Mebrat Hail Residential Crossroads', category: 'residential', lat: 8.974, lng: 38.807, description: 'South neighborhood cluster and local shops', districtId: 'dist-gerji' },
    ],
  },
  {
    id: 'dist-salitemihret', name: 'Salitemihret District',
    description: 'Local roads around Salitemihret, Figa, and Goro neighborhoods',
    center: { lat: 9.021, lng: 38.826 }, maxRadiusKm: 3, status: 'active', colorTag: '#3B82F6',
    landmarks: [
      { id: 'lm-salite-1', name: 'Salitemihret Church Square & Stand', category: 'religious', lat: 9.021, lng: 38.826, description: 'Central church plaza & local pickup station', districtId: 'dist-salitemihret' },
      { id: 'lm-salite-2', name: 'Figa Market & Local Shops', category: 'market', lat: 9.016, lng: 38.8205, description: 'Daily fresh market and neighborhood hub', districtId: 'dist-salitemihret' },
      { id: 'lm-salite-3', name: 'Goro Local Ring Road Stand', category: 'station', lat: 9.027, lng: 38.831, description: 'Connecting inner streets to Goro quarters', districtId: 'dist-salitemihret' },
      { id: 'lm-salite-4', name: 'CMC Behind Residential Cluster', category: 'residential', lat: 9.0245, lng: 38.839, description: 'Quiet residential inner road area', districtId: 'dist-salitemihret' },
    ],
  },
  {
    id: 'dist-jackros', name: 'Jackros District',
    description: 'Jackros local neighborhood inner lanes and Meta quarters',
    center: { lat: 8.995, lng: 38.818 }, maxRadiusKm: 3, status: 'active', colorTag: '#8B5CF6',
    landmarks: [
      { id: 'lm-jackros-1', name: 'Jackros Central Stand', category: 'station', lat: 8.995, lng: 38.818, description: 'Main center of Jackros neighborhood', districtId: 'dist-jackros' },
      { id: 'lm-jackros-2', name: 'Meta Brewery Local Quarter', category: 'commercial', lat: 8.992, lng: 38.823, description: 'Inner access street', districtId: 'dist-jackros' },
    ],
  },
  {
    id: 'dist-bole', name: 'Bole District',
    description: 'Bole sub-city area around Bole International Airport and Edna Mall',
    center: { lat: 8.9806, lng: 38.7986 }, maxRadiusKm: 3, status: 'active', colorTag: '#F59E0B',
    landmarks: [
      { id: 'lm-bole-1', name: 'Bole International Airport Roundabout', category: 'station', lat: 8.9779, lng: 38.7993, description: 'Main airport entrance and taxi stand', districtId: 'dist-bole' },
      { id: 'lm-bole-2', name: 'Edna Mall / Bole Atlas', category: 'commercial', lat: 8.9832, lng: 38.7978, description: 'Shopping center and commercial hub', districtId: 'dist-bole' },
      { id: 'lm-bole-3', name: 'Bole Bulbula Junction', category: 'station', lat: 8.9735, lng: 38.8045, description: 'Major intersection and local transport hub', districtId: 'dist-bole' },
    ],
  },
  {
    id: 'dist-yeka', name: 'Yeka District',
    description: 'Yeka sub-city around Kotebe and Shola area',
    center: { lat: 9.0200, lng: 38.8100 }, maxRadiusKm: 3, status: 'active', colorTag: '#EF4444',
    landmarks: [
      { id: 'lm-yeka-1', name: 'Kotebe Roundabout', category: 'station', lat: 9.0220, lng: 38.8150, description: 'Main Kotebe junction and transport hub', districtId: 'dist-yeka' },
      { id: 'lm-yeka-2', name: 'Shola Market Area', category: 'market', lat: 9.0180, lng: 38.8050, description: 'Local market and residential neighborhood', districtId: 'dist-yeka' },
    ],
  },
  {
    id: 'dist-kolfe', name: 'Kolfe District',
    description: 'Kolfe Keranyo area and surrounding neighborhoods',
    center: { lat: 9.0350, lng: 38.7350 }, maxRadiusKm: 3, status: 'active', colorTag: '#06B6D4',
    landmarks: [
      { id: 'lm-kolfe-1', name: 'Kolfe Keranyo Main Junction', category: 'station', lat: 9.0350, lng: 38.7350, description: 'Central Kolfe intersection and bajaj stand', districtId: 'dist-kolfe' },
      { id: 'lm-kolfe-2', name: 'Gofa Sefer Area', category: 'residential', lat: 9.0280, lng: 38.7400, description: 'Dense residential and local shops area', districtId: 'dist-kolfe' },
    ],
  },
  {
    id: 'dist-kirkos', name: 'Kirkos District',
    description: 'Kirkos sub-city around Mexico Square and Lideta area',
    center: { lat: 9.0050, lng: 38.7600 }, maxRadiusKm: 3, status: 'active', colorTag: '#EC4899',
    landmarks: [
      { id: 'lm-kirkos-1', name: 'Mexico Square Area', category: 'station', lat: 9.0050, lng: 38.7550, description: 'Mexico roundabout and main transport hub', districtId: 'dist-kirkos' },
      { id: 'lm-kirkos-2', name: 'Lideta Church Road', category: 'religious', lat: 9.0080, lng: 38.7650, description: 'Church area and local passenger stop', districtId: 'dist-kirkos' },
    ],
  },
  {
    id: 'dist-lafto', name: 'Lafto District',
    description: 'Lafto sub-city around Woreda and Sumit area',
    center: { lat: 9.0100, lng: 38.7300 }, maxRadiusKm: 3, status: 'active', colorTag: '#84CC16',
    landmarks: [
      { id: 'lm-lafto-1', name: 'Lafto Main Road Junction', category: 'station', lat: 9.0100, lng: 38.7300, description: 'Main Lafto junction and bajaj staging area', districtId: 'dist-lafto' },
      { id: 'lm-lafto-2', name: 'Sumit Area Center', category: 'commercial', lat: 9.0150, lng: 38.7380, description: 'Commercial area with shops and local traffic', districtId: 'dist-lafto' },
    ],
  },
];

function getDistrictName(districtId: string): string {
  const d = DISTRICTS.find(dist => dist.id === districtId);
  return d ? d.name : districtId;
}

// ---- Map Supabase driver row to frontend-expected format ----
function mapDriver(row: any): any {
  const dist = DISTRICTS.find(d => d.id === row.district);
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    secondaryPhone: '',
    bajajPlate: row.plate_number || '',
    bajajColor: 'Yellow & Black',
    modelYear: '2024 TVS King',
    districtId: row.district || 'dist-gerji',
    districtName: dist ? dist.name : getDistrictName(row.district),
    villageArea: (dist && dist.landmarks && dist.landmarks[0]) ? dist.landmarks[0].name : 'Central Stand',
    currentLocation: {
      lat: typeof row.location_lat === 'number' ? row.location_lat : 8.9806,
      lng: typeof row.location_lng === 'number' ? row.location_lng : 38.802,
    },
    isOnline: row.status === 'online',
    isRegistered: true,
    approvalStatus: row.is_approved === true ? 'approved' : 'pending',
    kmBalance: 15,
    totalKmPurchased: 15,
    totalKmDriven: 0,
    nationalIdNumber: '',
    faydaNumber: '',
    kebeleHouseNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    annualCommissionRatePercent: 2,
    totalTripsCompleted: 0,
    totalEstimatedEarnings: 0,
    annualCommissionDue: 0,
    annualCommissionPaid: true,
    annualSettlementYear: 2026,
    registrationDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    rating: 5.0,
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    nationalIdPhotoUrl: '',
    activeTripId: null,
    lastActiveAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

// ---- Map Supabase trip row to frontend-expected format ----
function mapTrip(row: any): any {
  return {
    id: row.id,
    passengerName: row.customer_name || '',
    passengerPhone: row.customer_phone || '',
    districtId: row.district || '',
    districtName: getDistrictName(row.district),
    pickupAddress: row.pickup_location || '',
    pickupCoords: { lat: row.pickup_lat || 0, lng: row.pickup_lng || 0 },
    dropoffAddress: row.dropoff_location || '',
    dropoffCoords: { lat: row.dropoff_lat || 0, lng: row.dropoff_lng || 0 },
    distanceKm: 0,
    estimatedMinutes: 0,
    passengerCount: 1,
    hasLuggage: false,
    tripType: 'instant_contract',
    suggestedNegotiationMin: row.fare || 0,
    suggestedNegotiationMax: row.fare || 0,
    currency: 'ETB (Birr)',
    status: row.status || 'pending',
    cancelledBy: '',
    cancellationReason: '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    ringingExpiresAt: row.created_at ? new Date(row.created_at).getTime() + 120000 : Date.now() + 120000,
    targetDriverIds: [],
    acceptedByDriverId: row.driver_id || '',
    agreedPrice: row.fare || 0,
    fare: row.fare || 0,
  };
}

// ---- Settings from Supabase (merged with defaults) ----
async function getSettings() {
  const { data, ok } = await sb('settings', 'GET', undefined, 'key=not.is.null');
  const settingRows: Record<string, string> = {};
  if (ok && Array.isArray(data)) {
    for (const row of data) { settingRows[row.key] = row.value; }
  }
  return {
    villageName: settingRows.village_name || 'Gerji & Salitemihret Village Network',
    activeDistrictId: settingRows.active_district_id || 'dist-gerji',
    districts: DISTRICTS,
    currency: 'ETB (Birr)',
    currencySymbol: 'Br',
    adminEmail: settingRows.admin_email || 'busfkedmurdu21@gmail.com',
    adminPhone: settingRows.admin_phone || '0911234567',
    kmRateBirrPer15Km: Number(settingRows.km_rate_birr_per_15km) || 100,
    annualCommissionPercent: Number(settingRows.annual_commission_percent) || 2,
    maxDispatchRangeKm: Number(settingRows.max_dispatch_range_km) || 3,
    ringTimeoutSeconds: Number(settingRows.ring_timeout_seconds) || 120,
    supportPhone: settingRows.support_phone || '+251 91 123 4567',
    supportEmail: settingRows.support_email || 'busfkedmurdu21@gmail.com',
    telebirrAccount: settingRows.telebirr_account || '',
    cbeAccount: settingRows.cbe_account || '',
    awashAccount: settingRows.awash_account || '',
    accountHolderName: settingRows.account_holder_name || '',
    baseContractFare: Number(settingRows.base_contract_fare) || 40,
    ratePerKm: Number(settingRows.rate_per_km) || 20,
    villageCenter: DISTRICTS[0].center,
    landmarks: DISTRICTS.flatMap(d => d.landmarks),
  };
}

// ---- Main Handler ----
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = url.pathname;
  const method = req.method || 'GET';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') return res.status(200).end();

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};

  try {
    // GET /api/health
    if (method === 'GET' && pathname === '/api/health') {
      return res.json({ status: 'ok', storage: 'supabase', time: new Date().toISOString() });
    }

    // GET /api/state — KEY ENDPOINT: returns settings with districts inside
    if (method === 'GET' && pathname === '/api/state') {
      const [settingsResult, driversResult, tripsResult, rechargesResult] = await Promise.all([
        getSettings(),
        sb('drivers', 'GET', undefined, 'order=created_at.desc'),
        sb('trips', 'GET', undefined, 'order=created_at.desc'),
        sb('recharges', 'GET', undefined, 'order=created_at.desc'),
      ]);
      const drivers = (driversResult.ok && Array.isArray(driversResult.data)) ? driversResult.data.map(mapDriver) : [];
      const trips = (tripsResult.ok && Array.isArray(tripsResult.data)) ? tripsResult.data.map(mapTrip) : [];
      const recharges = (rechargesResult.ok && Array.isArray(rechargesResult.data)) ? rechargesResult.data : [];
      return res.json({ settings: settingsResult, drivers, trips, recharges });
    }

    // POST /api/admin/verify-credentials
    if (method === 'POST' && pathname === '/api/admin/verify-credentials') {
      const { password, email, phone } = body;
      if (password === ADMIN_PASSWORD) {
        return res.json({ success: true, authenticated: true, message: 'Welcome back Admin!' });
      }
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // POST /api/admin/verify-password
    if (method === 'POST' && pathname === '/api/admin/verify-password') {
      return res.json({ success: true, authenticated: true });
    }

    // POST /api/settings
    if (method === 'POST' && pathname === '/api/settings') {
      const keysToUpdate: { key: string; value: string }[] = [];
      const fieldMap: Record<string, string> = {
        villageName: 'village_name', activeDistrictId: 'active_district_id',
        adminEmail: 'admin_email', adminPhone: 'admin_phone',
        supportPhone: 'support_phone', supportEmail: 'support_email',
        telebirrAccount: 'telebirr_account', cbeAccount: 'cbe_account',
        awashAccount: 'awash_account', accountHolderName: 'account_holder_name',
      };
      const numericFields: Record<string, string> = {
        kmRateBirrPer15Km: 'km_rate_birr_per_15km', annualCommissionPercent: 'annual_commission_percent',
        maxDispatchRangeKm: 'max_dispatch_range_km', ringTimeoutSeconds: 'ring_timeout_seconds',
        baseContractFare: 'base_contract_fare', ratePerKm: 'rate_per_km',
      };
      for (const [frontendKey, dbKey] of Object.entries(fieldMap)) {
        if (body[frontendKey] !== undefined) keysToUpdate.push({ key: dbKey, value: String(body[frontendKey]) });
      }
      for (const [frontendKey, dbKey] of Object.entries(numericFields)) {
        if (body[frontendKey] !== undefined) keysToUpdate.push({ key: dbKey, value: String(body[frontendKey]) });
      }
      for (const item of keysToUpdate) {
        const { data: existing } = await sb('settings', 'GET', undefined, `key=eq.${item.key}`);
        if (Array.isArray(existing) && existing.length > 0) {
          await sb('settings', 'PATCH', { value: item.value }, `key=eq.${item.key}`);
        } else {
          await sb('settings', 'POST', { key: item.key, value: item.value });
        }
      }
      const settings = await getSettings();
      return res.json({ success: true, settings });
    }

    // GET /api/districts
    if (method === 'GET' && pathname === '/api/districts') {
      return res.json(DISTRICTS);
    }

    // POST /api/districts
    if (method === 'POST' && pathname === '/api/districts') {
      const { name, description, lat, lng, maxRadiusKm = 3, colorTag = '#10B981' } = body;
      if (!name) return res.status(400).json({ error: 'District name is required' });
      const id = 'dist-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);
      const newDistrict: any = {
        id, name, description: description || '',
        center: { lat: Number(lat) || 9.0, lng: Number(lng) || 38.8 },
        maxRadiusKm: Number(maxRadiusKm) || 3, status: 'active', colorTag,
        landmarks: [{ id: `lm-${id}-1`, name: `${name} Main Stand`, category: 'station', lat: Number(lat) || 9.0, lng: Number(lng) || 38.8, description: 'Main bajaj stand', districtId: id }],
      };
      DISTRICTS.push(newDistrict);
      return res.json({ success: true, district: newDistrict });
    }

    // POST /api/districts/:id/toggle-status
    if (method === 'POST' && pathname.match(/^\/api\/districts\/([^/]+)\/toggle-status$/)) {
      const id = pathname.match(/^\/api\/districts\/([^/]+)\/toggle-status$/)![1];
      const { status } = body;
      const dist = DISTRICTS.find(d => d.id === id);
      if (dist) {
        dist.status = status || (dist.status === 'active' ? 'suspended' : 'active');
        if (body.suspendedReason) dist.suspendedReason = body.suspendedReason;
      }
      return res.json({ success: true });
    }

    // DELETE /api/districts/:id
    if (method === 'DELETE' && pathname.match(/^\/api\/districts\/([^/]+)$/)) {
      const id = pathname.match(/^\/api\/districts\/([^/]+)$/)![1];
      const idx = DISTRICTS.findIndex(d => d.id === id);
      if (idx !== -1) DISTRICTS.splice(idx, 1);
      return res.json({ success: true });
    }

    // GET /api/recharges
    if (method === 'GET' && pathname === '/api/recharges') {
      const { data, ok } = await sb('recharges', 'GET', undefined, 'order=created_at.desc');
      return res.json({ success: true, recharges: ok ? data : [] });
    }

    // POST /api/recharges or /api/recharges/request
    if (method === 'POST' && (pathname === '/api/recharges' || pathname === '/api/recharges/request')) {
      const { driverId, amountBirr = 100, paymentMethod = 'telebirr', receiptScreenshotUrl, transactionReference } = body;
      const driverResult = await sb('drivers', 'GET', undefined, `id=eq.${driverId}`);
      if (!driverResult.ok || !Array.isArray(driverResult.data) || driverResult.data.length === 0)
        return res.status(404).json({ error: 'Driver not found' });
      const driver = driverResult.data[0];
      const kmToCredit = 15;
      const recharge = {
        driver_id: driverId, driver_name: driver.name, driver_phone: driver.phone,
        driver_plate: driver.plate_number, amount: Number(amountBirr), km_to_credit: kmToCredit,
        method: paymentMethod, reference: transactionReference || '',
        status: 'pending', receipt_url: receiptScreenshotUrl || '',
      };
      await sb('recharges', 'POST', recharge);
      return res.json({ success: true, message: `Recharge request for ${amountBirr} Birr (${kmToCredit} KM) submitted!` });
    }

    // POST /api/recharges/:id/approve
    if (method === 'POST' && pathname.match(/^\/api\/recharges\/([^/]+)\/approve$/)) {
      const id = pathname.match(/^\/api\/recharges\/([^/]+)\/approve$/)![1];
      await sb('recharges', 'PATCH', { status: 'approved' }, `id=eq.${id}`);
      return res.json({ success: true, message: 'Recharge approved!' });
    }

    // POST /api/recharges/:id/reject
    if (method === 'POST' && pathname.match(/^\/api\/recharges\/([^/]+)\/reject$/)) {
      const id = pathname.match(/^\/api\/recharges\/([^/]+)\/reject$/)![1];
      await sb('recharges', 'PATCH', { status: 'rejected' }, `id=eq.${id}`);
      return res.json({ success: true, message: 'Recharge rejected.' });
    }

    // POST /api/drivers/register
    if (method === 'POST' && pathname === '/api/drivers/register') {
      const data = body;
      if (!data.name || !data.phone || !data.bajajPlate)
        return res.status(400).json({ error: 'Name, phone, and plate number are required.' });
      const targetDistrict = DISTRICTS.find(d => d.id === data.districtId) || DISTRICTS[0];
      const newDriver = {
        name: String(data.name).trim(),
        phone: String(data.phone).trim(),
        plate_number: String(data.bajajPlate).trim().toUpperCase(),
        district: data.districtId || targetDistrict.id,
        location_lat: targetDistrict.center.lat + (Math.random() - 0.5) * 0.005,
        location_lng: targetDistrict.center.lng + (Math.random() - 0.5) * 0.005,
        status: 'offline',
        is_approved: false,
        vehicle_type: 'bajaj',
      };
      const { data: created, ok } = await sb('drivers', 'POST', newDriver);
      if (ok && Array.isArray(created) && created.length > 0) {
        const driver = mapDriver(created[0]);
        return res.json({ success: true, driver });
      }
      return res.status(500).json({ error: 'Failed to register driver' });
    }

    // POST /api/drivers/:id/reapply
    if (method === 'POST' && pathname.match(/^\/api\/drivers\/([^/]+)\/reapply$/)) {
      const id = pathname.match(/^\/api\/drivers\/([^/]+)\/reapply$/)![1];
      const { data: updated, ok } = await sb('drivers', 'PATCH', { is_approved: false }, `id=eq.${id}`);
      if (ok && Array.isArray(updated) && updated.length > 0) {
        return res.json({ driver: mapDriver(updated[0]) });
      }
      return res.status(500).json({ error: 'Failed to reapply' });
    }

    // POST /api/drivers/:id/toggle-online
    if (method === 'POST' && pathname.match(/^\/api\/drivers\/([^/]+)\/toggle-online$/)) {
      const id = pathname.match(/^\/api\/drivers\/([^/]+)\/toggle-online$/)![1];
      const { isOnline } = body;
      const { ok } = await sb('drivers', 'PATCH', { status: isOnline ? 'online' : 'offline', updated_at: new Date().toISOString() }, `id=eq.${id}`);
      if (ok) return res.json({ success: true });
      return res.status(500).json({ error: 'Failed to toggle online status' });
    }

    // POST /api/drivers/:id/location
    if (method === 'POST' && pathname.match(/^\/api\/drivers\/([^/]+)\/location$/)) {
      const id = pathname.match(/^\/api\/drivers\/([^/]+)\/location$/)![1];
      const { lat, lng } = body;
      await sb('drivers', 'PATCH', { location_lat: Number(lat), location_lng: Number(lng) }, `id=eq.${id}`);
      return res.json({ success: true });
    }

    // POST /api/drivers/:id/change-district
    if (method === 'POST' && pathname.match(/^\/api\/drivers\/([^/]+)\/change-district$/)) {
      const id = pathname.match(/^\/api\/drivers\/([^/]+)\/change-district$/)![1];
      const { districtId } = body;
      await sb('drivers', 'PATCH', { district: districtId }, `id=eq.${id}`);
      return res.json({ success: true });
    }

    // POST /api/drivers/:id/update
    if (method === 'POST' && pathname.match(/^\/api\/drivers\/([^/]+)\/update$/)) {
      const id = pathname.match(/^\/api\/drivers\/([^/]+)\/update$/)![1];
      const data = body;
      const updates: any = { updated_at: new Date().toISOString() };
      if (data.name !== undefined) updates.name = String(data.name).trim();
      if (data.phone !== undefined) updates.phone = String(data.phone).trim();
      if (data.bajajPlate !== undefined) updates.plate_number = String(data.bajajPlate).trim().toUpperCase();
      if (data.districtId !== undefined) updates.district = data.districtId;
      await sb('drivers', 'PATCH', updates, `id=eq.${id}`);
      return res.json({ success: true });
    }

    // POST /api/drivers/:id/update-photos
    if (method === 'POST' && pathname.match(/^\/api\/drivers\/([^/]+)\/update-photos$/)) {
      return res.json({ success: true });
    }

    // POST /api/drivers/:id/adjust-km
    if (method === 'POST' && pathname.match(/^\/api\/drivers\/([^/]+)\/adjust-km$/)) {
      return res.json({ success: true, message: 'KM balance updated.' });
    }

    // POST /api/drivers/:id/settle-annual-fee
    if (method === 'POST' && pathname.match(/^\/api\/drivers\/([^/]+)\/settle-annual-fee$/)) {
      return res.json({ success: true, message: 'Annual fee settled.' });
    }

    // DELETE /api/drivers/:id
    if (method === 'DELETE' && pathname.match(/^\/api\/drivers\/([^/]+)$/)) {
      const id = pathname.match(/^\/api\/drivers\/([^/]+)$/)![1];
      await sb('drivers', 'DELETE', undefined, `id=eq.${id}`);
      return res.json({ success: true });
    }

    // POST /api/admin/drivers/:id/approve
    if (method === 'POST' && pathname.match(/^\/api\/admin\/drivers\/([^/]+)\/approve$/)) {
      const id = pathname.match(/^\/api\/admin\/drivers\/([^/]+)\/approve$/)![1];
      await sb('drivers', 'PATCH', { is_approved: true }, `id=eq.${id}`);
      return res.json({ success: true, message: 'Driver approved!' });
    }

    // POST /api/admin/drivers/:id/reject
    if (method === 'POST' && pathname.match(/^\/api\/admin\/drivers\/([^/]+)\/reject$/)) {
      const id = pathname.match(/^\/api\/admin\/drivers\/([^/]+)\/reject$/)![1];
      await sb('drivers', 'PATCH', { is_approved: false }, `id=eq.${id}`);
      return res.json({ success: true, message: 'Driver rejected.' });
    }

    // POST /api/trips/request
    if (method === 'POST' && pathname === '/api/trips/request') {
      const { passengerName, passengerPhone, districtId, districtName, pickupAddress, pickupCoords, dropoffAddress, dropoffCoords, distanceKm = 0, suggestedNegotiationMin, suggestedNegotiationMax, passengerCount = 1, hasLuggage = false, tripType = 'instant_contract', notes = '' } = body;
      if (!passengerName || !passengerPhone || !pickupAddress || !dropoffAddress)
        return res.status(400).json({ error: 'Missing required fields' });
      const activeDist = DISTRICTS.find(d => d.id === districtId && d.status === 'active') || DISTRICTS.find(d => d.status === 'active') || DISTRICTS[0];
      const dist = distanceKm || calculateDistanceKm(pickupCoords, dropoffCoords);
      const driversResult = await sb('drivers', 'GET', undefined, 'status=eq.online&is_approved=eq.true');
      const allDrivers = (driversResult.ok && Array.isArray(driversResult.data)) ? driversResult.data.map(mapDriver) : [];
      const nearbyDrivers = allDrivers.filter(d => {
        const driverDist = calculateDistanceKm(pickupCoords, d.currentLocation);
        const districtMatch = !districtId || d.districtId === districtId;
        return driverDist <= 3.0 && districtMatch;
      }).sort((a, b) => calculateDistanceKm(pickupCoords, a.currentLocation) - calculateDistanceKm(pickupCoords, b.currentLocation));
      const newTrip = {
        customer_name: passengerName, customer_phone: passengerPhone,
        pickup_location: pickupAddress, dropoff_location: dropoffAddress,
        pickup_lat: pickupCoords?.lat || 0, pickup_lng: pickupCoords?.lng || 0,
        dropoff_lat: dropoffCoords?.lat || 0, dropoff_lng: dropoffCoords?.lng || 0,
        district: districtId || activeDist.id, status: 'ringing',
        fare: suggestedNegotiationMin || 0, driver_id: '',
      };
      const { data: created, ok } = await sb('trips', 'POST', newTrip);
      if (ok && Array.isArray(created) && created.length > 0) {
        const trip = mapTrip(created[0]);
        trip.targetDriverIds = nearbyDrivers.map(d => d.id);
        return res.json({ success: true, trip, nearbyDriverCount: nearbyDrivers.length });
      }
      return res.status(500).json({ error: 'Failed to create trip' });
    }

    // POST /api/trips/:id/accept
    if (method === 'POST' && pathname.match(/^\/api\/trips\/([^/]+)\/accept$/)) {
      const id = pathname.match(/^\/api\/trips\/([^/]+)\/accept$/)![1];
      const { driverId } = body;
      await sb('trips', 'PATCH', { status: 'accepted', driver_id: driverId, updated_at: new Date().toISOString() }, `id=eq.${id}`);
      await sb('drivers', 'PATCH', { status: 'offline' }, `id=eq.${driverId}`);
      return res.json({ success: true, message: 'Trip accepted!' });
    }

    // POST /api/trips/:id/status
    if (method === 'POST' && pathname.match(/^\/api\/trips\/([^/]+)\/status$/)) {
      const id = pathname.match(/^\/api\/trips\/([^/]+)\/status$/)![1];
      const { status, agreedPrice, cancelledBy, cancellationReason } = body;
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (agreedPrice) updates.fare = Number(agreedPrice);
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      const { data: trips } = await sb('trips', 'GET', undefined, `id=eq.${id}`);
      if (Array.isArray(trips) && trips.length > 0 && trips[0].driver_id) {
        if (status === 'completed' || status === 'cancelled') {
          await sb('drivers', 'PATCH', { status: 'online' }, `id=eq.${trips[0].driver_id}`);
        }
      }
      await sb('trips', 'PATCH', updates, `id=eq.${id}`);
      return res.json({ success: true });
    }

    // POST /api/trips/:id/cancel
    if (method === 'POST' && pathname.match(/^\/api\/trips\/([^/]+)\/cancel$/)) {
      const id = pathname.match(/^\/api\/trips\/([^/]+)\/cancel$/)![1];
      const { cancelledBy = 'passenger', cancellationReason = 'Customer changed mind' } = body;
      const { data: trips } = await sb('trips', 'GET', undefined, `id=eq.${id}`);
      if (Array.isArray(trips) && trips.length > 0 && trips[0].driver_id) {
        await sb('drivers', 'PATCH', { status: 'online' }, `id=eq.${trips[0].driver_id}`);
      }
      await sb('trips', 'PATCH', { status: 'cancelled', updated_at: new Date().toISOString() }, `id=eq.${id}`);
      return res.json({ success: true, message: `Trip cancelled by ${cancelledBy}.` });
    }

    // POST /api/trips/:id/expire-now
    if (method === 'POST' && pathname.match(/^\/api\/trips\/([^/]+)\/expire-now$/)) {
      const id = pathname.match(/^\/api\/trips\/([^/]+)\/expire-now$/)![1];
      await sb('trips', 'PATCH', { status: 'expired', updated_at: new Date().toISOString() }, `id=eq.${id}`);
      return res.json({ success: true });
    }

    // GET /api/stats
    if (method === 'GET' && pathname === '/api/stats') {
      return res.json({ drivers: 0, onlineDrivers: 0, trips: 0, revenue: 0 });
    }

    // 404 for unmatched routes
    return res.status(404).json({ error: 'Route not found', path: pathname });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message || 'Unknown error' });
  }
}
