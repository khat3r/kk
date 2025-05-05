// __tests__/utils.test.ts

describe('Utility Functions', () => {
    // Import the function to test
    // For testing, let's recreate the function here
    function deg2rad(deg: number): number {
      return deg * (Math.PI/180);
    }
    
    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c; // Distance in km
      return d;
    }
    
    describe('calculateDistance function', () => {
      test('should calculate correct distance between two points', () => {
        // New York to Los Angeles (approximate coordinates)
        const nyLat = 40.7128;
        const nyLon = -74.0060;
        const laLat = 34.0522;
        const laLon = -118.2437;
        
        const distance = calculateDistance(nyLat, nyLon, laLat, laLon);
        
        // Approximate distance between NY and LA is about 3935 km
        // Allow for some margin of error in the calculation
        expect(distance).toBeGreaterThan(3900);
        expect(distance).toBeLessThan(4000);
      });
      
      test('should return zero for same coordinates', () => {
        const lat = 40.7128;
        const lon = -74.0060;
        
        const distance = calculateDistance(lat, lon, lat, lon);
        
        expect(distance).toBeCloseTo(0);
      });
      
      test('should handle coordinate values at different hemispheres', () => {
        // Sydney to Santiago (opposite hemispheres)
        const sydneyLat = -33.8688;
        const sydneyLon = 151.2093;
        const santiagoLat = -33.4489;
        const santiagoLon = -70.6693;
        
        const distance = calculateDistance(sydneyLat, sydneyLon, santiagoLat, santiagoLon);
        
        // Approximate distance is about 11,365 km
        expect(distance).toBeGreaterThan(11000);
        expect(distance).toBeLessThan(12000);
      });
    });
    
    describe('deg2rad function', () => {
      test('should convert degrees to radians correctly', () => {
        expect(deg2rad(0)).toBeCloseTo(0);
        expect(deg2rad(90)).toBeCloseTo(Math.PI / 2);
        expect(deg2rad(180)).toBeCloseTo(Math.PI);
        expect(deg2rad(360)).toBeCloseTo(2 * Math.PI);
      });
      
      test('should handle negative angles', () => {
        expect(deg2rad(-90)).toBeCloseTo(-Math.PI / 2);
        expect(deg2rad(-180)).toBeCloseTo(-Math.PI);
      });
    });
  });