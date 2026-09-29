'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'react-toastify';
import { categoryService } from '@/api/services/categories';

const LIST_PATH = '/admin/data-management/categories';

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

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const categoryId = params.id as string;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loaded, setLoaded] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoryService.getCategoryById(categoryId),
    enabled: Boolean(categoryId),
  });

  // Seed the form once the record arrives. Guarded by `loaded` so a background
  // refetch (e.g. after invalidation) does not clobber edits in progress.
  useEffect(() => {
    if (loaded) return;
    const category: any = (data as any)?.data ?? (data as any)?.category ?? data;
    if (!category) return;
    setForm({
      name: category.name ?? '',
      description: category.description ?? '',
      image: category.image ?? '',
      status: category.status === 'inactive' ? 'inactive' : 'active',
    });
    setLoaded(true);
  }, [data, loaded]);

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
    mutationFn: (payload: Partial<FormState>) =>
      categoryService.updateCategory(categoryId, payload),
    onSuccess: (response: any) => {
      if (response?.success === false) {
        toast.error(response.error || response.message || 'Failed to update category');
        return;
      }
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', categoryId] });
      router.push(`${LIST_PATH}/${categoryId}`);
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to update category'),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    // `slug` is deliberately omitted: the server re-derives it from `name` in the
    // pre("validate") hook, so sending a stale client value would be ignored anyway.
    mutation.mutate({
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim() || undefined,
      status: form.status,
    });
  };

  const handleCancel = () => router.push(`${LIST_PATH}/${categoryId}`);

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
          {(error as any)?.message || 'Could not load this category.'}
        </Alert>
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
          onClick={handleCancel}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Back
        </Button>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Edit Category
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
                    <InputLabel id="edit-category-status-label">Status</InputLabel>
                    <Select
                      labelId="edit-category-status-label"
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

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button onClick={handleCancel} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={mutation.isPending || !loaded}
                  startIcon={
                    mutation.isPending ? <CircularProgress size={20} color="inherit" /> : undefined
                  }
                >
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
