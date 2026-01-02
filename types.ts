
export interface Coordinate {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number | null;
}

export interface Device {
  id: string;
  name: string;
  type: 'smartphone' | 'tracker' | 'vehicle';
  status: 'online' | 'offline';
  battery: number;
  lastSeen: string;
}

export interface Trip {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  distance: number; // in km
  avgSpeed: number; // in km/h
  path: Coordinate[];
  summary?: string;
  tags: string[];
}

export type View = 'home' | 'history' | 'devices' | 'profile';
