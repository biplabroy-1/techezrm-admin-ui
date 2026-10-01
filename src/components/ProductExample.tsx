import React, { useState } from 'react';
import type { CreateProductRequest } from '../api/services/products';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks/useProducts';
import { Button, Box, Typography, TextField } from '@mui/material';

// Example component showing direct hook usage
export default function ProductExample() {
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Direct hook usage - no handlers needed
  const { data: products, isLoading, error } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleCreate = async () => {
    try {
      await createProduct.mutateAsync({
        name: newProduct.name,
        description: 'Sample description',
        price: parseFloat(newProduct.price),
        category: 'Supplements',
        inStock: true,
      });
      setNewProduct({ name: '', price: '' });
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  const handleUpdate = async (id: string, data: Partial<CreateProductRequest>) => {
    try {
      await updateProduct.mutateAsync({ id, data });
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error)
    return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Products
      </Typography>

      {/* Create Product Form */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Add New Product
        </Typography>
        <TextField
          label="Name"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct((prev) => ({ ...prev, name: e.target.value }))
          }
          sx={{ mr: 2 }}
        />
        <TextField
          label="Price"
          type="number"
          value={newProduct.price}
          onChange={(e) =>
            setNewProduct((prev) => ({ ...prev, price: e.target.value }))
          }
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={createProduct.isPending}
        >
          {createProduct.isPending ? 'Creating...' : 'Create'}
        </Button>
      </Box>

      {/* Products List */}
      <Box>
        {/* The list hook returns ProductsListResponse, whose payload key is
            `products`. Reading `data` here rendered nothing at all. */}
        {products?.products?.map((product) => (
          <Box
            key={product._id}
            sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}
          >
            <Typography variant="h6">{product.name}</Typography>
            <Typography>Price: ${product.price}</Typography>
            {/* Product.category is an object {_id, name}; rendering it directly put
                "[object Object]" on screen. */}
            <Typography>Category: {product.category?.name ?? 'N/A'}</Typography>
            <Typography>In Stock: {product.inStock ? 'Yes' : 'No'}</Typography>

            <Box sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
                onClick={() => setEditingId(product._id ?? null)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDelete(product._id ?? '')}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
