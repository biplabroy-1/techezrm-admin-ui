'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/api/services/customers';

interface CartTabProps {
  customerId: string;
}

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    sku?: string;
  };
  quantity: number;
  price: number;
  addedAt: string;
}

interface CartApiResponse {
  success: boolean;
  message: string;
  data: {
    cart: {
      _id: string;
      customer: string;
      items: CartItem[];
      status: string;
      totalAmount: number;
      totalItems: number;
      createdAt: string;
      updatedAt: string;
      expiresAt: string;
    };
    totalItems: number;
    totalAmount: number;
    itemCount: number;
  };
}

export default function CartTab({ customerId }: CartTabProps) {
  const {
    data: cartData,
    isLoading,
    error,
  } = useQuery<CartApiResponse>({
    queryKey: ['customerCart', customerId],
    queryFn: () => customerService.getCustomerCart(customerId),
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
          {error instanceof Error ? error.message : 'Failed to load cart data'}
        </Alert>
      </Box>
    );
  }

  const cart = cartData?.data?.cart;
  const cartItems = cart?.items || [];
  const totalItems = cartData?.data?.totalItems || 0;
  const totalAmount = cartData?.data?.totalAmount || 0;

  if (!cart || cartItems.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Cart is Empty
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This customer has no items in their cart.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Cart Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" gutterBottom>
                {totalItems}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" gutterBottom>
                {cartItems.length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Unique Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cart Items Table */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <CartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Cart Items
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="center">SKU</TableCell>
                  <TableCell align="center">Price</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Added Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item._id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar
                          src={item.product.images?.[0]}
                          sx={{ width: 50, height: 50 }}
                          variant="rounded"
                        >
                          {item.product.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" component="div">
                            {item.product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {item.product._id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.product.sku || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatCurrency(item.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                        }}
                      >
                        <IconButton size="small" disabled>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="body1"
                          sx={{ minWidth: 24, textAlign: 'center' }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton size="small" disabled>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle2" color="success.main">
                        {formatCurrency(item.price * item.quantity)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(item.addedAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Cart Total */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6">Cart Total:</Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
