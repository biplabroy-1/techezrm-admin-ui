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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/config';
import Notes from './Notes';

/**
 * Refund detail.
 *
 * This rendered a fixed page of invented values and never read the route's [id],
 * so every refund showed the same fiction: "Robin Bask", randhrpol@gmail.com,
 * "Lorem ipsum garden, high street, jungi - 678004", "T-floral ipsum",
 * "London, UK 474-769-3919", and a Notes field whose placeholder was
 * "Loreal ipsumLoreal ipsums...". No API call existed in the file.
 *
 * It now loads the transaction by id from GET /private/transactions/:id and shows
 * its real amounts, status, reason and gateway details.
 *
 * A note on scope: the transaction document stores customerId and orderId as bare
 * id strings, and this endpoint does not populate them. So the customer and order
 * sections show the raw reference plus a note saying the endpoint does not return
 * more, rather than being filled with another placeholder. Populating them is a
 * server-side change to Transaction.getTransactionById, which does a plain
 * findById.
 */

interface RefundDetail {
  _id: string;
  uniqueId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentSource?: string;
  paymentStatus?: string;
  transactionType?: string;
  paymentFor?: string;
  gatewayTransactionId?: string;
  orderId?: string;
  customerId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  refundDetails?: {
    refundAmount?: number;
    refundReason?: string;
    refundDate?: string;
    refundStatus?: string;
  };
  gatewayResponse?: {
    success?: boolean;
    message?: string;
    errorCode?: string;
    gatewayName?: string;
  };
}

const money = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '-';
  return `₹${n.toFixed(2)}`;
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

function useRefundById(id: string) {
  return useQuery({
    queryKey: ['refundTransaction', id],
    queryFn: async () => {
      const { data } = await api.get(`/private/transactions/${id}`);
      return (data?.data ?? data) as RefundDetail;
    },
    enabled: !!id,
    retry: 1,
  });
}

export default function RefundDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { data, isLoading, isError, error } = useRefundById(id ?? '');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ color: '#637381', textTransform: 'none', fontWeight: 500, mb: 2 }}
        >
          Back
        </Button>
        <Typography color="error">
          Could not load this refund: {(error as any)?.message ?? 'not found'}
        </Typography>
      </Box>
    );
  }

  const refund = data.refundDetails ?? {};
  // Falls back to the transaction amount, which is what a refund record carries
  // when refundDetails was never filled in.
  const refundAmount = refund.refundAmount ?? data.amount;
  const isProcessed = refund.refundStatus === 'processed' || data.paymentStatus === 'completed';

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
          '&:hover': { backgroundColor: 'transparent', color: '#212B36' },
        }}
      >
        Back
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 700, color: '#212B36', mb: 3 }}>
        Refund Details
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          maxWidth: '950px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: '#1e3a5f', width: 56, height: 56, fontWeight: 'bold' }}>
            {(data.uniqueId ?? '?').replace(/[^A-Za-z]/g, '').charAt(0) || 'R'}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '16px' }}>
              {data.uniqueId ?? '-'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
              {titleCase(data.transactionType)} via {titleCase(data.paymentSource)}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {[
            ['Refund amount', money(refundAmount)],
            ['Refund status', titleCase(refund.refundStatus ?? data.paymentStatus)],
            ['Refund reason', refund.refundReason ?? '-'],
            ['Requested on', prettyDate(refund.refundDate ?? data.createdAt)],
            ['Payment method', titleCase(data.paymentMethod)],
            ['Gateway reference', data.gatewayTransactionId ?? '-'],
          ].map(([label, value]) => (
            <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {label}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Typography variant="h6" fontWeight="600" color="#1a365d" gutterBottom mt={3}>
        Customer &amp; Order
      </Typography>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, maxWidth: '950px' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Customer reference
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
              {data.customerId ?? '-'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
              This endpoint does not populate the customer, so no name, email or
              phone is available to show.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Order reference
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
              {data.orderId ?? '-'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" fontWeight="600" color="#1a365d" gutterBottom mt={3}>
        Refund Reasons
      </Typography>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, maxWidth: '950px' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
              Gateway response
            </Typography>
            <Typography variant="body2">
              {data.gatewayResponse?.message ?? '-'}
            </Typography>
            {data.gatewayResponse?.errorCode && (
              <Typography variant="body2" sx={{ color: '#ff5252' }}>
                {data.gatewayResponse.errorCode}
              </Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
              Notes
            </Typography>
            {/* placeholder was "Loreal ipsumLoreal ipsums Loreal ipsums..." */}
            <Notes value={data.notes ?? ''} placeholder="Add a note about this refund" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Original amount
          </Typography>
          <Typography variant="body2">{money(data.amount)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Refunded
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: isProcessed ? '#00b894' : '#ff9800', fontWeight: 600 }}
          >
            {money(refundAmount)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
