'use client';

import React from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Divider,
  Grid,
  styled,
  Avatar,
  Rating,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LocalShipping, Receipt } from '@mui/icons-material';
import {
  type TableColumn,
  type TableRowData,
  TableComponent,
} from '../../../../../../components/TableComponent';
// import Image from 'next/image';
import { useOrderById } from '@/api/handlers';

const StyledTab = styled(Tab)({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '14px',
  minWidth: 'unset',
  padding: '12px 16px',
  '&.Mui-selected': {
    color: '#000000',
    fontWeight: 700,
  },
});

const StatusDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isCompleted',
})<{ isActive?: boolean; isCompleted?: boolean }>(
  ({ isActive, isCompleted }) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: isActive ? '#f5a623' : isCompleted ? '#667085' : '#e0e0e0',
    border: isCompleted || isActive ? 'none' : '2px solid #e0e0e0',
  })
);

interface OrderTrackingClientProps {
  id: string;
}

export function OrderTrackingClient({ id }: OrderTrackingClientProps) {
  const [tabValue, setTabValue] = React.useState(0);

  // Fetch order data using the API
  const {
    data: orderData,
    isLoading,
    error,
  } = useOrderById(id);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const tabsStyles = {
    '& .MuiTabs-indicator': {
      backgroundColor: tabValue === 0 ? '#1a365d' : '#000000',
      height: tabValue === 0 ? '3px' : '2px',
    },
  };

  // Helper functions for data formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getOrderStatusProgress = (status: string) => {
    const statuses = ['confirmed', 'shipped', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(status.toLowerCase());
    return currentIndex;
  };

  const getPaymentMethodDisplay = (method: string) => {
    const methodMap: Record<string, string> = {
      upi: 'UPI',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      cod: 'Cash on Delivery',
      net_banking: 'Net Banking',
    };
    return methodMap[method] || method.toUpperCase();
  };

  // Customer orders columns for the table in customer info tab
  const orderColumns: TableColumn[] = [
    { id: 'order', label: 'Order', width: '25%' },
    { id: 'date', label: 'Date', width: '25%' },
    {
      id: 'status',
      label: 'Order Status',
      width: '25%',
      align: 'center',
      type: 'status',
    },
    { id: 'price', label: 'Price', width: '25%', align: 'right' },
  ];

  // This was commented "Mock data for other customer orders" and read as invented
  // data. It is not: it maps the CURRENT order, which comes from the API, into a
  // one-row table. The comment was simply wrong, and it obscured the real gap -
  // there is no "other orders" request here.
  const customerOrdersData: TableRowData[] = [
    {
      id: '1',
      order: orderData?.uniqueId || '#N/A',
      date: orderData ? formatDate(orderData.createdAt) : 'N/A',
      status: orderData?.orderStatus || 'Unknown',
      price: orderData ? formatCurrency(orderData.totalAmount) : '₹0.00',
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load order details. Please try again.
        </Alert>
      </Box>
    );
  }

  // No data state
  if (!orderData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Order not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 950, margin: '0 auto', p: 3, bgcolor: '#f9fafb' }}>
      <Typography variant="h5" fontWeight="700" color="#1a365d" gutterBottom>
        Track The Order
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="order tracking tabs"
          sx={tabsStyles}
        >
          <StyledTab label="Order Details" />
          <StyledTab label="Customer Information" />
        </Tabs>
      </Box>

      {tabValue === 0 ? (
        // Order Details Tab Content
        <>
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight="700"
                    color="#1a365d"
                  >
                    Order ID: {orderData.uniqueId}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                      Order date:
                    </Typography>
                    <Typography variant="body2" fontWeight="500">
                      {formatDate(orderData.createdAt)} |
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <LocalShipping
                        sx={{ color: '#4caf50', fontSize: 18, mr: 1 }}
                      />
                      <Typography
                        variant="body2"
                        color="#4caf50"
                        fontWeight="500"
                      >
                        Estimated delivery: {orderData.estimatedDelivery ? formatDate(orderData.estimatedDelivery) : 'TBD'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid
                sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}
              >
                <Button
                  variant="outlined"
                  startIcon={<Receipt />}
                  sx={{
                    borderColor: '#e0e0e0',
                    color: '#424242',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { borderColor: '#bdbdbd' },
                  }}
                >
                  Invoice
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#f5a623',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#e69c1f' },
                  }}
                >
                  Track order {orderData.trackingNumber ? `(${orderData.trackingNumber})` : ''}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Order Status Progress */}
          <Paper
            elevation={0}
            sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'transparent' }}
          >
            <Box sx={{ position: 'relative', width: '100%', mb: 4, px: 0 }}>
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  width: '100%',
                }}
              >
                {/* Single continuous background line */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '6px',
                    left: 'calc(12.5% + 6px)', // Start from center of first circle
                    right: 'calc(12.5% + 6px)', // End at center of last circle
                    height: '2px',
                    backgroundColor: '#e0e0e0',
                    zIndex: 1,
                  }}
                />

                {/* Active progress overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '6px',
                    left: 'calc(12.5% + 6px)',
                    width: `calc(75% * ${Math.max(0, getOrderStatusProgress(orderData.orderStatus)) / 3})`,
                    height: '2px',
                    backgroundColor: '#f5a623',
                    zIndex: 1,
                    transition: 'width 0.3s ease',
                  }}
                />

                {/* Status circles */}
                {['confirmed', 'shipped', 'out_for_delivery', 'delivered'].map((status, index) => {
                  const currentStatusIndex = getOrderStatusProgress(orderData.orderStatus);
                  const isActive = index === currentStatusIndex;
                  const isCompleted = index < currentStatusIndex;

                  return (
                    <Box
                      key={status}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 2,
                        width: '25%',
                      }}
                    >
                      <StatusDot isActive={isActive} isCompleted={isCompleted} />
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          textAlign: 'center',
                          fontWeight: 500,
                          color: isActive ? '#f5a623' : isCompleted ? '#667085' : '#bdbdbd',
                          fontSize: '12px',
                        }}
                      >
                        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(102, 112, 133, 1)',
                          textAlign: 'center',
                          fontSize: '11px',
                        }}
                      >
                        {formatDate(orderData.updatedAt)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Paper>




          <Typography
            variant="h6"
            fontWeight="700"
            color="#1a365d"
            sx={{ mb: 2 }}
          >
            Items Ordered
          </Typography>

          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            {orderData.items.map((item, index) => (
              <React.Fragment key={item._id}>
                <Grid container spacing={22} alignItems="center">
                  <Grid display="flex" alignItems="center" gap={3}>
                    <Avatar
                      variant="rounded"
                      sx={{ width: 50, height: 50, bgcolor: '#f0f0f0' }}
                    >
                      {item.product?.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700">
                        {item.product?.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="rgba(102, 112, 133, 1)"
                      >
                        Unit Price: {formatCurrency(item.price)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid>
                    <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                      Qty: {item.quantity}
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography variant="subtitle2" fontWeight="700">
                      {formatCurrency(item.total)}
                    </Typography>
                  </Grid>
                </Grid>
                {index < orderData.items.length - 1 && <Divider sx={{ my: 2 }} />}
              </React.Fragment>
            ))}

            <Grid container spacing={12} sx={{ mt: 5 }}>
              <Grid>
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    color="#1a365d"
                    sx={{ mb: 2 }}
                  >
                    Payment
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                      {getPaymentMethodDisplay(orderData.paymentMethod)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={orderData.paymentStatus === 'completed' ? '#4caf50' : '#f5a623'}
                      fontWeight="500"
                    >
                      ({orderData.paymentStatus.toUpperCase()})
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid>
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    color="#1a365d"
                    sx={{ mb: 2 }}
                  >
                    Delivery
                  </Typography>
                  <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                    Shipping Address
                  </Typography>
                  <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                    {orderData.shippingAddress.street}
                  </Typography>
                  <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                    {orderData.shippingAddress.city}, {orderData.shippingAddress.state}
                  </Typography>
                  <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                    {orderData.shippingAddress.country} - {orderData.shippingAddress.zipCode}
                  </Typography>
                </Box>
              </Grid>

              <Grid>
                <Typography
                  variant="h6"
                  fontWeight="700"
                  color="#1a365d"
                  sx={{ mb: 2 }}
                >
                  Order Summary
                </Typography>
                <Box width={'25vw'}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                      Subtotal
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="rgba(102, 112, 133, 1)"
                    >
                      {formatCurrency(orderData.subTotal)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                      Discount
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="#4caf50"
                    >
                      - {formatCurrency(orderData.discount)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                      Shipping
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="rgba(102, 112, 133, 1)"
                    >
                      {formatCurrency(orderData.shippingCost)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                      Tax
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="rgba(102, 112, 133, 1)"
                    >
                      + {formatCurrency(orderData.tax)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="700"
                      color="rgba(102, 112, 133, 1)"
                    >
                      Total
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      fontWeight="700"
                      color="rgba(102, 112, 133, 1)"
                    >
                      {formatCurrency(orderData.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </>
      ) : (
        // Customer Information Tab Content
        <>
          <Box
            sx={{
              maxWidth: '100%',
              margin: '0 auto',
              p: 3,
              bgcolor: '#f9fafb',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
                mb: 3,
              }}
            >
              {/* Left Column - Customer Info & Notes */}
              <Box sx={{ flex: 2 }}>
                <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: 2, height: '100%' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      mb: 4,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: '#E2E8F0',
                        color: '#1a365d',
                        width: 48,
                        height: 48,
                        fontSize: '20px',
                      }}
                    >
                      {orderData.customer?.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="700" color="#1a365d">
                        {orderData.customer?.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="rgba(102, 112, 133, 1)"
                      >
                        {orderData.shippingAddress.country}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="rgba(102, 112, 133, 1)"
                        >
                          Customer ID: {orderData.customer._id.slice(-8)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                      <Rating
                        name="read-only"
                        value={5}
                        readOnly
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="700"
                      color="#1a365d"
                      sx={{ mb: 2 }}
                    >
                      Order Notes
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderColor: '#e0e0e0',
                        borderRadius: 1,
                        color: 'rgba(102, 112, 133, 1)',
                        minHeight: '80px',
                      }}
                    >
                      {orderData.notes || 'No special instructions for this order.'}
                    </Paper>
                  </Box>
                </Paper>
              </Box>

              {/* Right Column - Overview */}
              <Box sx={{ flex: 1 }}>
                <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: 2, height: '100%' }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="700"
                    color="#1a365d"
                    sx={{ mb: 3 }}
                  >
                    Customer Overview
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="body2"
                      color="rgba(102, 112, 133, 1)"
                      sx={{ mb: 0.5 }}
                    >
                      Billing Address
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="#1a365d"
                    >
                      {orderData.billingAddress.street}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="#1a365d"
                    >
                      {orderData.billingAddress.city}, {orderData.billingAddress.state}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="#1a365d"
                    >
                      {orderData.billingAddress.zipCode}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="#1a365d"
                    >
                      {orderData.billingAddress.country}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="body2"
                      color="rgba(102, 112, 133, 1)"
                      sx={{ mb: 0.5 }}
                    >
                      Email Address
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="#1a365d"
                    >
                      {orderData.customer.email}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="rgba(102, 112, 133, 1)"
                      sx={{ mb: 0.5 }}
                    >
                      Phone
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="500"
                      color="#1a365d"
                    >
                      {orderData.customer.phone}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>

            {/* Customer Orders (this order) */}
            <Box sx={{ width: '100%' }}>
              <Typography
                variant="h6"
                fontWeight="700"
                color="#1a365d"
                sx={{ mb: 2 }}
              >
                Customer Orders
              </Typography>
              <TableComponent
                columns={orderColumns}
                data={customerOrdersData}
                totalResults={customerOrdersData.length}
                showCheckboxes={false}
                showHeader={true}
                rowsPerPage={10}
                currentPage={1}
                onPageChange={() => { }}
              />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
