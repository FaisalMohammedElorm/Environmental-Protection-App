"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icons reference asset paths that don't resolve under
// Next.js bundling — point them at the CDN copies that ship with the same version.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationPickerProps {
  latitude: number | undefined;
  longitude: number | undefined;
  onChange: (lat: number, lng: number) => void;
  defaultCenter?: [number, number];
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  defaultCenter = [5.6037, -0.187]
}: LocationPickerProps) {
  const center = useMemo<[number, number]>(
    () => (latitude !== undefined && longitude !== undefined ? [latitude, longitude] : defaultCenter),
    [latitude, longitude, defaultCenter]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-canopy-100 dark:border-canopy-700">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: 260, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {latitude !== undefined && longitude !== undefined && (
          <Marker
            position={[latitude, longitude]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
