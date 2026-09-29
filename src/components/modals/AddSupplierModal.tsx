import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import ReactSelect from 'react-select';
import {
  supplierService,
  CreateSupplierRequest,
} from '../../api/services/suppliers';
import { toast } from 'react-hot-toast';
import { SUPPLIER_PAYMENT_METHODS } from '@/constants/suppliers';

interface AddSupplierModalProps {
  open: boolean;
  onClose: () => void;
  onSupplierAdded: (supplier: any) => void;
}

const reactSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '40px',
    border: state.isFocused ? '2px solid #1976d2' : '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: state.isFocused ? '0 0 0 1px #1976d2' : 'none',
    '&:hover': {
      border: '1px solid #1976d2',
    },
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#1976d2'
      : state.isFocused
        ? '#f5f5f5'
        : 'white',
    color: state.isSelected ? 'white' : '#333',
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: '"Poppins", sans-serif',
  }),
  menu: (provided: any) => ({
    ...provided,
    zIndex: 9999,
    fontFamily: '"Poppins", sans-serif',
  }),
  singleValue: (provided: any) => ({
    ...provided,
    fontFamily: '"Poppins", sans-serif',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    fontFamily: '"Poppins", sans-serif',
    color: '#666',
  }),
  input: (provided: any) => ({
    ...provided,
    fontFamily: '"Poppins", sans-serif',
  }),
};

const countries = [
  { value: 'UAE', label: 'United Arab Emirates' },
  { value: 'USA', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'China', label: 'China' },
  { value: 'India', label: 'India' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
];

const paymentMethods = SUPPLIER_PAYMENT_METHODS.map((m) => ({ value: m, label: m }));

export default function AddSupplierModal({
  open,
  onClose,
  onSupplierAdded,
}: AddSupplierModalProps) {
  const [formData, setFormData] = useState<CreateSupplierRequest>({
    name: '',
    country: '',
    email: '',
    phone: '',
    address: '',
    payment_method: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supplierService.createSupplier(formData);

      if (response.success && response.data) {
        toast.success('Supplier added successfully!');
        onSupplierAdded(response.data);
        handleClose();
      } else {
        toast.error(response.message || 'Failed to add supplier');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      country: '',
      email: '',
      phone: '',
      address: '',
      payment_method: '',
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (
    field: keyof CreateSupplierRequest,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Supplier</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
              Supplier Name *
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="Enter supplier name"
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
              Country *
            </Typography>
            <ReactSelect
              value={
                countries.find((c) => c.value === formData.country) || null
              }
              onChange={(selectedOption: any) =>
                handleInputChange('country', selectedOption?.value || '')
              }
              options={countries}
              placeholder="Select country"
              isClearable
              styles={reactSelectStyles}
              isSearchable
            />
            {errors.country && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.country}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
              Email *
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              placeholder="Enter email address"
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
              Phone Number *
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              placeholder="Enter phone number"
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
              Address *
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              error={!!errors.address}
              helperText={errors.address}
              placeholder="Enter complete address"
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
              Payment Method *
            </Typography>
            <ReactSelect
              value={
                paymentMethods.find(
                  (p) => p.value === formData.payment_method
                ) || null
              }
              onChange={(selectedOption: any) =>
                handleInputChange('payment_method', selectedOption?.value || '')
              }
              options={paymentMethods}
              placeholder="Select payment method"
              isClearable
              styles={reactSelectStyles}
              isSearchable
            />
            {errors.payment_method && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.payment_method}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          sx={{
            bgcolor: '#FFA500',
            color: '#fff',
            '&:hover': { bgcolor: '#FF8C00' },
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: '#fff' }} />
              Adding...
            </>
          ) : (
            'Add Supplier'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
