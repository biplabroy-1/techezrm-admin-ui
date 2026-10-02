import { api } from '../config';

export interface Customer {
  _id: string;
  uniqueId: string;
  name: string;
  email: string;
  phone: string;
  membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  status: 'active' | 'inactive';
  loginApproval: boolean;
  signupStep: string;
  addresses: any[];
  createdAt: string;
  updatedAt: string;
  annualRevenue?: string;
  businessType?: string;
  companyName?: string;
  contactPerson?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  employeeCount?: string;
  industry?: string;
  notes?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  /**
   * Optional, and was not before.
   *
   * `phone` has `// required: true` commented out in `server/src/models/customer.ts`,
   * so the server never demanded it - this type simply claimed it did, and the add
   * form could not honour the claim without either blocking on a field the server
   * treats as optional or sending `""` for it. See `buildCreateCustomerPayload`.
   */
  phone?: string;
  membershipTier: string;
  status: string;
  loginApproval: boolean;
  signupStep: string;
  addresses: any[];
  annualRevenue?: string;
  businessType?: string;
  companyName?: string;
  contactPerson?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  employeeCount?: string;
  industry?: string;
  notes?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
}

export interface CustomerResponse {
  success: boolean;
  data?: Customer;
  message?: string;
  error?: string;
}

export interface CustomersListResponse {
  success: boolean;
  data: Customer[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WishlistProduct {
  id: string;
  uniqueId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  images: string[];
  bannerImage: string;
  appearance: string;
  status: string;
  addedAt: string;
}

export interface CustomerWishlistData {
  customerId: string;
  customerUniqueId: string;
  customerName: string;
  customerEmail: string;
  totalProducts: number;
  products: WishlistProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWishlistResponse {
  success: boolean;
  data: CustomerWishlistData;
  message: string;
}

class CustomerService {
  private baseUrl = '/private/customers';

  // Get all customers
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    membershipTier?: string;
  }): Promise<CustomersListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.membershipTier) {
        queryParams.append('membershipTier', params.membershipTier);
      }
      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch customers'
      );
    }
  }

  // Get customer by ID
  async getCustomerById(id: string): Promise<CustomerResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch customer'
      );
    }
  }

  // Create customer
  async createCustomer(data: CreateCustomerRequest): Promise<CustomerResponse> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create customer'
      );
    }
  }

  // Update customer
  async updateCustomer(
    id: string,
    data: Partial<CreateCustomerRequest>
  ): Promise<CustomerResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update customer'
      );
    }
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<CustomerResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete customer'
      );
    }
  }

  // Get customer cart
  async getCustomerCart(customerId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      cart: {
        _id: string;
        customer: string;
        items: any[];
        status: string;
        totalAmount: number;
        totalItems: number;
        createdAt: string;
        updatedAt: string;
        expiresAt: string;
      };
      totalItems: number;
      totalAmount: number;
      itemCount: number;
    };
  }> {
    try {
      const response = await api.get(`/private/cart?customerId=${customerId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch customer cart'
      );
    }
  }

  // Get customer wishlist
  async getCustomerWishlist(
    customerId: string
  ): Promise<CustomerWishlistResponse> {
    try {
      const response = await api.get(
        `/private/wishlists/customer/${customerId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch customer wishlist'
      );
    }
  }

  // Get customer orders
  async getCustomerOrders(
    customerId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('customerId', customerId);
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }

      const response = await api.get(
        `/private/customer-orders?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch customer orders'
      );
    }
  }

  // Get customer addresses (from customer data)
  getCustomerAddresses(customer: Customer): any[] {
    return customer.addresses || [];
  }

  // Approve customer signup
  async approveCustomer(
    customerId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(
        `/private/customer-signup/approve/${customerId}`,
        { adminNotes }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to approve customer'
      );
    }
  }

  // Reject customer signup
  async rejectCustomer(
    customerId: string,
    adminNotes: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(
        `/private/customer-signup/reject/${customerId}`,
        { adminNotes }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to reject customer'
      );
    }
  }
}

export const customerService = new CustomerService();
