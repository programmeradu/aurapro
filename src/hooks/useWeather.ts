import { useState, useEffect } from 'react';
import WeatherService from '@/lib/weather-service';

interface WeatherData {
  temperature: number;
  location: string;
  condition: string;
  icon: string;
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
}

export function useWeather() {
  const [weather, setWeather] = useState<Omit<WeatherData, 'isLoading' | 'error'>>({
    temperature: 28, // Default temperature for Accra
    location: 'Accra',
    condition: 'Clear',
    icon: '01d',
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await WeatherService.getCurrentWeather();
      setWeather(data);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to load weather data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Refresh weather data every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...weather,
    isLoading,
    error,
    refresh: fetchWeather
  };
}
