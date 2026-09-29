'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  categoryService,
  type CreateCategoryRequest,
} from '@/api/services/categories';
import { toast } from 'react-toastify';

interface FormState {
  name: string;
  description: string;
  image: string;
  status: 'active' | 'inactive';
}

const INITIAL_FORM: FormState = {
  name: '',
  description: '',
  image: '',
  status: 'active',
};

/**
 * Mirrors the pre-save hook in server/src/models/categories.ts. The server
 * re-derives the slug on save, this only keeps the request payload honest.
 */
const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '-');

export default function AddCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleStatusChange = (event: SelectChangeEvent<FormState['status']>) => {
    setForm((prev) => ({ ...prev, status: event.target.value as FormState['status'] }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) {
      next.name = 'Category name is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateCategoryRequest) =>
      categoryService.createCategory(payload),
    onSuccess: (response) => {
      if (response?.success === false) {
        toast.error(response.error || 'Failed to create category');
        return;
      }
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      router.push('/admin/data-management/categories');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create category');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    mutation.mutate({
      name: form.name.trim(),
      slug: toSlug(form.name.trim()),
      description: form.description.trim(),
      image: form.image.trim() || undefined,
      status: form.status,
    });
  };

  const handleCancel = () => {
    router.push('/admin/data-management/categories');
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 900, margin: '0 auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back to Categories
        </Button>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Add Category
        </Typography>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Name"
                    value={form.name}
                    onChange={handleChange('name')}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="category-status-label">Status</InputLabel>
                    <Select
                      labelId="category-status-label"
                      label="Status"
                      value={form.status}
                      onChange={handleStatusChange}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Description"
                    value={form.description}
                    onChange={handleChange('description')}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Image URL"
                    placeholder="https://..."
                    value={form.image}
                    onChange={handleChange('image')}
                    helperText="Optional"
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 3,
                }}
              >
                <Button onClick={handleCancel} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={mutation.isPending}
                  startIcon={
                    mutation.isPending ? <CircularProgress size={20} color="inherit" /> : undefined
                  }
                >
                  {mutation.isPending ? 'Creating...' : 'Create Category'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
