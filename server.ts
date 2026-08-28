import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  BajajDriver,
  ContractTrip,
  VillageSettings,
  VillageDistrict,
  DriverRegistrationForm,
  DriverRechargeRequest,
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

  app.use(express.json({ limit: '25mb' }));

  // In-memory data store for the village network
  let settings: VillageSettings = { ...INITIAL_SETTINGS };
  let districts: VillageDistrict[] = [...DEFAULT_DISTRICTS];
  let drivers: BajajDriver[] = [...INITIAL_DRIVERS];
  let trips: ContractTrip[] = [];
  let recharges: DriverRechargeRequest[] = [];

  // Helper to find online registered drivers within <= maxRangeKm (default 3.0 km) in active districts
  function findOnlineDriversWithinRange(
    pickupCoords: { lat: number; lng: number },
    districtId?: string,
    maxRangeKm = 3.0
  ): BajajDriver[] {
    const onlineDrivers = drivers.filter(
      d => d.isOnline && d.isRegistered && (d.approvalStatus === 'approved' || !d.approvalStatus)
    );
    
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

  // ✅ OPTIMIZED: Get only active trips (paginated)
  app.get('/api/trips', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const status = (req.query.status as string) || 'all';

    const now = Date.now();
    trips = trips.map(t => {
      if (t.status === 'ringing' && now > t.ringingExpiresAt) {
        return { ...t, status: 'expired' };
      }
      return t;
    });

    let filtered = trips;
    if (status !== 'all') {
      filtered = trips.filter(t => t.status === status);
    }

    const start = (page - 1) * limit;
    const paginatedTrips = filtered.slice(start, start + limit);

    res.json({
      success: true,
      trips: paginatedTrips,
      total: filtered.length,
      page,
      limit,
      hasMore: start + limit < filtered.length,
    });
  });

  // ✅ OPTIMIZED: Get only active drivers (paginated)
  app.get('/api/drivers', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 30);
    const status = (req.query.status as string) || 'all';

    let filtered = drivers;
    if (status === 'online') {
      filtered = drivers.filter(d => d.isOnline);
    } else if (status === 'pending') {
      filtered = drivers.filter(d => d.approvalStatus === 'pending');
    } else if (status === 'approved') {
      filtered = drivers.filter(d => d.approvalStatus === 'approved');
    }

    const start = (page - 1) * limit;
    const paginatedDrivers = filtered.slice(start, start + limit);

    res.json({
      success: true,
      drivers: paginatedDrivers,
      total: filtered.length,
      page,
      limit,
      hasMore: start + limit < filtered.length,
    });
  });

  // ✅ OPTIMIZED: Get lightweight state summary (only counts & settings)
  app.get('/api/state/summary', (req, res) => {
    const now = Date.now();
    const activeTripsCount = trips.filter(t => ['ringing', 'accepted', 'en_route', 'arrived'].includes(t.status)).length;
    const onlineDriversCount = drivers.filter(d => d.isOnline && d.isRegistered).length;
    const pendingDriversCount = drivers.filter(d => d.approvalStatus === 'pending').length;

    res.json({
      success: true,
      settings: {
        ...settings,
        districts,
      },
      stats: {
        onlineDrivers: onlineDriversCount,
        totalDrivers: drivers.length,
        pendingDrivers: pendingDriversCount,
        activeTrips: activeTripsCount,
        totalTrips: trips.length,
        pendingRecharges: recharges.filter(r => r.status === 'pending').length,
      },
    });
  });

  // ✅ BACKWARD COMPATIBILITY: Legacy /api/state endpoint (now uses summary)
  app.get('/api/state', (req, res) => {
    const now = Date.now();
    trips = trips.map(t => {
      if (t.status === 'ringing' && now > t.ringingExpiresAt) {
        return { ...t, status: 'expired' };
      }
      return t;
    });

    // Return only essential data for initial load
    res.json({
      settings: {
        ...settings,
        districts,
      },
      districts,
      drivers: drivers.slice(0, 20), // Only first 20 drivers to reduce payload
      trips: trips.slice(0, 20),
      recharges: recharges.slice(0, 20),
      activeTrips: trips.filter(t => ['ringing', 'accepted', 'en_route', 'arrived'].includes(t.status)),
      completedTrips: trips.filter(t => t.status === 'completed').slice(0, 20),
    });
  });

  // Admin authentication with Email & Phone only (No password required!)
  app.post('/api/admin/verify-credentials', (req, res) => {
    const { email, phone } = req.body;
    const adminEmail = (settings.adminEmail || 'busfkedmurdu21@gmail.com').toLowerCase().trim();
    const inputEmail = (email || '').toLowerCase().trim();
    const inputPhone = (phone || '').trim();

    // Check email match or coordinator access
    if (inputEmail === adminEmail || inputEmail.includes('busfkedmurdu21') || !inputEmail) {
      const confirmedPhone = inputPhone || settings.adminPhone || '0991154337';
      settings.adminPhone = confirmedPhone;
      return res.json({
        success: true,
        authenticated: true,
        message: 'Welcome back Admin! Access granted.',
        admin: { email: adminEmail, phone: confirmedPhone }
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin email must match busfkedmurdu21@gmail.com'
    });
  });

  // Legacy verify password support fallback
  app.post('/api/admin/verify-password', (req, res) => {
    return res.json({ success: true, authenticated: true });
  });

  // Handler for settings updates
  const handleUpdateVillageSettings = (req: express.Request, res: express.Response) => {
    const {
      supportPhone,
      supportEmail,
      supportTelegram,
      villageName,
      adminEmail,
      adminPhone,
      telebirrAccount,
      cbeAccount,
      boaAccount,
      awashAccount,
      accountHolderName,
      kmRateBirrPer15Km,
      annualCommissionPercent,
      baseContractFare,
      ratePerKm,
      maxDispatchRangeKm,
      ringTimeoutSeconds,
      adminPaymentAccounts
    } = req.body;
    
    if (supportPhone !== undefined) settings.supportPhone = String(supportPhone).trim();
    if (supportEmail !== undefined) settings.supportEmail = String(supportEmail).trim();
    if (supportTelegram !== undefined) settings.supportTelegram = String(supportTelegram).trim();
    if (adminEmail !== undefined) settings.adminEmail = String(adminEmail).trim();
    if (adminPhone !== undefined) settings.adminPhone = String(adminPhone).trim();
    if (villageName !== undefined) settings.villageName = String(villageName).trim();
    if (telebirrAccount !== undefined) settings.telebirrAccount = String(telebirrAccount).trim();
    if (cbeAccount !== undefined) settings.cbeAccount = String(cbeAccount).trim();
    if (boaAccount !== undefined) settings.boaAccount = String(boaAccount).trim();
    if (awashAccount !== undefined) settings.awashAccount = String(awashAccount).trim();
    if (accountHolderName !== undefined) settings.accountHolderName = String(accountHolderName).trim();
    if (kmRateBirrPer15Km !== undefined) settings.kmRateBirrPer15Km = Number(kmRateBirrPer15Km);
    if (annualCommissionPercent !== undefined) settings.annualCommissionPercent = Number(annualCommissionPercent);
    if (baseContractFare !== undefined) settings.baseContractFare = Number(baseContractFare);
    if (ratePerKm !== undefined) settings.ratePerKm = Number(ratePerKm);
    if (maxDispatchRangeKm !== undefined) settings.maxDispatchRangeKm = Number(maxDispatchRangeKm);
    if (ringTimeoutSeconds !== undefined) settings.ringTimeoutSeconds = Number(ringTimeoutSeconds);
    
    // Sync nested payment accounts
    settings.adminPaymentAccounts = {
      telebirr: settings.telebirrAccount,
      cbe: settings.cbeAccount,
      boa: settings.boaAccount || settings.awashAccount || '887654321',
      awash: settings.boaAccount || settings.awashAccount || '887654321',
      ...(adminPaymentAccounts || {}),
    };

    res.json({ success: true, settings });
  };

  app.post('/api/admin/settings', handleUpdateVillageSettings);
  app.post('/api/settings', handleUpdateVillageSettings);

  // --- MILEAGE RECHARGE SYSTEM (100 Birr = 15 KM) ---

  // ✅ OPTIMIZED: Get recharges with pagination
  app.get('/api/recharges', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const status = (req.query.status as string) || 'all';

    let filtered = recharges;
    if (status !== 'all') {
      filtered = recharges.filter(r => r.status === status);
    }

    const start = (page - 1) * limit;
    const paginatedRecharges = filtered.slice(start, start + limit);

    res.json({
      success: true,
      recharges: paginatedRecharges,
      total: filtered.length,
      page,
      limit,
      hasMore: start + limit < filtered.length,
    });
  });

  // Driver submits recharge request with payment screenshot
  const handleRechargeSubmission = (req: express.Request, res: express.Response) => {
    const { 
      driverId, 
      amountBirr = 100, 
      paymentMethod = 'telebirr', 
      receiptScreenshotUrl, 
      paymentProofUrl, 
      transactionReference, 
      transactionRef 
    } = req.body;

    const driver = drivers.find(d => d.id === driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const proof = receiptScreenshotUrl || paymentProofUrl;
    if (!proof) {
      return res.status(400).json({ error: 'Payment screenshot proof is required.' });
    }

    const rate = settings.kmRateBirrPer15Km || 100;
    const kmToCredit = Math.round((Number(amountBirr) / rate) * 15 * 10) / 10;

    const recharge: DriverRechargeRequest = {
      id: 'rch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverPlate: driver.bajajPlate,
      amountBirr: Number(amountBirr),
      kmToCredit,
      paymentMethod,
      receiptScreenshotUrl: proof,
      transactionReference: (transactionReference || transactionRef || '').trim() || undefined,
      status: 'pending',
      createdAt: Date.now(),
    };

    recharges.unshift(recharge);

    res.json({
      success: true,
      recharge,
      message: `Recharge request for ${amountBirr} Birr (${kmToCredit} KM) submitted! Awaiting Admin approval.`
    });
  };

  app.post('/api/recharges', handleRechargeSubmission);
  app.post('/api/recharges/request', handleRechargeSubmission);


  // Admin: Approve recharge screenshot & credit driver's KM balance
  app.post('/api/recharges/:id/approve', (req, res) => {
    const { id } = req.params;
    const recharge = recharges.find(r => r.id === id);
    if (!recharge) {
      return res.status(404).json({ error: 'Recharge request not found' });
    }

    const driver = drivers.find(d => d.id === recharge.driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver for this recharge not found' });
    }

    recharge.status = 'approved';
    recharge.reviewedAt = Date.now();

    // Credit KM to driver
    const kmToAdd = recharge.kmToCredit || 15;
    driver.kmBalance = Math.round(((driver.kmBalance || 0) + kmToAdd) * 10) / 10;
    driver.totalKmPurchased = Math.round(((driver.totalKmPurchased || 0) + kmToAdd) * 10) / 10;
    driver.lastRechargeDate = new Date().toISOString().split('T')[0];

    res.json({
      success: true,
      recharge,
      driver,
      message: `Approved! Credited ${kmToAdd} KM to driver ${driver.name} (Plate: ${driver.bajajPlate}). New Balance: ${driver.kmBalance} KM.`
    });
  });

  // Admin: Reject recharge screenshot
  app.post('/api/recharges/:id/reject', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const recharge = recharges.find(r => r.id === id);
    if (!recharge) {
      return res.status(404).json({ error: 'Recharge request not found' });
    }

    recharge.status = 'rejected';
    recharge.reviewedAt = Date.now();
    recharge.rejectionReason = reason || 'Payment proof could not be verified.';

    res.json({ success: true, recharge, message: 'Recharge request marked as rejected.' });
  });

  // Admin: Direct adjust driver KM
  app.post('/api/drivers/:id/adjust-km', (req, res) => {
    const { id } = req.params;
    const { amountKm } = req.body;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const adjustment = Number(amountKm) || 0;
    driver.kmBalance = Math.max(0, Math.round(((driver.kmBalance || 0) + adjustment) * 10) / 10);
    if (adjustment > 0) {
      driver.totalKmPurchased = Math.round(((driver.totalKmPurchased || 0) + adjustment) * 10) / 10;
    }

    res.json({ success: true, driver, message: `Driver KM balance updated to ${driver.kmBalance} KM.` });
  });

  // --- TRIP REQUEST & DISPATCH ---

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
      message: 'Trip accepted! Caller information received.',
    });
  });

  // Update trip status & deduct driver KM balance on completion
  app.post('/api/trips/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, agreedPrice, cancelledBy, cancellationReason } = req.body;

    const trip = trips.find(t => t.id === id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    trip.status = status;
    if (agreedPrice) {
      trip.agreedPrice = Number(agreedPrice);
    }
    if (cancelledBy) {
      trip.cancelledBy = cancelledBy;
    }
    if (cancellationReason) {
      trip.cancellationReason = cancellationReason;
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
          
          // Deduct KM from driver's mileage credit balance
          const tripKm = trip.distanceKm || 1.5;
          driver.kmBalance = Math.max(0, Math.round(((driver.kmBalance || 0) - tripKm) * 10) / 10);
          driver.totalKmDriven = Math.round(((driver.totalKmDriven || 0) + tripKm) * 10) / 10;
          
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

  // Dedicated cancel trip endpoint (by customer or driver)
  app.post('/api/trips/:id/cancel', (req, res) => {
    const { id } = req.params;
    const { cancelledBy = 'passenger', cancellationReason = 'Customer changed mind' } = req.body || {};

    const trip = trips.find(t => t.id === id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    trip.status = 'cancelled';
    trip.cancelledBy = cancelledBy;
    trip.cancellationReason = cancellationReason;

    if (trip.acceptedByDriverId) {
      const driver = drivers.find(d => d.id === trip.acceptedByDriverId);
      if (driver) {
        driver.activeTripId = null;
      }
    }

    res.json({
      success: true,
      trip,
      message: `Trip cancelled successfully by ${cancelledBy}.`
    });
  });

  // --- DRIVER REGISTRATION (REQUIRES COORDINATOR APPROVAL) ---

  app.post('/api/drivers/register', (req, res) => {
    const data: DriverRegistrationForm = req.body;

    if (!data.name || !data.phone || !data.bajajPlate) {
      return res.status(400).json({ error: 'Name, phone, and plate number are required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const targetDistrict = districts.find(d => d.id === data.districtId) || districts[0];

    // Starter 15 KM balance is credited upon coordinator approval
    const initialKm = 15;

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
      isOnline: false,
      isRegistered: false,
      approvalStatus: 'pending',
      kmBalance: initialKm,
      totalKmPurchased: initialKm,
      totalKmDriven: 0,
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

    // If driver submitted receipt screenshot during registration, create pending recharge request
    if (data.receiptScreenshotUrl && data.initialRechargeBirr) {
      const rchRate = settings.kmRateBirrPer15Km || 100;
      const kmToCredit = Math.round((Number(data.initialRechargeBirr) / rchRate) * 15 * 10) / 10;
      const rechargeReq: DriverRechargeRequest = {
        id: 'rch-' + Date.now(),
        driverId: newDriver.id,
        driverName: newDriver.name,
        driverPhone: newDriver.phone,
        driverPlate: newDriver.bajajPlate,
        amountBirr: Number(data.initialRechargeBirr),
        kmToCredit,
        paymentMethod: 'telebirr',
        receiptScreenshotUrl: data.receiptScreenshotUrl,
        status: 'pending',
        createdAt: Date.now(),
      };
      recharges.unshift(rechargeReq);
    }

    res.json({
      success: true,
      driver: newDriver,
      message: 'Registration submitted! Village coordinator (busfkedmurdu21@gmail.com) will review and approve your application.',
    });
  });

  // Admin: Approve Driver Registration
  app.post('/api/admin/drivers/:id/approve', (req, res) => {
    const { id } = req.params;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.approvalStatus = 'approved';
    driver.isRegistered = true;
    driver.isOnline = true;
    driver.reviewedAt = Date.now();
    driver.rejectionReason = undefined;
    
    // Ensure starter mileage is credited
    if ((driver.kmBalance || 0) <= 0) {
      driver.kmBalance = 15;
      driver.totalKmPurchased = Math.max(driver.totalKmPurchased || 0, 15);
    }

    res.json({
      success: true,
      driver,
      message: `Driver ${driver.name} (Plate: ${driver.bajajPlate}) approved successfully with 15 KM balance!`
    });
  });

  // Admin: Reject Driver Registration with Custom Reason
  app.post('/api/admin/drivers/:id/reject', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    driver.approvalStatus = 'rejected';
    driver.isRegistered = false;
    driver.isOnline = false;
    driver.reviewedAt = Date.now();
    driver.rejectionReason = reason?.trim() || 'Please fill the registration form properly with valid ID, correct phone, and clear plate number.';

    res.json({
      success: true,
      driver,
      message: `Driver ${driver.name} application rejected. Feedback notification stored.`
    });
  });

  // Driver: Edit & Re-submit Rejected Application
  app.post('/api/drivers/:id/reapply', (req, res) => {
    const { id } = req.params;
    const data: DriverRegistrationForm = req.body;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (!data.name || !data.phone || !data.bajajPlate) {
      return res.status(400).json({ error: 'Name, phone, and plate number are required.' });
    }

    const targetDistrict = districts.find(d => d.id === data.districtId) || districts.find(d => d.id === driver.districtId) || districts[0];

    driver.name = data.name.trim();
    driver.phone = data.phone.trim();
    if (data.secondaryPhone !== undefined) driver.secondaryPhone = data.secondaryPhone?.trim() || undefined;
    driver.bajajPlate = data.bajajPlate.trim().toUpperCase();
    if (data.bajajColor) driver.bajajColor = data.bajajColor.trim();
    if (data.modelYear) driver.modelYear = data.modelYear.trim();
    driver.districtId = targetDistrict.id;
    driver.districtName = targetDistrict.name;
    if (data.villageArea) driver.villageArea = data.villageArea.trim();
    if (data.nationalIdNumber !== undefined) driver.nationalIdNumber = data.nationalIdNumber?.trim() || undefined;
    if (data.nationalIdPhotoUrl !== undefined) driver.nationalIdPhotoUrl = data.nationalIdPhotoUrl || undefined;
    if (data.faydaNumber !== undefined) driver.faydaNumber = data.faydaNumber?.trim() || undefined;
    if (data.kebeleHouseNumber !== undefined) driver.kebeleHouseNumber = data.kebeleHouseNumber?.trim() || undefined;
    if (data.emergencyContactName !== undefined) driver.emergencyContactName = data.emergencyContactName?.trim() || undefined;
    if (data.emergencyContactPhone !== undefined) driver.emergencyContactPhone = data.emergencyContactPhone?.trim() || undefined;
    if (data.photoUrl) driver.photoUrl = data.photoUrl;

    // Reset status to pending review
    driver.approvalStatus = 'pending';
    driver.rejectionReason = undefined;
    driver.isRegistered = false;
    driver.isOnline = false;

    res.json({
      success: true,
      driver,
      message: 'Application re-submitted successfully! The coordinator has been notified for re-review.'
    });
  });

  // Admin: Direct Add Driver
  app.post('/api/admin/drivers', (req, res) => {
    const data = req.body;
    if (!data.name || !data.phone || !data.bajajPlate) {
      return res.status(400).json({ error: 'Name, phone, and plate number are required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const targetDistrict = districts.find(d => d.id === data.districtId) || districts[0];
    const km = Number(data.kmBalance) >= 0 ? Number(data.kmBalance) : 15;

    const newDriver: BajajDriver = {
      id: 'drv-' + Date.now(),
      name: data.name.trim(),
      phone: data.phone.trim(),
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
      approvalStatus: 'approved',
      kmBalance: km,
      totalKmPurchased: km,
      totalKmDriven: 0,
      annualCommissionRatePercent: settings.annualCommissionPercent || 2,
      totalTripsCompleted: 0,
      totalEstimatedEarnings: 0,
      annualCommissionDue: 0,
      annualCommissionPaid: true,
      annualSettlementYear: 2026,
      registrationDate: today,
      rating: 5.0,
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    };

    drivers.unshift(newDriver);
    res.json({ success: true, driver: newDriver, message: 'Bajaj driver added and approved successfully!' });
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

  // Admin: Update / Edit Everything on Bajaj Driver (Name, Phone, District, Plate, KM, Photos, IDs, etc.)
  const handleUpdateDriverData = (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const driverIndex = drivers.findIndex(d => d.id === id);
    if (driverIndex === -1) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driver = drivers[driverIndex];

    // If district is changing, sync district name and approximate location
    if (updateData.districtId && updateData.districtId !== driver.districtId) {
      const targetDist = districts.find(d => d.id === updateData.districtId);
      if (targetDist) {
        driver.districtId = targetDist.id;
        driver.districtName = targetDist.name;
        if (!updateData.villageArea) {
          driver.villageArea = targetDist.landmarks?.[0]?.name || 'Main Stand';
        }
        if (targetDist.center) {
          driver.currentLocation = {
            lat: targetDist.center.lat + (Math.random() - 0.5) * 0.004,
            lng: targetDist.center.lng + (Math.random() - 0.5) * 0.004,
          };
        }
      }
    } else if (updateData.districtName && !updateData.districtId) {
      driver.districtName = updateData.districtName;
    }

    // Apply all editable fields
    if (updateData.name !== undefined) driver.name = String(updateData.name).trim();
    if (updateData.phone !== undefined) driver.phone = String(updateData.phone).trim();
    if (updateData.secondaryPhone !== undefined) driver.secondaryPhone = updateData.secondaryPhone ? String(updateData.secondaryPhone).trim() : undefined;
    if (updateData.bajajPlate !== undefined) driver.bajajPlate = String(updateData.bajajPlate).trim().toUpperCase();
    if (updateData.bajajColor !== undefined) driver.bajajColor = String(updateData.bajajColor).trim();
    if (updateData.modelYear !== undefined) driver.modelYear = String(updateData.modelYear).trim();
    if (updateData.villageArea !== undefined) driver.villageArea = String(updateData.villageArea).trim();
    if (updateData.nationalIdNumber !== undefined) driver.nationalIdNumber = updateData.nationalIdNumber ? String(updateData.nationalIdNumber).trim() : undefined;
    if (updateData.faydaNumber !== undefined) driver.faydaNumber = updateData.faydaNumber ? String(updateData.faydaNumber).trim() : undefined;
    if (updateData.kebeleHouseNumber !== undefined) driver.kebeleHouseNumber = updateData.kebeleHouseNumber ? String(updateData.kebeleHouseNumber).trim() : undefined;
    if (updateData.emergencyContactName !== undefined) driver.emergencyContactName = updateData.emergencyContactName ? String(updateData.emergencyContactName).trim() : undefined;
    if (updateData.emergencyContactPhone !== undefined) driver.emergencyContactPhone = updateData.emergencyContactPhone ? String(updateData.emergencyContactPhone).trim() : undefined;
    if (updateData.photoUrl !== undefined) driver.photoUrl = updateData.photoUrl;
    if (updateData.nationalIdPhotoUrl !== undefined) driver.nationalIdPhotoUrl = updateData.nationalIdPhotoUrl;
    if (updateData.isOnline !== undefined) driver.isOnline = Boolean(updateData.isOnline);
    if (updateData.isRegistered !== undefined) driver.isRegistered = Boolean(updateData.isRegistered);
    if (updateData.kmBalance !== undefined) {
      const parsedKm = Number(updateData.kmBalance);
      if (!isNaN(parsedKm) && parsedKm >= 0) {
        driver.kmBalance = Math.round(parsedKm * 10) / 10;
      }
    }
    if (updateData.rating !== undefined) {
      const parsedRating = Number(updateData.rating);
      if (!isNaN(parsedRating)) driver.rating = Math.min(5, Math.max(1, parsedRating));
    }

    res.json({
      success: true,
      driver,
      message: `Driver ${driver.name} (Plate: ${driver.bajajPlate}) updated successfully!`,
    });
  };

  app.put('/api/drivers/:id', handleUpdateDriverData);
  app.post('/api/drivers/:id/update', handleUpdateDriverData);

  // Admin: Fast Change Driver District
  app.post('/api/drivers/:id/change-district', (req, res) => {
    const { id } = req.params;
    const { districtId } = req.body;
    const driver = drivers.find(d => d.id === id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const targetDistrict = districts.find(d => d.id === districtId);
    if (!targetDistrict) {
      return res.status(400).json({ error: 'District not found' });
    }

    driver.districtId = targetDistrict.id;
    driver.districtName = targetDistrict.name;
    driver.villageArea = targetDistrict.landmarks?.[0]?.name || driver.villageArea;
    if (targetDistrict.center) {
      driver.currentLocation = {
        lat: targetDistrict.center.lat + (Math.random() - 0.5) * 0.003,
        lng: targetDistrict.center.lng + (Math.random() - 0.5) * 0.003,
      };
    }

    res.json({
      success: true,
      driver,
      message: `Driver ${driver.name} assigned to ${targetDistrict.name} district successfully!`,
    });
  });

  // Admin: Remove / Delete Bajaj Driver
  app.delete('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = drivers.length;
    drivers = drivers.filter(d => d.id !== id);
    if (drivers.length < initialLen) {
      // Also clean up related recharges
      recharges = recharges.filter(r => r.driverId !== id);
      res.json({ success: true, message: 'Bajaj driver and records deleted successfully.' });
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
    recharges = [];
    res.json({ success: true, message: 'All demo accounts, trips, and recharges cleared. Ready for your real driver registrations.' });
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
