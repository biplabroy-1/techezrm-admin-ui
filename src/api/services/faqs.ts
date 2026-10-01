import { api } from '../config';

/**
 * The FAQ entries shown on the storefront, and the per-product ones attached to a
 * product page.
 *
 * 717 rows in the source. The server endpoints have existed for a while; only this
 * client and the admin screen were missing, so the request/response shapes below
 * mirror `faq.controller.ts` rather than inventing one.
 */
export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  /**
   * Which surface the FAQ belongs to. Constrained by the server's enum, so this is
   * a union rather than `string`: a typo would be a schema validation failure at
   * save time instead of a filter that silently returns nothing.
   */
  key: 'product' | 'general' | 'shipping' | 'payment' | 'account' | 'technical' | 'other';
  /**
   * Id of the owning entity - a product for `key: "product"`, blank for the global
   * FAQs. The product-name column on the admin screen resolves this.
   */
  entityId?: string;
  entityType?: string;
  image?: string;
  /** Ascending display order within its key. Reordered with bulkUpdateOrders. */
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetFAQsParams {
  page?: number;
  limit?: number;
  /** Free text, matched against question/answer/key. */
  search?: string;
  key?: FAQ['key'];
  entityId?: string;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  key: FAQ['key'];
  entityId?: string;
  entityType?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
}

export interface FAQOrderUpdate {
  id: string;
  order: number;
}

/**
 * The list response nests its rows under `data` and its count under `pagination`,
 * NOT a top-level `total`. Reading `faqsData?.total` silently yields 0 and renders
 * "0 Results" above a populated table - which is exactly what happened on the
 * Categories screen, hence the comment in `categories.ts`.
 */
export interface FAQsListResponse {
  success: boolean;
  data?: FAQ[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

export interface FAQResponse {
  success: boolean;
  data?: FAQ;
  message?: string;
  error?: string;
}

class FAQService {
  private baseUrl = '/private/faqs';

  async getAll(params?: GetFAQsParams): Promise<FAQsListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.search) queryParams.append('search', params.search);
      if (params?.key) queryParams.append('key', params.key);
      if (params?.entityId) queryParams.append('entityId', params.entityId);

      const qs = queryParams.toString();
      const response = await api.get(qs ? `${this.baseUrl}?${qs}` : this.baseUrl);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to fetch FAQs'
      );
    }
  }

  async create(data: CreateFAQRequest): Promise<FAQResponse> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to create FAQ'
      );
    }
  }

  async update(
    id: string,
    data: Partial<CreateFAQRequest>
  ): Promise<FAQResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to update FAQ'
      );
    }
  }

  /**
   * Reorder in one request.
   *
   * `PATCH /bulk/orders` takes `{ orderUpdates: [{ id, order }] }`. Used by the
   * up/down buttons, which swap the two neighbouring rows' orders rather than
   * renumbering: sending the whole visible set would reorder rows the admin never
   * touched, and the server applies the entries it is given.
   */
  async bulkUpdateOrders(orderUpdates: FAQOrderUpdate[]): Promise<FAQResponse> {
    try {
      const response = await api.patch(`${this.baseUrl}/bulk/orders`, {
        orderUpdates,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to update FAQ orders'
      );
    }
  }

  async remove(id: string): Promise<FAQResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to delete FAQ'
      );
    }
  }
}

export const faqService = new FAQService();