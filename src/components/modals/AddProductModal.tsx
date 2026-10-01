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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormHelperText,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useCreateProduct } from '../../hooks/useProducts';
import { productFiltersService } from '@/api/services/productFilters';
import { productService } from '@/api/services/products';
import { certificationTypeService, type CertificationType } from '@/api/services';
import { toast } from 'react-toastify';
import { primaryCategoryId, type DietaryAttribute } from './buildUpdateProductFormData';
import {
  attachableCertifications,
  attachCertification,
  detachCertificationAt,
  isRetiredCertification,
} from './certificationPicker';

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
    // `specifications` still has no editor UI here - it is declared so the field is
    // threaded through to the multipart body rather than forgotten at the type
    // level. `dietaryAttributes` DID have that gap and now has the same picker the
    // edit form uses, so a product can be created holding its certifications
    // instead of being born empty and needing a second save to attach them.
    specifications: {} as Record<string, string>,
    dietaryAttributes: [] as DietaryAttribute[],
    /**
     * The full set of category `_id`s. Empty at create, unlike the edit form: the
     * links are written after the product exists and has an `_id`.
     */
    categoryIds: [] as string[],
  });

  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use the simplified mutation hook directly
  const createProduct = useCreateProduct();
  const queryClient = useQueryClient();

  /**
   * Real categories, from the same endpoint the edit form uses.
   *
   * This form had a hardcoded array of seven NAMES as `value`s. A name cannot be a
   * ProductCategoryLink `categoryId` - that is a real ObjectId with a `ref` - so a
   * hardcoded list of names cannot produce valid links at all. The ids are also what
   * `Products.category` is supposed to hold, so this replaces an option list that
   * could never have stored a working category.
   */
  const { data: filtersData, isLoading: filtersLoading } = useQuery({
    queryKey: ['productFilters'],
    queryFn: productFiltersService.getFiltersData,
    enabled: open,
  });

  const categoryOptions =
    filtersData?.data?.category?.categories?.map((cat) => ({
      id: cat._id,
      name: cat.name,
    })) || [];

  /**
   * The global catalogue of certifications, on the same query key the edit form and
   * the certifications admin screen use - so all three share one cache entry.
   */
  const { data: certTypesData, isLoading: certTypesLoading } = useQuery({
    queryKey: ['certificationTypes'],
    queryFn: certificationTypeService.getAll,
    enabled: open,
  });

  const certTypes: CertificationType[] = certTypesData?.data ?? [];

  /**
   * Empty at create, so this is the whole catalogue, filtered to the active rows -
   * but it goes through the same helper the edit form uses rather than rendering
   * `certTypes` directly, so "which rows may be attached" and "in what order" is
   * decided in exactly one place. If that rule changes, both forms change.
   */
  const attachableCerts = attachableCertifications(
    certTypes,
    formData.dietaryAttributes
  );

  const addCertification = (cert: CertificationType) => {
    setFormData((prev) => ({
      ...prev,
      dietaryAttributes: attachCertification(prev.dietaryAttributes, cert),
    }));
  };

  /** By index: two chips can carry the same title, and a click means one of them. */
  const removeCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      dietaryAttributes: detachCertificationAt(prev.dietaryAttributes, index),
    }));
  };

  /**
   * Write the links for the freshly created product.
   *
   * Separate from the create call because `/private/products/:id/categories` needs
   * an `_id` that does not exist until the product is created. Awaited inside the
   * submit handler so a failure is surfaced - a product whose categories silently
   * did not save is indistinguishable from one that saved correctly.
   */
  const setCategoriesMutation = useMutation({
    mutationFn: ({ productId, categoryIds }: { productId: string; categoryIds: string[] }) =>
      productService.setProductCategories(productId, categoryIds),
  });

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

    // At least one category. Checked against `categoryIds`, not `category`: the
    // multi-select is the source of truth and `category` is derived from it, so
    // validating the derived field would let through a state where they disagree.
    if (formData.categoryIds.length === 0) {
      newErrors.category = 'At least one category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // `category` is derived, never read from the field directly, so the single-ref
      // field and the link set cannot disagree.
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: primaryCategoryId({ categoryIds: formData.categoryIds }),
        inStock: formData.inStock,
        bannerImage: bannerImage || undefined,
        images: images.length > 0 ? images : undefined,
        // Appended as JSON strings by productService.createProduct.
        specifications: formData.specifications,
        dietaryAttributes: formData.dietaryAttributes,
      };

      const result = await createProduct.mutateAsync(productData);

      if (result?.data) {
        // Only now does the product have an `_id`, so only now can links be
        // written. Awaited and inside the same try: a failure here surfaces to the
        // admin rather than leaving a product with no categories and a success toast
        // already on screen.
        // `Product` declares `_id` only. `id` is not read as a fallback: reading a field
        // the type does not have is how a wrong id gets passed to the links endpoint
        // and 404s there while the product itself saved fine.
        const createdId = result.data._id;
        if (createdId && formData.categoryIds.length > 0) {
          await setCategoriesMutation.mutateAsync({
            productId: createdId,
            categoryIds: formData.categoryIds,
          });
        }

        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success('Product created successfully!');
        onProductAdded(result.data);
        handleClose();
      }
    } catch (error: any) {
      // Was `console.error` only, so a failed create produced no user-visible
      // feedback at all - the dialog stayed open with the form intact and nothing
      // said why.
      toast.error(error?.message || 'Failed to create product');
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      inStock: true,
      specifications: {},
      dietaryAttributes: [],
      categoryIds: [],
    });
    setBannerImage(null);
    setImages([]);
    setErrors({});
    onClose();
  };

  // `string[]` is in the union because categoryIds is an array. Narrowing to
  // `string | boolean` is why `handleInputChange('categoryIds', [...])` could not
  // typecheck, and the cast to `{...prev, [field]: value}` is what makes it sound
  // for a fixed set of known field names.
  const handleInputChange = (
    field: string,
    value: string | boolean | string[]
  ) => {
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
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Categories</InputLabel>
                {/*
                 * Valued on category `_id`s, matching the edit form. A product
                 * created with the old hardcoded name list could not produce valid
                 * ProductCategoryLink rows at all, since `categoryId` is a real
                 * ObjectId with a `ref`.
                 */}
                <Select
                  multiple
                  label="Categories"
                  value={formData.categoryIds}
                  onChange={(e) => {
                    const next = e.target.value as string[];
                    handleInputChange('categoryIds', next);
                    handleInputChange(
                      'category',
                      primaryCategoryId({ categoryIds: next })
                    );
                  }}
                  disabled={filtersLoading}
                  renderValue={(selected) =>
                    (selected as string[])
                      .map(
                        (id) =>
                          categoryOptions.find((c) => c.id === id)?.name ?? id
                      )
                      .join(', ')
                  }
                >
                  {categoryOptions.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Checkbox
                        size="small"
                        checked={formData.categoryIds.includes(category.id)}
                      />
                      <ListItemText primary={category.name} />
                    </MenuItem>
                  ))}
                </Select>
                {/*
                 * Outside the Select: MUI's Select takes no `helperText`, and this
                 * message is load-bearing - it names which category the single-ref
                 * `Products.category` field will hold, which is otherwise invisible.
                 */}
                <FormHelperText error={!!errors.category}>
                  {errors.category ||
                    (formData.categoryIds.length > 0
                      ? `Primary: ${
                          categoryOptions.find(
                            (c) => c.id === formData.categoryIds[0]
                          )?.name ?? formData.categoryIds[0]
                        }`
                      : ' ')}
                </FormHelperText>
              </FormControl>
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

          {/*
           * The same picker `EditProductModal` uses, and the same helper module
           * behind it. Its `logo` is an icon NAME and its link is the catalogue's
           * PDF, neither of which is editable per product - the whole field is a
           * selection, so it is presented as one rather than as three free-text
           * boxes that could store a value the storefront cannot render.
           */}
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}
            >
              Certifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Certification</InputLabel>
                <Select
                  value=""
                  displayEmpty
                  onChange={(e) => {
                    const picked = attachableCerts.find(
                      (c) => c._id === e.target.value
                    );
                    // Looked up out of `attachableCerts` rather than trusted from
                    // the event: a re-render between the click and this handler can
                    // leave a stale id, and `undefined.name` would take the dialog
                    // down.
                    if (picked) addCertification(picked);
                  }}
                  label="Select Certification"
                  disabled={certTypesLoading || attachableCerts.length === 0}
                >
                  {attachableCerts.map((cert) => (
                    <MenuItem key={cert._id} value={cert._id}>
                      {cert.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={() => {
                  const picked = attachableCerts[0];
                  if (picked) addCertification(picked);
                }}
                disabled={certTypesLoading || attachableCerts.length === 0}
              >
                Add
              </Button>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                minHeight: 40,
                mb: 1,
              }}
            >
              {formData.dietaryAttributes.length === 0 ? (
                <Typography variant="caption" color="textSecondary">
                  No certifications attached
                </Typography>
              ) : (
                formData.dietaryAttributes.map((attr, index) => (
                  <Chip
                    key={`${attr.title}-${index}`}
                    label={attr.title}
                    onDelete={() => removeCertification(index)}
                    color="primary"
                    variant="outlined"
                  />
                ))
              )}
            </Box>
            <FormHelperText>
              {formData.dietaryAttributes.length === 0
                ? 'Optional. Only certifications still active in the catalogue can be attached.'
                : `${formData.dietaryAttributes.length} attached. The icon name and the PDF link come from the catalogue.`}
            </FormHelperText>
          </Box>

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
