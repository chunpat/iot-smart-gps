
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Coordinate, Trip, Device } from './types';
import { MapView } from './components/MapView';
import { generateTripSummary } from './services/geminiService';

// Mock Data
const MOCK_DEVICES: Device[] = [
  { id: '1', name: 'iPhone 15 Pro', type: 'smartphone', status: 'online', battery: 85, lastSeen: 'Just now' },
  { id: '2', name: 'Van Tracker', type: 'vehicle', status: 'offline', battery: 42, lastSeen: '2 hours ago' },
];

const MOCK_TRIPS: Trip[] = [
  {
    id: 't1',
    date: '2023-10-24',
    startTime: '08:30',
    endTime: '09:15',
    distance: 5.2,
    avgSpeed: 12.5,
    path: [],
    summary: 'Morning commute through the park. Good pace!',
    tags: ['commute', 'morning']
  },
  {
    id: 't2',
    date: '2023-10-23',
    startTime: '18:10',
    endTime: '19:00',
    distance: 12.8,
    avgSpeed: 25.2,
    path: [],
    summary: 'Evening cycle around the lake. Great cardio session.',
    tags: ['fitness', 'evening']
  }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [isTracking, setIsTracking] = useState(false);
  const [currentPath, setCurrentPath] = useState<Coordinate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const watchId = useRef<number | null>(null);

  // Auth Handling
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  // GPS Tracking Logic
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    setCurrentPath([]);

    // Fix: Removed 'distanceFilter' as it is not a valid property of PositionOptions in the standard Geolocation API.
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newCoord: Coordinate = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          speed: position.coords.speed
        };
        setCurrentLocation(newCoord);
        setCurrentPath(prev => [...prev, newCoord]);
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
  }, []);

  const stopTracking = useCallback(async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);

    if (currentPath.length > 2) {
      const now = new Date();
      const newTrip: Trip = {
        id: `t-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        startTime: new Date(currentPath[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        distance: 1.5, // Simplified mock distance calculation
        avgSpeed: 15.0,
        path: currentPath,
        tags: ['new-trip']
      };

      // Call Gemini for summary
      const summary = await generateTripSummary(newTrip);
      newTrip.summary = summary;
      
      setTrips(prev => [newTrip, ...prev]);
    }
    setCurrentPath([]);
  }, [currentPath]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">GeoPath</h1>
            <p className="text-slate-500 mt-2">Sign in to track your journey</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input type="email" required defaultValue="demo@geopath.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" required defaultValue="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200">
              Continue
            </button>
          </form>
          <p className="text-center text-sm text-slate-400">
            Don't have an account? <span className="text-blue-600 font-medium cursor-pointer">Sign Up</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50 relative">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <span className="text-xl font-bold tracking-tight">GeoPath</span>
        </div>
        <button className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {activeView === 'home' && (
          <div className="p-4 space-y-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Track Movement</h2>
              <MapView 
                path={currentPath} 
                currentPos={currentLocation} 
                className="h-72 shadow-inner" 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Distance</p>
                  <p className="text-2xl font-bold text-blue-600">{(currentPath.length * 0.01).toFixed(2)} km</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Live Speed</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {currentLocation?.speed ? (currentLocation.speed * 3.6).toFixed(1) : '0.0'} km/h
                  </p>
                </div>
              </div>

              {!isTracking ? (
                <button 
                  onClick={startTracking}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  Start Tracking
                </button>
              ) : (
                <button 
                  onClick={stopTracking}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-xl shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <div className="w-3 h-3 bg-white rounded-sm" />
                  Stop Journey
                </button>
              )}
            </div>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Recent Devices</h3>
                <button className="text-blue-600 text-sm font-medium">Manage</button>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {devices.map(device => (
                  <div key={device.id} className="min-w-[160px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${device.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {device.type === 'vehicle' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{device.battery}%</span>
                    </div>
                    <p className="font-semibold text-sm truncate">{device.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{device.lastSeen}</p>
                  </div>
                ))}
                <div className="min-w-[160px] bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 cursor-pointer hover:bg-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  <span className="text-xs font-medium">Add Device</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeView === 'history' && (
          <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">History</h2>
            <div className="space-y-4">
              {trips.map(trip => (
                <div key={trip.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900">{trip.date}</h4>
                      <p className="text-xs text-slate-500">{trip.startTime} - {trip.endTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{trip.distance.toFixed(1)} km</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{trip.avgSpeed} km/h avg</p>
                    </div>
                  </div>
                  {trip.summary && (
                    <div className="mt-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <div className="flex gap-2 items-start">
                        <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                        <p className="text-xs text-blue-700 leading-relaxed italic">"{trip.summary}"</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {trip.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'devices' && (
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">My Devices</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-100">+ Link New</button>
            </div>
            <div className="space-y-4">
              {devices.map(device => (
                <div key={device.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${device.status === 'online' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{device.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{device.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{device.battery}%</p>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${device.battery > 20 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${device.battery}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'profile' && (
          <div className="p-4 space-y-8">
            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full p-1 shadow-xl">
                <img src="https://picsum.photos/200" className="w-full h-full rounded-full object-cover border-4 border-white" alt="Avatar" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900">Alex Johnson</h2>
                <p className="text-slate-500 font-medium">Premium Member</p>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <span className="font-semibold text-slate-700">Account Settings</span>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>
              
              <button className="w-full p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  </div>
                  <span className="font-semibold text-slate-700">Privacy & Security</span>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>

              <button 
                onClick={() => setIsLoggedIn(false)}
                className="w-full p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between group active:bg-red-100 transition-colors mt-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  </div>
                  <span className="font-semibold">Logout</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50">
        <NavButton active={activeView === 'home'} onClick={() => setActiveView('home')} icon="home" label="Track" />
        <NavButton active={activeView === 'history'} onClick={() => setActiveView('history')} icon="history" label="History" />
        <NavButton active={activeView === 'devices'} onClick={() => setActiveView('devices')} icon="devices" label="Devices" />
        <NavButton active={activeView === 'profile'} onClick={() => setActiveView('profile')} icon="profile" label="Profile" />
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: 'home' | 'history' | 'devices' | 'profile';
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
  const getIcon = () => {
    switch(icon) {
      case 'home': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
      case 'history': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'devices': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />;
      case 'profile': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />;
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <svg className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {getIcon()}
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && <div className="w-1 h-1 bg-blue-600 rounded-full mt-1" />}
    </button>
  );
};

export default App;
