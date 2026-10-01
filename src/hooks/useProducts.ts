import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productService,
  CreateProductRequest,
  Product,
  ProductResponse,
  ProductsListResponse,
} from '../api/services/products';
import { toast } from 'react-toastify';

/**
 * Query params the products endpoint accepts.
 *
 * `limit` was being passed by callers (see /admin/inventory/delete) and silently
 * dropped: getProducts did not accept it and useProducts never forwarded the params
 * object at all, so `page` and `search` were dead too - the hook always fetched
 * page 1, unfiltered, no matter what the caller asked for.
 */
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

// Simple product queries
export const useProducts = (params: ProductQueryParams = {}) => {
  return useQuery<ProductsListResponse, Error>({
    queryKey: ['products', params],
    // Forward the params. Without this the hook ignored every filter it was given.
    queryFn: () => productService.getProducts(params),
  });
};

export const useProduct = (id: string) => {
  return useQuery<ProductResponse, Error>({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
};

export const useProductsByCategory = (category: string) => {
  return useQuery<Product[], Error>({
    queryKey: ['products', 'category', category],
    queryFn: () => productService.getProductsByCategory(category),
    enabled: !!category,
  });
};

// Simple product mutations
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest): Promise<ProductResponse> =>
      productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: FormData | Partial<CreateProductRequest>;
    }): Promise<ProductResponse> => productService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Product updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update product');
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<ProductResponse> => productService.deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.removeQueries({ queryKey: ['product', id] });
      toast.success('Product deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });
};
