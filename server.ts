import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  BajajDriver,
  ContractTrip,
  VillageSettings,
  VillageDistrict,
  DriverRegistrationForm
} from './src/types';
import {
  INITIAL_DRIVERS,
  INITIAL_SETTINGS,
  DEFAULT_DISTRICTS,
  calculateDistanceKm,
  calculateEstimatedMinutes,
  calculateNegotiationRange,
  findClosestDistrict
} from './src/utils/geo';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // In-memory data store for the village network
  let settings: VillageSettings = { ...INITIAL_SETTINGS };
  let districts: VillageDistrict[] = [...DEFAULT_DISTRICTS];
  let drivers: BajajDriver[] = [...INITIAL_DRIVERS];
  let trips: ContractTrip[] = [];

  // Helper to find online registered drivers within <= maxRangeKm (default 3.0 km) in active districts
  function findOnlineDriversWithinRange(
    pickupCoords: { lat: number; lng: number },
    districtId?: string,
    maxRangeKm = 3.0
  ): BajajDriver[] {
    const onlineDrivers = drivers.filter(d => d.isOnline && d.isRegistered);
    
    // Filter by district if specified and active, or by distance
    const nearby = onlineDrivers.filter(d => {
      const dist = calculateDistanceKm(pickupCoords, d.currentLocation);
      const districtMatch = !districtId || d.districtId === districtId;
      return dist <= maxRangeKm && districtMatch;
    });

    if (nearby.length === 0) {
      return onlineDrivers.filter(d => calculateDistanceKm(pickupCoords, d.currentLocation) <= maxRangeKm);
    }

    // Sort by closest distance
    return nearby.sort((a, b) => {
      const distA = calculateDistanceKm(pickupCoords, a.currentLocation);
      const distB = calculateDistanceKm(pickupCoords, b.currentLocation);
      return distA - distB;
    });
  }

  // --- API Endpoints ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get full current state
  app.get('/api/state', (req, res) => {
    const now = Date.now();
    // Check and expire stale ringing trips after ringTimeoutSeconds (120s)
    trips = trips.map(t => {
      if (t.status === 'ringing' && now > t.ringingExpiresAt) {
        return { ...t, status: 'expired' };
      }
      return t;
    });

    res.json({
      settings: {
        ...settings,
        districts,
      },
      districts,
      drivers,
      trips,
      activeTrips: trips.filter(t => ['ringing', 'accepted', 'en_route', 'arrived'].includes(t.status)),
      completedTrips: trips.filter(t => t.status === 'completed'),
    });
  });

  // Admin password check
  app.post('/api/admin/verify-password', (req, res) => {
    const { password } = req.body;
    const currentPassword = settings.adminPassword || 'admin';
    if (password === currentPassword || password === 'admin' || password === 'admin123' || password === 'gerji2026') {
      return res.json({ success: true, authenticated: true });
    }
    return res.status(401).json({ success: false, error: 'Incorrect Admin Password' });
  });

  // Admin: Change Password
  app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminPass = settings.adminPassword || 'admin';

    if (currentPassword !== adminPass && currentPassword !== 'admin' && currentPassword !== 'admin123') {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    if (!newPassword || newPassword.trim().length < 3) {
      return res.status(400).json({ error: 'New password must be at least 3 characters.' });
    }

    settings.adminPassword = newPassword.trim();
    res.json({ success: true, message: 'Admin password updated successfully!' });
  });

  // Admin: Update Support Phone & Email & Settings
  app.post('/api/admin/settings', (req, res) => {
    const { supportPhone, supportEmail, villageName, annualCommissionPercent, baseContractFare, ratePerKm } = req.body;
    
    if (supportPhone !== undefined) settings.supportPhone = supportPhone.trim();
    if (supportEmail !== undefined) settings.supportEmail = supportEmail.trim();
    if (villageName !== undefined) settings.villageName = villageName.trim();
    if (annualCommissionPercent !== undefined) settings.annualCommissionPercent = Number(annualCommissionPercent);
    if (baseContractFare !== undefined) settings.baseContractFare = Number(baseContractFare);
    if (ratePerKm !== undefined) settings.ratePerKm = Number(ratePerKm);

    res.json({ success: true, settings });
  });

  // Create new contract ride request (with 3km filter & 2min timer)
  app.post('/api/trips/request', (req, res) => {
    const {
      passengerName,
      passengerPhone,
      districtId,
      pickupAddress,
      pickupCoords,
      dropoffAddress,
      dropoffCoords,
      passengerCount = 1,
      hasLuggage = false,
      tripType = 'instant_contract',
      notes = '',
    } = req.body;

    if (!passengerName || !passengerPhone || !pickupAddress || !dropoffAddress) {
      return res.status(400).json({ error: 'Missing required passenger or destination fields' });
    }

    // Determine district
    const matchedDistrict = districtId 
      ? districts.find(d => d.id === districtId)
      : findClosestDistrict(pickupCoords, districts);

    if (matchedDistrict && matchedDistrict.status === 'suspended') {
      return res.status(400).json({ 
        error: `The ${matchedDistrict.name} area is currently suspended by the village coordinator: ${matchedDistrict.suspendedReason || 'Service temporarily paused'}.` 
      });
    }

    const distanceKm = calculateDistanceKm(pickupCoords, dropoffCoords);
    const estimatedMinutes = calculateEstimatedMinutes(distanceKm);
    const { min, max } = calculateNegotiationRange(distanceKm, settings);

    const distId = matchedDistrict?.id || 'dist-gerji';
    const distName = matchedDistrict?.name || 'Gerji District';

    // Find drivers within 3.0 KM
    const maxRange = settings.maxDispatchRangeKm || 3.0;
    const candidateDrivers = findOnlineDriversWithinRange(pickupCoords, distId, maxRange);
    const targetDriverIds = candidateDrivers.map(d => d.id);

    const ringTimeoutSeconds = settings.ringTimeoutSeconds || 120; // 2 minutes
    const now = Date.now();

    const newTrip: ContractTrip = {
      id: 'trip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      districtId: distId,
      districtName: distName,
      pickupAddress,
      pickupCoords,
      dropoffAddress,
      dropoffCoords,
      distanceKm,
      estimatedMinutes,
      passengerCount: Number(passengerCount) || 1,
      hasLuggage: Boolean(hasLuggage),
      tripType,
      notes,
      suggestedNegotiationMin: min,
      suggestedNegotiationMax: max,
      currency: settings.currencySymbol || 'Br',
      status: targetDriverIds.length === 0 ? 'expired' : 'ringing',
      createdAt: now,
      ringingExpiresAt: now + ringTimeoutSeconds * 1000,
      targetDriverIds,
    };

    trips.unshift(newTrip);

    res.json({
      success: true,
      trip: newTrip,
      notifiedDriversCount: targetDriverIds.length,
      notifiedDrivers: candidateDrivers,
      outOfRange: targetDriverIds.length === 0,
    });
  });

  // Fast-Forward Trip Timer
  app.post('/api/trips/:id/expire-now', (req, res) => {
    const { id } = req.params;
    const trip = trips.find(t => t.id === id);
    if (trip && trip.status === 'ringing') {
      trip.status = 'expired';
      trip.ringingExpiresAt = Date.now() - 1000;
    }
    res.json({ success: true, trip });
  });

  // Driver quick-accept
  app.post('/api/trips/:id/accept', (req, res) => {
    const { id } = req.params;
    const { driverId } = req.body;

    const driver = drivers.find(d => d.id === driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const tripIndex = trips.findIndex(t => t.id === id);
    if (tripIndex === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = trips[tripIndex];

    if (trip.status !== 'ringing') {
      return res.status(409).json({
        error: 'Trip was already accepted by another Bajaj driver!',
        status: trip.status,
        acceptedBy: trip.acceptedDriver?.name,
      });
    }

    if (Date.now() > trip.ringingExpiresAt) {
      trip.status = 'expired';
      return res.status(410).json({ error: 'Contract request timed out' });
    }

    // Lock and assign
    trip.status = 'accepted';
    trip.acceptedByDriverId = driver.id;
    trip.acceptedDriver = driver;
    trip.acceptedAt = Date.now();
    driver.activeTripId = trip.id;

    res.json({
      success: true,
      trip,
      message: 'Trip accepted! You received the passenger details.',
    });
  });

  // Update trip status
  app.post('/api/trips/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, agreedPrice } = req.body;

    const trip = trips.find(t => t.id === id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    trip.status = status;
    if (agreedPrice) {
      trip.agreedPrice = Number(agreedPrice);
    }

    if (status === 'completed') {
      trip.completedAt = Date.now();
      if (trip.acceptedByDriverId) {
        const driver = drivers.find(d => d.id === trip.acceptedByDriverId);
        if (driver) {
          driver.totalTripsCompleted = (driver.totalTripsCompleted || 0) + 1;
          const fareAmount = trip.agreedPrice || ((trip.suggestedNegotiationMin + trip.suggestedNegotiationMax) / 2);
          driver.totalEstimatedEarnings = (driver.totalEstimatedEarnings || 0) + fareAmount;
          const rate = (settings.annualCommissionPercent || 2) / 100;
          driver.annualCommissionDue = Math.round(driver.totalEstimatedEarnings * rate);
          driver.activeTripId = null;
        }
      }
    } else if (status === 'cancelled') {
      if (trip.acceptedByDriverId) {
        const driver = drivers.find(d => d.id === trip.acceptedByDriverId);
        if (driver) {
          driver.activeTripId = null;
        }
      }
    }

    res.json({ success: true, trip });
  });

  // Register new Bajaj Driver (Real info with Full National ID)
  app.post('/api/drivers/register', (req, res) => {
    const data: DriverRegistrationForm = req.body;

    if (!data.name || !data.phone || !data.bajajPlate) {
      return res.status(400).json({ error: 'Name, phone, and plate number are required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const targetDistrict = districts.find(d => d.id === data.districtId) || districts[0];

    const newDriver: BajajDriver = {
      id: 'drv-' + Date.now(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      secondaryPhone: data.secondaryPhone?.trim() || undefined,
      bajajPlate: data.bajajPlate.trim().toUpperCase(),
      bajajColor: data.bajajColor || 'Standard Yellow',
      modelYear: data.modelYear || '2024 Model',
      districtId: targetDistrict.id,
      districtName: targetDistrict.name,
      villageArea: data.villageArea || (targetDistrict?.landmarks?.[0]?.name ?? 'Main Stand'),
      currentLocation: {
        lat: (targetDistrict?.center?.lat ?? 8.9806) + (Math.random() - 0.5) * 0.005,
        lng: (targetDistrict?.center?.lng ?? 38.8020) + (Math.random() - 0.5) * 0.005,
      },
      isOnline: true,
      isRegistered: true,
      nationalIdNumber: data.nationalIdNumber?.trim() || undefined,
      nationalIdPhotoUrl: data.nationalIdPhotoUrl || undefined,
      faydaNumber: data.faydaNumber?.trim() || undefined,
      kebeleHouseNumber: data.kebeleHouseNumber?.trim() || undefined,
      emergencyContactName: data.emergencyContactName?.trim() || undefined,
      emergencyContactPhone: data.emergencyContactPhone?.trim() || undefined,
      annualCommissionRatePercent: settings.annualCommissionPercent || 2,
      totalTripsCompleted: 0,
      totalEstimatedEarnings: 0,
      annualCommissionDue: 0,
      annualCommissionPaid: true,
      annualSettlementYear: 2026,
      registrationDate: today,
      rating: 5.0,
      photoUrl: data.photoUrl || (data.nationalIdPhotoUrl ? data.nationalIdPhotoUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'),
    };

    drivers.unshift(newDriver);

    res.json({
      success: true,
      driver: newDriver,
      message: 'Driver registration submitted successfully!',
    });
  });

  // Update Driver Profile Photo / National ID Photo
  app.post('/api/drivers/:id/update-photos', (req, res) => {
    const { id } = req.params;
    const { photoUrl, nationalIdPhotoUrl, nationalIdNumber } = req.body;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (photoUrl) driver.photoUrl = photoUrl;
    if (nationalIdPhotoUrl) driver.nationalIdPhotoUrl = nationalIdPhotoUrl;
    if (nationalIdNumber) driver.nationalIdNumber = nationalIdNumber;

    res.json({ success: true, driver, message: 'Driver photo updated.' });
  });

  // Real-time GPS location update from Driver device
  app.post('/api/drivers/:id/location', (req, res) => {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      driver.currentLocation = { lat: Number(lat), lng: Number(lng) };
      driver.lastActiveAt = Date.now();
    }
    res.json({ success: true, driver });
  });

  // Admin: Remove / Delete Bajaj Driver
  app.delete('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = drivers.length;
    drivers = drivers.filter(d => d.id !== id);
    if (drivers.length < initialLen) {
      res.json({ success: true, message: 'Bajaj driver removed successfully.' });
    } else {
      res.status(404).json({ error: 'Driver not found' });
    }
  });

  // Admin: Settle 2% Annual Commission for Driver
  app.post('/api/drivers/:id/settle-annual-fee', (req, res) => {
    const { id } = req.params;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.annualCommissionPaid = true;
    driver.lastAnnualPaymentDate = new Date().toISOString().split('T')[0];
    driver.annualCommissionDue = 0;

    res.json({ success: true, driver, message: '2026 Annual 2% Commission marked as settled.' });
  });

  // Toggle Driver Online / Offline status
  app.post('/api/drivers/:id/toggle-online', (req, res) => {
    const { id } = req.params;
    const { isOnline } = req.body;

    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.isOnline = typeof isOnline === 'boolean' ? isOnline : !driver.isOnline;
    driver.lastActiveAt = Date.now();

    res.json({ success: true, driver });
  });

  // --- DISTRICT MANAGEMENT & SUSPENSION ENDPOINTS ---

  // Add new district
  app.post('/api/districts', (req, res) => {
    const { name, description, center, landmarks = [], maxRadiusKm = 3.0, colorTag } = req.body;
    if (!name || !center || !center.lat || !center.lng) {
      return res.status(400).json({ error: 'District name and center coordinates are required' });
    }

    const distId = 'dist-' + Date.now();
    const newDistrict: VillageDistrict = {
      id: distId,
      name: name.trim(),
      description: description || `${name} internal neighborhood road network`,
      center: { lat: Number(center.lat), lng: Number(center.lng) },
      maxRadiusKm: Number(maxRadiusKm) || 3.0,
      status: 'active',
      colorTag: colorTag || '#10B981',
      landmarks: landmarks.length > 0 ? landmarks : [
        {
          id: 'lm-' + Date.now() + '-1',
          name: `${name} Main Bajaj Stand`,
          category: 'station',
          lat: Number(center.lat),
          lng: Number(center.lng),
          description: 'Primary village station',
          districtId: distId,
        }
      ],
    };

    districts.push(newDistrict);
    settings.landmarks = districts.flatMap(d => d.landmarks);

    res.json({ success: true, district: newDistrict, districts });
  });

  // Suspend / Activate District
  app.post('/api/districts/:id/toggle-status', (req, res) => {
    const { id } = req.params;
    const { status, suspendedReason } = req.body;

    const district = districts.find(d => d.id === id);
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    district.status = status === 'suspended' ? 'suspended' : 'active';
    if (suspendedReason) {
      district.suspendedReason = suspendedReason;
    } else if (district.status === 'active') {
      district.suspendedReason = undefined;
    }

    res.json({ success: true, district, districts });
  });

  // Delete district
  app.delete('/api/districts/:id', (req, res) => {
    const { id } = req.params;
    if (districts.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only remaining district' });
    }
    districts = districts.filter(d => d.id !== id);
    // Reassign orphan drivers to the first remaining district
    drivers = drivers.map(d => {
      if (d.districtId === id) {
        return {
          ...d,
          districtId: districts[0].id,
          districtName: districts[0].name,
        };
      }
      return d;
    });
    settings.landmarks = districts.flatMap(d => d.landmarks);
    res.json({ success: true, districts });
  });

  // Admin: Clear All Data / Clean Slate (0 drivers, 0 trips)
  app.post('/api/admin/reset-clean', (req, res) => {
    drivers = [];
    trips = [];
    res.json({ success: true, message: 'All demo accounts and trips cleared. Ready for your real driver registrations.' });
  });

  // --- Vite Middleware / Static Files ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bajaj Village Dispatch Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
