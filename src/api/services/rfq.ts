import { api, ENDPOINTS } from "../config"

export interface RFQItem {
  _id?: string
  id: string
  uniqueId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  productId: string
  productName: string
  quantity: number
  description: string
  urgency: string
  status: string
  expectedDeliveryDate: string
  budget: number
  additionalRequirements: string
  attachments: string[]
  createdAt: string
  updatedAt: string
}

export interface GetRFQParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface RFQResponse {
  rfqs: RFQItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Updated to match your actual API response structure
export interface ApiResponse {
  success: boolean
  message: string
  data: {
    rfqs: RFQItem[]
  }
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

// Single RFQ response structure - Updated to match your actual response
export interface SingleRFQResponse {
  success: boolean
  message: string
  data: {
    rfq: RFQItem
  }
}

export const rfqService = {
  // Get RFQs with proper typing and filtering
  getRFQs: async ({ queryKey }: { queryKey: [string, GetRFQParams] }): Promise<RFQResponse> => {
    const [, { page = 1, limit = 10, search = "", status = "", sortBy = "createdAt", sortOrder = "desc" }] = queryKey

    // Build params object, only include non-empty values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = {
      page,
      limit,
      sortBy,
      sortOrder,
    }

    if (search) params.q = search
    if (status) params.status = status

    try {
      const { data } = await api.get(`${ENDPOINTS.RFQ.GET}`, {
        params,
      })

      
      // Handle the actual API response structure
      const apiResponse = data as ApiResponse
      
      // Get RFQs from the nested data structure
      const rfqs = apiResponse.data?.rfqs || []
      

      return {
        rfqs:data?.data,
        total: apiResponse.total || rfqs.length,
        page: apiResponse.page || page,
        limit: apiResponse.limit || limit,
        totalPages: apiResponse.totalPages || Math.ceil(rfqs.length / limit),
      }
    } catch (error) {
      console.error("Error fetching RFQs:", error)
      throw error
    }
  },

  // Get single RFQ by ID - Updated to handle data.rfq structure
  getRFQById: async (id: string): Promise<RFQItem> => {
    try {
      const response = await api.get(`${ENDPOINTS.RFQ.GET_BY_ID.replace(":id", id)}`)

      const apiResponse = response.data as SingleRFQResponse

      // Return the RFQ data from the nested structure
      if (apiResponse.success && apiResponse.data?.rfq) {
        return apiResponse.data.rfq
      }

      throw new Error(apiResponse.message || "Failed to fetch RFQ")
    } catch (error) {
      console.error("Error fetching single RFQ:", error)
      throw error
    }
  },
}
