import { api, ENDPOINTS } from "../config"

export interface TrackingEvent {
  coordinates?: {
    lat: number
    lng: number
  }
  location: string
  description: string
  date: string
  status: string
  portCode?: string
}

export interface CreatedBy {
  _id: string
  email: string
}

export interface Customer {
  _id: string
  name: string
  email: string
  phone: string
}

export interface Shipment {
  _id: string
  id?: string
  blNumber: string
  carrier: string
  carrierTrackingUrl?: string
  shipmentReference?: string
  containerNumber?: string
  status: string
  eta?: string
  etd?: string
  deliveryDate?: string
  departurePort?: string
  arrivalPort?: string
  trackingEvents: TrackingEvent[]
  lastSyncedAt?: string
  isDelivered: boolean
  createdBy?: CreatedBy | null
  customerId?: Customer | null
  notes?: string
  archived: boolean
  createdAt: string
  updatedAt: string
  __v: number
}

export interface GetShipmentsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export interface ShipmentsResponse {
  shipments: Shipment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API response structure
export interface ApiResponse {
  success: boolean
  data: {
    shipments: Shipment[]
    total: number
    page: number
    totalPages: number
    limit: number
  }
}

export const shipmentsService = {
  // Get shipments with proper typing and filtering
  getShipments: async ({ queryKey }: { queryKey: [string, GetShipmentsParams] }): Promise<ShipmentsResponse> => {
    const [, { page = 1, limit = 10, search = "", status = "" }] = queryKey

    // Build params object, only include non-empty values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = {
      page,
      limit,
    }

    if (search) params.q = search
    if (status) params.status = status

    try {
      const { data } = await api.get(`${ENDPOINTS.SHIPMENTS.GET}`, {
        params,
      })


      // Handle the actual API response structure
      const apiResponse = data as ApiResponse

      // Get shipments from the data structure
      const shipments = apiResponse.data?.shipments || []

      // Transform shipments and add computed fields
      const transformedShipments = shipments.map((shipment) => ({
        ...shipment,
        id: shipment._id, // Map _id to id for frontend consistency
      }))


      return {
        shipments: transformedShipments,
        total: apiResponse.data?.total || shipments.length,
        page: apiResponse.data?.page || page,
        limit: apiResponse.data?.limit || limit,
        totalPages: apiResponse.data?.totalPages || Math.ceil(shipments.length / limit),
      }
    } catch (error) {
      console.error("Error fetching shipments:", error)
      throw error
    }
  },

  // Get single shipment by ID
  getShipmentById: async (id: string): Promise<Shipment> => {
    try {
      const response = await api.get(`${ENDPOINTS.SHIPMENTS.GET_BY_ID.replace(":id", id)}`)

      if (response.data.success && response.data.data) {
        const shipment = response.data.data
        return {
          ...shipment,
          id: shipment._id,
        }
      }

      throw new Error("Failed to fetch shipment")
    } catch (error) {
      console.error("Error fetching single shipment:", error)
      throw error
    }
  },
}
