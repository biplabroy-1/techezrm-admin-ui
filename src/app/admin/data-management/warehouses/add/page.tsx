'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { warehouseService } from '@/api/services/warehouses';
import { toast } from 'react-toastify';

type Field =
  | 'name'
  | 'street'
  | 'city'
  | 'state'
  | 'country'
  | 'zipCode'
  | 'latitude'
  | 'longitude'
  | 'email'
  | 'phone'
  | 'alternatePhone'
  | 'manager'
  | 'capacity';

interface FormState {
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  email: string;
  phone: string;
  alternatePhone: string;
  manager: string;
  capacity: string;
  status: 'active' | 'inactive' | 'maintenance';
}

const INITIAL_FORM: FormState = {
  name: '',
  street: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  latitude: '',
  longitude: '',
  email: '',
  phone: '',
  alternatePhone: '',
  manager: '',
  capacity: '',
  status: 'active',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CAPACITY_PATTERN = /^\d+$/;

export default function AddWarehousePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleChange =
    (field: Field) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleStatusChange = (
    event: SelectChangeEvent<FormState['status']>
  ) => {
    setForm((prev) => ({ ...prev, status: event.target.value as FormState['status'] }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<Field, string>> = {};

    if (!form.name.trim()) next.name = 'Warehouse name is required';
    if (!form.street.trim()) next.street = 'Street is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.state.trim()) next.state = 'State is required';
    if (!form.country.trim()) next.country = 'Country is required';
    if (!form.zipCode.trim()) next.zipCode = 'Zip code is required';
    if (!form.manager.trim()) next.manager = 'Manager is required';

    if (!form.latitude.trim()) {
      next.latitude = 'Latitude is required';
    } else if (isNaN(parseFloat(form.latitude))) {
      next.latitude = 'Latitude must be a number';
    }

    if (!form.longitude.trim()) {
      next.longitude = 'Longitude is required';
    } else if (isNaN(parseFloat(form.longitude))) {
      next.longitude = 'Longitude must be a number';
    }

    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = 'Enter a valid email address';
    }

    if (!form.phone.trim()) {
      next.phone = 'Phone number is required';
    }

    if (!form.capacity.trim()) {
      next.capacity = 'Capacity is required';
    } else if (!CAPACITY_PATTERN.test(form.capacity.trim())) {
      next.capacity = 'Capacity must be a whole number';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: any) => warehouseService.createWarehouse(payload),
    onSuccess: (response: any) => {
      if (response?.success === false) {
        toast.error(response?.error || 'Failed to create warehouse');
        return;
      }
      toast.success('Warehouse created successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      router.push('/admin/data-management/warehouses');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create warehouse');
    },
  });

  /**
   * Fill latitude/longitude from the browser's location.
   *
   * Every failure mode gets a distinct message, because they need different
   * actions: an insecure origin and a denied permission both surface as an
   * opaque `code 1` in some browsers, and "unavailable" is usually just "no
   * GPS indoors". Geolocation is only exposed on a secure origin, so this works
   * on localhost and over HTTPS but not on a plain-HTTP LAN address.
   */
  const useCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('This browser cannot detect your location.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setErrors((prev) => ({ ...prev, latitude: '', longitude: '' }));
        toast.success('Location filled in from your device.');
      },
      (error) => {
        setLocating(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Allow it in your browser, or type the coordinates in.'
            : error.code === error.TIMEOUT
              ? 'Timed out while getting your location. Try again, or type the coordinates in.'
              : 'Could not determine your location. Type the coordinates in manually.';
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    mutation.mutate({
      name: form.name.trim(),
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        zipCode: form.zipCode.trim(),
        latitude: form.latitude.trim(),
        longitude: form.longitude.trim(),
      },
      contactInfo: {
        email: form.email.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim() || undefined,
      },
      status: form.status,
      capacity: parseInt(form.capacity.trim(), 10),
      manager: form.manager.trim(),
    });
  };

  const handleCancel = () => {
    router.push('/admin/data-management/warehouses');
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Warehouses
        </Button>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Add Warehouse
        </Typography>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Warehouse Name"
                    value={form.name}
                    onChange={handleChange('name')}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Manager"
                    value={form.manager}
                    onChange={handleChange('manager')}
                    error={Boolean(errors.manager)}
                    helperText={errors.manager}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="warehouse-status-label">Status</InputLabel>
                    <Select
                      labelId="warehouse-status-label"
                      label="Status"
                      value={form.status}
                      onChange={handleStatusChange}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Capacity"
                    type="number"
                    value={form.capacity}
                    onChange={handleChange('capacity')}
                    error={Boolean(errors.capacity)}
                    helperText={errors.capacity}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Address
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required
                    label="Street"
                    value={form.street}
                    onChange={handleChange('street')}
                    error={Boolean(errors.street)}
                    helperText={errors.street}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="City"
                    value={form.city}
                    onChange={handleChange('city')}
                    error={Boolean(errors.city)}
                    helperText={errors.city}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="State"
                    value={form.state}
                    onChange={handleChange('state')}
                    error={Boolean(errors.state)}
                    helperText={errors.state}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Country"
                    value={form.country}
                    onChange={handleChange('country')}
                    error={Boolean(errors.country)}
                    helperText={errors.country}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Zip Code"
                    value={form.zipCode}
                    onChange={handleChange('zipCode')}
                    error={Boolean(errors.zipCode)}
                    helperText={errors.zipCode}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="outlined"
                    startIcon={<MyLocationIcon />}
                    onClick={useCurrentLocation}
                    disabled={locating}
                  >
                    {locating ? 'Locating...' : 'Use current location'}
                  </Button>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Latitude"
                    placeholder="-12.9716"
                    value={form.latitude}
                    onChange={handleChange('latitude')}
                    error={Boolean(errors.latitude)}
                    helperText={errors.latitude}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Longitude"
                    placeholder="77.5946"
                    value={form.longitude}
                    onChange={handleChange('longitude')}
                    error={Boolean(errors.longitude)}
                    helperText={errors.longitude}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Contact Info
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Phone"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    error={Boolean(errors.phone)}
                    helperText={errors.phone}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Alternate Phone"
                    value={form.alternatePhone}
                    onChange={handleChange('alternatePhone')}
                    helperText="Optional"
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 3,
                }}
              >
                <Button onClick={handleCancel} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={mutation.isPending}
                  startIcon={
                    mutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : undefined
                  }
                >
                  {mutation.isPending ? 'Creating...' : 'Create Warehouse'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
