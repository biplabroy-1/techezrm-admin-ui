'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { toast } from 'react-toastify';
import { useFillFromLocation } from '@/hooks/useFillFromLocation';
import { warehouseService } from '@/api/services/warehouses';

const LIST_PATH = '/admin/data-management/warehouses';

interface FormState {
  name: string;
  manager: string;
  status: string;
  capacity: string;
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
}

const INITIAL_FORM: FormState = {
  name: '',
  manager: '',
  status: 'active',
  capacity: '',
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
};

export default function EditWarehousePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const warehouseId = params.id as string;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loaded, setLoaded] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: () => warehouseService.getWarehouseById(warehouseId),
    enabled: Boolean(warehouseId),
  });

  useEffect(() => {
    if (loaded) return;
    const w: any = (data as any)?.data ?? (data as any)?.warehouse ?? data;
    if (!w) return;
    const a = w.address ?? {};
    const c = w.contactInfo ?? {};
    setForm({
      name: w.name ?? '',
      manager: w.manager ?? '',
      status: w.status ?? 'active',
      capacity: w.capacity === null || w.capacity === undefined ? '' : String(w.capacity),
      street: a.street ?? '',
      city: a.city ?? '',
      state: a.state ?? '',
      country: a.country ?? '',
      zipCode: a.zipCode ?? '',
      latitude: a.latitude ?? '',
      longitude: a.longitude ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      alternatePhone: c.alternatePhone ?? '',
    });
    setLoaded(true);
  }, [data, loaded]);

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setForm((prev) => ({ ...prev, status: event.target.value }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Warehouse name is required';
    if (!form.manager.trim()) next.manager = 'Manager is required';
    if (!form.capacity.trim() || Number.isNaN(Number(form.capacity))) {
      next.capacity = 'Capacity must be a number';
    }
    if (!form.street.trim()) next.street = 'Street is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.country.trim()) next.country = 'Country is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: any) => warehouseService.updateWarehouse(warehouseId, payload),
    onSuccess: (response: any) => {
      if (response?.success === false) {
        toast.error(response.error || response.message || 'Failed to update warehouse');
        return;
      }
      toast.success('Warehouse updated');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', warehouseId] });
      router.push(`${LIST_PATH}/${warehouseId}`);
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update warehouse'),
  });

  // Fills street, city, state, country and zipCode from the device's GPS fix.
  // Only empty fields are written, so an address already on file is not silently
  // replaced because the fix landed in a different administrative boundary.
  const { locating, fill } = useFillFromLocation<FormState>();

  const useCurrentLocation = async () => {
    await fill(form, {

      street: 'street',
      city: 'city',
      state: 'state',
      country: 'country',
      zipCode: 'postcode',
    }, (patch) => {
      setForm((prev) => ({ ...prev, ...patch }));
      // Clear any "this field is required" captions the new values satisfied.
      setErrors((prev) => {
        const clean = { ...prev };
        for (const k of Object.keys(patch)) delete clean[k as keyof typeof clean];
        return clean;
      });
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      name: form.name.trim(),
      manager: form.manager.trim(),
      status: form.status,
      capacity: Number(form.capacity),
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
    });
  };

  const handleCancel = () => router.push(`${LIST_PATH}/${warehouseId}`);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {(error as any)?.message || 'Could not load this warehouse.'}
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(LIST_PATH)}>
          Back to Warehouses
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back
        </Button>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Edit Warehouse
        </Typography>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required label="Warehouse Name" value={form.name}
                    onChange={handleChange('name')} error={Boolean(errors.name)} helperText={errors.name}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required label="Manager" value={form.manager}
                    onChange={handleChange('manager')} error={Boolean(errors.manager)} helperText={errors.manager}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="edit-warehouse-status-label">Status</InputLabel>
                    <Select
                      labelId="edit-warehouse-status-label" label="Status"
                      value={form.status} onChange={handleStatusChange}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required type="number" label="Capacity" value={form.capacity}
                    onChange={handleChange('capacity')} error={Boolean(errors.capacity)} helperText={errors.capacity}
                  />
                </Grid>

                <Grid size={12}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Address</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth required label="Street" value={form.street}
                    onChange={handleChange('street')} error={Boolean(errors.street)} helperText={errors.street} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth required label="City" value={form.city}
                    onChange={handleChange('city')} error={Boolean(errors.city)} helperText={errors.city} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="State" value={form.state} onChange={handleChange('state')} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth required label="Country" value={form.country}
                    onChange={handleChange('country')} error={Boolean(errors.country)} helperText={errors.country} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Zip Code" value={form.zipCode} onChange={handleChange('zipCode')} />
                </Grid>
                <Grid size={12}>
                  <Button
                    variant="outlined"
                    startIcon={<MyLocationIcon />}
                    onClick={useCurrentLocation}
                    disabled={locating}
                    sx={{ textTransform: 'none' }}
                  >
                    {locating ? 'Locating...' : 'Use current location to fill the address'}
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Latitude" value={form.latitude} onChange={handleChange('latitude')} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Longitude" value={form.longitude} onChange={handleChange('longitude')} />
                </Grid>

                <Grid size={12}><Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Contact</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth required label="Email" value={form.email}
                    onChange={handleChange('email')} error={Boolean(errors.email)} helperText={errors.email} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth required label="Phone" value={form.phone}
                    onChange={handleChange('phone')} error={Boolean(errors.phone)} helperText={errors.phone} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Alternate Phone" value={form.alternatePhone}
                    onChange={handleChange('alternatePhone')} helperText="Optional" />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button onClick={handleCancel} disabled={mutation.isPending}>Cancel</Button>
                <Button
                  type="submit" variant="contained"
                  disabled={mutation.isPending || !loaded}
                  startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : undefined}
                >
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
