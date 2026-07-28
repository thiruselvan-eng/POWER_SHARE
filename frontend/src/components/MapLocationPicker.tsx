import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon path issue in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface LocationData {
  latitude: number;
  longitude: number;
  fullAddress: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface MapLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect: (data: LocationData) => void;
}

// Component to dynamically re-center map when marker moves
const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

// Interactive map click handler
const MapClickHandler: React.FC<{ onLocationPicked: (lat: number, lng: number) => void }> = ({ onLocationPicked }) => {
  useMapEvents({
    click(e) {
      onLocationPicked(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  initialLat = 12.9716, // Default Bengaluru center
  initialLng = 77.5946,
  initialAddress = '',
  onLocationSelect,
}) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fullAddress, setFullAddress] = useState<string>(initialAddress);
  const [area, setArea] = useState<string>('');
  const [city, setCity] = useState<string>('Bengaluru');
  const [state, setState] = useState<string>('Karnataka');
  const [country, setCountry] = useState<string>('India');
  const [pincode, setPincode] = useState<string>('');

  const [geocoding, setGeocoding] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Reverse geocoding function (lat/lng -> address)
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setGeocoding(true);
      setGeoError(null);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const formattedAddress = data.display_name || '';
        const detectedArea = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
        const detectedCity = addr.city || addr.town || addr.village || addr.county || '';
        const detectedState = addr.state || '';
        const detectedCountry = addr.country || '';
        const detectedPincode = addr.postcode || '';

        setFullAddress(formattedAddress);
        setArea(detectedArea);
        setCity(detectedCity);
        setState(detectedState);
        setCountry(detectedCountry);
        setPincode(detectedPincode);

        onLocationSelect({
          latitude,
          longitude,
          fullAddress: formattedAddress,
          area: detectedArea,
          city: detectedCity,
          state: detectedState,
          country: detectedCountry,
          pincode: detectedPincode,
        });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      // Fallback update without full geocoded string
      onLocationSelect({
        latitude,
        longitude,
        fullAddress: fullAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        area,
        city,
        state,
        country,
        pincode,
      });
    } finally {
      setGeocoding(false);
    }
  };

  // Direct Address Search (address query -> lat/lng)
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setGeoError(null);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await res.json();

      if (results && results.length > 0) {
        const first = results[0];
        const newLat = parseFloat(first.lat);
        const newLng = parseFloat(first.lon);
        setLat(newLat);
        setLng(newLng);
        await reverseGeocode(newLat, newLng);
      } else {
        setGeoError('No location found for this search. Try adding city or pincode.');
      }
    } catch (err) {
      console.error('Search location error:', err);
      setGeoError('Location search failed. Check your internet connection.');
    } finally {
      setSearching(false);
    }
  };

  // HTML5 "Use Current Location"
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setSearching(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        reverseGeocode(newLat, newLng);
        setSearching(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoError('Unable to access device location. Please select on map.');
        setSearching(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (e: any) => {
    const marker = e.target;
    if (marker) {
      const position = marker.getLatLng();
      setLat(position.lat);
      setLng(position.lng);
      reverseGeocode(position.lat, position.lng);
    }
  };

  const handleMapClick = (clickLat: number, clickLng: number) => {
    setLat(clickLat);
    setLng(clickLng);
    reverseGeocode(clickLat, clickLng);
  };

  return (
    <div className="space-y-4">
      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleAddressSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search address, landmark, city or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-emerald-400 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5 rotate-45" />
          Use Current Location
        </button>
      </div>

      {geoError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
          {geoError}
        </div>
      )}

      {/* Interactive Map */}
      <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-slate-800 relative z-0">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={lat} lng={lng} />
          <MapClickHandler onLocationPicked={handleMapClick} />
          <Marker
            position={[lat, lng]}
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
          />
        </MapContainer>

        {geocoding && (
          <div className="absolute top-3 right-3 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-emerald-400 font-semibold flex items-center gap-2 z-[1000]">
            <Loader2 className="w-3 h-3 animate-spin" /> Geocoding address...
          </div>
        )}
      </div>

      {/* Geocoded Address Details Breakdown */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs border-b border-slate-850 pb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{fullAddress || 'Click map or drag pin to select precise location'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">Area / Locality</span>
            <input
              type="text"
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                onLocationSelect({ latitude: lat, longitude: lng, fullAddress, area: e.target.value, city, state, country, pincode });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">City</span>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                onLocationSelect({ latitude: lat, longitude: lng, fullAddress, area, city: e.target.value, state, country, pincode });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">State</span>
            <input
              type="text"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                onLocationSelect({ latitude: lat, longitude: lng, fullAddress, area, city, state: e.target.value, country, pincode });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">Pincode</span>
            <input
              type="text"
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value);
                onLocationSelect({ latitude: lat, longitude: lng, fullAddress, area, city, state, country, pincode: e.target.value });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 font-mono">
          <span>Lat: {lat.toFixed(5)}</span>
          <span>Lng: {lng.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;
