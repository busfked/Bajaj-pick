import type { VercelRequest, VercelResponse } from '@vercel/node';

interface LC { lat: number; lng: number }
interface LM { id: string; name: string; category: string; lat: number; lng: number; description?: string; districtId?: string }
interface VD { id: string; name: string; description: string; center: LC; maxRadiusKm: number; landmarks: LM[]; colorTag?: string; status: string; suspendedReason?: string }
interface DR { id: string; driverId: string; driverName: string; driverPhone: string; driverPlate: string; amountBirr: number; kmToCredit: number; paymentMethod: string; receiptScreenshotUrl: string; transactionReference?: string; status: string; createdAt: number; reviewedAt?: number; rejectionReason?: string }
interface BD { id: string; name: string; phone: string; secondaryPhone?: string; bajajPlate: string; bajajColor: string; modelYear?: string; districtId: string; districtName: string; villageArea: string; currentLocation: LC; isOnline: boolean; isRegistered: boolean; kmBalance: number; totalKmPurchased: number; totalKmDriven: number; lastRechargeDate?: string; nationalIdNumber?: string; nationalIdPhotoUrl?: string; faydaNumber?: string; kebeleHouseNumber?: string; emergencyContactName?: string; emergencyContactPhone?: string; annualCommissionRatePercent: number; totalTripsCompleted: number; totalEstimatedEarnings: number; annualCommissionDue: number; annualCommissionPaid: boolean; annualSettlementYear: number; lastAnnualPaymentDate?: string; approvalStatus?: string; reviewedAt?: number; rejectionReason?: string; registrationDate: string; rating: number; photoUrl?: string; activeTripId?: string | null; lastActiveAt?: number }
interface CT { id: string; passengerName: string; passengerPhone: string; districtId: string; districtName: string; pickupAddress: string; pickupCoords: LC; dropoffAddress: string; dropoffCoords: LC; distanceKm: number; estimatedMinutes: number; passengerCount: number; hasLuggage: boolean; tripType: string; notes?: string; suggestedNegotiationMin: number; suggestedNegotiationMax: number; currency: string; status: string; cancelledBy?: string; cancellationReason?: string; createdAt: number; ringingExpiresAt: number; targetDriverIds: string[]; acceptedByDriverId?: string; acceptedDriver?: BD; acceptedAt?: number; completedAt?: number; agreedPrice?: number }
interface VS { villageName: string; activeDistrictId: string; districts: VD[]; currency: string; currencySymbol: string; adminEmail: string; adminPhone: string; kmRateBirrPer15Km: number; annualCommissionPercent: number; maxDispatchRangeKm: number; ringTimeoutSeconds: number; adminPassword?: string; supportPhone: string; supportEmail: string; telebirrAccount: string; cbeAccount: string; awashAccount: string; accountHolderName: string; baseContractFare: number; ratePerKm: number; villageCenter: LC; landmarks: LM[] }

function distKm(a: LC | null | undefined, b: LC | null | undefined): number {
  if (!a || !b || typeof a.lat !== 'number' || typeof b.lat !== 'number' || isNaN(a.lat) || isNaN(b.lat)) return 0;
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}
function estMin(km: number): number { return Math.max(2, Math.ceil(km / 25 * 60 + 1)); }
function negRange(km: number, s: VS) { const c = (s.baseContractFare || 40) + Math.max(0.5, km) * (s.ratePerKm || 20); return { min: Math.max(s.baseContractFare || 40, Math.round(c * 0.9 / 5) * 5), max: Math.round(c * 1.25 / 5) * 5 }; }

const DD: VD[] = [
  { id: 'dist-gerji', name: 'Gerji District', description: 'Internal village streets around Roba, Unity, and Sunshine', center: { lat: 8.9806, lng: 38.8020 }, maxRadiusKm: 3.0, status: 'active', colorTag: '#10B981', landmarks: [
    { id: 'lm-gerji-1', name: 'Gerji Taxi & Bajaj Stand (Roba Bakery)', category: 'station', lat: 8.9806, lng: 38.8020, description: 'Main neighborhood passenger hub', districtId: 'dist-gerji' },
    { id: 'lm-gerji-2', name: 'Unity University Campus Gate', category: 'school', lat: 8.9850, lng: 38.8045, description: 'Student drop zone', districtId: 'dist-gerji' },
    { id: 'lm-gerji-3', name: 'Gerji Giorgis Church Square', category: 'religious', lat: 8.9772, lng: 38.7990, description: 'Upper village crossroads', districtId: 'dist-gerji' },
    { id: 'lm-gerji-4', name: 'Sunshine Real Estate Village Gate', category: 'residential', lat: 8.9835, lng: 38.8110, description: 'Residential compound entrance', districtId: 'dist-gerji' },
    { id: 'lm-gerji-5', name: 'Mebrat Hail Residential Crossroads', category: 'residential', lat: 8.9740, lng: 38.8070, description: 'South neighborhood cluster', districtId: 'dist-gerji' },
  ]},
  { id: 'dist-salitemihret', name: 'Salitemihret District', description: 'Local roads around Salitemihret, Figa, and Goro', center: { lat: 9.0210, lng: 38.8260 }, maxRadiusKm: 3.0, status: 'active', colorTag: '#3B82F6', landmarks: [
    { id: 'lm-salite-1', name: 'Salitemihret Church Square & Stand', category: 'religious', lat: 9.0210, lng: 38.8260, description: 'Central church plaza', districtId: 'dist-salitemihret' },
    { id: 'lm-salite-2', name: 'Figa Market & Local Shops', category: 'market', lat: 9.0160, lng: 38.8205, description: 'Daily fresh market', districtId: 'dist-salitemihret' },
    { id: 'lm-salite-3', name: 'Goro Local Ring Road Stand', category: 'station', lat: 9.0270, lng: 38.8310, description: 'Connecting inner streets', districtId: 'dist-salitemihret' },
    { id: 'lm-salite-4', name: 'CMC Behind Residential Cluster', category: 'residential', lat: 9.0245, lng: 38.8390, description: 'Residential area', districtId: 'dist-salitemihret' },
  ]},
  { id: 'dist-jackros', name: 'Jackros District', description: 'Jackros local neighborhood inner lanes and Meta quarters', center: { lat: 8.9950, lng: 38.8180 }, maxRadiusKm: 3.0, status: 'active', colorTag: '#8B5CF6', landmarks: [
    { id: 'lm-jackros-1', name: 'Jackros Central Stand', category: 'station', lat: 8.9950, lng: 38.8180, description: 'Main center of Jackros', districtId: 'dist-jackros' },
    { id: 'lm-jackros-2', name: 'Meta Brewery Local Quarter', category: 'commercial', lat: 8.9920, lng: 38.8230, description: 'Inner access street', districtId: 'dist-jackros' },
  ]},
];
const mkDD = () => DD.map(d => ({ ...d, landmarks: [...d.landmarks] }));
let settings: VS = { villageName: 'Gerji & Salitemihret Village Network', activeDistrictId: 'dist-gerji', districts: mkDD(), currency: 'ETB (Birr)', currencySymbol: 'Br', adminEmail: 'busfkedmurdu21@gmail.com', adminPhone: '0911234567', kmRateBirrPer15Km: 100, annualCommissionPercent: 2, maxDispatchRangeKm: 3.0, ringTimeoutSeconds: 120, adminPassword: '', supportPhone: '+251 91 123 4567', supportEmail: 'busfkedmurdu21@gmail.com', telebirrAccount: '0911234567', cbeAccount: '1000123456789', awashAccount: '0142345678900', accountHolderName: 'Village Bajaj Dispatch', baseContractFare: 40, ratePerKm: 20, villageCenter: DD[0].center, landmarks: DD.flatMap(d => d.landmarks) };
let districts: VD[] = mkDD();
let drivers: BD[] = [];
let trips: CT[] = [];
let recharges: DR[] = [];

function findNearby(pickup: LC, distId?: string, maxKm = 3.0): BD[] {
  const on = drivers.filter(d => d.isOnline && d.isRegistered && (d.approvalStatus === 'approved' || !d.approvalStatus));
  let near = on.filter(d => { const dm = !distId || d.districtId === distId; return distKm(pickup, d.currentLocation) <= maxKm && dm; });
  if (!near.length) near = on.filter(d => distKm(pickup, d.currentLocation) <= maxKm);
  return near.sort((a, b) => distKm(pickup, a.currentLocation) - distKm(pickup, b.currentLocation));
}
function gid(p: string, rx: RegExp): string | null { const m = p.match(rx); return m ? m[1] : null; }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '/', 'http://localhost');
  const p = url.pathname, method = req.method || 'GET';
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') return res.status(200).end();
  const b = typeof req.body === 'object' && req.body ? req.body : {};

  try {
    if (p === '/api/health') return res.json({ status: 'ok', time: new Date().toISOString() });

    if (p === '/api/state') {
      const now = Date.now();
      trips = trips.map(t => t.status === 'ringing' && now > t.ringingExpiresAt ? { ...t, status: 'expired' } : t);
      return res.json({ settings: { ...settings, districts }, districts, drivers, trips, recharges, activeTrips: trips.filter(t => ['ringing', 'accepted', 'en_route', 'arrived'].includes(t.status)), completedTrips: trips.filter(t => t.status === 'completed') });
    }

    if (p === '/api/admin/verify-credentials') {
      const ae = (settings.adminEmail || 'busfkedmurdu21@gmail.com').toLowerCase().trim();
      const ie = (b.email || '').toLowerCase().trim(), ip = (b.phone || '').trim();
      if (ie === ae) { if (ip.length >= 8) { if (!settings.adminPhone || settings.adminPhone === '0911234567') settings.adminPhone = ip; return res.json({ success: true, authenticated: true, message: 'Welcome back Admin!', admin: { email: ae, phone: ip } }); } return res.status(400).json({ success: false, error: 'Please provide your registered phone number.' }); }
      return res.status(401).json({ success: false, error: 'Unauthorized: Admin email must match busfkedmurdu21@gmail.com' });
    }

    if (p === '/api/admin/verify-password') return res.json({ success: true, authenticated: true });

    if (p === '/api/admin/settings') {
      const s = b;
      if (s.supportPhone !== undefined) settings.supportPhone = String(s.supportPhone).trim();
      if (s.supportEmail !== undefined) settings.supportEmail = String(s.supportEmail).trim();
      if (s.adminEmail !== undefined) settings.adminEmail = String(s.adminEmail).trim();
      if (s.adminPhone !== undefined) settings.adminPhone = String(s.adminPhone).trim();
      if (s.villageName !== undefined) settings.villageName = String(s.villageName).trim();
      if (s.telebirrAccount !== undefined) settings.telebirrAccount = String(s.telebirrAccount).trim();
      if (s.cbeAccount !== undefined) settings.cbeAccount = String(s.cbeAccount).trim();
      if (s.awashAccount !== undefined) settings.awashAccount = String(s.awashAccount).trim();
      if (s.accountHolderName !== undefined) settings.accountHolderName = String(s.accountHolderName).trim();
      if (s.kmRateBirrPer15Km !== undefined) settings.kmRateBirrPer15Km = Number(s.kmRateBirrPer15Km);
      if (s.annualCommissionPercent !== undefined) settings.annualCommissionPercent = Number(s.annualCommissionPercent);
      if (s.baseContractFare !== undefined) settings.baseContractFare = Number(s.baseContractFare);
      if (s.ratePerKm !== undefined) settings.ratePerKm = Number(s.ratePerKm);
      if (s.maxDispatchRangeKm !== undefined) settings.maxDispatchRangeKm = Number(s.maxDispatchRangeKm);
      if (s.ringTimeoutSeconds !== undefined) settings.ringTimeoutSeconds = Number(s.ringTimeoutSeconds);
      return res.json({ success: true, settings });
    }

    if (p === '/api/recharges' && method === 'GET') return res.json({ success: true, recharges });

    if ((p === '/api/recharges' || p === '/api/recharges/request') && method === 'POST') {
      const drv = drivers.find(d => d.id === b.driverId); if (!drv) return res.status(404).json({ error: 'Driver not found' });
      const proof = b.receiptScreenshotUrl || b.paymentProofUrl; if (!proof) return res.status(400).json({ error: 'Payment screenshot proof is required.' });
      const km = Math.round((Number(b.amountBirr || 100) / (settings.kmRateBirrPer15Km || 100)) * 15 * 10) / 10;
      const rch: DR = { id: 'rch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), driverId: drv.id, driverName: drv.name, driverPhone: drv.phone, driverPlate: drv.bajajPlate, amountBirr: Number(b.amountBirr || 100), kmToCredit: km, paymentMethod: b.paymentMethod || 'telebirr', receiptScreenshotUrl: proof, transactionReference: (b.transactionReference || b.transactionRef || '').trim() || undefined, status: 'pending', createdAt: Date.now() };
      recharges.unshift(rch); return res.json({ success: true, recharge: rch, message: `Recharge for ${b.amountBirr || 100} Birr submitted!` });
    }

    if (p.match(/\/api\/recharges\/[^/]+\/approve/) && method === 'POST') {
      const id = gid(p, /\/api\/recharges\/([^/]+)\/approve/); const rch = recharges.find(r => r.id === id);
      if (!rch) return res.status(404).json({ error: 'Not found' }); const drv = drivers.find(d => d.id === rch.driverId);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); rch.status = 'approved'; rch.reviewedAt = Date.now();
      const km = rch.kmToCredit || 15; drv.kmBalance = Math.round((drv.kmBalance + km) * 10) / 10; drv.totalKmPurchased = Math.round((drv.totalKmPurchased + km) * 10) / 10; drv.lastRechargeDate = new Date().toISOString().split('T')[0];
      return res.json({ success: true, recharge: rch, driver: drv, message: `${km} KM credited to ${drv.name}.` });
    }

    if (p.match(/\/api\/recharges\/[^/]+\/reject/) && method === 'POST') {
      const id = gid(p, /\/api\/recharges\/([^/]+)\/reject/); const rch = recharges.find(r => r.id === id);
      if (!rch) return res.status(404).json({ error: 'Not found' }); rch.status = 'rejected'; rch.reviewedAt = Date.now(); rch.rejectionReason = b.reason || 'Payment proof could not be verified.';
      return res.json({ success: true, recharge: rch, message: 'Recharge rejected.' });
    }

    if (p === '/api/trips/request' && method === 'POST') {
      const { passengerName, passengerPhone, districtId, pickupAddress, pickupCoords, dropoffAddress, dropoffCoords, passengerCount = 1, hasLuggage = false, tripType = 'instant_contract', notes = '' } = b;
      if (!passengerName || !passengerPhone || !pickupAddress || !dropoffAddress) return res.status(400).json({ error: 'Missing required fields' });
      const ad = districts.find(d => d.id === districtId) || districts.find(d => d.status === 'active') || districts[0];
      const d = distKm(pickupCoords, dropoffCoords), nr = negRange(d, settings), near = findNearby(pickupCoords, ad.id).filter(dr => (dr.kmBalance || 0) >= d);
      const trip: CT = { id: 'trip-' + Date.now(), passengerName, passengerPhone, districtId: ad.id, districtName: ad.name, pickupAddress, pickupCoords: pickupCoords || ad.center, dropoffAddress, dropoffCoords: dropoffCoords || ad.center, distanceKm: d, estimatedMinutes: estMin(d), passengerCount, hasLuggage, tripType, notes: notes || undefined, suggestedNegotiationMin: nr.min, suggestedNegotiationMax: nr.max, currency: settings.currency, status: 'ringing', createdAt: Date.now(), ringingExpiresAt: Date.now() + (settings.ringTimeoutSeconds || 120) * 1000, targetDriverIds: near.map(dr => dr.id) };
      trips.unshift(trip); return res.json({ success: true, trip, nearbyDriverCount: near.length, message: near.length > 0 ? `Dispatching to ${near.length} Bajaj(s)...` : 'No online drivers within range.' });
    }

    if (p.match(/\/api\/trips\/[^/]+\/expire-now/) && method === 'POST') {
      const id = gid(p, /\/api\/trips\/([^/]+)\/expire-now/); const t = trips.find(tr => tr.id === id);
      if (t && t.status === 'ringing') { t.status = 'expired'; t.ringingExpiresAt = Date.now() - 1000; } return res.json({ success: true, trip: t });
    }

    if (p.match(/\/api\/trips\/[^/]+\/accept/) && method === 'POST') {
      const id = gid(p, /\/api\/trips\/([^/]+)\/accept/); const drv = drivers.find(d => d.id === b.driverId);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); const t = trips.find(tr => tr.id === id);
      if (!t) return res.status(404).json({ error: 'Trip not found' }); if (t.status !== 'ringing') return res.status(409).json({ error: 'Already accepted!', status: t.status });
      if (Date.now() > t.ringingExpiresAt) { t.status = 'expired'; return res.status(410).json({ error: 'Timed out' }); }
      t.status = 'accepted'; t.acceptedByDriverId = drv.id; t.acceptedDriver = drv; t.acceptedAt = Date.now(); drv.activeTripId = t.id;
      return res.json({ success: true, trip: t, message: 'Trip accepted!' });
    }

    if (p.match(/\/api\/trips\/[^/]+\/status/) && method === 'POST') {
      const id = gid(p, /\/api\/trips\/([^/]+)\/status/); const t = trips.find(tr => tr.id === id);
      if (!t) return res.status(404).json({ error: 'Trip not found' }); t.status = b.status; if (b.agreedPrice) t.agreedPrice = Number(b.agreedPrice); if (b.cancelledBy) t.cancelledBy = b.cancelledBy; if (b.cancellationReason) t.cancellationReason = b.cancellationReason;
      if (b.status === 'completed') { t.completedAt = Date.now(); if (t.acceptedByDriverId) { const drv = drivers.find(d => d.id === t.acceptedByDriverId); if (drv) { drv.totalTripsCompleted++; const fare = t.agreedPrice || (t.suggestedNegotiationMin + t.suggestedNegotiationMax) / 2; drv.totalEstimatedEarnings += fare; drv.annualCommissionDue = Math.round(drv.totalEstimatedEarnings * ((settings.annualCommissionPercent || 2) / 100)); const tk = t.distanceKm || 1.5; drv.kmBalance = Math.max(0, Math.round((drv.kmBalance - tk) * 10) / 10); drv.totalKmDriven = Math.round((drv.totalKmDriven + tk) * 10) / 10; drv.activeTripId = null; } } } else if (b.status === 'cancelled' && t.acceptedByDriverId) { const drv = drivers.find(d => d.id === t.acceptedByDriverId); if (drv) drv.activeTripId = null; }
      return res.json({ success: true, trip: t });
    }

    if (p.match(/\/api\/trips\/[^/]+\/cancel/) && method === 'POST') {
      const id = gid(p, /\/api\/trips\/([^/]+)\/cancel/); const t = trips.find(tr => tr.id === id);
      if (!t) return res.status(404).json({ error: 'Trip not found' }); t.status = 'cancelled'; t.cancelledBy = b.cancelledBy || 'passenger'; t.cancellationReason = b.cancellationReason || 'Changed mind';
      if (t.acceptedByDriverId) { const drv = drivers.find(d => d.id === t.acceptedByDriverId); if (drv) drv.activeTripId = null; }
      return res.json({ success: true, trip: t, message: 'Trip cancelled.' });
    }

    if (p === '/api/drivers/register' && method === 'POST') {
      if (!b.name || !b.phone || !b.bajajPlate) return res.status(400).json({ error: 'Name, phone, and plate are required.' });
      const td = districts.find(d => d.id === b.districtId) || districts[0], ik = 15;
      const nd: BD = { id: 'drv-' + Date.now(), name: String(b.name).trim(), phone: String(b.phone).trim(), secondaryPhone: b.secondaryPhone?.trim(), bajajPlate: String(b.bajajPlate).trim().toUpperCase(), bajajColor: b.bajajColor || 'Standard Yellow', modelYear: b.modelYear || '2024 Model', districtId: td.id, districtName: td.name, villageArea: b.villageArea || td.landmarks?.[0]?.name || 'Main Stand', currentLocation: { lat: (td.center?.lat || 8.9806) + (Math.random() - 0.5) * 0.005, lng: (td.center?.lng || 38.802) + (Math.random() - 0.5) * 0.005 }, isOnline: false, isRegistered: false, approvalStatus: 'pending', kmBalance: ik, totalKmPurchased: ik, totalKmDriven: 0, nationalIdNumber: b.nationalIdNumber?.trim(), nationalIdPhotoUrl: b.nationalIdPhotoUrl, faydaNumber: b.faydaNumber?.trim(), kebeleHouseNumber: b.kebeleHouseNumber?.trim(), emergencyContactName: b.emergencyContactName?.trim(), emergencyContactPhone: b.emergencyContactPhone?.trim(), annualCommissionRatePercent: settings.annualCommissionPercent || 2, totalTripsCompleted: 0, totalEstimatedEarnings: 0, annualCommissionDue: 0, annualCommissionPaid: true, annualSettlementYear: 2026, registrationDate: new Date().toISOString().split('T')[0], rating: 5.0, photoUrl: b.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' };
      drivers.unshift(nd);
      if (b.receiptScreenshotUrl && b.initialRechargeBirr) { const km = Math.round((Number(b.initialRechargeBirr) / (settings.kmRateBirrPer15Km || 100)) * 15 * 10) / 10; recharges.unshift({ id: 'rch-' + Date.now(), driverId: nd.id, driverName: nd.name, driverPhone: nd.phone, driverPlate: nd.bajajPlate, amountBirr: Number(b.initialRechargeBirr), kmToCredit: km, paymentMethod: 'telebirr', receiptScreenshotUrl: b.receiptScreenshotUrl, status: 'pending', createdAt: Date.now() }); }
      return res.json({ success: true, driver: nd, message: 'Registration submitted! Coordinator will review.' });
    }

    if (p.match(/\/api\/admin\/drivers\/[^/]+\/approve/) && method === 'POST') {
      const id = gid(p, /\/api\/admin\/drivers\/([^/]+)\/approve/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); drv.approvalStatus = 'approved'; drv.isRegistered = true; drv.isOnline = true; drv.reviewedAt = Date.now(); drv.rejectionReason = undefined;
      if ((drv.kmBalance || 0) <= 0) { drv.kmBalance = 15; drv.totalKmPurchased = Math.max(drv.totalKmPurchased || 0, 15); }
      return res.json({ success: true, driver: drv, message: `Driver ${drv.name} approved with 15 KM!` });
    }

    if (p.match(/\/api\/admin\/drivers\/[^/]+\/reject/) && method === 'POST') {
      const id = gid(p, /\/api\/admin\/drivers\/([^/]+)\/reject/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); drv.approvalStatus = 'rejected'; drv.isRegistered = false; drv.isOnline = false; drv.reviewedAt = Date.now(); drv.rejectionReason = b.reason?.trim() || 'Please fill the form properly.';
      return res.json({ success: true, driver: drv, message: `Driver ${drv.name} rejected.` });
    }

    if (p.match(/\/api\/drivers\/[^/]+\/reapply/) && method === 'POST') {
      const id = gid(p, /\/api\/drivers\/([^/]+)\/reapply/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); if (!b.name || !b.phone || !b.bajajPlate) return res.status(400).json({ error: 'Name, phone, and plate are required.' });
      const td = districts.find(d => d.id === b.districtId) || districts[0];
      drv.name = String(b.name).trim(); drv.phone = String(b.phone).trim(); drv.bajajPlate = String(b.bajajPlate).trim().toUpperCase(); drv.districtId = td.id; drv.districtName = td.name;
      if (b.bajajColor) drv.bajajColor = String(b.bajajColor).trim(); if (b.villageArea) drv.villageArea = String(b.villageArea).trim(); if (b.photoUrl) drv.photoUrl = b.photoUrl;
      drv.approvalStatus = 'pending'; drv.rejectionReason = undefined; drv.isRegistered = false; drv.isOnline = false;
      return res.json({ success: true, driver: drv, message: 'Application re-submitted!' });
    }

    if (p === '/api/admin/drivers' && method === 'POST') {
      if (!b.name || !b.phone || !b.bajajPlate) return res.status(400).json({ error: 'Name, phone, and plate are required.' });
      const td = districts.find(d => d.id === b.districtId) || districts[0], km = Number(b.kmBalance) >= 0 ? Number(b.kmBalance) : 15;
      const nd: BD = { id: 'drv-' + Date.now(), name: String(b.name).trim(), phone: String(b.phone).trim(), bajajPlate: String(b.bajajPlate).trim().toUpperCase(), bajajColor: b.bajajColor || 'Standard Yellow', modelYear: b.modelYear || '2024 Model', districtId: td.id, districtName: td.name, villageArea: b.villageArea || td.landmarks?.[0]?.name || 'Main Stand', currentLocation: { lat: (td.center?.lat || 8.9806) + (Math.random() - 0.5) * 0.005, lng: (td.center?.lng || 38.802) + (Math.random() - 0.5) * 0.005 }, isOnline: true, isRegistered: true, approvalStatus: 'approved', kmBalance: km, totalKmPurchased: km, totalKmDriven: 0, annualCommissionRatePercent: settings.annualCommissionPercent || 2, totalTripsCompleted: 0, totalEstimatedEarnings: 0, annualCommissionDue: 0, annualCommissionPaid: true, annualSettlementYear: 2026, registrationDate: new Date().toISOString().split('T')[0], rating: 5.0, photoUrl: b.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80' };
      drivers.unshift(nd); return res.json({ success: true, driver: nd, message: 'Driver added!' });
    }

    if (p.match(/\/api\/drivers\/[^/]+\/update-photos/) && method === 'POST') {
      const id = gid(p, /\/api\/drivers\/([^/]+)\/update-photos/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); if (b.photoUrl) drv.photoUrl = b.photoUrl; if (b.nationalIdPhotoUrl) drv.nationalIdPhotoUrl = b.nationalIdPhotoUrl; if (b.nationalIdNumber) drv.nationalIdNumber = b.nationalIdNumber;
      return res.json({ success: true, driver: drv });
    }

    if (p.match(/\/api\/drivers\/[^/]+\/location/) && method === 'POST') {
      const id = gid(p, /\/api\/drivers\/([^/]+)\/location/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); if (b.lat && b.lng && !isNaN(b.lat) && !isNaN(b.lng)) { drv.currentLocation = { lat: Number(b.lat), lng: Number(b.lng) }; drv.lastActiveAt = Date.now(); }
      return res.json({ success: true, driver: drv });
    }

    if (p.match(/\/api\/drivers\/[^/]+\/adjust-km/) && method === 'POST') {
      const id = gid(p, /\/api\/drivers\/([^/]+)\/adjust-km/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); const adj = Number(b.amountKm) || 0;
      drv.kmBalance = Math.max(0, Math.round((drv.kmBalance + adj) * 10) / 10); if (adj > 0) drv.totalKmPurchased = Math.round((drv.totalKmPurchased + adj) * 10) / 10;
      return res.json({ success: true, driver: drv, message: `KM balance: ${drv.kmBalance}` });
    }

    if ((method === 'PUT' || method === 'POST') && p.match(/\/api\/drivers\/[^/]+(\/update)?$/)) {
      const id = gid(p, /\/api\/drivers\/([^/]+)(?:\/update)?$/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); const u = b;
      if (u.districtId && u.districtId !== drv.districtId) { const td = districts.find(d => d.id === u.districtId); if (td) { drv.districtId = td.id; drv.districtName = td.name; if (td.center) drv.currentLocation = { lat: td.center.lat + (Math.random() - 0.5) * 0.004, lng: td.center.lng + (Math.random() - 0.5) * 0.004 }; } }
      if (u.name !== undefined) drv.name = String(u.name).trim(); if (u.phone !== undefined) drv.phone = String(u.phone).trim();
      if (u.bajajPlate !== undefined) drv.bajajPlate = String(u.bajajPlate).trim().toUpperCase();
      if (u.bajajColor !== undefined) drv.bajajColor = String(u.bajajColor).trim(); if (u.villageArea !== undefined) drv.villageArea = String(u.villageArea).trim();
      if (u.isOnline !== undefined) drv.isOnline = Boolean(u.isOnline); if (u.kmBalance !== undefined) { const n = Number(u.kmBalance); if (!isNaN(n) && n >= 0) drv.kmBalance = Math.round(n * 10) / 10; }
      if (u.rating !== undefined) { const n = Number(u.rating); if (!isNaN(n)) drv.rating = Math.min(5, Math.max(1, n)); }
      if (u.photoUrl !== undefined) drv.photoUrl = u.photoUrl; if (u.nationalIdPhotoUrl !== undefined) drv.nationalIdPhotoUrl = u.nationalIdPhotoUrl;
      if (u.nationalIdNumber !== undefined) drv.nationalIdNumber = u.nationalIdNumber ? String(u.nationalIdNumber).trim() : undefined;
      if (u.faydaNumber !== undefined) drv.faydaNumber = u.faydaNumber ? String(u.faydaNumber).trim() : undefined;
      if (u.kebeleHouseNumber !== undefined) drv.kebeleHouseNumber = u.kebeleHouseNumber ? String(u.kebeleHouseNumber).trim() : undefined;
      if (u.emergencyContactName !== undefined) drv.emergencyContactName = u.emergencyContactName ? String(u.emergencyContactName).trim() : undefined;
      if (u.emergencyContactPhone !== undefined) drv.emergencyContactPhone = u.emergencyContactPhone ? String(u.emergencyContactPhone).trim() : undefined;
      return res.json({ success: true, driver: drv, message: `Driver ${drv.name} updated!` });
    }

    if (p.match(/\/api\/drivers\/[^/]+\/change-district/) && method === 'POST') {
      const id = gid(p, /\/api\/drivers\/([^/]+)\/change-district/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); const td = districts.find(d => d.id === b.districtId);
      if (!td) return res.status(400).json({ error: 'District not found' }); drv.districtId = td.id; drv.districtName = td.name; drv.villageArea = td.landmarks?.[0]?.name || drv.villageArea;
      if (td.center) drv.currentLocation = { lat: td.center.lat + (Math.random() - 0.5) * 0.003, lng: td.center.lng + (Math.random() - 0.5) * 0.003 };
      return res.json({ success: true, driver: drv, message: `Assigned to ${td.name}.` });
    }

    if (p.match(/\/api\/drivers\/[^/]+$/) && method === 'DELETE') {
      const id = gid(p, /\/api\/drivers\/([^/]+)$/); const len = drivers.length; drivers = drivers.filter(d => d.id !== id);
      if (drivers.length < len) { recharges = recharges.filter(r => r.driverId !== id); return res.json({ success: true, message: 'Driver deleted.' }); }
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (p.match(/\/api\/drivers\/[^/]+\/settle-annual-fee/) && method === 'POST') {
      const id = gid(p, /\/api\/drivers\/([^/]+)\/settle-annual-fee/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); drv.annualCommissionPaid = true; drv.lastAnnualPaymentDate = new Date().toISOString().split('T')[0]; drv.annualCommissionDue = 0;
      return res.json({ success: true, driver: drv, message: 'Annual commission settled.' });
    }

    if (p.match(/\/api\/drivers\/[^/]+\/toggle-online/) && method === 'POST') {
      const id = gid(p, /\/api\/drivers\/([^/]+)\/toggle-online/); const drv = drivers.find(d => d.id === id);
      if (!drv) return res.status(404).json({ error: 'Driver not found' }); drv.isOnline = typeof b.isOnline === 'boolean' ? b.isOnline : !drv.isOnline; drv.lastActiveAt = Date.now();
      return res.json({ success: true, driver: drv });
    }

    if (p === '/api/districts' && method === 'POST') {
      if (!b.name || !b.center || !b.center.lat || !b.center.lng) return res.status(400).json({ error: 'District name and center coordinates are required' });
      const did = 'dist-' + Date.now(), nd: VD = { id: did, name: String(b.name).trim(), description: b.description || `${b.name} road network`, center: { lat: Number(b.center.lat), lng: Number(b.center.lng) }, maxRadiusKm: Number(b.maxRadiusKm) || 3.0, status: 'active', colorTag: b.colorTag || '#10B981', landmarks: (b.landmarks || []).length > 0 ? b.landmarks : [{ id: 'lm-' + Date.now(), name: `${b.name} Main Stand`, category: 'station', lat: Number(b.center.lat), lng: Number(b.center.lng), description: 'Primary station', districtId: did }] };
      districts.push(nd); settings.landmarks = districts.flatMap(d => d.landmarks); return res.json({ success: true, district: nd, districts });
    }

    if (p.match(/\/api\/districts\/[^/]+\/toggle-status/) && method === 'POST') {
      const id = gid(p, /\/api\/districts\/([^/]+)\/toggle-status/); const dist = districts.find(d => d.id === id);
      if (!dist) return res.status(404).json({ error: 'District not found' }); dist.status = b.status === 'suspended' ? 'suspended' : 'active';
      if (b.suspendedReason) dist.suspendedReason = b.suspendedReason; else if (dist.status === 'active') dist.suspendedReason = undefined;
      return res.json({ success: true, district: dist, districts });
    }

    if (p.match(/\/api\/districts\/[^/]+$/) && method === 'DELETE') {
      const id = gid(p, /\/api\/districts\/([^/]+)$/);
      if (districts.length <= 1) return res.status(400).json({ error: 'Cannot delete the only district' });
      districts = districts.filter(d => d.id !== id); drivers = drivers.map(d => d.districtId === id ? { ...d, districtId: districts[0].id, districtName: districts[0].name } : d);
      settings.landmarks = districts.flatMap(d => d.landmarks); return res.json({ success: true, districts });
    }

    if (p === '/api/admin/reset-clean' && method === 'POST') { drivers = []; trips = []; recharges = []; return res.json({ success: true, message: 'All data cleared.' }); }

    return res.status(404).json({ error: 'Not found', path: p });
  } catch (err: any) { return res.status(500).json({ error: 'Server error', message: err.message }); }
}
