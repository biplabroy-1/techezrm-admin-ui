'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Link,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { toast } from 'react-toastify';
import { supplierService } from '@/api/services/suppliers';

const LIST_PATH = '/admin/data-management/suppliers';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      {/* component="div": Typography renders a <p> by default, and some values
          (e.g. the status <Chip>) are <div>s, which cannot nest inside a <p>. */}
      <Typography component="div" variant="body1" sx={{ wordBreak: 'break-word' }}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </Typography>
    </Grid>
  );
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const supplierId = params.id as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => supplierService.getSupplierById(supplierId),
    enabled: Boolean(supplierId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => supplierService.deleteSupplier(supplierId),
    onSuccess: (response: any) => {
      if (response?.success === false) {
        toast.error(response.error || response.message || 'Failed to delete supplier');
        return;
      }
      toast.success('Supplier deleted');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      router.push(LIST_PATH);
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to delete supplier'),
  });

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Delete this supplier? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {(error as any)?.message || 'Could not load this supplier. It may have been deleted.'}
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(LIST_PATH)}>
          Back to Suppliers
        </Button>
      </Box>
    );
  }

  // Some list endpoints return an array; normalise so the page renders either way.
  const raw = (data as any)?.data ?? (data as any)?.supplier ?? data;
  const supplier: any = Array.isArray(raw) ? raw[0] : raw;

  if (!supplier) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Supplier not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(LIST_PATH)}>
          Back to Suppliers
        </Button>
      </Box>
    );
  }

  const lat = supplier.latitude;
  const lon = supplier.longitude;
  const hasCoords = lat !== null && lat !== undefined && lat !== '' && lon !== null && lon !== undefined && lon !== '';

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(LIST_PATH)}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Suppliers
        </Button>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {supplier.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`${LIST_PATH}/${supplierId}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Row label="Name" value={supplier.name} />
              <Row label="Unique ID" value={supplier.uniqueId} />
              <Row label="Country" value={supplier.country} />
              <Row label="Payment method" value={supplier.payment_method} />
              <Row
                label="Created"
                value={supplier.createdAt ? new Date(supplier.createdAt).toLocaleString() : null}
              />
              <Row
                label="Updated"
                value={supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleString() : null}
              />

              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Contact
                </Typography>
                <Grid container spacing={3} sx={{ mt: 0 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Link href={`mailto:${supplier.email}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      {supplier.email || '—'}
                    </Link>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" />
                      {supplier.phone || '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PlaceIcon fontSize="small" />
                      {hasCoords ? `${lat}, ${lon}` : '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Address
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {supplier.address || '—'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
