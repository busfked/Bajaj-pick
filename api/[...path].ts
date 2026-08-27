import { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://jvggqpanmixyaaxdpazp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8tWYLvd3LPilxsVH7KWrdg_mc6G3x2h';
const ADMIN_PASSWORD = '121921';

function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }

async function sbGet(key: string): Promise<any> {
  const url = `${SUPABASE_URL}/rest/v1/app_data?key=eq.${key}&select=value`;
  const res = await fetch(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) throw new Error(`SB GET ${key}: ${res.status}`);
  const rows = await res.json();
  return rows?.[0]?.value ?? (key === 'settings' ? {} : []);
}

async function sbSet(key: string, value: any): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/app_data`;
  const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
  const check = await fetch(`${url}?key=eq.${key}&select=key`, { headers: h });
  const exists = (await check.json())?.length > 0;
  if (exists) {
    await fetch(`${url}?key=eq.${key}`, { method: 'PATCH', headers: h, body: JSON.stringify({ value, updated_at: new Date().toISOString() }) });
  } else {
    await fetch(url, { method: 'POST', headers: h, body: JSON.stringify({ key, value }) });
  }
}

function parsePath(req: VercelRequest): string[] {
  let raw = '';
  if (req.url) { raw = req.url.split('?')[0].replace(/^\/api\/?/, ''); }
  if (!raw) { let p = req.query.path; if (Array.isArray(p)) p = p.join('/'); raw = String(p || ''); }
  return raw.split('/').filter(Boolean);
}

function calcDist(a: any, b: any): number {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return 999;
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const path = parsePath(req);
  const now = new Date().toISOString();

  try {
    if ((path.length === 0 || (path.length === 1 && path[0] === 'health')) && method === 'GET')
      return res.json({ status: 'ok', storage: 'supabase', time: now });

    if (path.length === 1 && path[0] === 'state' && method === 'GET') {
      const [drivers, trips, recharges, settings] = await Promise.all([sbGet('drivers'), sbGet('trips'), sbGet('recharges'), sbGet('settings')]);
      return res.json({ drivers: drivers||[], trips: trips||[], recharges: recharges||[], districts: [], settings: settings||{} });
    }

    if (path[0]==='admin' && path[1]==='verify-credentials' && method==='POST') {
      const { phone } = req.body || {};
      if (phone && String(phone).trim() === ADMIN_PASSWORD) return res.json({ authenticated: true });
      return res.status(401).json({ error: 'Access denied.' });
    }

    if (path[0]==='admin' && path[1]==='settings') {
      if (method==='GET') { return res.json({ settings: await sbGet('settings') }); }
      if (method==='PUT') { const { settings: s } = req.body||{}; const c = await sbGet('settings'); await sbSet('settings', {...c,...s}); return res.json({ success: true }); }
    }

    if (path[0]==='recharges' && path.length===1 && method==='GET') return res.json({ recharges: await sbGet('recharges') });

    if (path[0]==='recharges' && path.length===3 && path[2]==='approve' && method==='POST') {
      const r = await sbGet('recharges'); const i = r.findIndex((x:any)=>x.id===path[1]);
      if (i>=0) { r[i].status='approved'; const did=r[i].driverId; if(did){const d=await sbGet('drivers');const di=d.findIndex((x:any)=>x.id===did);if(di>=0){d[di].kmBalance=(d[di].kmBalance||0)+(r[i].amountKm||15);await sbSet('drivers',d);}} await sbSet('recharges',r); }
      return res.json({ success: true });
    }

    if (path[0]==='recharges' && path.length===3 && path[2]==='reject' && method==='POST') {
      const r = await sbGet('recharges'); const i = r.findIndex((x:any)=>x.id===path[1]);
      if (i>=0) { r[i].status='rejected'; await sbSet('recharges',r); }
      return res.json({ success: true });
    }

    if (path[0]==='drivers' && path.length===1 && method==='POST') {
      const b = req.body||{}; const d = await sbGet('drivers');
      if (d.some((x:any)=>x.phone===b.phone)) return res.status(409).json({ error:'Phone exists', driver: d.find((x:any)=>x.phone===b.phone) });
      const driver:any = { id:b.id||genId(), name:b.name||'', phone:b.phone||'', district:b.district||'dist-gerji', vehicleType:b.vehicleType||'bajaj', plateNumber:b.plateNumber||'', status:'active', isOnline:false, isRegistered:true, approvalStatus:'pending', kmBalance:15, rating:5, currentLocation:b.currentLocation||null, photoUrl:b.photoUrl||'', nationalIdPhotoUrl:b.nationalIdPhotoUrl||'', nationalIdNumber:b.nationalIdNumber||'', faydaNumber:b.faydaNumber||'', kebeleHouseNumber:b.kebeleHouseNumber||'', emergencyContactName:b.emergencyContactName||'', emergencyContactPhone:b.emergencyContactPhone||'', createdAt:now, updatedAt:now };
      d.push(driver); await sbSet('drivers',d);
      return res.status(201).json(driver);
    }

    if (path[0]==='drivers' && path[1]==='register' && method==='POST') {
      const b = req.body||{}; const d = await sbGet('drivers');
      if (d.some((x:any)=>x.phone===b.phone)) return res.status(409).json({ error:'Phone exists' });
      const driver:any = { id:genId(), name:b.name||'', phone:b.phone||'', district:b.district||'dist-gerji', vehicleType:b.vehicleType||'bajaj', plateNumber:b.plateNumber||'', status:'active', isOnline:false, isRegistered:true, approvalStatus:'pending', kmBalance:15, rating:5, currentLocation:null, photoUrl:'', nationalIdPhotoUrl:'', createdAt:now, updatedAt:now };
      d.push(driver); await sbSet('drivers',d);
      return res.status(201).json(driver);
    }

    if (path[0]==='drivers' && path.length>=2) {
      const did=path[1]; const d=await sbGet('drivers'); const di=d.findIndex((x:any)=>x.id===did);

      if (path.length===2 && method==='DELETE') { if(di>=0){d.splice(di,1);await sbSet('drivers',d);} return res.json({success:true}); }

      if (path[2]==='toggle-online' && method==='POST') {
        if(di>=0){d[di].isOnline=!!(req.body||{}).isOnline;d[di].updatedAt=now;await sbSet('drivers',d);}
        return res.json({success:true});
      }

      if (path[2]==='location' && method==='POST') {
        if(di>=0){const{lat,lng}=req.body||{};d[di].currentLocation={lat,lng};d[di].updatedAt=now;await sbSet('drivers',d);}
        return res.json({success:true});
      }

      if (path[2]==='change-district' && method==='POST') {
        if(di>=0){d[di].district=(req.body||{}).districtId||d[di].district;d[di].updatedAt=now;await sbSet('drivers',d);}
        return res.json({success:true});
      }

      if (path[2]==='update' && method==='POST') {
        if(di>=0){const b=req.body||{};for(const k of['name','phone','district','vehicleType','plateNumber','nationalIdNumber','faydaNumber','kebeleHouseNumber','emergencyContactName','emergencyContactPhone']){if(b[k]!==undefined)d[di][k]=b[k];}d[di].updatedAt=now;await sbSet('drivers',d);return res.json(d[di]);}
        return res.status(404).json({error:'Not found'});
      }

      if (path[2]==='update-photos' && method==='POST') {
        if(di>=0){const{photoUrl}=req.body||{};if(photoUrl!==undefined)d[di].photoUrl=photoUrl;d[di].updatedAt=now;await sbSet('drivers',d);}
        return res.json({success:true});
      }

      if (path[2]==='adjust-km' && method==='POST') {
        if(di>=0){d[di].kmBalance=(d[di].kmBalance||0)+((req.body||{}).amountKm||0);d[di].updatedAt=now;await sbSet('drivers',d);}
        return res.json({success:true});
      }
    }

    if (path[0]==='admin' && path[1]==='drivers' && path.length===4 && path[3]==='approve' && method==='POST') {
      const d=await sbGet('drivers');const i=d.findIndex((x:any)=>x.id===path[2]);
      if(i>=0){d[i].approvalStatus='approved';d[i].updatedAt=now;await sbSet('drivers',d);}
      return res.json({success:true});
    }

    if (path[0]==='admin' && path[1]==='drivers' && path.length===4 && path[3]==='reject' && method==='POST') {
      const d=await sbGet('drivers');const i=d.findIndex((x:any)=>x.id===path[2]);
      if(i>=0){d[i].approvalStatus='rejected';d[i].updatedAt=now;await sbSet('drivers',d);}
      return res.json({success:true});
    }

    if (path[0]==='trips') {
      const trips=await sbGet('trips'); const drivers=await sbGet('drivers');

      if (path[1]==='request' && method==='POST') {
        const b=req.body||{}; const s=await sbGet('settings'); const maxR=s?.max_dispatch_range_km||s?.maxDispatchRangeKm||3; const timeout=s?.ring_timeout_seconds||s?.ringTimeoutSeconds||120;
        const trip:any={id:genId(),customerPhone:b.customerPhone||'',customerName:b.customerName||'',pickupLocation:b.pickupLocation||'',dropoffLocation:b.dropoffLocation||'',pickupLat:b.pickupLat||0,pickupLng:b.pickupLng||0,dropoffLat:b.dropoffLat||0,dropoffLng:b.dropoffLng||0,district:b.district||'',pickupDistrict:b.district||b.pickupDistrict||'',status:'ringing',driverId:'',acceptedByDriverId:'',targetDriverIds:[],fare:0,estimatedFare:b.estimatedFare||0,agreedFare:0,agreedPrice:0,countdownSeconds:timeout,cancellationReason:'',cancelledBy:'',createdAt:now,updatedAt:now};
        const nearby=drivers.filter((d:any)=>{if(!d.isOnline||d.approvalStatus!=='approved')return false;if(trip.district&&d.district&&d.district!==trip.district)return false;return calcDist({lat:trip.pickupLat,lng:trip.pickupLng},d.currentLocation)<=maxR;}).sort((a:any,b2:any)=>calcDist({lat:trip.pickupLat,lng:trip.pickupLng},a.currentLocation)-calcDist({lat:trip.pickupLat,lng:trip.pickupLng},b2.currentLocation));
        trip.targetDriverIds=nearby.map((d:any)=>d.id);
        trips.push(trip); await sbSet('trips',trips);
        return res.status(201).json({trip});
      }

      if (path.length===3 && path[2]==='accept' && method==='POST') {
        const{driverId}=req.body||{}; const i=trips.findIndex((t:any)=>t.id===path[1]);
        if(i>=0&&(trips[i].status==='ringing'||trips[i].status==='pending')){
          trips[i].status='accepted'; trips[i].driverId=driverId||trips[i].targetDriverIds?.[0]||''; trips[i].acceptedByDriverId=trips[i].driverId; trips[i].updatedAt=now;
          const di=drivers.findIndex((d:any)=>d.id===trips[i].driverId);
          if(di>=0){drivers[di].isOnline=false;drivers[di].updatedAt=now;await sbSet('drivers',drivers);}
          await sbSet('trips',trips); return res.json({trip:trips[i]});
        }
        return res.status(400).json({error:'Trip not available'});
      }

      if (path.length===3 && path[2]==='status' && method==='POST') {
        const{status,agreedPrice}=req.body||{}; const i=trips.findIndex((t:any)=>t.id===path[1]);
        if(i>=0){
          trips[i].status=status; if(agreedPrice!==undefined){trips[i].agreedPrice=agreedPrice;trips[i].agreedFare=agreedPrice;trips[i].fare=agreedPrice;}
          trips[i].updatedAt=now;
          if(status==='completed'){trips[i].completedAt=now;const di=drivers.findIndex((d:any)=>d.id===trips[i].driverId);if(di>=0){drivers[di].isOnline=true;drivers[di].updatedAt=now;await sbSet('drivers',drivers);}}
          if(status==='cancelled'){const di=drivers.findIndex((d:any)=>d.id===trips[i].driverId);if(di>=0){drivers[di].isOnline=true;drivers[di].updatedAt=now;await sbSet('drivers',drivers);}}
          await sbSet('trips',trips); return res.json({trip:trips[i]});
        }
        return res.status(404).json({error:'Not found'});
      }

      if (path.length===3 && path[2]==='cancel' && method==='POST') {
        const{cancellationReason,cancelledBy}=req.body||{}; const i=trips.findIndex((t:any)=>t.id===path[1]);
        if(i>=0){trips[i].status='cancelled';trips[i].cancellationReason=cancellationReason||'';trips[i].cancelledBy=cancelledBy||'';trips[i].updatedAt=now;const di=drivers.findIndex((d:any)=>d.id===trips[i].driverId);if(di>=0){drivers[di].isOnline=true;drivers[di].updatedAt=now;await sbSet('drivers',drivers);}await sbSet('trips',trips);}
        return res.json({success:true});
      }

      if (path.length===1 && method==='GET') return res.json({trips:trips||[]});
    }

    if (path[0]==='districts' && path.length===3 && path[2]==='toggle-status' && method==='POST') return res.json({success:true});

    if (path[0]==='stats' && path.length===1 && method==='GET') {
      const [drivers,trips,recharges]=await Promise.all([sbGet('drivers'),sbGet('trips'),sbGet('recharges')]);
      return res.json({totalDrivers:drivers.length,approvedDrivers:drivers.filter((d:any)=>d.approvalStatus==='approved').length,onlineDrivers:drivers.filter((d:any)=>d.isOnline).length,totalTrips:trips.length,completedTrips:trips.filter((t:any)=>t.status==='completed').length,totalRevenue:trips.filter((t:any)=>t.status==='completed').reduce((s:number,t:any)=>s+(t.fare||0),0),pendingRecharges:recharges.filter((r:any)=>r.status==='pending').length});
    }

    return res.status(404).json({ error: 'Route not found' });
  } catch (error: any) {
    console.error('API Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
