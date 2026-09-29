'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import { warehouseService } from '@/api/services/warehouses';

const LIST_PATH = '/admin/data-management/warehouses';

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  maintenance: 'warning',
  inactive: 'default',
};

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Grid size={12}>
      <Divider sx={{ my: 1 }} />
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {title}
      </Typography>
      <Grid container spacing={3}>
        {children}
      </Grid>
    </Grid>
  );
}

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const warehouseId = params.id as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: () => warehouseService.getWarehouseById(warehouseId),
    enabled: Boolean(warehouseId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => warehouseService.deleteWarehouse(warehouseId),
    onSuccess: (response: any) => {
      if (response?.success === false) {
        toast.error(response.error || response.message || 'Failed to delete warehouse');
        return;
      }
      toast.success('Warehouse deleted');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      router.push(LIST_PATH);
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to delete warehouse'),
  });

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Delete this warehouse? This cannot be undone.')) {
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
          {(error as any)?.message || 'Could not load this warehouse. It may have been deleted.'}
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(LIST_PATH)}>
          Back to Warehouses
        </Button>
      </Box>
    );
  }

  const warehouse: any = (data as any)?.data ?? (data as any)?.warehouse ?? data;

  if (!warehouse) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Warehouse not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(LIST_PATH)}>
          Back to Warehouses
        </Button>
      </Box>
    );
  }

  const a = warehouse.address ?? {};
  const c = warehouse.contactInfo ?? {};

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(LIST_PATH)}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Warehouses
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
            {warehouse.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`${LIST_PATH}/${warehouseId}/edit`)}
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
              <Section title="Overview">
                <Row label="Name" value={warehouse.name} />
                <Row
                  label="Status"
                  value={
                    <Chip
                      label={warehouse.status}
                      size="small"
                      color={STATUS_COLOR[warehouse.status] ?? 'default'}
                    />
                  }
                />
                <Row label="Manager" value={warehouse.manager} />
                <Row label="Unique ID" value={warehouse.uniqueId} />
                <Row label="Capacity" value={warehouse.capacity} />
                <Row label="Current utilization" value={warehouse.currentUtilization} />
                <Row
                  label="Created"
                  value={warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleString() : null}
                />
                <Row
                  label="Updated"
                  value={warehouse.updatedAt ? new Date(warehouse.updatedAt).toLocaleString() : null}
                />
              </Section>

              <Section title="Address">
                <Row label="Street" value={a.street} />
                <Row label="City" value={a.city} />
                <Row label="State" value={a.state} />
                <Row label="Country" value={a.country} />
                <Row label="Zip code" value={a.zipCode} />
                <Row label="Latitude" value={a.latitude} />
                <Row label="Longitude" value={a.longitude} />
              </Section>

              <Section title="Contact">
                <Row label="Email" value={c.email} />
                <Row label="Phone" value={c.phone} />
                <Row label="Alternate phone" value={c.alternatePhone} />
              </Section>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
