/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { productService } from '../services';
import { CreateProductRequest } from '../services/products';

// export const useProducts = ({
//   page = 1,
//   limit = 10,
//   search = '',
//   name = '',
//   category = '',
//   sortBy = 'createdAt',
//   sortOrder = 'desc' as 'asc' | 'desc',
// } = {}) => {
//   return useQuery({
//     queryKey: [
//       'products',
//       { page, limit, search, name, category, sortBy, sortOrder },
//     ] as const,
//     // queryFn: productService.getProducts,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     placeholderData: keepPreviousData, // Updated from keepPreviousData: true
//   });
// };

/**
 * Note there is a second `useProducts` in src/hooks/useProducts.ts. This is the one
 * /admin/inventory/delete imports. It had the same defect: `limit` was accepted by
 * callers and never declared here, so the requested page size was silently ignored.
 */
export const useProducts = ({
  page = 1,
  limit = 10,
  search = '',
  category = '',
  status = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
} = {}) => {
  return useQuery({
    queryKey: ['products', { page, limit, search, category, status }],
    queryFn: () =>
      productService.getProducts({
        page,
        limit,
        search,
        category,
        status,
      }),

    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
  });
};

export const useSearchProducts = () => {
  return useMutation({
    mutationFn: ({
      query,
      page = 1,
      limit = 10,
    }: {
      query: string;
      page?: number;
      limit?: number;
    }) => productService.searchProducts({ query, page, limit }),
    onError: (error: any) => {
      console.error('Search products error:', error);
    },
  });
};

// export const useProductsByCategory = () => {
//   return useMutation({
//     mutationFn: ({
//       category,
//       page = 1,
//       limit = 10,
//     }: {
//       category: string;
//       page?: number;
//       limit?: number;
//     }) => productService.getProductsByCategory({ category, page, limit }),
//     onError: (error: any) => {
//       console.error('Get products by category error:', error);
//     },
//   });
// };

export const useProductsByStockStatus = () => {
  return useMutation({
    mutationFn: ({
      inStock,
      page = 1,
      limit = 10,
    }: {
      inStock: boolean;
      page?: number;
      limit?: number;
    }) => productService.getProductsByStockStatus({ inStock, page, limit }),
    onError: (error: any) => {
      console.error('Get products by stock status error:', error);
    },
  });
};

export const useProductsByPriceRange = () => {
  return useMutation({
    mutationFn: ({
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    }: {
      minPrice: number;
      maxPrice: number;
      page?: number;
      limit?: number;
    }) =>
      productService.getProductsByPriceRange({
        minPrice,
        maxPrice,
        page,
        limit,
      }),
    onError: (error: any) => {
      console.error('Get products by price range error:', error);
    },
  });
};

// export const useAddProduct = () => {
//   const queryClient = useQueryClient();
//   const { addNotification } = useUIStore();

//   return useMutation({
//     mutationFn: (data: CreateProductRequest) => productService.addProduct(data),
//     onSuccess: (newProduct) => {
//       // Invalidate and refetch products
//       queryClient.invalidateQueries({ queryKey: ['products'] });

//       // Show success notification
//       addNotification({
//         type: 'success',
//         message: 'Product added successfully!',
//       });
//     },
//     onError: (error: any) => {
//       console.error('Add product error:', error);

//       // Show error notification
//       addNotification({
//         type: 'error',
//         message: error?.message || 'Failed to add product',
//       });
//     },
//   });
// };


export const useAddProduct = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      productService.createProduct(data),
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Show success notification
      addNotification({
        type: 'success',
        message: 'Product added successfully!',
      });
    },
    onError: (error: any) => {
      console.error('Add product error:', error);

      // Show error notification
      addNotification({
        type: 'error',
        message: error?.message || 'Failed to add product',
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: Partial<CreateProductRequest>;
    }) => productService.updateProduct(productId, data),
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Show success notification
      addNotification({
        type: 'success',
        message: 'Product updated successfully!',
      });
    },
    onError: (error: any) => {
      console.error('Update product error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update product';
      addNotification({
        type: 'error',
        message: errorMessage,
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({ productId }: { productId: string }) =>
      productService.deleteProduct(productId),
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Show success notification
      addNotification({
        type: 'success',
        message: 'Product deleted successfully!',
      });
    },
    onError: (error: any) => {
      console.error('Delete product error:', error);

      // Show error notification
      addNotification({
        type: 'error',
        message: error?.message || 'Failed to delete product',
      });
    },
  });
};
