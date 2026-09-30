import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { ordersService } from "../services/orders"
import type { GetOrdersParams } from "../services/orders"

export const useOrders = ({
  page = 1,
  limit = 10,
  search,
  status,
  paymentStatus,
}: GetOrdersParams = {}) => {
  return useQuery({
    // Every value the request depends on has to be in the key, or switching tabs
    // shows the previous tab's cached rows. paymentStatus is what separates the
    // Pending and Completed tabs here.
    queryKey: [
      "orders",
      {
        page,
        limit,
        search,
        status,
        paymentStatus: Array.isArray(paymentStatus)
          ? paymentStatus.join(",")
          : paymentStatus,
      },
    ] as const,
    queryFn: ordersService.getOrders,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export const useOrderById = (id: string) => {
  return useQuery({
    queryKey: ["order", id] as const,
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
