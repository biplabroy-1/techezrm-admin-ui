'use client';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import React from 'react';
import { useOrderById } from '@/api/handlers';

/**
 * Payment detail.
 *
 * This rendered a fixed page of invented values and never read the route's [id]
 * parameter, so every payment linked to the same fiction: "Robin Bask",
 * randhrpol@gmail.com, "Lorem ipsum garden, high street, jungi - 678004",
 * $123 / $1234.89 / $4666.48, and a "Track The Order" list hardcoded to two rows
 * of "vitamin / T-floral ipsum / Qty: 234". No API call existed in the file.
 *
 * It now loads the order by id and shows its real customer, line items, address
 * and money. Note the route segment stays [id] - the canonical identifier for an
 * order is its uniqueId (EZ-OI-00042), which is what the list links to.
 */

const money = (v: unknown): string => {
  const n = Number(v);
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : '-';
};

const prettyDate = (v: unknown): string => {
  if (!v) return '-';
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const titleCase = (v: unknown): string => {
  const s = String(v ?? '').replace(/_/g, ' ').trim();
  if (!s) return '-';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const initial = (name: string): string => name.trim().charAt(0).toUpperCase() || '?';

export default function PendingDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { data: order, isLoading, isError, error } = useOrderById(id ?? '');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !order) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{
            color: '#637381',
            textTransform: 'none',
            fontWeight: 500,
            mb: 2,
            '&:hover': { backgroundColor: 'transparent', color: '#212B36' },
          }}
        >
          Back
        </Button>
        <Typography color="error">
          Could not load this payment:{' '}
          {(error as any)?.message ?? 'order not found'}
        </Typography>
      </Box>
    );
  }

  const customer: any = order.customer;
  const custName =
    customer && typeof customer === 'object' ? customer.name : null;
  const custEmail =
    customer && typeof customer === 'object' ? customer.email : null;
  const custPhone =
    customer && typeof customer === 'object' ? customer.phone : null;
  const ship: any = order.shippingAddress ?? {};
  const addressLine = [ship.street, ship.city, ship.state, ship.country, ship.zipCode]
    .filter(Boolean)
    .join(', ');
  const items = order.items ?? [];

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.back()}
        sx={{
          color: '#637381',
          textTransform: 'none',
          fontWeight: 500,
          mb: 1,
          mt: 0,
          '&:hover': { backgroundColor: 'transparent', color: '#212B36' },
        }}
      >
        Back
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 700, color: '#212B36', mb: 3 }}>
        {order.paymentStatus === 'completed' || order.paymentStatus === 'refunded'
          ? 'Completed payment'
          : 'Pending payment'}
      </Typography>

      <Box sx={{ display: 'flex', gap: 5, maxWidth: '950px', width: '100%', flexWrap: 'wrap' }}>
        {/* Customer */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: '320px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            padding: '24px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#1e3a5f',
                width: 56,
                height: 56,
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              {initial(String(custName ?? '?'))}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                {custName ?? 'Unknown customer'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
                {ship.country ?? '-'}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mt: 3, ml: 8 }}>
            <Grid>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon sx={{ color: '#666', fontSize: '18px', minWidth: '20px' }} />
                <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
                  {custPhone ?? '-'}
                </Typography>
              </Box>
            </Grid>
            <Grid>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ color: '#666', fontSize: '18px', minWidth: '20px' }} />
                <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
                  {custEmail ?? '-'}
                </Typography>
              </Box>
            </Grid>
            <Grid>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOnIcon sx={{ color: '#666', fontSize: '18px', minWidth: '20px', mt: '2px' }} />
                <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
                  {addressLine || '-'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Amounts */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: '320px',
            p: 3,
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Invoice
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {order.uniqueId ?? '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Amount
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: order.paymentStatus === 'completed' ? '#00b894' : '#ff5252', fontWeight: 'bold' }}
              >
                {money(order.totalAmount)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Payment status
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {titleCase(order.paymentStatus)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Placed
              </Typography>
              <Typography variant="body2" sx={{ color: '#333' }}>
                {prettyDate(order.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Typography
        variant="h6"
        fontWeight="600"
        color="#1a365d"
        gutterBottom
        mt={3}
      >
        Order Items
      </Typography>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        {items.length === 0 ? (
          <Typography variant="body2" color="rgba(102, 112, 133, 1)">
            This order has no line items recorded.
          </Typography>
        ) : (
          items.map((item: any, index: number) => {
            const p = item.product;
            const productName =
              p && typeof p === 'object' ? p.name : null;
            const image =
              p && typeof p === 'object' ? (p as any).bannerImage : null;
            return (
              <React.Fragment key={item._id ?? index}>
                <Grid container spacing={3} alignItems="center">
                  <Grid display="flex" alignItems="center" gap={3}>
                    {image ? (
                      <Avatar variant="rounded" src={String(image)} sx={{ width: 50, height: 50 }} />
                    ) : (
                      <Avatar variant="rounded" sx={{ width: 50, height: 50, bgcolor: '#f0f0f0' }}>
                        {initial(String(productName ?? '?'))}
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700">
                        {productName ?? 'Unknown product'}
                      </Typography>
                      <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                        {money(item.price)} each
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid>
                    <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                      Qty: {item.quantity ?? 0}
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography variant="subtitle2" fontWeight="700">
                      {money(item.total)}
                    </Typography>
                  </Grid>
                </Grid>
                {index < items.length - 1 && <Divider sx={{ my: 2 }} />}
              </React.Fragment>
            );
          })
        )}

        <Grid container spacing={3} sx={{ mt: 5 }}>
          <Grid>
            <Typography variant="h6" fontWeight="700" color="#1a365d" sx={{ mb: 2 }}>
              Payment
            </Typography>
            <Typography variant="body2" color="rgba(102, 112, 133, 1)">
              {titleCase(order.paymentMethod)}
            </Typography>
          </Grid>

          <Grid>
            <Typography variant="h6" fontWeight="700" color="#1a365d" sx={{ mb: 2 }}>
              Delivery
            </Typography>
            <Typography variant="body2" color="rgba(102, 112, 133, 1)">
              {addressLine || '-'}
            </Typography>
            {order.trackingNumber && (
              <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                Tracking: {order.trackingNumber}
              </Typography>
            )}
          </Grid>

          <Grid>
            <Typography variant="h6" fontWeight="700" color="#1a365d" sx={{ mb: 2 }}>
              Order Summary
            </Typography>
            <Box width={'25vw'} minWidth={'220px'}>
              {[
                ['Subtotal', money(order.subTotal)],
                ['Discount', money(order.discount)],
                ['Delivery', money(order.shippingCost)],
                ['Tax', money(order.tax)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="rgba(102, 112, 133, 1)">
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight="500" color="rgba(102, 112, 133, 1)">
                    {value}
                  </Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="rgba(102, 112, 133, 1)">
                  Total
                </Typography>
                <Typography variant="subtitle2" fontWeight="700" color="rgba(102, 112, 133, 1)">
                  {money(order.totalAmount)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
