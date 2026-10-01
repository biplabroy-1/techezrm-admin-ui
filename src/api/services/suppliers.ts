import { api } from '../config';

export interface Supplier {
  _id: string;
  uniqueId: string;
  name: string;
  country: string;
  email: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
  payment_method: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierRequest {
  name: string;
  country: string;
  email: string;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
  payment_method: string;
}

export interface SupplierResponse {
  success: boolean;
  data?: Supplier;
  message?: string;
  error?: string;
}

export interface SuppliersListResponse {
  success: boolean;
  data: Supplier[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class SupplierService {
  private baseUrl = '/private/suppliers';

  // Get all suppliers
  async getSuppliers(params?: {
    page?: number;
    search?: string;
    country?: string;
    payment_method?: string;
  }): Promise<SuppliersListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.country) {
        queryParams.append('country', params.country);
      }
      if (params?.payment_method) {
        queryParams.append('payment_method', params.payment_method);
      }
      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch suppliers'
      );
    }
  }

  // Get supplier by ID
  async getSupplierById(id: string): Promise<SupplierResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch supplier'
      );
    }
  }

  // Create supplier
  async createSupplier(data: CreateSupplierRequest): Promise<SupplierResponse> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      // Keep the server's detail, not just its generic message. The API answers
      // { message: "Error creating supplier", error: "Supplier validation failed:
      // longitude: Path `longitude` is required." }. Throwing only `message`
      // reduced that to "Error creating supplier", which names nothing the user
      // can act on - the actual cause only ever appeared in the network tab.
      const detail = error.response?.data?.error;
      const summary = error.response?.data?.message || 'Failed to create supplier';
      throw new Error(detail ? `${summary} - ${detail}` : summary);
    }
  }

  // Update supplier
  async updateSupplier(
    id: string,
    data: Partial<CreateSupplierRequest>
  ): Promise<SupplierResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update supplier'
      );
    }
  }

  // Delete supplier
  async deleteSupplier(id: string): Promise<SupplierResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete supplier'
      );
    }
  }
}

export const supplierService = new SupplierService();
