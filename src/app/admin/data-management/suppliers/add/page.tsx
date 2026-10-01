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
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  supplierService,
  type CreateSupplierRequest,
} from '@/api/services/suppliers';
import { toast } from 'react-toastify';
import { SUPPLIER_PAYMENT_METHODS } from '@/constants/suppliers';

type Field =
  | 'name'
  | 'country'
  | 'email'
  | 'phone'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'payment_method';

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

// Mirrors the filter options in the suppliers listing page.
// Declared before INITIAL_FORM, which references PAYMENT_OPTIONS[0].
const PAYMENT_OPTIONS = [...SUPPLIER_PAYMENT_METHODS];

const INITIAL_FORM: FormState = {
  name: '',
  country: '',
  email: '',
  phone: '',
  address: '',
  latitude: '',
  longitude: '',
  // Preselect the first option. Leaving this empty meant a user who filled in
  // every visible text field still got "Payment method is required" from
  // validate() and the submit silently did nothing, because the only clue was a
  // caption under a dropdown they had no reason to think was mandatory.
  payment_method: PAYMENT_OPTIONS[0],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddSupplierPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleChange =
    (field: Field) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const next: Partial<Record<Field, string>> = {};

    if (!form.name.trim()) next.name = 'Supplier name is required';
    if (!form.country.trim()) next.country = 'Country is required';
    if (!form.address.trim()) next.address = 'Address is required';
    if (!form.payment_method) next.payment_method = 'Payment method is required';

    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      next.email = 'Enter a valid email address';
    }

    if (!form.phone.trim()) next.phone = 'Phone number is required';

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

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateSupplierRequest) =>
      supplierService.createSupplier(payload),
    onSuccess: (response) => {
      if (response?.success === false) {
        toast.error(response?.error || 'Failed to create supplier');
        return;
      }
      toast.success('Supplier created successfully');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      router.push('/admin/data-management/suppliers');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create supplier');
    },
  });

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

  const handleCancel = () => {
    router.push('/admin/data-management/suppliers');
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Suppliers
        </Button>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
          Add Supplier
        </Typography>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Supplier Name"
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

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    minRows={3}
                    label="Address"
                    value={form.address}
                    onChange={handleChange('address')}
                    error={Boolean(errors.address)}
                    helperText={errors.address}
                  />
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

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.payment_method)}>
                    <InputLabel id="payment-method-label">Payment Method</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      label="Payment Method"
                      value={form.payment_method}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          payment_method: event.target.value as string,
                        }));
                        setErrors((prev) => ({ ...prev, payment_method: undefined }));
                      }}
                    >
                      {PAYMENT_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.payment_method && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ ml: 2, mt: 0.5 }}
                      >
                        {errors.payment_method}
                      </Typography>
                    )}
                  </FormControl>
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
                  {mutation.isPending ? 'Creating...' : 'Create Supplier'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
