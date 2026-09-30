'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/api/services/categories';
import {
  TableComponent,
  TableRowData,
} from '../../../../components/TableComponent';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface CategoryRowData extends TableRowData {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  // The rendered action buttons. TableComponent renders a cell that is a
  // React element directly, which is how every other listing page does this.
  actions: React.ReactNode;
}

export default function CategoriesListing() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch categories
  const {
    data: categoriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories', { page, search: debouncedSearchTerm }],
    queryFn: () =>
      categoryService.getCategories({ page, search: debouncedSearchTerm }),
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return categoryService.deleteCategory(categoryId);
    },
    onSuccess: () => {
      toast.success('Category deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  // Declared as a function (not a const arrow) and placed above `categoryData`
  // because the row mapping below calls it during render: a const arrow in
  // that position would be in its temporal dead zone and throw.
  function renderActions(categoryId: string) {
    return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleViewCategory(categoryId);
        }}
        sx={{ color: '#1976d2' }}
      >
        <VisibilityIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleEditCategory(categoryId);
        }}
        sx={{ color: '#ff9800' }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteCategory(categoryId);
        }}
        sx={{ color: '#f44336' }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
    );
  }

  const categories = categoriesData?.categories || [];
  // The API nests the count under `pagination` ({ success, categories,
  // pagination: { total, page, limit, ... } }). This used to read a top-level
  // `categoriesData?.total`, which does not exist, so the count was always 0
  // even with rows on screen.
  const totalResults = categoriesData?.pagination?.total ?? 0;

  const categoryData: CategoryRowData[] = categories.map((category: any) => ({
    id: category._id,
    name: category.name,
    slug: category.slug,
    description: category.description || 'No description',
    status: category.status || 'inactive',
    actions: renderActions(category._id),
  }));

  const columns = [
    { id: 'name', label: 'Category Name', width: '25%' },
    { id: 'slug', label: 'Slug', width: '20%' },
    { id: 'description', label: 'Description', width: '35%' },
    {
      id: 'status',
      label: 'Status',
      width: '10%',
      type: 'status' as const,
      align: 'center' as const,
    },
    { id: 'actions', label: 'Actions', width: '10%', align: 'center' as const },
  ];

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // TableRowData, not CategoryRowData: onRowClick is declared as
  // (row: TableRowData) => void, and CategoryRowData extends TableRowData, so
  // a handler taking the narrower type is not assignable (contravariance).
  const handleRowClick = (row: TableRowData) => {
    router.push(`/admin/data-management/categories/${row.id}`);
  };

  const handleAddCategory = () => {
    router.push('/admin/data-management/categories/add');
  };

  const handleEditCategory = (categoryId: string) => {
    router.push(`/admin/data-management/categories/${categoryId}/edit`);
  };

  const handleViewCategory = (categoryId: string) => {
    router.push(`/admin/data-management/categories/${categoryId}`);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete);
    }
  };


  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: '#F9FAFB',
        minHeight: '85vh',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1F2A44',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Categories Listing ({totalResults})
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
          sx={{
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' },
          }}
        >
          Add Category
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load categories. Please try again.
        </Alert>
      )}

      {!isLoading && !error && (
        <TableComponent
          columns={columns}
          data={categoryData}
          totalResults={totalResults}
          currentPage={page}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          showCheckboxes={false}
          showHeader={true}
          rowsPerPage={10}
          searchOptions={{
            value: searchTerm,
            onChange: setSearchTerm,
            placeholder: 'Search categories...',
          }}
          filterOptions={{
            value: '',
            onChange: () => {},
            options: statusOptions,
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this category? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteCategoryMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteCategoryMutation.isPending}
            startIcon={
              deleteCategoryMutation.isPending ? (
                <CircularProgress size={16} />
              ) : null
            }
          >
            {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
