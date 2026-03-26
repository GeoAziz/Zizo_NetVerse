/**
 * Geolocation and enrichment utilities for threat visualization
 */

export interface GeoLocation {
  ip: string;
  country: string;
  city?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isp?: string;
  threat_level?: 'low' | 'medium' | 'high' | 'critical';
}

// Mock geolocation database - in production, use MaxMind GeoIP2 or similar
const geoLocationCache = new Map<string, GeoLocation>();

// Common country coordinates
const countryCoordinates: Record<string, [number, number]> = {
  'US': [37.0902, -95.7129],
  'CN': [35.8617, 104.1954],
  'RU': [61.5240, 105.3188],
  'IN': [20.5937, 78.9629],
  'GB': [55.3781, -3.4360],
  'DE': [51.1657, 10.4515],
  'JP': [36.2048, 138.2529],
  'FR': [46.2276, 2.2137],
  'BR': [-14.2350, -51.9253],
  'CA': [56.1304, -106.3468],
  'AU': [-25.2744, 133.7751],
  'MX': [23.6345, -102.5528],
  'ZA': [-30.5595, 22.9375],
  'NG': [9.0820, 8.6753],
  'KR': [35.9078, 127.7669],
  'SG': [1.3521, 103.8198],
  'UA': [48.3794, 31.1656],
  'IL': [31.0461, 34.8516],
  'UAE': [23.4241, 53.8478],
  'NL': [52.1326, 5.2913],
};

/**
 * Get geolocation for an IP address
 * In production, integrate with MaxMind GeoIP2 API
 */
export async function getGeolocation(ip: string): Promise<GeoLocation> {
  // Check cache first
  if (geoLocationCache.has(ip)) {
    return geoLocationCache.get(ip)!;
  }

  // Mock geolocation - in production, call real API
  const mockGeo = generateMockGeolocation(ip);
  geoLocationCache.set(ip, mockGeo);
  return mockGeo;
}

/**
 * Generate mock geolocation for demonstration
 */
function generateMockGeolocation(ip: string): GeoLocation {
  const parts = ip.split('.');
  const lastOctet = parseInt(parts[3] || '0');
  
  // Generate deterministic but varied locations based on IP
  const countries = Object.keys(countryCoordinates);
  const countryIndex = lastOctet % countries.length;
  const country = countries[countryIndex];
  const [lat, lon] = countryCoordinates[country] || [0, 0];
  
  // Add some randomization within the country
  const jitter = 3;
  const mockLat = lat + (Math.random() - 0.5) * jitter;
  const mockLon = lon + (Math.random() - 0.5) * jitter;
  
  // Determine threat level based on IP
  let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (lastOctet > 240) threatLevel = 'critical';
  else if (lastOctet > 200) threatLevel = 'high';
  else if (lastOctet > 150) threatLevel = 'medium';
  
  return {
    ip,
    country,
    latitude: mockLat,
    longitude: mockLon,
    city: generateMockCity(country),
    timezone: generateMockTimezone(country),
    isp: generateMockISP(country),
    threat_level: threatLevel,
  };
}

function generateMockCity(country: string): string {
  const cities: Record<string, string[]> = {
    'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    'CN': ['Beijing', 'Shanghai', 'Guangzhou', 'Chengdu', 'Hangzhou'],
    'RU': ['Moscow', 'St. Petersburg', 'Novosibirsk', 'Ekaterinburg'],
    'GB': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow'],
    'DE': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne'],
  };
  
  const cityList = cities[country] || ['Unknown'];
  return cityList[Math.floor(Math.random() * cityList.length)];
}

function generateMockTimezone(country: string): string {
  const timezones: Record<string, string> = {
    'US': 'America/New_York',
    'CN': 'Asia/Shanghai',
    'RU': 'Europe/Moscow',
    'GB': 'Europe/London',
    'DE': 'Europe/Berlin',
    'JP': 'Asia/Tokyo',
    'AU': 'Australia/Sydney',
  };
  
  return timezones[country] || 'UTC';
}

function generateMockISP(country: string): string {
  const isps: Record<string, string[]> = {
    'US': ['Comcast', 'AT&T', 'Verizon', 'CenturyLink', 'Charter'],
    'CN': ['China Telecom', 'China Unicom', 'China Mobile'],
    'RU': ['Rostelecom', 'MTS', 'Megafon'],
    'GB': ['BT', 'Vodafone', 'EE', 'Sky'],
    'DE': ['Deutsche Telekom', 'Vodafone', 'O2'],
  };
  
  const ispList = isps[country] || ['Unknown ISP'];
  return ispList[Math.floor(Math.random() * ispList.length)];
}

/**
 * Batch geolocation lookups
 */
export async function getGeolocations(ips: string[]): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();
  
  for (const ip of ips) {
    results.set(ip, await getGeolocation(ip));
  }
  
  return results;
}

/**
 * Calculate distance between two coordinates (in km)
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert latitude/longitude to 3D sphere coordinates
 */
export function geoTo3D(latitude: number, longitude: number, radius: number = 1): [number, number, number] {
  const lat = latitude * Math.PI / 180;
  const lon = longitude * Math.PI / 180;
  
  const x = radius * Math.cos(lat) * Math.cos(lon);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.sin(lon);
  
  return [x, y, z];
}

/**
 * Convert 3D sphere coordinates back to latitude/longitude
 */
export function threeDToGeo(x: number, y: number, z: number): [number, number] {
  const latitude = Math.asin(y) * 180 / Math.PI;
  const longitude = Math.atan2(z, x) * 180 / Math.PI;
  
  return [latitude, longitude];
}

/**
 * Enrich threat data with geolocation
 */
export async function enrichThreatWithGeo(threat: any): Promise<any> {
  const sourceGeo = await getGeolocation(threat.source_ip);
  const targetGeo = await getGeolocation(threat.target_ip);
  
  return {
    ...threat,
    source_geo: sourceGeo,
    target_geo: targetGeo,
    distance_km: calculateDistance(
      sourceGeo.latitude,
      sourceGeo.longitude,
      targetGeo.latitude,
      targetGeo.longitude
    ),
  };
}

/**
 * Generate mock device locations on a local network
 */
export function generateMockDeviceLocation(deviceIndex: number): {
  x: number;
  y: number;
  z: number;
} {
  // Create a 3D grid layout for devices
  const gridSize = Math.ceil(Math.sqrt(Math.sqrt(deviceIndex + 1)));
  const itemsPerLayer = gridSize * gridSize;
  const layer = Math.floor(deviceIndex / itemsPerLayer);
  const positionInLayer = deviceIndex % itemsPerLayer;
  
  const x = gridSize % 2 === 0 
    ? (positionInLayer % gridSize - gridSize / 2) * 2
    : (positionInLayer % gridSize - gridSize / 2) * 2;
  
  const y = layer * 2;
  
  const z = gridSize % 2 === 0
    ? (Math.floor(positionInLayer / gridSize) - gridSize / 2) * 2
    : (Math.floor(positionInLayer / gridSize) - gridSize / 2) * 2;
  
  return { x, y, z };
}

/**
 * Clear geolocation cache
 */
export function clearGeolocationCache(): void {
  geoLocationCache.clear();
}
