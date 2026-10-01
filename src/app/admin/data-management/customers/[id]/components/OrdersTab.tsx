'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Pagination,
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/api/services/customers';

interface OrdersTabProps {
  customerId: string;
}

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    sku?: string;
  };
  quantity: number;
  price: number;
  total: number;
}

interface CustomerOrder {
  _id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  totalItems: number;
  shippingAddress: Record<string, unknown>;
  billingAddress: Record<string, unknown>;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// Interface available for future type checking
// interface OrdersData {
//   success: boolean;
//   data: {
//     orders: CustomerOrder[];
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

export default function OrdersTab({ customerId }: OrdersTabProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;

  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customerOrders', customerId, page, statusFilter],
    queryFn: () =>
      customerService.getCustomerOrders(customerId, {
        page,
        limit,
        status: statusFilter || undefined,
      }),
    enabled: !!customerId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error instanceof Error
            ? error.message
            : 'Failed to load orders data'}
        </Alert>
      </Box>
    );
  }

  // getCustomerOrders is typed `Promise<any>`, so `orders` was any[] and every
  // reduce/filter/map callback parameter was an implicit any. These are the fields
  // this tab actually reads.
  type CustomerOrder = {
    _id: string;
    orderNumber?: string;
    totalItems?: number;
    totalAmount?: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  };
  const orders: CustomerOrder[] = ordersData?.data?.orders || [];
  const totalOrders = ordersData?.data?.total || 0;
  const totalPages = ordersData?.data?.totalPages || 1;

  if (orders.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <OrderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No Orders Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This customer has not placed any orders yet.
        </Typography>
      </Box>
    );
  }

  // Calculate summary statistics
  const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0);
  const completedOrders = orders.filter(
    (order) => order.status === 'delivered'
  ).length;
  const pendingOrders = orders.filter(
    (order) => order.status === 'pending' || order.status === 'processing'
  ).length;

  return (
    <Box sx={{ p: 2 }}>
      {/* Orders Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" gutterBottom>
                {totalOrders}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {formatCurrency(totalSpent)}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total Spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" gutterBottom>
                {completedOrders}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {pendingOrders}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Controls */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="shipped">Shipped</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          size="small"
          disabled
        >
          Export Orders
        </Button>
      </Box>

      {/* Orders Table */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <OrderIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Order History
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell align="center">Date</TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Payment</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" component="div">
                          #{order.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order._id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatDate(order.createdAt ?? '')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {order.totalItems} items
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle2" color="success.main">
                        {formatCurrency(order.totalAmount ?? 0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.status.toUpperCase()}
                        color={
                          getStatusColor(order.status) as
                            | 'success'
                            | 'info'
                            | 'warning'
                            | 'error'
                            | 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.paymentStatus.toUpperCase()}
                        color={
                          getPaymentStatusColor(order.paymentStatus) as
                            | 'success'
                            | 'warning'
                            | 'error'
                            | 'info'
                            | 'default'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          justifyContent: 'center',
                        }}
                      >
                        <IconButton
                          size="small"
                          title="View Order Details"
                          sx={{ color: 'primary.main' }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Print Order"
                          sx={{ color: 'info.main' }}
                          disabled
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="Download Invoice"
                          sx={{ color: 'success.main' }}
                          disabled
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Order Summary */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {orders.length} of {totalOrders} total orders
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
