import { useQuery } from '@tanstack/react-query';
import { countryService } from '../api/services/countries';

// Simple country queries (read-only since it's public data)
export const useCountries = (params = {}) => {
  return useQuery({
    queryKey: ['countries', params],
    queryFn: () => countryService.getCountries(),
    staleTime: 10 * 60 * 1000, // 10 minutes - countries don't change often
  });
};

export const useCountry = (code: string) => {
  return useQuery({
    queryKey: ['country', code],
    queryFn: () => countryService.getCountryByCode(code),
    enabled: !!code,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
