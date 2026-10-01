import React, { useState } from 'react';
import type { Category, CreateCategoryRequest } from '../api/services/categories';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCategories';
import {
  Button,
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

export default function CategoryExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'active',
  });

  // Direct hook usage
  const { data: categories, isLoading, error } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // CreateCategoryRequest.status is the union 'active' | 'inactive'; the form state
  // held a plain string, so every submit was rejected by the type checker.
  type CategoryForm = CreateCategoryRequest;

  const handleCreate = async () => {
    try {
      await createCategory.mutateAsync(formData as CategoryForm);
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', description: '', status: 'active' });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateCategory.mutateAsync({
        // handleUpdate only runs from the edit modal, which always has a row, but
        // editingCategory is nullable state - guard rather than assert.
        id: editingCategory?.id ?? '',
        data: formData as Partial<CreateCategoryRequest>,
      });
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', status: 'active' });
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', status: 'active' });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      status: category.status,
    });
    setIsModalOpen(true);
  };

  if (isLoading) return <Typography>Loading categories...</Typography>;
  if (error)
    return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5">Categories</Typography>
        <Button variant="contained" onClick={openCreateModal}>
          Add Category
        </Button>
      </Box>

      {/* Categories List */}
      <Box>
        {/* The list hook returns CategoriesListResponse, whose payload key is
            `categories` - not `data`. Reading `data` here rendered nothing. */}
        {categories?.categories?.map((category: Category) => (
          <Box
            key={category.id}
            sx={{
              mb: 2,
              p: 2,
              border: '1px solid #eee',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h6">{category.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                Slug: {category.slug}
              </Typography>
              <Typography variant="body2">{category.description}</Typography>
              <Typography
                variant="body2"
                color={
                  category.status === 'active' ? 'success.main' : 'error.main'
                }
              >
                Status: {category.status}
              </Typography>
            </Box>
            <Box>
              <Button
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
                onClick={() => openEditModal(category)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDelete(category.id ?? '')}
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Create/Edit Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Create Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              select
              SelectProps={{ native: true }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={editingCategory ? handleUpdate : handleCreate}
            disabled={createCategory.isPending || updateCategory.isPending}
          >
            {editingCategory
              ? updateCategory.isPending
                ? 'Updating...'
                : 'Update'
              : createCategory.isPending
                ? 'Creating...'
                : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
