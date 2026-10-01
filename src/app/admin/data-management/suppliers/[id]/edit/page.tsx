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
import { supplierService } from '@/api/services/suppliers';
import { useFillFromLocation } from '@/hooks/useFillFromLocation';
import { SUPPLIER_PAYMENT_METHODS } from '@/constants/suppliers';

const LIST_PATH = '/admin/data-management/suppliers';

interface FormState {
  name: string;
  country: string;
  email: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
  payment_method: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  country: '',
  email: '',
  phone: '',
  address: '',
  latitude: '',
  longitude: '',
  payment_method: 'UPI',
};

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const supplierId = params.id as string;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loaded, setLoaded] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => supplierService.getSupplierById(supplierId),
    enabled: Boolean(supplierId),
  });

  useEffect(() => {
    if (loaded) return;
    const raw = (data as any)?.data ?? (data as any)?.supplier ?? data;
    const s: any = Array.isArray(raw) ? raw[0] : raw;
    if (!s) return;
    setForm({
      name: s.name ?? '',
      country: s.country ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
      latitude: s.latitude ?? '',
      longitude: s.longitude ?? '',
          payment_method: s.payment_method || SUPPLIER_PAYMENT_METHODS[0],
    });
    setLoaded(true);
  }, [data, loaded]);

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handlePaymentChange = (event: SelectChangeEvent<string>) => {
    setForm((prev) => ({ ...prev, payment_method: event.target.value }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Supplier name is required';
    if (!form.country.trim()) next.country = 'Country is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    if (!form.address.trim()) next.address = 'Address is required';
    if (!form.latitude.trim()) next.latitude = 'Latitude is required';
    if (!form.longitude.trim()) next.longitude = 'Longitude is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: Partial<FormState>) => supplierService.updateSupplier(supplierId, payload),
    onSuccess: (response: any) => {
      if (response?.success === false) {
        toast.error(response.error || response.message || 'Failed to update supplier');
        return;
      }
      toast.success('Supplier updated');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      router.push(`${LIST_PATH}/${supplierId}`);
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update supplier'),
  });

  // Fills the free-text address and the country from the device's GPS fix, plus
  // latitude/longitude. Suppliers have no separate city/state/postcode fields, so
  // the geocoder's one-line formatted address is what lands in `address`. Only
  // empty fields are written.
  const { locating, fill } = useFillFromLocation<FormState>();

  const useCurrentLocation = async () => {
    await fill(form, {

      address: 'formattedAddress',
      country: 'country',
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
      country: form.country.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
      payment_method: form.payment_method,
    });
  };

  const handleCancel = () => router.push(`${LIST_PATH}/${supplierId}`);

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
          {(error as any)?.message || 'Could not load this supplier.'}
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(LIST_PATH)}>
          Back to Suppliers
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
          Edit Supplier
        </Typography>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required label="Supplier Name" value={form.name}
                    onChange={handleChange('name')} error={Boolean(errors.name)} helperText={errors.name}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required label="Country" value={form.country}
                    onChange={handleChange('country')} error={Boolean(errors.country)} helperText={errors.country}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required label="Email" value={form.email}
                    onChange={handleChange('email')} error={Boolean(errors.email)} helperText={errors.email}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required label="Phone" value={form.phone}
                    onChange={handleChange('phone')} error={Boolean(errors.phone)} helperText={errors.phone}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="edit-supplier-payment-label">Payment Method</InputLabel>
                    <Select
                      labelId="edit-supplier-payment-label" label="Payment Method"
                      value={form.payment_method} onChange={handlePaymentChange}
                    >
                      {SUPPLIER_PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method} value={method}>
                          {method}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required label="Address" value={form.address}
                    onChange={handleChange('address')} error={Boolean(errors.address)} helperText={errors.address}
                  />
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
                  <TextField
                    fullWidth required label="Latitude" value={form.latitude}
                    onChange={handleChange('latitude')} error={Boolean(errors.latitude)} helperText={errors.latitude}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth required label="Longitude" value={form.longitude}
                    onChange={handleChange('longitude')} error={Boolean(errors.longitude)} helperText={errors.longitude}
                  />
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
