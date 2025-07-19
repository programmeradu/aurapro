interface WeatherData {
  temperature: number;
  location: string;
  condition: string;
  icon: string;
  lastUpdated: string;
}

export class WeatherService {
  private static API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  private static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache
  private static CACHE_KEY = 'aura_weather_cache';
  
  private static getCachedWeather(): WeatherData | null {
    if (typeof window === 'undefined') return null;
    
    const cached = localStorage.getItem(WeatherService.CACHE_KEY);
    if (!cached) return null;
    
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < WeatherService.CACHE_DURATION) {
        return data;
      }
    } catch (e) {
      console.error('Failed to parse cached weather data', e);
    }
    
    return null;
  }
  
  private static cacheWeather(data: WeatherData): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cache = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(WeatherService.CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to cache weather data', e);
    }
  }
  
  static async getCurrentWeather(): Promise<WeatherData> {
    // Return cached data if available
    const cached = this.getCachedWeather();
    if (cached) return cached;
    
    try {
      // Default to Accra, Ghana coordinates
      const lat = 5.6037;
      const lon = -0.1870;
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json();
      
      const weatherData: WeatherData = {
        temperature: Math.round(data.main.temp),
        location: data.name || 'Accra',
        condition: data.weather[0]?.main || 'Clear',
        icon: data.weather[0]?.icon || '01d',
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result
      this.cacheWeather(weatherData);
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Fallback to default data if API fails
      return {
        temperature: 28, // Default temperature for Accra
        location: 'Accra',
        condition: 'Clear',
        icon: '01d',
        lastUpdated: new Date().toISOString()
      };
    }
  }
}

export default WeatherService;
