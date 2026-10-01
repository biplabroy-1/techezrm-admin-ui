/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { api, ENDPOINTS } from "../config"

export interface CustomerInfo {
  _id: string
  name: string
  email: string
  phone: string
}

export interface ProductInfo {
  _id: string
  name: string
  images: string[]
}

export interface CustomerReview {
  _id: string
  id?: string
  customer: CustomerInfo
  product: ProductInfo
  order: string
  rating: number
  title: string
  review: string
  images: string[]
  status: "approved" | "pending" | "published"
  isVerifiedPurchase: boolean
  helpfulVotes: number
  reportCount: number
  createdAt: string
  updatedAt: string
  uniqueId: string
  __v: number
  // Computed fields for display
  customerName?: string
  customerEmail?: string
  productName?: string
  date?: string
  time?: string
}

export interface GetCustomerReviewsParams {
  page?: number
  pageSize?: number
  status?: "pending" | "published" | "deleted" | ""
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface CustomerReviewsResponse {
  reviews: CustomerReview[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Updated API response structure to match your actual response
export interface ApiResponse {
  success: boolean
  data: {
    reviews: CustomerReview[]
    total: number
    page: number
    totalPages: number
    limit: number
  }
}

// Single review response structure - Updated to match actual API
export interface SingleReviewResponse {
  success: boolean
  message: string
  data: {
    _id: string
    customer: string // Just ID in update response
    product: string // Just ID in update response
    order: string
    rating: number
    title: string
    review: string
    images: string[]
    status: "approved" | "pending" | "published"
    isVerifiedPurchase: boolean
    helpfulVotes: number
    reportCount: number
    createdAt: string
    updatedAt: string
    uniqueId: string
    __v: number
  }
}

// Update review request to match API expectations
export interface UpdateReviewRequest {
  status: "approved" | "pending" | "published"
}

export const customerReviewsService = {
  getCustomerReviews: async ({
    queryKey,
  }: { queryKey: [string, GetCustomerReviewsParams] }): Promise<CustomerReviewsResponse> => {
    const [, { page = 1, pageSize = 10, status = "", search = "", sortBy = "createdAt", sortOrder = "desc" }] = queryKey

    // Build params object, only include non-empty values
    const params: Record<string, any> = {
      page,
      limit: pageSize, // API uses 'limit' instead of 'pageSize'
      sortBy,
      sortOrder,
    }

    if (status) params.status = status
    if (search) params.q = search

    try {
      const { data } = await api.get(`${ENDPOINTS.CUSTOMER_REVIEWS.GET}`, {
        params,
      })


      // Handle the actual API response structure
      const apiResponse = data as ApiResponse

      // Get reviews from the data structure
      const reviews = apiResponse.data?.reviews || []

      // Transform reviews and add computed fields
      const transformedReviews = reviews.map((review) => {
        const createdDate = new Date(review.createdAt)
        return {
          ...review,
          id: review._id, // Map _id to id for frontend consistency
          customerName: review.customer?.name || "Unknown Customer",
          customerEmail: review.customer?.email || "",
          productName: review.product?.name || "Unknown Product",
          date: createdDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          time: createdDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        }
      })


      return {
        reviews: transformedReviews,
        total: apiResponse.data?.total || reviews.length,
        page: apiResponse.data?.page || page,
        pageSize: pageSize,
        totalPages: apiResponse.data?.totalPages || Math.ceil(reviews.length / pageSize),
      }
    } catch (error) {
      console.error("Error fetching customer reviews:", error)
      throw error
    }
  },

  // Get single review by ID
  // getReviewById: async (id: string): Promise<CustomerReview> => {
  //   try {
  //     const response = await api.get(`${ENDPOINTS.CUSTOMER_REVIEWS.GET_BY_ID.replace(":id", id)}`)
  //     console.log("Single Review API Response:", response.data)

  //     const apiResponse = response.data as SingleReviewResponse

  //     if (apiResponse.success && apiResponse.data) {
  //       const review = apiResponse.data
  //       const createdDate = new Date(review.createdAt)

  //       return {
  //         ...review,
  //         id: review._id || review._id,
  //         date: createdDate.toLocaleDateString("en-GB", {
  //           day: "numeric",
  //           month: "long",
  //           year: "numeric",
  //         }),
  //         time: createdDate.toLocaleTimeString("en-US", {
  //           hour: "2-digit",
  //           minute: "2-digit",
  //           hour12: true,
  //         }),
  //       }
  //     }

  //     throw new Error(apiResponse.message || "Failed to fetch review")
  //   } catch (error) {
  //     console.error("Error fetching single review:", error)
  //     throw error
  //   }
  // },

  // Update other methods similarly...
  updateReviewStatus: async ({
    reviewId,
    data,
  }: { reviewId: string; data: UpdateReviewRequest }): Promise<CustomerReview> => {
    try {
      const response = await api.put(`${ENDPOINTS.CUSTOMER_REVIEWS.UPDATE.replace(":id", reviewId)}`, data)

      // Handle the actual API response structure
      if (response.data.success && response.data.data) {
        const reviewData = response.data.data

        // Since the update response doesn't include populated customer/product data,
        // we'll create a minimal review object with the updated status
        return {
          ...reviewData,
          id: reviewData._id,
          _id: reviewData._id,
          customer: reviewData.customer, // This will be just the ID
          product: reviewData.product, // This will be just the ID
          customerName: "Updated Customer", // Placeholder since we don't have populated data
          productName: "Updated Product", // Placeholder since we don't have populated data
          status: reviewData.status,
          rating: reviewData.rating,
          title: reviewData.title,
          review: reviewData.review,
          images: reviewData.images || [],
          isVerifiedPurchase: reviewData.isVerifiedPurchase,
          helpfulVotes: reviewData.helpfulVotes,
          reportCount: reviewData.reportCount,
          createdAt: reviewData.createdAt,
          updatedAt: reviewData.updatedAt,
          uniqueId: reviewData.uniqueId,
          __v: reviewData.__v,
          order: reviewData.order,
        }
      }

      throw new Error(response.data.message || "Failed to update review")
    } catch (error) {
      console.error("Error updating review:", error)
      throw error
    }
  },

  // Delete review permanently
  deleteReview: async (reviewId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`${ENDPOINTS.CUSTOMER_REVIEWS.DELETE.replace(":id", reviewId)}`)
      return { message: "Review deleted successfully" }
    } catch (error) {
      console.error("Error deleting review:", error)
      throw error
    }
  },
}
