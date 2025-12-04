// src/components/MapView.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, ImageOverlay, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      // Small timeout to ensure container is resized before flying
      setTimeout(() => {
        map.invalidateSize(); // FIX: Recalculates map size if layout changed
        map.flyTo(coords, 12, { duration: 2 });
      }, 100);
    }
  }, [coords, map]);
  return null;
}

const MapView = ({ lat, lon, overlay }) => {
  return (
    <MapContainer 
      center={[30.4000, 79.3000]} 
      zoom={11} 
      zoomControl={false} 
      style={{ height: "100%", width: "100%" }} // <--- THIS IS CRITICAL
    >
      <TileLayer 
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
        attribution="GeoSlide AI" 
      />
      
      <MapController coords={[lat, lon]} />
      
      {overlay.maskUrl && (
        <ImageOverlay 
           url={overlay.maskUrl} 
           bounds={overlay.bounds} 
           opacity={0.7} 
        />
      )}
    </MapContainer>
  );
};

export default MapView;