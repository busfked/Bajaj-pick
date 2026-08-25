import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationCoord, VillageLandmark, BajajDriver, VillageDistrict } from '../types';
import { Navigation } from 'lucide-react';

interface VillageMapProps {
  center: LocationCoord;
  landmarks: VillageLandmark[];
  drivers: BajajDriver[];
  districts?: VillageDistrict[];
  activeDistrictId?: string;
  pickupCoords?: LocationCoord | null;
  dropoffCoords?: LocationCoord | null;
  distanceKm?: number;
  onMapClick?: (coords: LocationCoord) => void;
  onLocateMe?: () => void;
  selectionMode?: 'pickup' | 'dropoff' | null;
  heightClass?: string;
  activeDriverId?: string;
}

export const VillageMap: React.FC<VillageMapProps> = ({
  center,
  landmarks,
  drivers,
  districts = [],
  activeDistrictId,
  pickupCoords,
  dropoffCoords,
  distanceKm,
  onMapClick,
  onLocateMe,
  selectionMode,
  heightClass = 'h-72 sm:h-96',
  activeDriverId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const districtCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = center?.lat ?? 8.9806;
    const initialLng = center?.lng ?? 38.8020;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when changed
  useEffect(() => {
    if (mapInstanceRef.current && center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      mapInstanceRef.current.setView([center.lat, center.lng], 14);
    }
  }, [center?.lat, center?.lng]);

  // Click handler for map location selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (onMapClick && e?.latlng) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [onMapClick]);

  // Render Markers, Circles, and Polyline Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    if (districtCircleRef.current) {
      districtCircleRef.current.remove();
      districtCircleRef.current = null;
    }

    // 1. Render 3.0 KM District Boundary Circle
    const currentDistrict = (districts || []).find(d => d.id === activeDistrictId) || (districts || [])[0];
    if (currentDistrict && currentDistrict.center && typeof currentDistrict.center.lat === 'number' && typeof currentDistrict.center.lng === 'number') {
      const circle = L.circle([currentDistrict.center.lat, currentDistrict.center.lng], {
        radius: (currentDistrict.maxRadiusKm || 3.0) * 1000,
        color: currentDistrict.colorTag || '#10B981',
        fillColor: currentDistrict.colorTag || '#10B981',
        fillOpacity: 0.07,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);
      districtCircleRef.current = circle;
    }

    // 2. Render Landmarks
    (landmarks || []).forEach((lm) => {
      if (!lm || typeof lm.lat !== 'number' || typeof lm.lng !== 'number') return;
      const landmarkIcon = L.divIcon({
        className: 'custom-map-landmark',
        html: `
          <div class="flex items-center space-x-1 px-2.5 py-1 bg-slate-900/90 text-white rounded-full border border-slate-700 shadow-md text-[11px] font-semibold whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2 backdrop-blur-xs">
            <span class="text-emerald-400">📍</span>
            <span class="max-w-[120px] truncate">${lm.name || 'Landmark'}</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      L.marker([lm.lat, lm.lng], { icon: landmarkIcon })
        .bindTooltip(`<b>${lm.name}</b><br/>${lm.description || ''}`, { direction: 'top' })
        .addTo(group);
    });

    // 3. Render Bajaj Drivers
    (drivers || []).forEach((drv) => {
      if (!drv || !drv.isOnline || !drv.currentLocation || typeof drv.currentLocation.lat !== 'number' || typeof drv.currentLocation.lng !== 'number') return;

      const isSelected = activeDriverId === drv.id;
      const driverIcon = L.divIcon({
        className: 'custom-map-bajaj',
        html: `
          <div class="relative group cursor-pointer transform -translate-x-1/2 -translate-y-1/2">
            <div class="w-10 h-10 rounded-full overflow-hidden ${
              isSelected ? 'bg-emerald-500 ring-4 ring-emerald-500/40' : 'bg-slate-900 ring-2 ring-emerald-400'
            } shadow-xl flex items-center justify-center text-base transform transition-transform hover:scale-110">
              ${drv.photoUrl ? `<img src="${drv.photoUrl}" class="w-full h-full object-cover" />` : '<span class="text-white text-base">🛺</span>'}
            </div>
            <div class="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 text-emerald-300 text-[10px] font-bold rounded-md border border-slate-700 shadow-sm whitespace-nowrap">
              ${drv.bajajPlate ? (drv.bajajPlate.split('-').pop() || drv.name.split(' ')[0]) : drv.name}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([drv.currentLocation.lat, drv.currentLocation.lng], { icon: driverIcon })
        .bindPopup(`
          <div class="text-xs p-1 font-sans">
            <div class="font-bold text-slate-900 text-sm">🛺 ${drv.name}</div>
            <div class="text-slate-600 font-mono">${drv.bajajPlate || ''} (${drv.bajajColor || 'Bajaj'})</div>
            <div class="text-emerald-600 font-semibold mt-1">● Online in ${drv.districtName || 'Village'} (${drv.villageArea || 'Station'})</div>
            <div class="text-slate-500 mt-0.5">Rating: ★ ${drv.rating || 5.0} (${drv.totalTripsCompleted || 0} trips)</div>
          </div>
        `);
      marker.addTo(group);
    });

    // 4. Render Pickup Marker
    if (pickupCoords && typeof pickupCoords.lat === 'number' && typeof pickupCoords.lng === 'number') {
      const pickupIcon = L.divIcon({
        className: 'custom-map-pickup',
        html: `
          <div class="flex flex-col items-center transform -translate-x-1/2 -translate-y-full">
            <div class="px-2.5 py-1 bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-lg flex items-center space-x-1 whitespace-nowrap animate-bounce">
              <span>🟢</span>
              <span>PICKUP</span>
            </div>
            <div class="w-3 h-3 bg-emerald-500 rotate-45 -mt-1.5 shadow"></div>
          </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 40],
      });

      L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon }).addTo(group);
    }

    // 5. Render Dropoff Marker
    if (dropoffCoords && typeof dropoffCoords.lat === 'number' && typeof dropoffCoords.lng === 'number') {
      const dropoffIcon = L.divIcon({
        className: 'custom-map-dropoff',
        html: `
          <div class="flex flex-col items-center transform -translate-x-1/2 -translate-y-full">
            <div class="px-2.5 py-1 bg-rose-500 text-white font-bold text-[11px] rounded-lg shadow-lg flex items-center space-x-1 whitespace-nowrap">
              <span>🏁</span>
              <span>DESTINATION</span>
            </div>
            <div class="w-3 h-3 bg-rose-500 rotate-45 -mt-1.5 shadow"></div>
          </div>
        `,
        iconSize: [90, 40],
        iconAnchor: [45, 40],
      });

      L.marker([dropoffCoords.lat, dropoffCoords.lng], { icon: dropoffIcon }).addTo(group);
    }

    // 6. Draw Polyline Route if both pickup & dropoff exist
    if (
      pickupCoords &&
      dropoffCoords &&
      typeof pickupCoords.lat === 'number' &&
      typeof pickupCoords.lng === 'number' &&
      typeof dropoffCoords.lat === 'number' &&
      typeof dropoffCoords.lng === 'number'
    ) {
      const latlngs: L.LatLngExpression[] = [
        [pickupCoords.lat, pickupCoords.lng],
        [dropoffCoords.lat, dropoffCoords.lng],
      ];

      const polyline = L.polyline(latlngs, {
        color: '#10b981',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8',
      }).addTo(map);

      routeLayerRef.current = polyline;

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [landmarks, drivers, districts, activeDistrictId, pickupCoords, dropoffCoords, activeDriverId]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Locate Me Button Overlay */}
      {onLocateMe && (
        <button
          type="button"
          onClick={onLocateMe}
          title="Auto-detect my live GPS location"
          className="absolute top-3 right-3 z-10 bg-white hover:bg-slate-50 text-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-200 flex items-center space-x-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Detect GPS</span>
        </button>
      )}

      {/* Map Interactive Banner / Controls */}
      {selectionMode && (
        <div className="absolute top-3 left-3 right-14 sm:right-auto z-10 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-medium border border-slate-700 shadow-lg flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>
            Click on map to set <b>{selectionMode.toUpperCase()}</b> location
          </span>
        </div>
      )}

      {/* Distance KM Badge overlay if active */}
      {distanceKm !== undefined && distanceKm > 0 && pickupCoords && dropoffCoords && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md text-slate-900 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 shadow-md flex items-center space-x-2">
          <span className="text-emerald-600 font-extrabold text-sm font-['Outfit']">{distanceKm} KM</span>
          <span className="text-slate-500 font-medium">Road Distance</span>
        </div>
      )}
    </div>
  );
};

