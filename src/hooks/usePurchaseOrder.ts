import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchaseOrderService,
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  PurchaseOrderStatus,
} from '../api/services/purchaseOrders';
import {
  purchaseOrderSchema,
  CreatePurchaseOrderData,
} from '../utils/validation/purchaseOrderValidation';
import { toast } from 'react-toastify';

export const usePurchaseOrders = () => {
  const queryClient = useQueryClient();

  // Get all purchase orders
  const {
    data: purchaseOrders,
    isLoading: isLoadingPurchaseOrders,
    error: purchaseOrdersError,
    refetch: refetchPurchaseOrders,
  } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchaseOrderService.getPurchaseOrders(),
  });

  // Get purchase order by ID
  const usePurchaseOrderById = (id: string) => {
    return useQuery({
      queryKey: ['purchase-order', id],
      queryFn: () => purchaseOrderService.getPurchaseOrderById(id),
      enabled: !!id,
    });
  };

  // Get purchase orders by status
  const usePurchaseOrdersByStatus = (status: PurchaseOrderStatus) => {
    return useQuery({
      queryKey: ['purchase-orders', 'status', status],
      queryFn: () => purchaseOrderService.getPurchaseOrdersByStatus(status),
      enabled: !!status,
    });
  };

  // Create purchase order mutation
  const createPurchaseOrderMutation = useMutation({
    mutationFn: async (data: CreatePurchaseOrderRequest) => {
      // Validate the data before sending
      await purchaseOrderSchema.validate(data.order);
      return purchaseOrderService.createPurchaseOrder(data);
    },
    onSuccess: (data) => {
      toast.success('Purchase order created successfully!');
      // Invalidate and refetch purchase orders list
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create purchase order');
      throw error;
    },
  });

  // Update purchase order mutation
  const updatePurchaseOrderMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PurchaseOrder>;
    }) => {
      return purchaseOrderService.updatePurchaseOrder(id, data);
    },
    onSuccess: (data, variables) => {
      toast.success('Purchase order updated successfully!');
      // Invalidate and refetch specific purchase order and list
      queryClient.invalidateQueries({
        queryKey: ['purchase-order', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update purchase order');
      throw error;
    },
  });

  // Delete purchase order mutation
  const deletePurchaseOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      return purchaseOrderService.deletePurchaseOrder(id);
    },
    onSuccess: (data, id) => {
      toast.success('Purchase order deleted successfully!');
      // Remove from cache and invalidate queries
      queryClient.removeQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete purchase order');
      throw error;
    },
  });

  // Update purchase order status mutation
  const updatePurchaseOrderStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: PurchaseOrderStatus;
    }) => {
      return purchaseOrderService.updatePurchaseOrderStatus(id, status);
    },
    onSuccess: (data, variables) => {
      toast.success('Purchase order status updated successfully!');
      // Invalidate and refetch specific purchase order and list
      queryClient.invalidateQueries({
        queryKey: ['purchase-order', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update purchase order status');
      throw error;
    },
  });

  return {
    // Queries
    purchaseOrders: purchaseOrders?.data || [],
    isLoadingPurchaseOrders,
    purchaseOrdersError,
    refetchPurchaseOrders,
    usePurchaseOrderById,
    usePurchaseOrdersByStatus,

    // Mutations
    createPurchaseOrder: createPurchaseOrderMutation.mutateAsync,
    isCreatingPurchaseOrder: createPurchaseOrderMutation.isPending,
    createPurchaseOrderError: createPurchaseOrderMutation.error,

    updatePurchaseOrder: updatePurchaseOrderMutation.mutateAsync,
    isUpdatingPurchaseOrder: updatePurchaseOrderMutation.isPending,
    updatePurchaseOrderError: updatePurchaseOrderMutation.error,

    deletePurchaseOrder: deletePurchaseOrderMutation.mutateAsync,
    isDeletingPurchaseOrder: deletePurchaseOrderMutation.isPending,
    deletePurchaseOrderError: deletePurchaseOrderMutation.error,

    updatePurchaseOrderStatus: updatePurchaseOrderStatusMutation.mutateAsync,
    isUpdatingPurchaseOrderStatus: updatePurchaseOrderStatusMutation.isPending,
    updatePurchaseOrderStatusError: updatePurchaseOrderStatusMutation.error,
  };
};
