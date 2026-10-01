import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchaseOrderService,
  CreatePurchaseOrderRequest,
  PurchaseOrder,
  PurchaseOrderResponse,
  PurchaseOrderStatus,
} from '../api/services/purchaseOrders';
import { toast } from 'react-toastify';

// Simple purchase order queries
export const usePurchaseOrders = (params = {}) => {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => purchaseOrderService.getPurchaseOrders(),
  });
};

export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderService.getPurchaseOrderById(id),
    enabled: !!id,
  });
};

// Simple purchase order mutations
export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest): Promise<PurchaseOrderResponse> =>
      purchaseOrderService.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create purchase order');
    },
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PurchaseOrder>;
    }): Promise<PurchaseOrderResponse> => purchaseOrderService.updatePurchaseOrder(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      toast.success('Purchase order updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update purchase order');
    },
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<PurchaseOrderResponse> =>
      purchaseOrderService.deletePurchaseOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.removeQueries({ queryKey: ['purchase-order', id] });
      toast.success('Purchase order deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete purchase order');
    },
  });
};

export const useUpdatePurchaseOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: PurchaseOrderStatus;
    }): Promise<PurchaseOrderResponse> =>
      purchaseOrderService.updatePurchaseOrderStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      toast.success('Purchase order status updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update purchase order status');
    },
  });
};
