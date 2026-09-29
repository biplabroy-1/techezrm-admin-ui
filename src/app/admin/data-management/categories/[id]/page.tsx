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
import { useQuery } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { categoryService } from '@/api/services/categories';

const LIST_PATH = '/admin/data-management/categories';

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

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const categoryId = params.id as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoryService.getCategoryById(categoryId),
    enabled: Boolean(categoryId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => categoryService.deleteCategory(categoryId),
    onSuccess: (response: any) => {
      if (response?.success === false) {
        toast.error(response.error || response.message || 'Failed to delete category');
        return;
      }
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      router.push(LIST_PATH);
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to delete category'),
  });

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Delete this category? This cannot be undone.')) {
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
          {(error as any)?.message || 'Could not load this category. It may have been deleted.'}
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(LIST_PATH)}>
          Back to Categories
        </Button>
      </Box>
    );
  }

  const category: any = (data as any)?.data ?? (data as any)?.category ?? data;

  if (!category) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Category not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push(LIST_PATH)}>
          Back to Categories
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(LIST_PATH)}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Categories
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
            {category.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push(`${LIST_PATH}/${categoryId}/edit`)}
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
              <Row label="Name" value={category.name} />
              <Row label="Status" value={
                <Chip
                  label={category.status}
                  size="small"
                  color={category.status === 'active' ? 'success' : 'default'}
                />
              } />
              <Row label="Unique ID" value={category.uniqueId} />
              <Row label="Slug" value={category.slug} />
              <Row label="Parent category" value={category.parentCategory} />
              <Row label="Tags" value={
                Array.isArray(category.tags) && category.tags.length
                  ? category.tags.join(', ')
                  : null
              } />
              <Row label="Created" value={category.createdAt ? new Date(category.createdAt).toLocaleString() : null} />
              <Row label="Updated" value={category.updatedAt ? new Date(category.updatedAt).toLocaleString() : null} />

              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {category.description || '—'}
                </Typography>
              </Grid>

              {category.image ? (
                <Grid size={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                    Image
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {category.image}
                  </Typography>
                </Grid>
              ) : null}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
