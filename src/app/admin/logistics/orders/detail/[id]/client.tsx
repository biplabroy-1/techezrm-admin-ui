'use client';

import React from 'react';
import Image from 'next/image';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Grid,
  Divider,
  Stack,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import { LocalShipping, Receipt, CreditCard } from '@mui/icons-material';
import { usePurchaseOrder } from '@/hooks/usePurchaseOrders';

interface StatusDotProps {
  isActive?: boolean;
  isCompleted?: boolean;
}

const StatusDot = ({ isActive, isCompleted }: StatusDotProps) => (
  <Box
    sx={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: isActive
        ? '#f59e0b'
        : isCompleted
          ? '#6b7280'
          : '#e5e7eb',
      border: !isActive && !isCompleted ? '2px solid #e5e7eb' : 'none',
    }}
  />
);

interface OrderTrackingClientProps {
  id: string;
}

export function OrderTrackingClient({ id }: OrderTrackingClientProps) {
  // Fetch purchase order details
  const {
    data: purchaseOrderData,
    isLoading,
    error,
  }: any = usePurchaseOrder(id);
  const purchaseOrder = purchaseOrderData?.data;


  // Loading state
  if (isLoading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 3, backgroundColor: '#f9fafb', minHeight: '100vh' }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 3, backgroundColor: '#f9fafb', minHeight: '100vh' }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load purchase order details. Please try again.
        </Alert>
      </Container>
    );
  }

  // Format dates
  const orderDate = purchaseOrder?.order?.createdAt
    ? new Date(purchaseOrder.order.createdAt).toLocaleDateString()
    : 'N/A';
  const expectedDate = purchaseOrder?.expected_date
    ? new Date(purchaseOrder.expected_date).toLocaleDateString()
    : 'N/A';

  return (
    <Container
      maxWidth="lg"
      sx={{ py: 3, backgroundColor: '#f9fafb', minHeight: '100vh' }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 'bold', color: '#1e293b', mb: 3 }}
      >
        Track The Purchase Order
      </Typography>

      {/* Order Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontWeight: 'bold', color: '#1e293b' }}
              >
                Order ID: {purchaseOrder?.order?.id || id}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mt: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Order date:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {orderDate} |
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <LocalShipping sx={{ fontSize: 16, color: '#10b981' }} />
                  <Typography
                    variant="body2"
                    sx={{ color: '#10b981', fontWeight: 500 }}
                  >
                    Expected delivery: {expectedDate}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Receipt />}
                sx={{ textTransform: 'none' }}
              >
                Invoice
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#f59e0b',
                  '&:hover': { backgroundColor: '#d97706' },
                  textTransform: 'none',
                }}
              >
                Track order
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Progress Tracker */}
      <Card sx={{ mb: 3, backgroundColor: 'transparent', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ position: 'relative', px: 4, mb: 4 }}>
            {/* Progress Line */}
            <Box
              sx={{
                position: 'absolute',
                top: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '75%',
                height: '1px',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  width: '16.67%',
                  height: '1px',
                  backgroundColor: '#6b7280',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: '16.67%',
                  right: 0,
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                }}
              />
            </Box>

            {/* Status Steps */}
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ position: 'relative', zIndex: 10 }}
            >
              <Stack alignItems="center" sx={{ width: '25%' }}>
                <StatusDot
                  isActive={purchaseOrder?.status === 'pending'}
                  isCompleted={['shipped', 'received'].includes(
                    purchaseOrder?.status || ''
                  )}
                />
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    fontWeight: 500,
                    color:
                      purchaseOrder?.status === 'pending'
                        ? '#f59e0b'
                        : '#6b7280',
                    textAlign: 'center',
                  }}
                >
                  Order Confirmed
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  {orderDate}
                </Typography>
              </Stack>

              <Stack alignItems="center" sx={{ width: '25%' }}>
                <StatusDot
                  isActive={purchaseOrder?.status === 'shipped'}
                  isCompleted={purchaseOrder?.status === 'received'}
                />
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    fontWeight: 500,
                    color:
                      purchaseOrder?.status === 'shipped'
                        ? '#f59e0b'
                        : '#6b7280',
                    textAlign: 'center',
                  }}
                >
                  Shipped
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  {purchaseOrder?.shipping_date
                    ? new Date(purchaseOrder.shipping_date).toLocaleDateString()
                    : 'Pending'}
                </Typography>
              </Stack>

              <Stack alignItems="center" sx={{ width: '25%' }}>
                <StatusDot
                  isActive={purchaseOrder?.status === 'shipped'}
                  isCompleted={purchaseOrder?.status === 'received'}
                />
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    fontWeight: 500,
                    color:
                      purchaseOrder?.status === 'shipped'
                        ? '#f59e0b'
                        : '#6b7280',
                    textAlign: 'center',
                  }}
                >
                  Out For Delivery
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  {purchaseOrder?.status === 'shipped'
                    ? 'In Progress'
                    : 'Pending'}
                </Typography>
              </Stack>

              <Stack alignItems="center" sx={{ width: '25%' }}>
                <StatusDot
                  isActive={purchaseOrder?.status === 'received'}
                  isCompleted={purchaseOrder?.status === 'received'}
                />
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    fontWeight: 500,
                    color:
                      purchaseOrder?.status === 'received'
                        ? '#f59e0b'
                        : '#6b7280',
                    textAlign: 'center',
                  }}
                >
                  Delivered
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  {purchaseOrder?.delivery_date
                    ? new Date(purchaseOrder.delivery_date).toLocaleDateString()
                    : expectedDate}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          width: '100%',
          height: 320,
          mb: 3,
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#f3f4f6',
        }}
      >
        <Image
          src="/map.png"
          alt="Delivery route map"
          fill
          style={{ objectFit: 'cover' }}
          priority={true}
        />
      </Box>

      {/* Map Section */}
      <Typography
        variant="h5"
        component="h2"
        sx={{ fontWeight: 'bold', color: '#1e293b', mb: 2 }}
      >
        Items Ordered
      </Typography>

      {/* Order Details */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          {/* Items List */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            {purchaseOrder?.items?.map((item: any, index: number) => (
              <React.Fragment key={item._id || index}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 48,
                        height: 48,
                        backgroundColor: '#f3f4f6',
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: '#d1d5db',
                          borderRadius: 0.5,
                        }}
                      />
                    </Avatar>
                    <Box>
                      <Tooltip
                        title={
                          purchaseOrder?.items && purchaseOrder.items.length > 1
                            ? purchaseOrder.items
                                .map((product: any) => product.product_name)
                                .join(', ')
                            : ''
                        }
                        placement="top"
                        arrow
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 'bold',
                            cursor:
                              purchaseOrder?.items &&
                              purchaseOrder.items.length > 1
                                ? 'help'
                                : 'default',
                          }}
                        >
                          {item.product_name || 'N/A'}
                        </Typography>
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary">
                        Product ID: {item.product_id || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      Qty: {item.quantity || 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      ₹{item.amount || 0}
                    </Typography>
                  </Box>
                </Stack>
                {index < (purchaseOrder?.items?.length || 0) - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Stack>

          {/* Bottom Section */}
          <Grid container spacing={16}>
            {/* Payment */}
            <Grid>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: '#1e293b', mb: 2 }}
              >
                Payment
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {purchaseOrder?.currency || 'INR'} Payment
                </Typography>
                <CreditCard sx={{ color: '#2563eb' }} />
              </Stack>
            </Grid>

            {/* Delivery */}
            <Grid>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: '#1e293b', mb: 2 }}
              >
                Delivery
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {purchaseOrder?.shipping_address?.street ||
                    'Address not specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {purchaseOrder?.shipping_address?.city || 'City'},{' '}
                  {purchaseOrder?.shipping_address?.state || 'State'}{' '}
                  {purchaseOrder?.shipping_address?.postal_code ||
                    'Postal Code'}
                </Typography>
              </Stack>
            </Grid>

            {/* Order Summary */}
            <Grid width={330}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', color: '#1e293b', mb: 2 }}
              >
                Order Summary
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ₹{purchaseOrder?.total_amount || 0}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Shipping
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ₹{purchaseOrder?.shipping_cost || 0}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Total
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    ₹
                    {(purchaseOrder?.total_amount || 0) +
                      (purchaseOrder?.shipping_cost || 0)}
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}
