import React, { useState, useRef } from 'react';
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
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import ReactSelect from 'react-select';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useCreateProduct } from '../../hooks/useProducts';

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onProductAdded: (product: any) => void;
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

const categories = [
  { value: 'Amino Acids', label: 'Amino Acids' },
  { value: 'Vitamins', label: 'Vitamins' },
  { value: 'Supplements', label: 'Supplements' },
  { value: 'Protein', label: 'Protein' },
  { value: 'Pre-workout', label: 'Pre-workout' },
  { value: 'Chemicals', label: 'Chemicals' },
  { value: 'Raw Materials', label: 'Raw Materials' },
];

export default function AddProductModal({
  open,
  onClose,
  onProductAdded,
}: AddProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    inStock: true,
  });

  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use the simplified mutation hook directly
  const createProduct = useCreateProduct();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        inStock: formData.inStock,
        bannerImage: bannerImage || undefined,
        images: images.length > 0 ? images : undefined,
      };

      const result = await createProduct.mutateAsync(productData);

      if (result?.data) {
        onProductAdded(result.data);
        handleClose();
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      inStock: true,
    });
    setBannerImage(null);
    setImages([]);
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBannerUpload = () => {
    bannerInputRef.current?.click();
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBannerImage(file);
    }
  };

  const handleRemoveBanner = () => {
    setBannerImage(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif' }}>
        Add New Product
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                error={!!errors.price}
                helperText={errors.price}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                error={!!errors.description}
                helperText={errors.description}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ReactSelect
                options={categories}
                value={categories.find(
                  (cat) => cat.value === formData.category
                )}
                onChange={(option) =>
                  handleInputChange('category', option?.value || '')
                }
                placeholder="Select Category"
                styles={reactSelectStyles}
                isSearchable
              />
              {errors.category && (
                <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                  {errors.category}
                </Typography>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.inStock}
                    onChange={(e) =>
                      handleInputChange('inStock', e.target.checked)
                    }
                  />
                }
                label="In Stock"
              />
            </Grid>
          </Grid>

          {/* Banner Image Upload */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}
            >
              Banner Image
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={handleBannerUpload}
              >
                Upload Banner
              </Button>
              {bannerImage && (
                <Chip
                  label={bannerImage.name}
                  onDelete={handleRemoveBanner}
                  color="primary"
                />
              )}
            </Box>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              style={{ display: 'none' }}
            />
          </Box>

          {/* Additional Images Upload */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}
            >
              Additional Images
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={handleFileUpload}
              >
                Upload Images
              </Button>
            </Box>
            {images.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {images.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => handleRemoveFile(index)}
                    color="secondary"
                  />
                ))}
              </Box>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createProduct.isPending}
          startIcon={
            createProduct.isPending ? <CircularProgress size={20} /> : null
          }
        >
          {createProduct.isPending ? 'Creating...' : 'Create Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
