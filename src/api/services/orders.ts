import { api, ENDPOINTS } from "../config"

// Address interface
export interface Address {
  street: string
  city: string
  state: string
  country: string
  zipCode: string
}

// Customer interface
export interface Customer {
  _id: string
  name: string
  email: string
  phone: string
}

// Product info for order items
export interface OrderProduct {
  _id: string
  name: string
}

// Order item interface
export interface OrderItem {
  product: OrderProduct
  quantity: number
  price: number
  discount: number
  total: number
  _id: string
}

// Main order interface matching your API response
export interface CustomerOrder {
  _id: string
  customer: Customer
  items: OrderItem[]
  shippingAddress: Address
  billingAddress: Address
  totalAmount: number
  subTotal: number
  tax: number
  shippingCost: number
  discount: number
  paymentMethod: string
  paymentStatus: "pending" | "processing" | "completed" | "failed" | "refunded"
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  trackingNumber?: string
  estimatedDelivery?: string
  actualDelivery?: string | null
  notes?: string
  createdAt: string
  updatedAt: string
  uniqueId: string
  __v: number
}

export interface GetOrdersParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  /**
   * One status, or several as a comma-separated list. The server accepts both and
   * turns a multi-value filter into `$in`.
   *
   * The admin payments screen needs this: its "Pending" tab is really
   * pending + processing + failed, and "Completed" is completed + refunded. It
   * previously had no server-side filter at all and was fed hardcoded rows.
   */
  paymentStatus?: string | string[]
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface OrdersResponse {
  orders: CustomerOrder[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API response structure matching your actual response
export interface CustomerOrdersApiResponse {
  success: boolean
  data: {
    orders: CustomerOrder[]
    total: number
    page: number
    totalPages: number
    limit: number
  }
}

// Single order response structure
export interface SingleOrderResponse {
  success: boolean
  message?: string
  data: {
    order: CustomerOrder
  }
}
export interface SingleOrderApiResponse {
  success: boolean
  data: CustomerOrder
}
export const ordersService = {
  // Get customer orders with proper typing
  getOrders: async ({ queryKey }: { queryKey: [string, GetOrdersParams] }): Promise<OrdersResponse> => {
    const [, { page = 1, limit = 10, search, status, paymentStatus }] = queryKey

    // Build params object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = {
      page,
      limit,
    }

    if (search) params.search = search
    if (status) params.status = status

  if (paymentStatus) {
    params.paymentStatus = Array.isArray(paymentStatus)
      ? paymentStatus.join(",")
      : paymentStatus
  }

    try {
      const { data } = await api.get(`${ENDPOINTS.ORDERS.GET}`, {
        params,
      })

      console.log("Raw Customer Orders API Response:", data)

      const apiResponse = data as CustomerOrdersApiResponse

      if (!apiResponse.success) {
        throw new Error("Failed to fetch orders")
      }

      const orders = apiResponse.data.orders || []

      return {
        orders,
        total: apiResponse.data.total || 0,
        page: apiResponse.data.page || page,
        limit: apiResponse.data.limit || limit,
        totalPages: apiResponse.data.totalPages || 1,
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error)
      throw error
    }
  },

  // Get single order by ID
getOrderById: async (id: string): Promise<CustomerOrder> => {
    try {
      const response = await api.get(`${ENDPOINTS.ORDERS.GET_BY_ID.replace(":id", id)}`)
      console.log("Single Order API Response:", response.data)

      const apiResponse = response.data as SingleOrderApiResponse

      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data
      }

      throw new Error("Failed to fetch order details")
    } catch (error) {
      console.error("Error fetching single order:", error)
      throw error
    }
  },
}
