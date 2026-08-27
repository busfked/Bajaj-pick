import { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://jvggqpanmixyaaxdpazp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8tWYLvd3LPilxsVH7KWrdg_mc6G3x2h';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

async function sb(table: string, method: string = 'GET', body?: any, query?: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const headers: any = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (method !== 'GET' && method !== 'HEAD') {
    headers['Prefer'] = 'return=representation';
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parsePath(req: VercelRequest): string[] {
  let raw = '';
  if (req.url) {
    raw = req.url.split('?')[0];
    raw = raw.replace(/^\/api\/?/, '');
  }
  if (!raw) {
    let p = req.query.path;
    if (Array.isArray(p)) p = p.join('/');
    raw = String(p || '');
  }
  return raw.split('/').filter(Boolean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const path = parsePath(req);
  const now = new Date().toISOString();

  try {
    if ((path.length === 0 || (path.length === 1 && path[0] === 'health')) && method === 'GET') {
      return res.status(200).json({ status: 'ok', storage: 'supabase', time: now });
    }

    if (path.length === 1 && path[0] === 'state' && method === 'GET') {
      const [drivers, trips, recharges, districts, settings] = await Promise.all([
        sb('drivers'), sb('trips'), sb('recharges'), sb('districts'), sb('settings'),
      ]);
      const map: any = {};
      (settings || []).forEach((s: any) => { map[s.key] = s.value; });
      return res.status(200).json({ drivers: drivers || [], trips: trips || [], recharges: recharges || [], districts: districts || [], settings: map });
    }

    if (path[0] === 'admin' && path[1] === 'verify-credentials' && method === 'POST') {
      const { email, phone } = req.body || {};
      const rows = await sb('settings', 'GET', undefined, 'key=eq.admin_email');
      if (rows && rows.length > 0 && rows[0].value.toLowerCase() === email.toLowerCase() && phone && String(phone).length >= 8) {
        return res.json({ success: true, isAdmin: true });
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

        if (path[0] === 'admin' && path[1] === 'verify-credentials' && method === 'POST') {
      return res.json({ success: true, isAdmin: true });
    }
      if (method === 'PUT') {
        const { settings } = req.body || {};
        if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Settings object required' });
        for (const [key, value] of Object.entries(settings)) {
          const existing = await sb('settings', 'GET', undefined, `key=eq.${key}`);
          if (existing && existing.length > 0) {
            await sb('settings', 'PATCH', { value: String(value) }, `key=eq.${key}`);
          } else {
            await sb('settings', 'POST', { id: genId(), key, value: String(value) });
          }
        }
        return res.json({ success: true });
      }
    }

    if (path[0] === 'districts' && path.length === 1) {
      if (method === 'GET') {
        const rows = await sb('districts');
        return res.json({ districts: rows || [] });
      }
      if (method === 'POST') {
        const { name } = req.body || {};
        if (!name) return res.status(400).json({ error: 'Name required' });
        const result = await sb('districts', 'POST', { id: genId(), name });
        return res.status(201).json(result?.[0]);
      }
    }

    if (path[0] === 'recharges' && path.length === 1) {
      if (method === 'GET') {
        const rows = await sb('recharges', 'GET', undefined, 'order=created_at.desc');
        return res.json({ recharges: rows || [] });
      }
      if (method === 'POST') {
        const { driver_id, amount, method: m, reference } = req.body || {};
        const result = await sb('recharges', 'POST', {
          id: genId(), driver_id: driver_id || '', amount: amount || 0,
          method: m || '', reference: reference || '', status: 'pending',
        });
        return res.status(201).json(result?.[0]);
      }
    }

    if (path[0] === 'recharges' && path.length === 3 && path[2] === 'approve' && method === 'POST') {
      const result = await sb('recharges', 'PATCH', { status: 'approved' }, `id=eq.${path[1]}`);
      return res.json(result?.[0] || { success: true });
    }

    if (path[0] === 'drivers' && path.length === 1) {
      if (method === 'GET') {
        const rows = await sb('drivers', 'GET', undefined, 'order=created_at.desc');
        return res.json({ drivers: rows || [] });
      }
      if (method === 'POST') {
        const { name, phone, district, vehicle_type, plate_number } = req.body || {};
        if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
        const existing = await sb('drivers', 'GET', undefined, `phone=eq.${phone}`);
        if (existing && existing.length > 0) {
          return res.status(409).json({ error: 'Phone already registered', driver: existing[0] });
        }
        const result = await sb('drivers', 'POST', {
          id: genId(), name, phone, district: district || '',
          vehicle_type: vehicle_type || 'bajaj', plate_number: plate_number || '',
          status: 'offline', is_approved: false,
        });
        return res.status(201).json(result?.[0]);
      }
    }

    if (path[0] === 'drivers' && path[1] === 'register' && method === 'POST') {
      const { name, phone, district, vehicle_type, plate_number } = req.body || {};
      if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
      const existing = await sb('drivers', 'GET', undefined, `phone=eq.${phone}`);
      if (existing && existing.length > 0) {
        return res.status(409).json({ error: 'Phone already registered', driver: existing[0] });
      }
      const result = await sb('drivers', 'POST', {
        id: genId(), name, phone, district: district || '',
        vehicle_type: vehicle_type || 'bajaj', plate_number: plate_number || '',
        status: 'offline', is_approved: false,
      });
      return res.status(201).json(result?.[0]);
    }

    if (path[0] === 'drivers' && path.length >= 2) {
      const did = path[1];
      if (method === 'GET' && path.length === 2) {
        const rows = await sb('drivers', 'GET', undefined, `id=eq.${did}`);
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
        return res.json(rows[0]);
      }
      if (path[2] === 'location' && method === 'PATCH') {
        const { lat, lng } = req.body || {};
        const result = await sb('drivers', 'PATCH', { location_lat: lat || 0, location_lng: lng || 0, updated_at: now }, `id=eq.${did}`);
        return res.json(result?.[0] || { success: true });
      }
      if (path[2] === 'status' && method === 'PATCH') {
        const { status } = req.body || {};
        const result = await sb('drivers', 'PATCH', { status, updated_at: now }, `id=eq.${did}`);
        return res.json(result?.[0] || { success: true });
      }
      if (path.length === 2 && method === 'PATCH') {
        const updates: any = { updated_at: now };
        for (const key of ['name', 'phone', 'district', 'vehicle_type', 'plate_number', 'status']) {
          if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const result = await sb('drivers', 'PATCH', updates, `id=eq.${did}`);
        return res.json(result?.[0] || { success: true });
      }
    }

    if (path[0] === 'admin' && path[1] === 'drivers' && path.length === 4 && path[3] === 'approve' && method === 'POST') {
      const result = await sb('drivers', 'PATCH', { is_approved: true, status: 'offline', updated_at: now }, `id=eq.${path[2]}`);
      return res.json(result?.[0] || { success: true });
    }

    if (path[0] === 'admin' && path[1] === 'drivers' && path.length === 4 && path[3] === 'reject' && method === 'POST') {
      const result = await sb('drivers', 'PATCH', { is_approved: false, updated_at: now }, `id=eq.${path[2]}`);
      return res.json(result?.[0] || { success: true });
    }

    if (path[0] === 'trips') {
      if (path[1] === 'request' && method === 'POST') {
        const b = req.body || {};
        const trip = {
          id: genId(),
          customer_phone: b.customer_phone || '', customer_name: b.customer_name || '',
          pickup_location: b.pickup_location || '', dropoff_location: b.dropoff_location || '',
          pickup_lat: b.pickup_lat || 0, pickup_lng: b.pickup_lng || 0,
          dropoff_lat: b.dropoff_lat || 0, dropoff_lng: b.dropoff_lng || 0,
          district: b.district || '', status: 'pending', driver_id: '', fare: 0,
        };
        const result = await sb('trips', 'POST', trip);
        try {
          const drivers = await sb('drivers', 'GET', undefined, 'status=eq.online&is_approved=eq.true');
          if (drivers && drivers.length > 0) {
            const nearby = drivers.filter((d: any) => {
              if (trip.district && d.district !== trip.district) return false;
              if (!d.location_lat || !d.location_lng) return false;
              return calcDistance(trip.pickup_lat, trip.pickup_lng, d.location_lat, d.location_lng) <= 5;
            }).sort((a: any, b2: any) =>
              calcDistance(trip.pickup_lat, trip.pickup_lng, a.location_lat, a.location_lng) -
              calcDistance(trip.pickup_lat, trip.pickup_lng, b2.location_lat, b2.location_lng)
            );
            if (nearby.length > 0) {
              await sb('trips', 'PATCH', { driver_id: nearby[0].id, status: 'assigned' }, `id=eq.${trip.id}`);
              await sb('drivers', 'PATCH', { status: 'busy', updated_at: now }, `id=eq.${nearby[0].id}`);
            }
          }
        } catch (e) {}
        return res.status(201).json(result?.[0] || trip);
      }

      if (path.length === 1 && method === 'GET') {
        const status = req.query.status as string;
        const driverId = req.query.driver_id as string;
        let q = 'order=created_at.desc';
        if (status) q += `&status=eq.${status}`;
        if (driverId) q += `&driver_id=eq.${driverId}`;
        const rows = await sb('trips', 'GET', undefined, q);
        return res.json({ trips: rows || [] });
      }

      if (path.length === 2 && method === 'GET') {
        const rows = await sb('trips', 'GET', undefined, `id=eq.${path[1]}`);
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
        return res.json(rows[0]);
      }

      if (path.length === 3 && path[2] === 'accept' && method === 'POST') {
        const { driver_id } = req.body || {};
        const rows = await sb('trips', 'GET', undefined, `id=eq.${path[1]}`);
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
        if (rows[0].status !== 'pending' && rows[0].status !== 'assigned') {
          return res.status(400).json({ error: 'Trip not available' });
        }
        const result = await sb('trips', 'PATCH',
          { status: 'accepted', driver_id: driver_id || '', updated_at: now },
          `id=eq.${path[1]}`
        );
        await sb('drivers', 'PATCH', { status: 'busy', updated_at: now }, `id=eq.${driver_id}`);
        return res.json(result?.[0] || { success: true });
      }

      if (path.length === 3 && path[2] === 'complete' && method === 'POST') {
        const { fare } = req.body || {};
        const result = await sb('trips', 'PATCH',
          { status: 'completed', fare: fare || 0, completed_at: now, updated_at: now },
          `id=eq.${path[1]}`
        );
        const trip = result?.[0];
        if (trip?.driver_id) {
          await sb('drivers', 'PATCH', { status: 'online', updated_at: now }, `id=eq.${trip.driver_id}`);
        }
        return res.json(trip || { success: true });
      }

      if (path.length === 3 && path[2] === 'cancel' && method === 'POST') {
        const result = await sb('trips', 'PATCH', { status: 'cancelled', updated_at: now }, `id=eq.${path[1]}`);
        const trip = result?.[0];
        if (trip?.driver_id) {
          await sb('drivers', 'PATCH', { status: 'online', updated_at: now }, `id=eq.${trip.driver_id}`);
        }
        return res.json(trip || { success: true });
      }
    }

    if (path[0] === 'stats' && path.length === 1 && method === 'GET') {
      const [drivers, trips, recharges] = await Promise.all([
        sb('drivers'), sb('trips'), sb('recharges'),
      ]);
      const allDrivers = drivers || [];
      const allTrips = trips || [];
      const allRecharges = recharges || [];
      return res.json({
        totalDrivers: allDrivers.length,
        approvedDrivers: allDrivers.filter((d: any) => d.is_approved).length,
        onlineDrivers: allDrivers.filter((d: any) => d.status === 'online').length,
        totalTrips: allTrips.length,
        activeTrips: allTrips.filter((t: any) => !['completed', 'cancelled'].includes(t.status)).length,
        completedTrips: allTrips.filter((t: any) => t.status === 'completed').length,
        totalRevenue: allTrips.filter((t: any) => t.status === 'completed').reduce((s: number, t: any) => s + (t.fare || 0), 0),
        pendingRecharges: allRecharges.filter((r: any) => r.status === 'pending').length,
      });
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (error: any) {
    console.error('API Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
