'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  Checkbox,
  ListItemText,
  FormHelperText,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ViewList as ViewListIcon,
  Info as InfoIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { productService } from '@/api/services/products';
import { productFiltersService } from '@/api/services';
import {
  buildUpdateProductFormData,
  primaryCategoryId,
  type DietaryAttribute,
} from './buildUpdateProductFormData';
import {
  specToRows,
  specRowAdded,
  specRowUpdated,
  specRowRemoved,
  rowsToSpec,
  type SpecRow,
} from './specRows';

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  product: {
    _id: string;
    uniqueId: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    inStock: boolean;
    images?: string[];
    bannerImage?: string;
    status: string;
    moq?: number;
    unit?: string;
    tags?: string[];
    appearance?: string;
    dietaryAttributes?: DietaryAttribute[];
    /** Free-form spec rows. Keys are preserved verbatim, trailing space included. */
    specifications?: Record<string, string>;
    applications?: string[];
    functions?: string[];
    countryOfOrigin?: string[];
  };
}

export default function EditProductModal({
  open,
  onClose,
  product,
}: EditProductModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    inStock: true,
    status: 'active',
    moq: 0,
    unit: '',
    appearance: '',
    /**
     * The full set of category `_id`s. `category` above stays the primary, which
     * is what product.service.ts:104 filters on and the products table reads; this
     * is what becomes the ProductCategoryLink rows.
     */
    categoryIds: [] as string[],
    tags: [] as string[],
    specifications: {} as Record<string, string>,
    dietaryAttributes: [] as DietaryAttribute[],
    applications: [] as string[],
    functions: [] as string[],
    countryOfOrigin: [] as string[],
    bannerImage: '',
    images: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [applicationInput, setApplicationInput] = useState('');
  const [functionInput, setFunctionInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [bannerImageInput, setBannerImageInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  /**
   * Editing buffer for the specifications editor. `formData.specifications` is
   * what actually gets saved; the rows are what is on screen. They are kept in
   * step by `applySpecRows` and by the field blur handlers, and read straight
   * from the buffer in `handleSubmit` so an edit cannot be lost by not having
   * blurred the field it was typed into.
   */
  const [specRows, setSpecRows] = useState<SpecRow[]>(() => specToRows());

  // Fetch filter data
  const { data: filtersData, isLoading: filtersLoading } = useQuery({
    queryKey: ['productFilters'],
    queryFn: productFiltersService.getFiltersData,
    enabled: open, // Only fetch when modal is open
  });

  /**
   * The product's existing category links, so the multi-select opens showing what is
   * actually stored rather than blank.
   *
   * Fetched separately from `product`, because `Products.category` is a single ref
   * and the other links only exist in ProductCategoryLink. Without this the select
   * would render empty for a product in six categories, and the admin's first save
   * would replace all six with whatever the (apparently empty) form showed.
   */
  const { data: productCategoriesData } = useQuery({
    queryKey: ['productCategories', product._id],
    queryFn: () => productService.getProductCategories(product._id),
    enabled: open && !!product._id,
  });

  // The links may arrive AFTER the form was initialised from `product`, so this is
  // seeded from the query result too. `?? []` rather than a fallback to
  // `[product.category]`: a half-known set that silently seeds one category would
  // make the next save drop the other five.
  const storedCategoryIds: string[] =
    productCategoriesData?.categories?.map((c) => c._id) ?? [];

  // Unit options
  const unitOptions = [
    'kg',
    'g',
    'lb',
    'oz',
    'L',
    'ml',
    'gal',
    'qt',
    'pt',
    'fl oz',
    'piece',
    'pack',
    'box',
    'bottle',
    'can',
    'jar',
    'tube',
    'sachet',
    'tablet',
    'capsule',
  ];

  /**
   * Category options from the API, as `{ _id, name }`.
   *
   * The value is the `_id`, not the name. The single-category version of this
   * control mapped over `.name` and used the NAME as the value, so it stored a
   * label where the schema wants an id - which is why the multi-select has to carry
   * `_id` through: ProductCategoryLink has a real ObjectId `categoryId` with a
   * `ref`, and a name would cast to a malformed ObjectId that resolves to nothing.
   */
  const categoryOptions =
    filtersData?.data?.category?.categories?.map((cat) => ({
      id: cat._id,
      name: cat.name,
    })) || [];

  // Country options from API
  const countryOptions =
    filtersData?.data?.countryOfOrigin?.map((country) => country.name) || [];

  // Initialize form data when product changes.
  //
  // `categoryIds` is seeded from the links query when it has arrived, and falls
  // back to the single primary otherwise. The fallback matters: this effect runs on
  // `product`, which is available immediately, while the links query is not, so
  // without it the multi-select would flash empty. The second effect below
  // reconciles once the links land.
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        category: product.category || '',
        categoryIds:
          storedCategoryIds.length > 0
            ? storedCategoryIds
            : product.category
              ? [product.category]
              : [],
        inStock: product.inStock ?? true,
        status: product.status || 'active',
        moq: product.moq || 0,
        unit: product.unit || '',
        appearance: product.appearance || '',
        tags: product.tags || [],
        specifications: product.specifications ?? {},
        // Was a hardcoded [], so every stored certificate was invisible to the
        // form and the next save looked like a delete.
        dietaryAttributes: product.dietaryAttributes ?? [],
        applications: product.applications || [],
        functions: product.functions || [],
        countryOfOrigin: product.countryOfOrigin || [],
        bannerImage: product.bannerImage || '',
        images: product.images || [],
      });
      // Same effect, for the specifications buffer. Not `useState` initialisation:
      // the modal is reused across products, so an admin who opens a second
      // product must see that product's spec sheet, not the first one's.
      setSpecRows(specToRows(product.specifications));
    }
  }, [product]);

  /**
   * Reconcile the multi-select once the stored links arrive.
   *
   * Deliberately NOT merged with the effect above: that one runs on `product`
   * alone, and folding this in would either wait for the links before showing
   * anything at all, or re-seed the select on every refetch and discard what the
   * admin has picked.
   *
   * The `open` guard is what stops this from clobbering an in-progress selection
   * when the query refetches in the background - a refetch while the dialog is open
   * would otherwise reset the select to the stored set mid-edit.
   */
  useEffect(() => {
    if (!open || !productCategoriesData?.categories) return;
    setFormData((prev) => ({
      ...prev,
      categoryIds: productCategoriesData.categories!.map((c) => c._id),
      // Keep the primary pointing at a category that still exists. If the stored
      // primary is not in the link set, fall back to the first link so
      // Products.category is never left naming a category the links do not include.
      category: productCategoriesData.categories!.some(
        (c) => c._id === prev.category
      )
        ? prev.category
        : (productCategoriesData.categories![0]?._id ?? ''),
    }));
  }, [open, productCategoriesData]);

  /**
 * Write the category links.
 *
 * Separate from the product update because it is a different endpoint on a
 * different resource: the product write is multipart (it carries images), the link
 * write is JSON against `/private/products/:id/categories`. Sequencing them
 * explicitly - rather than fire-and-forget - is what lets the admin be told when the
 * links failed. A product whose six categories silently did not save looks exactly
 * like one that saved correctly until someone goes looking.
 *
 * `PUT` replaces wholesale, so this is always given the FULL set. Passing a subset
 * would remove the rest, and passing nothing would clear every link.
 */
  const setCategoriesMutation = useMutation({
    mutationFn: (categoryIds: string[]) =>
      productService.setProductCategories(product._id, categoryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories', product._id] });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      // Awaited, not fired alongside: a failure in either half must not be
      // reported as a successful save.
      const response = await productService.updateProduct(product._id, data);
      await setCategoriesMutation.mutateAsync(formData.categoryIds);
      return response;
    },
    onSuccess: () => {
      toast.success('Product updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update product');
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddApplication = () => {
    if (
      applicationInput.trim() &&
      !formData.applications.includes(applicationInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        applications: [...prev.applications, applicationInput.trim()],
      }));
      setApplicationInput('');
    }
  };

  const handleRemoveApplication = (applicationToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      applications: prev.applications.filter(
        (app) => app !== applicationToRemove
      ),
    }));
  };

  const handleAddFunction = () => {
    if (
      functionInput.trim() &&
      !formData.functions.includes(functionInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        functions: [...prev.functions, functionInput.trim()],
      }));
      setFunctionInput('');
    }
  };

  const handleRemoveFunction = (functionToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      functions: prev.functions.filter((func) => func !== functionToRemove),
    }));
  };

  const handleAddCountry = () => {
    if (
      countryInput.trim() &&
      !formData.countryOfOrigin.includes(countryInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        countryOfOrigin: [...prev.countryOfOrigin, countryInput.trim()],
      }));
      setCountryInput('');
    }
  };

  const handleRemoveCountry = (countryToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      countryOfOrigin: prev.countryOfOrigin.filter(
        (country) => country !== countryToRemove
      ),
    }));
  };

  const handleAddImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput.trim()],
      }));
      setImageInput('');
    }
  };

  const handleRemoveImage = (imageToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image !== imageToRemove),
    }));
  };

  /**
   * The single place the specifications buffer becomes form state, so a row can
   * never be on screen without being in the payload.
   *
   * `rowsToSpec` drops keyless rows and normalises nothing else - no case
   * folding, no whitespace collapsing, and not even a trim, because the migrated
   * data holds both "Shelf Life " and "Shelf Life" and merging them would drop a
   * spec on every save.
   */
  const applySpecRows = (rows: SpecRow[]) => {
    setSpecRows(rows);
    handleInputChange('specifications', rowsToSpec(rows));
  };

  const commitSpecRows = () => {
    handleInputChange('specifications', rowsToSpec(specRows));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    // Create FormData for multipart/form-data.
    //
    // The builder is the whole payload: `applications`, `functions`,
    // `countryOfOrigin` and `tags` go out verbatim, as do `specifications`,
    // `dietaryAttributes` and `images`, each sent even when empty - the server
    // treats an absent key as "leave alone", so omitting an emptied field would
    // silently undo the admin's delete.
    //
    // Nothing here slugifies. `handleSubmit` used to convert these four lists to
    // slugs against `filtersData`, so a migrated value like "CAS No: 14281-83-5"
    // became "cas-no-14281-83-5" on the first save - destroying the CAS number,
    // with a success toast and nothing in the log. `filtersData` still fills the
    // pickers above; it must never touch the values on the way out.
    //
    // `specifications` is taken from the editor buffer rather than from
    // formData, so a row that was typed into but never blurred is still saved.
    //
    // `category` is NOT passed through: the builder derives the primary from
    // `categoryIds` via `primaryCategoryId`, so a stale `category` cannot disagree
    // with the multi-select and leave Products.category pointing at a category the
    // admin just removed.
    const formDataToSend = buildUpdateProductFormData({
      ...formData,
      category: '',
      specifications: rowsToSpec(specRows),
    });

    updateProductMutation.mutate(formDataToSend);
  };

  const handleClose = () => {
    setTagInput('');
    setApplicationInput('');
    setFunctionInput('');
    setCountryInput('');
    setBannerImageInput('');
    setImageInput('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '85vh',
          width: '90vw',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', color: '#1F2A44' }}
          >
            Edit Product
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
            {product?.uniqueId}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: '#ffffff' }}>
        {filtersLoading && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Loading filter data...
            </Typography>
          </Box>
        )}
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Row 1: Basic Information - Full Width */}
            <Box sx={{ width: '100%' }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      color: '#1F2A44',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '1.1rem',
                    }}
                  >
                    <InfoIcon sx={{ fontSize: '1rem' }} />
                    Basic Information
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                    {/* Left Column */}
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      <TextField
                        fullWidth
                        label="Product Name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange('name', e.target.value)
                        }
                        required
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Price"
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          handleInputChange(
                            'price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>

                    {/* Right Column */}
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      <TextField
                        fullWidth
                        label="Description"
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange('description', e.target.value)
                        }
                        multiline
                        rows={4}
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <FormControl fullWidth size="small">
                        <InputLabel>Categories</InputLabel>
                        {/*
                         * `multiple`, valued on category `_id`s.

                         * The value is the id, not the name. ProductCategoryLink
                         * declares `categoryId` as a real ObjectId with a `ref` to
                         * Categories, so a name here would cast to a malformed
                         * ObjectId and produce a link row that resolves to nothing -
                         * the exact silently-dangling-reference failure the server's
                         * parseCategoryIds exists to prevent. An id that is not in
                         * the options list is filtered out by renderValue below
                         * rather than shown as a blank chip.
                         */}
                        <Select
                          multiple
                          value={formData.categoryIds}
                          onChange={(e) => {
                            const next = e.target.value as string[];
                            handleInputChange('categoryIds', next);
                            // Keep the primary in step with the selection so the
                            // single-ref field and the link set never disagree.
                            handleInputChange(
                              'category',
                              primaryCategoryId({ categoryIds: next })
                            );
                          }}
                          label="Categories"
                          disabled={filtersLoading}
                          renderValue={(selected) =>
                            (selected as string[])
                              .map((id) => categoryOptions.find((c) => c.id === id)?.name ?? id)
                              .join(', ')
                          }
                          sx={{
                            borderRadius: 2,
                          }}
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
                         * The first selected category is the primary. Said out loud
                         * in the UI because `Products.category` is still a single
                         * ref and the products table shows only that one - an admin
                         * would otherwise have no way to know which category the
                         * storefront's category filter would match.
                         */}
                        <FormHelperText>
                          {formData.categoryIds.length > 0
                            ? `Primary: ${
                                categoryOptions.find(
                                  (c) => c.id === formData.categoryIds[0]
                                )?.name ?? formData.categoryIds[0]
                              }`
                            : 'No categories selected'}
                        </FormHelperText>
                      </FormControl>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Row 2: Product Details - Full Width */}
            <Box sx={{ width: '100%' }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      color: '#1F2A44',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '1.1rem',
                    }}
                  >
                    <CategoryIcon sx={{ fontSize: '1rem' }} />
                    Product Details
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                    {/* Left Column */}
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      <FormControl fullWidth size="small">
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={formData.unit}
                          onChange={(e) =>
                            handleInputChange('unit', e.target.value)
                          }
                          label="Unit"
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          {unitOptions.map((unit) => (
                            <MenuItem key={unit} value={unit}>
                              {unit}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label="Minimum Order Quantity (MOQ)"
                        type="number"
                        value={formData.moq}
                        onChange={(e) =>
                          handleInputChange(
                            'moq',
                            parseInt(e.target.value) || 0
                          )
                        }
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>

                    {/* Right Column */}
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                      }}
                    >
                      <TextField
                        fullWidth
                        label="Appearance"
                        value={formData.appearance}
                        onChange={(e) =>
                          handleInputChange('appearance', e.target.value)
                        }
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={formData.status}
                          onChange={(e) =>
                            handleInputChange('status', e.target.value)
                          }
                          label="Status"
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Specifications - Form, Color, Packaging, Purity/Assay, Shelf Life.
                A free key/value list rather than named fields: the migrated data's
                keys are inconsistent ("Purity/Assay" vs "Purity assay"), so a fixed
                set of inputs would hide rows the catalogue actually has. Its own
                full-width card because two inputs plus a chip and a button per row
                do not fit the half-width column this sits under. */}
            <Box sx={{ width: '100%' }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      color: '#1F2A44',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '1.1rem',
                    }}
                  >
                    <ViewListIcon sx={{ fontSize: '1rem' }} />
                    Specifications
                  </Typography>

                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {specRows.map((row, index) => (
                      <Box
                        key={index}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <TextField
                          label="Key"
                          value={row.key}
                          onChange={(e) => {
                            const { value } = e.target;
                            setSpecRows((prev) =>
                              specRowUpdated(prev, index, { key: value })
                            );
                          }}
                          onBlur={commitSpecRows}
                          size="small"
                          sx={{
                            flex: 2,
                            '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          }}
                        />
                        <TextField
                          label="Value"
                          value={row.value}
                          onChange={(e) => {
                            const { value } = e.target;
                            setSpecRows((prev) =>
                              specRowUpdated(prev, index, { value })
                            );
                          }}
                          onBlur={commitSpecRows}
                          size="small"
                          sx={{
                            flex: 3,
                            '& .MuiOutlinedInput-root': { borderRadius: 2 },
                          }}
                        />
                        {/* Delete commits as well as removing the row: a
                            buffer-only delete would come straight back on the
                            next save. */}
                        <Chip
                          label={row.key || 'new row'}
                          onDelete={() =>
                            applySpecRows(specRowRemoved(specRows, index))
                          }
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 2 }}
                        />
                        <IconButton
                          onClick={commitSpecRows}
                          size="small"
                          aria-label={`Save specification row ${
                            row.key || index + 1
                          }`}
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="outlined"
                    onClick={() => applySpecRows(specRowAdded(specRows))}
                    size="small"
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    Add Row
                  </Button>
                </CardContent>
              </Card>
            </Box>

            {/* Row 3: Status & Tags - Full Width */}
            <Box sx={{ width: '100%' }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      color: '#1F2A44',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '1.1rem',
                    }}
                  >
                    <ViewListIcon sx={{ fontSize: '1rem' }} />
                    Status & Tags
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                    {/* Left Column */}
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      {/* Stock Status */}
                      <Box>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontWeight: 600, mb: 1, fontSize: '0.85rem' }}
                        >
                          Stock Status
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.inStock}
                              onChange={(e) =>
                                handleInputChange('inStock', e.target.checked)
                              }
                              sx={{
                                '& .MuiSwitch-switchBase': {
                                  '&.Mui-checked': {
                                    color: '#4caf50',
                                    '& + .MuiSwitch-track': {
                                      backgroundColor: '#4caf50',
                                    },
                                  },
                                },
                              }}
                            />
                          }
                          label={formData.inStock ? 'In Stock' : 'Out of Stock'}
                          sx={{
                            margin: 0,
                            alignItems: 'center',
                            '& .MuiFormControlLabel-label': {
                              fontWeight: 500,
                              color: formData.inStock ? '#2e7d32' : '#d32f2f',
                            },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Right Column */}
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      {/* Tags Section */}
                      <Box>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          Product Tags
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <TextField
                            label="Add Tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            size="small"
                            sx={{
                              flexGrow: 1,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleAddTag}
                            disabled={!tagInput.trim()}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              backgroundColor: '#1976d2',
                              '&:hover': { backgroundColor: '#1565c0' },
                              minWidth: 'auto',
                              px: 2,
                            }}
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
                          }}
                        >
                          {formData.tags.length === 0 ? (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ alignSelf: 'center' }}
                            >
                              No tags added yet
                            </Typography>
                          ) : (
                            formData.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                onDelete={() => handleRemoveTag(tag)}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                              />
                            ))
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Row 4: Additional Fields - Full Width */}
            <Box sx={{ width: '100%' }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      color: '#1F2A44',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '1.1rem',
                    }}
                  >
                    <ViewListIcon sx={{ fontSize: '1rem' }} />
                    Additional Fields
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                    {/* Left Column */}
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      {/* Applications Section */}
                      <Box>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          Applications
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Application</InputLabel>
                            <Select
                              value={applicationInput}
                              onChange={(e) =>
                                setApplicationInput(e.target.value)
                              }
                              label="Select Application"
                              disabled={filtersLoading}
                              sx={{
                                borderRadius: 2,
                              }}
                            >
                              {filtersData?.data?.application?.map((app) => (
                                <MenuItem key={app.id} value={app.name}>
                                  {app.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            variant="contained"
                            onClick={handleAddApplication}
                            disabled={
                              !applicationInput.trim() || filtersLoading
                            }
                            size="small"
                            sx={{
                              borderRadius: 2,
                              backgroundColor: '#4caf50',
                              '&:hover': { backgroundColor: '#45a049' },
                              minWidth: 'auto',
                              px: 2,
                            }}
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
                          }}
                        >
                          {formData.applications.length === 0 ? (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ alignSelf: 'center' }}
                            >
                              No applications added yet
                            </Typography>
                          ) : (
                            formData.applications.map((app, index) => (
                              <Chip
                                key={index}
                                label={app}
                                onDelete={() => handleRemoveApplication(app)}
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                              />
                            ))
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Right Column */}
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      {/* Functions Section */}
                      <Box>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          Functions
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Function</InputLabel>
                            <Select
                              value={functionInput}
                              onChange={(e) => setFunctionInput(e.target.value)}
                              label="Select Function"
                              disabled={filtersLoading}
                              sx={{
                                borderRadius: 2,
                              }}
                            >
                              {filtersData?.data?.function?.map((func) => (
                                <MenuItem key={func.id} value={func.name}>
                                  {func.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            variant="contained"
                            onClick={handleAddFunction}
                            disabled={!functionInput.trim() || filtersLoading}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              backgroundColor: '#ff9800',
                              '&:hover': { backgroundColor: '#f57c00' },
                              minWidth: 'auto',
                              px: 2,
                            }}
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
                          }}
                        >
                          {formData.functions.length === 0 ? (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ alignSelf: 'center' }}
                            >
                              No functions added yet
                            </Typography>
                          ) : (
                            formData.functions.map((func, index) => (
                              <Chip
                                key={index}
                                label={func}
                                onDelete={() => handleRemoveFunction(func)}
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                              />
                            ))
                          )}
                        </Box>
                      </Box>

                      {/* Country of Origin Section */}
                      <Box>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          Country of Origin
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Country</InputLabel>
                            <Select
                              value={countryInput}
                              onChange={(e) => setCountryInput(e.target.value)}
                              label="Select Country"
                              disabled={filtersLoading}
                              sx={{
                                borderRadius: 2,
                              }}
                            >
                              {countryOptions.map((country) => (
                                <MenuItem key={country} value={country}>
                                  {country}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            variant="contained"
                            onClick={handleAddCountry}
                            disabled={!countryInput.trim() || filtersLoading}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              backgroundColor: '#9c27b0',
                              '&:hover': { backgroundColor: '#7b1fa2' },
                              minWidth: 'auto',
                              px: 2,
                            }}
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
                          }}
                        >
                          {formData.countryOfOrigin.length === 0 ? (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ alignSelf: 'center' }}
                            >
                              No countries added yet
                            </Typography>
                          ) : (
                            formData.countryOfOrigin.map((country, index) => (
                              <Chip
                                key={index}
                                label={country}
                                onDelete={() => handleRemoveCountry(country)}
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                              />
                            ))
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Row 5: Images - Full Width */}
            <Box sx={{ width: '100%' }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      color: '#1F2A44',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '1.1rem',
                    }}
                  >
                    <ViewListIcon sx={{ fontSize: '1rem' }} />
                    Images
                  </Typography>

                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                  >
                    {/* Banner Image */}
                    <Box>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        Banner Image URL
                      </Typography>
                      <TextField
                        fullWidth
                        value={formData.bannerImage}
                        onChange={(e) =>
                          handleInputChange('bannerImage', e.target.value)
                        }
                        placeholder="https://example.com/banner-image.jpg"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>

                    <Divider />

                    {/* Product Images */}
                    <Box>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        Product Images
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          fullWidth
                          label="Add Image URL"
                          value={imageInput}
                          onChange={(e) => setImageInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImage();
                            }
                          }}
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          onClick={handleAddImage}
                          disabled={!imageInput.trim()}
                          size="small"
                          sx={{
                            borderRadius: 2,
                            backgroundColor: '#2196f3',
                            '&:hover': { backgroundColor: '#1976d2' },
                            minWidth: 'auto',
                            px: 2,
                          }}
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
                        }}
                      >
                        {formData.images.length === 0 ? (
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ alignSelf: 'center' }}
                          >
                            No images added yet
                          </Typography>
                        ) : (
                          formData.images.map((image, index) => (
                            <Chip
                              key={index}
                              label={
                                image.length > 30
                                  ? `${image.substring(0, 30)}...`
                                  : image
                              }
                              onDelete={() => handleRemoveImage(image)}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            />
                          ))
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        {updateProductMutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {updateProductMutation.error.message || 'Failed to update product'}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={updateProductMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateProductMutation.isPending}
          startIcon={
            updateProductMutation.isPending ? (
              <CircularProgress size={16} />
            ) : (
              <SaveIcon />
            )
          }
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' },
          }}
        >
          {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
