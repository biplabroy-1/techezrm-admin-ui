'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '@/api/services/suppliers';
import {
  TableComponent,
  TableRowData,
} from '../../../../components/TableComponent';
import { toast } from 'react-toastify';
import { SUPPLIER_PAYMENT_FILTER_OPTIONS } from '@/constants/suppliers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PaymentIcon from '@mui/icons-material/Payment';

interface SupplierRowData extends TableRowData {
  id: string;
  name: string;
  uniqueId: string;
  country: string;
  contact: React.ReactNode;
  location: React.ReactNode;
  payment: string;
  actions: React.ReactNode;
}

export default function SuppliersListing() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch suppliers
  const {
    data: suppliersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'suppliers',
      {
        page,
        search: debouncedSearchTerm,
        country: countryFilter,
        payment_method: paymentFilter,
      },
    ],
    queryFn: () =>
      supplierService.getSuppliers({
        page,
        search: debouncedSearchTerm,
        country: countryFilter,
        payment_method: paymentFilter,
      }),
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      return supplierService.deleteSupplier(supplierId);
    },
    onSuccess: () => {
      toast.success('Supplier deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete supplier');
    },
  });

  const suppliers = suppliersData?.data || [];
  const totalResults = suppliersData?.total || 0;

  const handleOpenGoogleMaps = (
    latitude: string,
    longitude: string,
    address: string
  ) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
    window.open(url, '_blank');
  };

  const renderLocation = (supplier: any) => {
    if (!supplier?.latitude || !supplier?.longitude) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOnIcon sx={{ fontSize: 16, color: '#999' }} />
          <Typography variant="body2" color="text.secondary">
            {supplier?.address || 'N/A'}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={() =>
            handleOpenGoogleMaps(
              supplier.latitude,
              supplier.longitude,
              supplier.address
            )
          }
          sx={{
            color: '#1976d2',
            p: 0.5,
            '&:hover': { backgroundColor: '#e3f2fd' },
          }}
        >
          <LocationOnIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, fontSize: '12px' }}
          >
            {supplier.address}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '10px' }}
          >
            {supplier.latitude}, {supplier.longitude}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderContact = (supplier: any) => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmailIcon sx={{ fontSize: 12, color: '#666' }} />
          <Typography
            variant="caption"
            sx={{ fontSize: '10px', color: '#666' }}
          >
            {supplier?.email || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PhoneIcon sx={{ fontSize: 12, color: '#666' }} />
          <Typography
            variant="caption"
            sx={{ fontSize: '10px', color: '#666' }}
          >
            {supplier?.phone || 'N/A'}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderActions = (supplierId: string) => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleViewSupplier(supplierId);
        }}
        sx={{ color: '#1976d2' }}
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleEditSupplier(supplierId);
        }}
        sx={{ color: '#ff9800' }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteSupplier(supplierId);
        }}
        sx={{ color: '#f44336' }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  const supplierData: SupplierRowData[] = suppliers.map((supplier: any) => ({
    id: supplier._id,
    name: supplier.name,
    uniqueId: supplier.uniqueId,
    country: supplier.country,
    contact: renderContact(supplier),
    location: renderLocation(supplier),
    payment: supplier.payment_method,
    actions: renderActions(supplier._id),
  }));

  const columns = [
    { id: 'name', label: 'Supplier Name', width: '15%' },
    { id: 'uniqueId', label: 'Unique ID', width: '10%' },
    { id: 'country', label: 'Country', width: '10%' },
    { id: 'contact', label: 'Contact', width: '15%' },
    { id: 'location', label: 'Location', width: '20%' },
    {
      id: 'payment',
      label: 'Payment Method',
      width: '12%',
      align: 'center' as const,
    },
    { id: 'actions', label: 'Actions', width: '18%', align: 'center' as const },
  ];

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleAddSupplier = () => {
    router.push('/admin/data-management/suppliers/add');
  };

  const handleEditSupplier = (supplierId: string) => {
    router.push(`/admin/data-management/suppliers/${supplierId}/edit`);
  };

  const handleViewSupplier = (supplierId: string) => {
    router.push(`/admin/data-management/suppliers/${supplierId}`);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSupplierToDelete(supplierId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (supplierToDelete) {
      deleteSupplierMutation.mutate(supplierToDelete);
    }
  };

  const countryOptions = [
    { value: '', label: 'All Countries' },
    { value: 'China', label: 'China' },
    { value: 'Japan', label: 'Japan' },
    { value: 'Taiwan', label: 'Taiwan' },
    { value: 'South Korea', label: 'South Korea' },
    { value: 'Thailand', label: 'Thailand' },
    { value: 'India', label: 'India' },
    { value: 'USA', label: 'USA' },
    { value: 'Germany', label: 'Germany' },
  ];

  const paymentOptions = SUPPLIER_PAYMENT_FILTER_OPTIONS;

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: '#F9FAFB',
        minHeight: '85vh',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1F2A44',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Suppliers Listing ({totalResults})
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddSupplier}
          sx={{
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' },
          }}
        >
          Add Supplier
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load suppliers. Please try again.
        </Alert>
      )}

      {/* Filters */}
      {!isLoading && !error && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <Select
              value={countryFilter}
              onChange={(e: any) => setCountryFilter(e.target.value)}
              displayEmpty
              sx={{
                '& .MuiSelect-select': { fontFamily: 'Poppins, sans-serif' },
              }}
            >
              {countryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <Select
              value={paymentFilter}
              onChange={(e: any) => setPaymentFilter(e.target.value)}
              displayEmpty
              sx={{
                '& .MuiSelect-select': { fontFamily: 'Poppins, sans-serif' },
              }}
            >
              {paymentOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {!isLoading && !error && (
        <TableComponent
          columns={columns}
          data={supplierData}
          totalResults={totalResults}
          currentPage={page}
          onPageChange={handlePageChange}
          showCheckboxes={false}
          showHeader={true}
          rowsPerPage={10}
          searchOptions={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: 'Search suppliers...',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this supplier? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteSupplierMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteSupplierMutation.isPending}
            startIcon={
              deleteSupplierMutation.isPending ? (
                <CircularProgress size={16} />
              ) : null
            }
          >
            {deleteSupplierMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
