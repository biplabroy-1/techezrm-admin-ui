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
// Deferred to after mount: see ClientOnlyReactSelect for why.
import ReactSelect from '@/components/ClientOnlyReactSelect';
import AddProductModal from '../../../../../components/modals/AddProductModal';
import { productService } from '@/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { warehouseService } from '@/api/services/warehouses';
import { warehouseStockService } from '@/api/services/warehouseStock';
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

export default function AddStockToWarehouse() {
  const router = useRouter();

  // Create warehouse stock mutation
  const createStockMutation = useMutation({
    mutationFn: async (data: any) => {
      return warehouseStockService.createWarehouseStock(data);
    },
    onSuccess: (data) => {
      toast.success('Stock added to warehouse successfully!');
      router.push('/admin/logistics/warehouse/view-products');
      return data;
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add stock to warehouse');
    },
  });

  // Fetch warehouses
  const {
    data: warehousesData,
    isFetching: isLoadingWarehouses,
    refetch: refetchWarehouses,
  } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseService.getWarehouses(),
  });

  const warehouses: any = warehousesData?.warehouses ?? [];


  const {
    data: productsData,
    isFetching: isLoadingProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', {}],
    queryFn: () => productService.getProducts(),
  });

  const products: any = productsData?.products ?? [];


  // const { products, isLoadingProducts }: any = useProducts();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Modal states
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [formData, setFormData] = useState({
    warehouseId: '',
    productId: '',
    slotName: '',
    quantityTotal: 0,
    quantityReserved: 0,
    quantityAvailable: 0,
    qcPassed: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {

    try {
      // Validate required fields
      if (!formData.warehouseId) {
        toast.error('Please select a warehouse');
        return;
      }
      if (!formData.productId) {
        toast.error('Please select a product');
        return;
      }
      if (!formData.slotName) {
        toast.error('Please enter a slot name');
        return;
      }
      if (formData.quantityTotal <= 0) {
        toast.error('Please enter a valid total quantity');
        return;
      }

      // Calculate available quantity
      const availableQuantity =
        formData.quantityTotal - formData.quantityReserved;

      // Prepare data for API
      const createData = {
        warehouseId: formData.warehouseId,
        productId: formData.productId,
        slotName: formData.slotName,
        quantityTotal: formData.quantityTotal,
        quantityReserved: formData.quantityReserved,
        quantityAvailable: availableQuantity,
        qcPassed: formData.qcPassed,
      };

      // Create warehouse stock
      await createStockMutation.mutate(createData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add stock to warehouse');
    }
  };

  // Helper function to get field error
  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName] || '';
  };

  // Modal handlers
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
          Add Stock to Warehouse
        </Typography>

        <Typography sx={{ fontSize: '12px', color: '#1F2A44', mb: 2 }}>
          Add new stock items to warehouse inventory
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
          {/* Main Form Section */}
          <Box
            sx={{ flex: 1, pr: 2, bgcolor: '#fff', m: 2, p: 6, pt: 2, pb: 2 }}
          >
            {/* Stock Information Section */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 500, color: 'black' }}
              >
                Stock Information
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Warehouse
                      </Typography>
                      <ReactSelect
                        value={
                          formData.warehouseId
                            ? {
                                value: formData.warehouseId,
                                label: warehouses.find(
                                  (w: any) => w._id === formData.warehouseId
                                )?.name,
                              }
                            : null
                        }
                        options={warehouses.map((warehouse: any) => ({
                          value: warehouse._id,
                          label: warehouse.name,
                        }))}
                        placeholder="Select Warehouse"
                        isClearable
                        styles={reactSelectStyles}
                        isSearchable
                        isLoading={isLoadingWarehouses}
                        onChange={(selectedOption: any) => {
                          handleInputChange(
                            'warehouseId',
                            selectedOption?.value || ''
                          );
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Product
                      </Typography>
                      <ReactSelect
                        value={
                          formData.productId
                            ? {
                                value: formData.productId,
                                label: products.find(
                                  (p: any) => p._id === formData.productId
                                )?.name,
                              }
                            : null
                        }
                        options={[
                          ...products.map((product: any) => ({
                            value: product._id,
                            label: product.name,
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
                            handleInputChange(
                              'productId',
                              selectedOption?.value || ''
                            );
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Slot Name
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.slotName}
                        onChange={(e) =>
                          handleInputChange('slotName', e.target.value)
                        }
                        placeholder="e.g., A1, B3, C2"
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Total Quantity
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        type="number"
                        value={formData.quantityTotal}
                        onChange={(e) =>
                          handleInputChange(
                            'quantityTotal',
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Reserved Quantity
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        type="number"
                        value={formData.quantityReserved}
                        onChange={(e) =>
                          handleInputChange(
                            'quantityReserved',
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </Box>
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                        Available Quantity
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        type="number"
                        value={
                          formData.quantityTotal - formData.quantityReserved
                        }
                        disabled
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <CustomSwitch
                          checked={formData.qcPassed}
                          onChange={(e) =>
                            handleInputChange('qcPassed', e.target.checked)
                          }
                        />
                      }
                      label="QC Passed"
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}
            >
              <Button
                variant="text"
                sx={{ color: '#000' }}
                onClick={() => router.back()}
                disabled={createStockMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={createStockMutation.isPending}
                sx={{
                  bgcolor: '#FFA500',
                  color: '#fff',
                  '&:hover': { bgcolor: '#FF8C00' },
                  px: 4,
                  minWidth: '200px',
                }}
              >
                {createStockMutation.isPending ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                    Adding...
                  </>
                ) : (
                  'Add Stock to Warehouse'
                )}
              </Button>
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ width: 300 }}>
            {/* Stock Summary */}
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: 500, color: 'black' }}
                >
                  Stock Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Total Quantity:
                    </Typography>
                    <Typography variant="body2">
                      {formData.quantityTotal}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Reserved:
                    </Typography>
                    <Typography variant="body2">
                      {formData.quantityReserved}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body1" fontWeight="bold">
                      Available:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formData.quantityTotal - formData.quantityReserved}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* QC Status */}
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ p: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: 500, color: 'black' }}
                >
                  Quality Control
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      QC Status:
                    </Typography>
                    <Chip
                      label={formData.qcPassed ? 'Passed' : 'Pending'}
                      size="small"
                      color={formData.qcPassed ? 'success' : 'warning'}
                    />
                  </Box>
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
                    View Warehouse
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ textTransform: 'none' }}
                  >
                    Print Stock Report
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <AddProductModal
        open={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductAdded={handleProductAdded}
      />
    </ThemeProvider>
  );
}
