'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import {
  CustomerAddress,
  AddAddressRequest,
  customerAddressService,
} from '@/api/services/customerAddresses';

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: string;
  address?: CustomerAddress | null;
  mode: 'add' | 'edit';
}

interface FormData {
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

const initialFormData: FormData = {
  type: 'home',
  street: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  isDefault: false,
};

export default function AddressModal({
  open,
  onClose,
  onSuccess,
  customerId,
  address,
  mode,
}: AddressModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or address changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && address) {
        setFormData({
          type: address.type,
          street: address.street,
          city: address.city,
          state: address.state,
          country: address.country,
          zipCode: address.zipCode,
          isDefault: address.isDefault,
        });
      } else {
        setFormData(initialFormData);
      }
      setError(null);
    }
  }, [open, address, mode]);

  const handleInputChange =
    (field: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === 'isDefault'
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSelectChange = (field: keyof FormData) => (event: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.street.trim()) {
      setError('Street address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.state.trim()) {
      setError('State is required');
      return false;
    }
    if (!formData.country.trim()) {
      setError('Country is required');
      return false;
    }
    if (!formData.zipCode.trim()) {
      setError('Zip code is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const addressData: AddAddressRequest = {
        type: formData.type,
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        zipCode: formData.zipCode.trim(),
        isDefault: formData.isDefault,
      };

      if (mode === 'add') {
        await customerAddressService.addAddress(customerId, addressData);
      } else if (mode === 'edit' && address?._id) {
        await customerAddressService.updateAddress(
          customerId,
          address._id,
          addressData
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">
          {mode === 'add' ? 'Add New Address' : 'Edit Address'}
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Address Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Address Type</InputLabel>
              <Select
                value={formData.type}
                onChange={handleSelectChange('type')}
                label="Address Type"
                disabled={loading}
              >
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Default Address Checkbox */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={handleInputChange('isDefault')}
                  disabled={loading}
                />
              }
              label="Set as default address"
              sx={{ mt: 2 }}
            />
          </Grid>

          {/* Street Address */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.street}
              onChange={handleInputChange('street')}
              margin="normal"
              required
              disabled={loading}
              placeholder="Enter your street address"
            />
          </Grid>

          {/* City */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="City"
              value={formData.city}
              onChange={handleInputChange('city')}
              margin="normal"
              required
              disabled={loading}
              placeholder="Enter city"
            />
          </Grid>

          {/* State */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="State/Province"
              value={formData.state}
              onChange={handleInputChange('state')}
              margin="normal"
              required
              disabled={loading}
              placeholder="Enter state or province"
            />
          </Grid>

          {/* Country */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Country"
              value={formData.country}
              onChange={handleInputChange('country')}
              margin="normal"
              required
              disabled={loading}
              placeholder="Enter country"
            />
          </Grid>

          {/* Zip Code */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Zip/Postal Code"
              value={formData.zipCode}
              onChange={handleInputChange('zipCode')}
              margin="normal"
              required
              disabled={loading}
              placeholder="Enter zip or postal code"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading
            ? 'Saving...'
            : mode === 'add'
              ? 'Add Address'
              : 'Update Address'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
