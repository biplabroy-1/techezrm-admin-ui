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
  Typography,
  Box,
  Paper,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Directions as DirectionsIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import {
  shippingService,
  ShippingCalculationRequest,
} from '@/api/services/shipping';
import { toast } from 'react-toastify';
import ReactSelect from 'react-select';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('../RouteMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      Loading map...
    </div>
  ),
});

interface ShippingCalculationModalProps {
  open: boolean;
  onClose: () => void;
  supplierCoordinates?: [number, number];
  warehouseCoordinates?: [number, number];
  onCostCalculated?: (cost: number) => void;
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

const shippingTypes = [
  { value: 'FCL', label: 'Full Container Load (FCL)' },
  { value: 'LCL', label: 'Less than Container Load (LCL)' },
  { value: 'AIR', label: 'Air Freight' },
  { value: 'ROAD', label: 'Road Freight' },
];

const containerTypes = [
  { value: 'ST20', label: "20' Standard Container" },
  { value: 'ST40', label: "40' Standard Container" },
  { value: 'HC40', label: "40' High Cube Container" },
  { value: 'RF20', label: "20' Refrigerated Container" },
  { value: 'RF40', label: "40' Refrigerated Container" },
];

export default function ShippingCalculationModal({
  open,
  onClose,
  supplierCoordinates,
  warehouseCoordinates,
  onCostCalculated,
}: ShippingCalculationModalProps) {
  const [formData, setFormData] = useState({
    includedServices: 'd2d',
    portFromFees: true,
    portToFees: true,
    shippingType: 'FCL',
    coordinatesFrom: supplierCoordinates || [52.3675734, 4.9041389],
    coordinatesTo: warehouseCoordinates || [
      40.70547541536396, -74.01768086553932,
    ],
    date: new Date().toISOString().split('T')[0],
    container: 'ST20',
  });

  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);

  const calculateShippingMutation = useMutation({
    mutationFn: async (data: ShippingCalculationRequest) => {
      return shippingService.calculateShippingCost(data);
    },
    onSuccess: (data) => {
      setCalculationResults(data);
      if (data.data?.rates?.[0]?.general?.totalPrice) {
        onCostCalculated?.(data.data.rates[0].general.totalPrice);
      }
      toast.success('Shipping cost calculated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to calculate shipping cost');
    },
  });

  const handleCalculate = () => {
    calculateShippingMutation.mutate(formData);
  };

  const handleClose = () => {
    setCalculationResults(null);
    onClose();
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const handleShowRoute = (route: any) => {
    setSelectedRoute(route);
    setShowRouteModal(true);
  };

  const generateRouteUrl = (route: any) => {
    if (!route?.points || route.points.length < 2) return '';

    const points = route.points.map(
      (point: any) => `${point.location.lat},${point.location.lng}`
    );

    return `https://www.google.com/maps/dir/${points.join('/')}`;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', color: '#1F2A44' }}
          >
            Calculate Shipping Cost
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Form Section - Horizontal Layout */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: 'bold', color: '#1F2A44' }}
          >
            Shipping Details
          </Typography>

          <Grid container spacing={2}>
            {/* From Coordinates */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                From Coordinates (Supplier)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Latitude"
                  type="number"
                  value={formData.coordinatesFrom[0]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinatesFrom: [
                        parseFloat(e.target.value) || 0,
                        formData.coordinatesFrom[1],
                      ],
                    })
                  }
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Longitude"
                  type="number"
                  value={formData.coordinatesFrom[1]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinatesFrom: [
                        formData.coordinatesFrom[0],
                        parseFloat(e.target.value) || 0,
                      ],
                    })
                  }
                />
              </Box>
            </Grid>

            {/* To Coordinates */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                To Coordinates (Warehouse)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Latitude"
                  type="number"
                  value={formData.coordinatesTo[0]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinatesTo: [
                        parseFloat(e.target.value) || 0,
                        formData.coordinatesTo[1],
                      ],
                    })
                  }
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Longitude"
                  type="number"
                  value={formData.coordinatesTo[1]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinatesTo: [
                        formData.coordinatesTo[0],
                        parseFloat(e.target.value) || 0,
                      ],
                    })
                  }
                />
              </Box>
            </Grid>

            {/* Shipping Type */}
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                Shipping Type
              </Typography>
              <ReactSelect
                value={shippingTypes.find(
                  (type) => type.value === formData.shippingType
                )}
                options={shippingTypes}
                placeholder="Select Type"
                styles={reactSelectStyles}
                onChange={(selectedOption: any) =>
                  setFormData({
                    ...formData,
                    shippingType: selectedOption?.value || 'FCL',
                  })
                }
              />
            </Grid>

            {/* Container Type */}
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                Container Type
              </Typography>
              <ReactSelect
                value={containerTypes.find(
                  (container) => container.value === formData.container
                )}
                options={containerTypes}
                placeholder="Select Container"
                styles={reactSelectStyles}
                onChange={(selectedOption: any) =>
                  setFormData({
                    ...formData,
                    container: selectedOption?.value || 'ST20',
                  })
                }
              />
            </Grid>

            {/* Date */}
            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                Shipping Date
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Checkboxes and Button Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                checked={formData.portFromFees}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    portFromFees: e.target.checked,
                  })
                }
              />
              <Typography variant="body2">Include Port From Fees</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                checked={formData.portToFees}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    portToFees: e.target.checked,
                  })
                }
              />
              <Typography variant="body2">Include Port To Fees</Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={calculateShippingMutation.isPending}
              sx={{
                bgcolor: '#FFA500',
                color: '#fff',
                '&:hover': { bgcolor: '#FF8C00' },
                ml: 'auto',
              }}
            >
              {calculateShippingMutation.isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                  Calculating...
                </>
              ) : (
                'Calculate Shipping Cost'
              )}
            </Button>
          </Box>
        </Paper>

        {/* Results Section - Horizontal Layout */}
        {calculateShippingMutation.isPending && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {calculateShippingMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {calculateShippingMutation.error?.message ||
              'Failed to calculate shipping cost'}
          </Alert>
        )}

        {calculationResults && (
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
            >
              Available Routes
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
              {calculationResults.data?.rates?.map(
                (rate: any, index: number) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      minWidth: 300,
                      flex: '0 0 auto',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 'bold' }}
                      >
                        Option {index + 1}
                      </Typography>
                      <Chip
                        label={
                          rate.general.alternative ? 'Alternative' : 'Primary'
                        }
                        color={
                          rate.general.alternative ? 'secondary' : 'primary'
                        }
                        size="small"
                      />
                    </Box>

                    {/* Total Cost */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 'bold', color: '#1F2A44' }}
                      >
                        Total Cost:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 'bold', color: '#4caf50' }}
                      >
                        {formatCurrency(
                          rate.general.totalPrice,
                          rate.general.totalCurrency
                        )}
                      </Typography>
                    </Box>

                    {/* Route Summary */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 'bold' }}
                      >
                        Route Summary:
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {rate.points.map((point: any, pointIndex: number) => (
                          <Box
                            key={pointIndex}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <LocationIcon
                              sx={{ fontSize: 14, color: '#666' }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {point.location.name}, {point.location.country}
                            </Typography>
                            {point.distance && (
                              <Chip
                                label={`${point.distance} km`}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 'auto' }}
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    {/* Additional Information */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontSize: '0.8rem' }}
                        >
                          Transit Time:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {rate.general.totalTransitTime} hours
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontSize: '0.8rem' }}
                        >
                          CO2 Emissions:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {rate.general.totalCo2.amount} kg
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DirectionsIcon />}
                        onClick={() => handleShowRoute(rate)}
                        fullWidth
                      >
                        Show Route
                      </Button>
                    </Box>
                  </Paper>
                )
              )}
            </Box>
          </Box>
        )}

        {!calculationResults && !calculateShippingMutation.isPending && (
          <Box sx={{ textAlign: 'center', py: 4, color: '#666' }}>
            <ShippingIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              Enter shipping details and click "Calculate Shipping Cost" to see
              results
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      {/* Route Map Modal */}
      <Dialog
        open={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: '#1F2A44' }}
            >
              Route Details
            </Typography>
            <IconButton onClick={() => setShowRouteModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          {selectedRoute && (
            <Box>
              {/* Route Summary */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: 'bold' }}
                >
                  Route Summary
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', color: '#4caf50' }}
                  >
                    {formatCurrency(
                      selectedRoute.general.totalPrice,
                      selectedRoute.general.totalCurrency
                    )}
                  </Typography>
                  <Chip
                    label={
                      selectedRoute.general.alternative
                        ? 'Alternative'
                        : 'Primary'
                    }
                    color={
                      selectedRoute.general.alternative
                        ? 'secondary'
                        : 'primary'
                    }
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Transit Time
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedRoute.general.totalTransitTime} hours
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      CO2 Emissions
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedRoute.general.totalCo2.amount} kg
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Validity
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatDate(selectedRoute.general.validityFrom)} -{' '}
                      {formatDate(selectedRoute.general.validityTo)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Route Points */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: 'bold' }}
                >
                  Route Points
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {selectedRoute.points.map((point: any, index: number) => (
                    <Box
                      key={index}
                      sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor:
                            index === 0
                              ? '#4caf50'
                              : index === selectedRoute.points.length - 1
                                ? '#f44336'
                                : '#ff9800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {point.location.name}, {point.location.country}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {point.location.lat.toFixed(4)},{' '}
                          {point.location.lng.toFixed(4)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={point.shippingType}
                          size="small"
                          variant="outlined"
                        />
                        {point.provider && (
                          <Chip
                            label={point.provider}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {point.distance && (
                          <Chip
                            label={`${point.distance} km`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Tooltip title="View on Map">
                        <IconButton
                          size="small"
                          onClick={() =>
                            openGoogleMaps(
                              point.location.lat,
                              point.location.lng
                            )
                          }
                        >
                          <DirectionsIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* Route Map */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: 'bold' }}
                >
                  Route Map
                </Typography>
                <RouteMap route={selectedRoute} />
              </Paper>

              {/* Map Action */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<DirectionsIcon />}
                  onClick={() => {
                    const routeUrl = generateRouteUrl(selectedRoute);
                    if (routeUrl) {
                      window.open(routeUrl, '_blank');
                    }
                  }}
                  sx={{
                    bgcolor: '#1976d2',
                    color: '#fff',
                    '&:hover': { bgcolor: '#1565c0' },
                    px: 4,
                  }}
                >
                  View Complete Route on Google Maps
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowRouteModal(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
