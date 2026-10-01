'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  FormControl,
  Checkbox,
  ThemeProvider,
  createTheme,
  CssBaseline,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ReactSelect from 'react-select';
import { usePurchaseOrders } from '../../../../../hooks/usePurchaseOrder';

import AddSupplierModal from '../../../../../components/modals/AddSupplierModal';
import AddProductModal from '../../../../../components/modals/AddProductModal';
import ShippingCalculationModal from '../../../../../components/modals/ShippingCalculationModal';
import { productService, supplierService, warehouseService } from '@/api';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  CreatePurchaseOrderRequest,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  purchaseOrderService,
} from '@/api/services/purchaseOrders';
import { toast } from 'react-toastify';

// Create a custom styled Switch component that looks like the first image
const CustomSwitch = styled(Switch)(() => ({
  width: 42,
  height: 22,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#073E54', // Dark teal/blue color for ON state
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: 'rgba(217, 228, 255, 1)', // Light blue color for OFF state
    borderRadius: 32,
  },
}));

// React Select custom styles
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

// Create a theme with Poppins font
const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", sans-serif',
    allVariants: {
      fontFamily: '"Poppins", sans-serif',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          '*': {
            fontFamily: '"Poppins", sans-serif',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: {
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
  },
});

// PurchaseOrderStatus comes from the service - see the import below. This file used
// to declare its own copy with APPROVED commented out, which made
// PurchaseOrderStatus.APPROVED undefined at runtime: the "Approved" option in the
// status dropdown was written with value=undefined, and the
// `formData.status === PurchaseOrderStatus.APPROVED` branch could never match.

/**
 * The form's own state: the API's PurchaseOrder, plus the display-only fields the
 * selects are actually bound to.
 *
 * Each ReactSelect here takes `value={formData.<field>_option}` - an object of
 * {value,label} - while the API only ever receives the bare scalar
 * (`supplier_id`, `status`, `currency`). Both are kept: the scalar is what gets
 * submitted, the object is what the dropdown displays. Without this the state was
 * inferred from its initial value and every read of a display field was an error.
 */
type SelectOption = { value: string; label: string };

/** A line item, plus the display object its product select is bound to. */
type PurchaseOrderFormItem = PurchaseOrderItem & {
  product_option?: SelectOption;
};

type PurchaseOrderFormData = Omit<
  PurchaseOrder,
  'items' | 'shipping_address' | 'status' | '_id' | 'id'
> & {
  status: PurchaseOrderStatus;
  items: PurchaseOrderFormItem[];
  shipping_address: NonNullable<PurchaseOrder['shipping_address']>;
  /** Display-only companions. Never sent to the API. */
  supplier?: SelectOption;
  status_option?: SelectOption;
  currency_option?: SelectOption;
  warehouse_option?: SelectOption;
  shipping_method_option?: SelectOption;
  supplier_coordinates?: [number, number];
  warehouse_coordinates?: [number, number];
  warehouse_id?: string;
};

export default function AddPurchaseOrder() {
  const router = useRouter();
  const {
    createPurchaseOrder,
    isCreatingPurchaseOrder,
    createPurchaseOrderError,
  } = usePurchaseOrders();

  const createPurchaseOrderMutation = useMutation({
    mutationFn: async (data: CreatePurchaseOrderRequest) => {
      // Validate the data before sending
      return purchaseOrderService.createPurchaseOrder(data);
    },
    onSuccess: (data) => {
      toast.success('Purchase order created successfully!');
      // Invalidate and refetch purchase orders list
      // queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      return data;
    },
    onError: (error: any) => {

      // The API rejects with `{ message, error }`; Error carries no `error` field,
      // so this rendered "undefined" in the toast.
      toast.error(error?.error ?? error?.message ?? 'Failed to create purchase order');
    },
  });

  const {
    data: suppliersData,
    isFetching: isLoadingSuppliers,
    refetch: refetchSuppliers,
  } = useQuery({
    queryKey: ['suppliers', {}],
    queryFn: () => supplierService.getSuppliers(),
  });

  const suppliers: any = suppliersData?.data ?? [];


  const {
    data: productsData,
    isFetching: isLoadingProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', {}],
    queryFn: () => productService.getProducts(),
  });

  const products: any = productsData?.products ?? [];


  const { data: warehousesData, isFetching: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses', {}],
    queryFn: () => warehouseService.getWarehouses(),
  });

  const warehouses: any = warehousesData?.warehouses ?? [];

  // const { products, isLoadingProducts }: any = useProducts();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Modal states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showShippingCalculationModal, setShowShippingCalculationModal] =
    useState(false);

  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: '',
    status: PurchaseOrderStatus.PENDING,
    total_amount: 0,
    currency: 'USD',
    expected_date: new Date().toISOString().split('T')[0], // Set today's date as default
    items: [
      {
        product_id: '',
        product_name: '',
        quantity: 0,
        unit_price: 0,
        amount: 0,
        status: PurchaseOrderStatus.PENDING,
      },
    ],
    shipping_address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
    },
    shipping_method: '',
    shipping_cost: 0,
    tracking_number: '',
    shipping_date: '',
    delivery_date: '',
    shipping_notes: '',
  });

  const [shippingMethods] = useState([
    'Standard Shipping',
    'Express Shipping',
    'Overnight Delivery',
    'Freight Shipping',
    'Air Freight',
    'Sea Freight',
  ]);

  const [currencies] = useState([
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'INR', name: 'Indian Rupee' },
  ]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const addItem = () => {
    const newItem = {
      product_id: '',
      product_name: '',
      quantity: 0,
      unit_price: 0,
      amount: 0,
      status: PurchaseOrderStatus.PENDING,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: any, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          // Auto-calculate amount when quantity or unit_price changes
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.amount = updatedItem.quantity * updatedItem.unit_price;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const updateTotalAmount = () => {
    const itemsTotal = formData.items.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    setFormData((prev) => ({
      ...prev,
      total_amount: itemsTotal,
    }));
  };

  const handleSubmit = async () => {

    try {
      // Clear previous validation errors
      // setValidationErrors({});

      // Validate form data
      // await purchaseOrderSchema.validate(formData, { abortEarly: false });

      // Prepare data for API
      const createData = {
        order: {
          supplier_id: formData?.supplier_id,
          status: formData.status,
          total_amount: formData.total_amount,
          currency: formData.currency,
          expected_date: formData.expected_date,
          shipping_address: formData.shipping_address,
          shipping_method: formData.shipping_method,
          shipping_cost: formData.shipping_cost,
          tracking_number: formData.tracking_number || '',
          shipping_date: formData.shipping_date || '',
          delivery_date: formData.delivery_date || '',
          shipping_notes: formData.shipping_notes || '',
        },
        items: formData.items,
      };

      // Create purchase order
      await createPurchaseOrderMutation.mutate(createData);

      // Redirect to purchase orders list or show success message
      // router.push('/admin/logistics/warehouse');
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        // Handle validation errors
        const errors: Record<string, string> = {};
        error.inner.forEach((err: any) => {
          errors[err.path] = err.message;
        });
        setValidationErrors(errors);
        toast.error('Please fix the validation errors');
      } else {
        // Handle API errors
        toast.error(error.message || 'Failed to create purchase order');
      }
    }
  };

  // Update total amount when items change
  useEffect(() => {
    updateTotalAmount();
  }, [formData.items]);

  // Helper function to get field error
  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName] || '';
  };

  // Modal handlers
  const handleSupplierAdded = (newSupplier: any) => {
    // Refresh suppliers list
    refetchSuppliers();
    // Set the newly added supplier as selected.
    //
    // Two bugs here. It read `newSupplier.id`, but the API returns the mongoose
    // document, whose identifier is `_id` - so the condition was never true and the
    // supplier was created without ever being selected. And it then set only
    // `supplier_id`, while the ReactSelect renders `formData.supplier`, an object of
    // { value, label }; the dropdown's displayed value is bound to that object, so
    // it would still have read "Select Supplier" even with the correct id.
    const newId = newSupplier?._id ?? newSupplier?.id;
    if (newId) {
      handleInputChange('supplier_id', newId);
      handleInputChange('supplier', { value: newId, label: newSupplier?.name ?? '' });
    }
    setShowAddSupplierModal(false);
  };

  const handleProductAdded = (newProduct: any) => {
    // Refresh products list
    refetchProducts();
    setShowAddProductModal(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => router.back()}
          >
            <Image
              src="/back.png?height=13&width=13"
              alt="Back"
              width={13}
              height={13}
            />
            <Typography sx={{ ml: 1, color: '#737791', fontSize: '14px' }}>
              Back
            </Typography>
          </Box>
        </Box>

        <Typography
          sx={{ fontSize: '24px', fontWeight: 'bold', color: '#1F2A44' }}
        >
          Create Purchase Order
        </Typography>

        <Typography sx={{ fontSize: '12px', color: '#1F2A44', mb: 2 }}>
          Here you can create a new purchase order from vendor
        </Typography>

        <Box
          sx={{
            display: 'flex',
            p: 2,
            minHeight: '100vh',
            alignItems: 'flex-start',
            gap: 3,
            mt: -2,
          }}
        >
          {/* Left Section */}
          <Box
            sx={{ flex: 1, pr: 2, bgcolor: '#fff', m: 2, p: 6, pt: 2, pb: 2 }}
          >
            {/* Products Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 500, color: 'black' }}
              >
                Products
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Order Items
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    sx={{ textTransform: 'none' }}
                  >
                    Add Product
                  </Button>
                </Box>

                {formData.items.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3, color: '#666' }}>
                    <Typography variant="body2">
                      No products added yet. Click "Add Product" to start.
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {formData.items.map((item, index) => (
                      <Paper
                        key={index}
                        sx={{ p: 2, border: '1px solid #e0e0e0' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                          }}
                        >
                          <Typography variant="subtitle2">
                            Product {index + 1}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => removeItem(index)}
                            sx={{
                              color: 'error.main',
                              minWidth: 'auto',
                              p: 0.5,
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </Button>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}
                          >
                            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                              <Typography
                                variant="body2"
                                sx={{ mb: 1, color: '#666' }}
                              >
                                Product
                              </Typography>
                              <ReactSelect
                                value={item?.product_option}
                                options={[
                                  ...products.map((product: any) => ({
                                    value: product?._id,
                                    label: `${product?.name} - ${product?.category}`,
                                  })),
                                  {
                                    value: 'add_new',
                                    label: '+ Add New Product',
                                  },
                                ]}
                                placeholder="Select Product"
                                isClearable
                                styles={reactSelectStyles}
                                isSearchable
                                isLoading={isLoadingProducts}
                                onChange={(selectedOption: any) => {
                                  if (selectedOption?.value === 'add_new') {
                                    setShowAddProductModal(true);
                                  } else {
                                    const selectedProduct = (products as any[]).find(
                                      (p: any) => p.id === selectedOption?.value
                                    );
                                    updateItem(
                                      index,
                                      'product_id',
                                      selectedOption?.value || ''
                                    );
                                    updateItem(
                                      index,
                                      'product_option',
                                      selectedOption
                                    );
                                    if (selectedProduct) {
                                      updateItem(
                                        index,
                                        'product_name',
                                        selectedProduct.name
                                      );
                                      updateItem(
                                        index,
                                        'unit_price',
                                        selectedProduct.price
                                      );
                                    }
                                  }
                                }}
                              />
                            </Box>
                            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                              <Typography
                                variant="body2"
                                sx={{ mb: 1, color: '#666' }}
                              >
                                Quantity
                              </Typography>
                              <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'quantity',
                                    parseInt(e.target.value)
                                  )
                                }
                              />
                            </Box>
                            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                              <Typography
                                variant="body2"
                                sx={{ mb: 1, color: '#666' }}
                              >
                                Unit Price
                              </Typography>
                              <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                type="number"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    'unit_price',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      $
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Box>
                            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                              <Typography
                                variant="body2"
                                sx={{ mb: 1, color: '#666' }}
                              >
                                Amount
                              </Typography>
                              <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                type="number"
                                value={item.amount}
                                disabled
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      $
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Supplier Information Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 500, color: 'black' }}
              >
                Supplier Information
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Supplier
                    </Typography>
                    <ReactSelect
                      value={formData?.supplier}
                      options={[
                        ...suppliers?.map((supplier: any) => ({
                          value: supplier?._id,
                          label: supplier.name,
                        })),
                        { value: 'add_new', label: '+ Add New Supplier' },
                      ]}
                      placeholder="Select Supplier"
                      isClearable
                      styles={reactSelectStyles}
                      isSearchable
                      isLoading={isLoadingSuppliers}
                      onChange={(selectedOption: any) => {
                        if (selectedOption?.value === 'add_new') {
                          setShowAddSupplierModal(true);
                        } else {
                          setFormData({
                            ...formData,
                            supplier: selectedOption,
                            supplier_id: selectedOption?.value || '',
                          });
                        }
                      }}
                    />
                    {getFieldError('supplier_id') && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5 }}
                      >
                        {getFieldError('supplier_id')}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Status
                    </Typography>
                    <ReactSelect
                      value={formData?.status_option}
                      options={[
                        {
                          value: PurchaseOrderStatus.PENDING,
                          label: 'pending',
                        },
                        {
                          value: PurchaseOrderStatus.APPROVED,
                          label: 'Approved',
                        },
                        {
                          value: PurchaseOrderStatus.SHIPPED,
                          label: 'Shipped',
                        },
                        {
                          value: PurchaseOrderStatus.RECEIVED,
                          label: 'Received',
                        },
                        {
                          value: PurchaseOrderStatus.CANCELLED,
                          label: 'Cancelled',
                        },
                      ]}
                      placeholder="Select Status"
                      styles={reactSelectStyles}
                      onChange={(selectedOption: any) => {
                        setFormData({
                          ...formData,
                          status_option: selectedOption,
                          status:
                            selectedOption?.value ||
                            PurchaseOrderStatus.PENDING,
                        });
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Total Amount
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      type="number"
                      value={formData.total_amount}
                      onChange={(e) =>
                        handleInputChange(
                          'total_amount',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Currency
                    </Typography>
                    <ReactSelect
                      value={formData?.currency_option}
                      options={currencies.map((currency) => ({
                        value: currency.code,
                        label: `${currency.code} - ${currency.name}`,
                      }))}
                      placeholder="Select Currency"
                      styles={reactSelectStyles}
                      onChange={(selectedOption: any) => {
                        setFormData({
                          ...formData,
                          currency_option: selectedOption,
                          currency: selectedOption?.value || 'USD',
                        });
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Expected Date
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      type="date"
                      value={formData.expected_date}
                      onChange={(e) =>
                        handleInputChange('expected_date', e.target.value)
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Shipping Information Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 500, color: 'black' }}
              >
                Shipping Information
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Warehouse Selection */}
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Destination Warehouse
                    </Typography>
                    <ReactSelect
                      value={formData?.warehouse_option}
                      options={[
                        ...warehouses?.map((warehouse: any) => ({
                          value: warehouse?._id,
                          label: `${warehouse?.name} - ${warehouse?.address?.city}, ${warehouse?.address?.state}`,
                        })),
                      ]}
                      placeholder="Select Destination Warehouse"
                      isClearable
                      styles={reactSelectStyles}
                      isSearchable
                      isLoading={isLoadingWarehouses}
                      onChange={(selectedOption: any) => {
                        setFormData({
                          ...formData,
                          warehouse_option: selectedOption,
                          warehouse_id: selectedOption?.value || '',
                        });
                      }}
                    />
                  </Box>

                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Street Address
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={formData.shipping_address.street}
                      onChange={(e) =>
                        handleInputChange(
                          'shipping_address.street',
                          e.target.value
                        )
                      }
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        City
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.shipping_address.city}
                        onChange={(e) =>
                          handleInputChange(
                            'shipping_address.city',
                            e.target.value
                          )
                        }
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        State/Province
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.shipping_address.state}
                        onChange={(e) =>
                          handleInputChange(
                            'shipping_address.state',
                            e.target.value
                          )
                        }
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Country
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.shipping_address.country}
                        onChange={(e) =>
                          handleInputChange(
                            'shipping_address.country',
                            e.target.value
                          )
                        }
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Postal Code
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.shipping_address.postal_code}
                        onChange={(e) =>
                          handleInputChange(
                            'shipping_address.postal_code',
                            e.target.value
                          )
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Shipping Details Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 500, color: 'black' }}
              >
                Shipping Details
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Shipping Method
                      </Typography>
                      <ReactSelect
                        value={formData?.shipping_method_option}
                        options={shippingMethods.map((method) => ({
                          value: method,
                          label: method,
                        }))}
                        placeholder="Select Shipping Method"
                        isClearable
                        styles={reactSelectStyles}
                        isSearchable
                        onChange={(selectedOption: any) => {
                          setFormData({
                            ...formData,
                            shipping_method_option: selectedOption,
                            shipping_method: selectedOption?.value || '',
                          });
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Shipping Cost
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="small"
                          type="number"
                          value={formData.shipping_cost}
                          onChange={(e) =>
                            handleInputChange(
                              'shipping_cost',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                $
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setShowShippingCalculationModal(true)}
                          sx={{ minWidth: 'auto', px: 2 }}
                        >
                          Calculate
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Tracking Number
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.tracking_number}
                        onChange={(e) =>
                          handleInputChange('tracking_number', e.target.value)
                        }
                        placeholder="Enter tracking number"
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Shipping Date
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        type="date"
                        value={formData.shipping_date}
                        onChange={(e) =>
                          handleInputChange('shipping_date', e.target.value)
                        }
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Expected Delivery Date
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        type="date"
                        value={formData.delivery_date}
                        onChange={(e) =>
                          handleInputChange('delivery_date', e.target.value)
                        }
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Shipping Notes
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      multiline
                      rows={3}
                      value={formData.shipping_notes}
                      onChange={(e) =>
                        handleInputChange('shipping_notes', e.target.value)
                      }
                      placeholder="Enter any special shipping instructions or notes"
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Error Display */}
            {createPurchaseOrderError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {createPurchaseOrderError.message}
              </Alert>
            )}

            {/* Validation Errors */}
            {Object.keys(validationErrors).length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Please fix the following errors:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>
                      <Typography variant="body2">
                        {field}: {error}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Action Buttons */}
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}
            >
              <Button
                variant="text"
                sx={{ color: '#000' }}
                onClick={() => router.back()}
                disabled={isCreatingPurchaseOrder}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isCreatingPurchaseOrder}
                sx={{
                  bgcolor: '#FFA500',
                  color: '#fff',
                  '&:hover': { bgcolor: '#FF8C00' },
                  px: 4,
                  minWidth: '200px',
                }}
              >
                {isCreatingPurchaseOrder ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                    Creating...
                  </>
                ) : (
                  'Create Purchase Order'
                )}
              </Button>
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ width: 300 }}>
            {/* Order Summary */}
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: 500, color: 'black' }}
                >
                  Order Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Subtotal:
                    </Typography>
                    <Typography variant="body2">
                      ${formData.total_amount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Shipping:
                    </Typography>
                    <Typography variant="body2">
                      ${formData.shipping_cost.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body1" fontWeight="bold">
                      Total:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      $
                      {(formData.total_amount + formData.shipping_cost).toFixed(
                        2
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Status Information */}
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ p: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: 500, color: 'black' }}
                >
                  Status Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Current Status:
                    </Typography>
                    <Chip
                      label={
                        formData.status.charAt(0).toUpperCase() +
                        formData.status.slice(1)
                      }
                      size="small"
                      color={
                        formData.status === PurchaseOrderStatus.APPROVED
                          ? 'success'
                          : formData.status === PurchaseOrderStatus.SHIPPED
                            ? 'info'
                            : formData.status === PurchaseOrderStatus.RECEIVED
                              ? 'success'
                              : formData.status ===
                                  PurchaseOrderStatus.CANCELLED
                                ? 'error'
                                : 'warning'
                      }
                    />
                  </Box>
                  {formData.expected_date && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        Expected Date:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(formData.expected_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {formData.shipping_date && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        Shipping Date:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(formData.shipping_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>

            {/* Quick Actions */}
            <Box>
              <Paper sx={{ p: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: 500, color: 'black' }}
                >
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                  >
                    Send to Supplier
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                  >
                    Print Order
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <AddSupplierModal
        open={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        onSupplierAdded={handleSupplierAdded}
      />

      <AddProductModal
        open={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductAdded={handleProductAdded}
      />

      <ShippingCalculationModal
        open={showShippingCalculationModal}
        onClose={() => setShowShippingCalculationModal(false)}
        supplierCoordinates={formData.supplier_coordinates}
        warehouseCoordinates={formData.warehouse_coordinates}
        onCostCalculated={(cost) => {
          handleInputChange('shipping_cost', cost);
        }}
      />
    </ThemeProvider>
  );
}
