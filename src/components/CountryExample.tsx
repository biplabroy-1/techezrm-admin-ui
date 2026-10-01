import React, { useState } from 'react';
import { useCountries, useCountry } from '../hooks/useCountries';
import {
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

export default function CountryExample() {
  const [selectedCountryCode, setSelectedCountryCode] = useState('');

  // Direct hook usage
  const { data: countries, isLoading, error } = useCountries();
  const { data: selectedCountry } = useCountry(selectedCountryCode);

  if (isLoading) return <Typography>Loading countries...</Typography>;
  if (error)
    return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Countries
      </Typography>

      {/* Country Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select a Country</InputLabel>
          <Select
            value={selectedCountryCode}
            onChange={(e) => setSelectedCountryCode(e.target.value)}
            label="Select a Country"
          >
            {countries?.data?.map((country) => (
              <MenuItem key={country.code} value={country.code}>
                {country.name} ({country.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Selected Country Details */}
      {selectedCountry && (
        <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Country Details
          </Typography>
          <Typography>
            <strong>Name:</strong> {selectedCountry.data?.[0]?.name}
          </Typography>
          <Typography>
            <strong>Code:</strong> {selectedCountry.data?.[0]?.code}
          </Typography>
          {selectedCountry.data?.[0]?.phoneCode && (
            <Typography>
              <strong>Phone Code:</strong> +{selectedCountry.data[0].phoneCode}
            </Typography>
          )}
          {selectedCountry.data?.[0]?.currency && (
            <Typography>
              <strong>Currency:</strong> {selectedCountry.data[0].currency}
            </Typography>
          )}
          {selectedCountry.data?.[0]?.timezone && (
            <Typography>
              <strong>Timezone:</strong> {selectedCountry.data[0].timezone}
            </Typography>
          )}
        </Box>
      )}

      {/* All Countries List */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          All Countries ({countries?.data?.length || 0})
        </Typography>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {countries?.data?.map((country) => (
            <Box
              key={country.code}
              sx={{
                p: 1,
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="body1">{country.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Code: {country.code}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setSelectedCountryCode(country.code)}
              >
                View Details
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
