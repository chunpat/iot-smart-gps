
import React, { useMemo } from 'react';
import { Coordinate } from '../types';

interface MapViewProps {
  path: Coordinate[];
  currentPos?: Coordinate | null;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({ path, currentPos, className }) => {
  // We simulate a map view using an SVG to visualize the path logic
  // in a real production app, this would be Leaflet, Mapbox, or Google Maps.
  
  const viewBox = useMemo(() => {
    if (path.length < 2) return "0 0 100 100";
    const lats = path.map(p => p.lat);
    const lngs = path.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const padding = 0.001;
    return `${minLng - padding} ${minLat - padding} ${maxLng - minLng + padding*2} ${maxLat - minLat + padding*2}`;
  }, [path]);

  const pathD = useMemo(() => {
    if (path.length < 2) return "";
    return `M ${path[0].lng} ${path[0].lat} ` + path.slice(1).map(p => `L ${p.lng} ${p.lat}`).join(" ");
  }, [path]);

  return (
    <div className={`relative overflow-hidden bg-slate-200 rounded-2xl ${className}`}>
      {/* Background Grid Simulation */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
        backgroundSize: '20px 20px' 
      }} />
      
      {path.length > 0 ? (
        <svg 
          viewBox={viewBox} 
          className="w-full h-full transform scale-y-[-1]" 
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="0.0002"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
          {path.length > 0 && (
            <circle cx={path[0].lng} cy={path[0].lat} r="0.0001" fill="#10b981" />
          )}
          {currentPos && (
            <g>
               <circle cx={currentPos.lng} cy={currentPos.lat} r="0.00015" fill="#3b82f6" className="animate-pulse" />
               <circle cx={currentPos.lng} cy={currentPos.lat} r="0.00008" fill="white" />
            </g>
          )}
        </svg>
      ) : (
        <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <p className="text-sm font-medium">Waiting for GPS signal...</p>
        </div>
      )}

      {/* Map Controls Mock */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
          <span className="text-xl font-bold">+</span>
        </button>
        <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
          <span className="text-xl font-bold">-</span>
        </button>
      </div>
    </div>
  );
};
