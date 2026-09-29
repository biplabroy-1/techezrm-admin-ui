import { api } from '../config';

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description: string;
  image?: string;
  status: 'active' | 'inactive';
}

export interface CategoryResponse {
  success: boolean;
  data?: Category;
  message?: string;
  error?: string;
}

export interface CategoriesListResponse {
  success: boolean;
  categories?: Category[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
  error?: string;
}

class CategoryService {
  private baseUrl = '/private/categories';

  // Get all categories
  async getCategories(params?: {
    page?: number;
    search?: string;
  }): Promise<CategoriesListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.search) {
        queryParams.append('search', params.search);
      }
      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch categories'
      );
    }
  }

  // Get a specific category by ID
  async getCategoryById(id: string): Promise<CategoryResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch category'
      );
    }
  }

  // Create a new category
  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create category'
      );
    }
  }

  // Update a category
  async updateCategory(
    id: string,
    data: Partial<CreateCategoryRequest>
  ): Promise<CategoryResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update category'
      );
    }
  }

  // Delete a category
  async deleteCategory(id: string): Promise<CategoryResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete category'
      );
    }
  }
    // Get all categories without pagination and filtering.
    //
    // Backs GET /private/categories/all, which the Add/Update Product pages use to
    // populate a checkbox list. The response is deliberately TYPED here: when this
    // returned bare `any`, the pages read `data?.data?.categories` and a mismatch
    // between the declared and actual shape failed silently - the list rendered
    // empty with no error, because `isLoading`/`error` were destructured and unused.
    async fetchAllCategories(): Promise<CategoriesListResponse> {
      try {
        const url = this.baseUrl + '/all';
        const response = await api.get(url);
        return response.data;
      } catch (error: any) {
        // Read the message from BOTH shapes, because the axios response
        // interceptor in api/config/api.ts ends with
        //     return Promise.reject(error?.response?.data || error)
        // so a failed request rejects with the response BODY
        // ({ success: false, message: "..." }) rather than an axios error.
        // Reading only `error.response?.data?.message` therefore always found
        // undefined here and every real cause - a 401, a 404, a 500 - collapsed
        // into the same useless "Failed to fetch categories" string, which is
        // exactly the silent failure this method's error path was meant to end.
        // A genuine network failure or timeout has no `response` at all but does
        // have a useful `message` ("Network Error", "timeout of 10000ms
        // exceeded"), so surfacing that is the point.
        throw new Error(
          error?.message ||
            error?.response?.data?.message ||
            'Failed to fetch categories'
        );
      }
    }
}

export const categoryService = new CategoryService();
