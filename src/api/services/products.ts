/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '../config';
import { appendReplaceJson, type DietaryAttribute } from '../../components/modals/buildUpdateProductFormData';

export interface Product {
  /**
   * Average rating from PUBLISHED reviews, aggregated server-side per listing
   * request. `ratingCount` is 0 when the product has no published reviews, in
   * which case `rating` is 0 and the UI should say so rather than show "0.0".
   */
  rating?: number;
  ratingCount?: number;
  _id?: string;
  uniqueId?: string;
  seq?: number;
  name: string;
  description?: string;
  price: number;
  category?: {
    _id: string;
    name: string;
  };
  inStock: boolean;
  bannerImage?: string;
  images?: string[];
  status?: string;
  moq?: number;
  unit?: string;
  tags?: string[];
  appearance?: string;
  dietaryAttributes?: Array<{
    title: string;
    logo: string;
    certificateLink: string;
  }>;
  /** Free-form spec rows. Keys are preserved verbatim, trailing space included. */
  specifications?: Record<string, string>;
  applications?: string[];
  functions?: string[];
  countryOfOrigin?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  bannerImage?: File;
  images?: File[];
  /** Free-form labels. The Product model declares `tags: [String]`. */
  tags?: string[];
  /**
   * Free-form spec rows and certification links, sent as JSON strings because a
   * multipart part is always text - the server decodes them with `parseJsonField`.
   */
  specifications?: Record<string, string>;
  dietaryAttributes?: DietaryAttribute[];
}

/**
 * The shape the admin-ui Add Product form builds before handing it to
 * useAddProduct. Identical to CreateProductRequest today; kept as its own name
 * because the page imported `CreateProductFormData` while the only place it had
 * ever been declared was a commented-out block in the services barrel - so the
 * import resolved to nothing and tsc reported
 * TS2305: Module '"@/api/services"' has no exported member 'CreateProductFormData'.
 */
export interface CreateProductFormData extends CreateProductRequest {}

export interface ProductResponse {
  success: boolean;
  data?: Product;
  message?: string;
  error?: string;
}

export interface ProductsListResponse {
  success: boolean;
  products?: Product[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
  error?: string;
}

/**
 * A category as the link endpoint returns it: `populate("categoryId", "name slug")`
 * selects exactly those two fields, so `_id` is the only id available and the
 * admin cannot read back the slug it did not ask for.
 */
export interface ProductCategory {
  _id: string;
  name: string;
  slug?: string;
}

export interface ProductCategoriesResponse {
  success: boolean;
  categories?: ProductCategory[];
  message?: string;
  error?: string;
}

class ProductService {
  getProductsByPriceRange(arg0: {
    minPrice: number;
    maxPrice: number;
    page: number;
    limit: number;
  }): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  private baseUrl = '/private/products';
  // addProduct: any;
  searchProducts: any;
  getProductsByStockStatus: any;

  // Get all products
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) {
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
      if (params?.category) {
        queryParams.append('category', params.category);
      }
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch products'
      );
    }
  }

  // Get a specific product by ID
  async getProductById(id: string): Promise<ProductResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch product'
      );
    }
  }

  // Create a new product
  // async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
  //   try {
  //     const formData = new FormData();
  //     formData.append('name', data.name);
  //     formData.append('description', data.description);
  //     formData.append('price', data.price.toString());
  //     formData.append('category', data.category);
  //     formData.append('inStock', data.inStock.toString());

  //     if (data.bannerImage) {
  //       formData.append('bannerImage', data.bannerImage);
  //     }

  //     if (data.images) {
  //       // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //       data.images.forEach((image, index) => {
  //         formData.append(`images`, image);
  //       });
  //     }

  //     const response = await api.post(this.baseUrl, formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     });
  //     return response.data;
  //   } catch (error: any) {
  //     throw new Error(
  //       error.response?.data?.message || 'Failed to create product'
  //     );
  //   }
  // }

  async addProduct(data: CreateProductRequest): Promise<ProductResponse> {
    return this.createProduct(data);
  }
  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('category', data.category);
      formData.append('inStock', data.inStock.toString());
  
      if (data.bannerImage) {
        formData.append('bannerImage', data.bannerImage);
      }
  
      if (data.images) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      // Repeated field name, because the schema declares `tags: [String]` -
      // appending a joined string would store one tag containing commas.
      // Skipped when empty so we do not send a literal "" as a tag.
      if (data.tags?.length) {
        data.tags.forEach((tag) => {
          formData.append('tags', tag);
        });
      }

      // Always sent, including as `{}` / `[]`. There is nothing stored to clear on
      // a create, so this is only about the server's decode step: these are
      // `Mixed` / subdocument paths, and an undecoded JSON string would be stored
      // verbatim as the text `'{"Form":"Powder"}'`.
      appendReplaceJson(formData, 'specifications', data.specifications ?? {});
      appendReplaceJson(formData, 'dietaryAttributes', data.dietaryAttributes ?? []);
  
      const response = await api.post(this.baseUrl, formData, {
        headers: {
           'Content-Type': 'multipart/form-data'
           },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create product'
      );
    }
  }

  // Update a product
  async updateProduct(
    id: string,
    data: FormData | Partial<CreateProductRequest>
  ): Promise<ProductResponse> {
    try {
      let formData: FormData;

      if (data instanceof FormData) {
        // If data is already FormData, use it directly
        formData = data;
      } else {
        // Convert object to FormData
        formData = new FormData();

        if (data.name) formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        if (data.price) formData.append('price', data.price.toString());
        if (data.category) formData.append('category', data.category);
        if (data.inStock !== undefined)
          formData.append('inStock', data.inStock.toString());

        if (data.bannerImage) {
          formData.append('bannerImage', data.bannerImage);
        }

        if (data.images) {
          data.images.forEach((image) => {
            formData.append('images', image);
          });
        }
      }

      const response = await api.put(`${this.baseUrl}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update product'
      );
    }
  }

  // Delete a product
  async deleteProduct(id: string): Promise<ProductResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete product'
      );
    }
  }

  // Get products by category
  async getProductsByCategory(category: string) {
    try {
      const response = await api.get(`${this.baseUrl}/category/${category}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch products by category'
      );
    }
  }

  /**
   * The product's FULL category set, from ProductCategoryLink.
   *
   * Not the same as `product.category`, which stays a single String ref that
   * `product.service.ts:104` filters on and the products table's Category column
   * reads. This is the 954-row `product_tags` join, and it is the only thing that
   * can show an admin all six categories a product belongs to.
   */
  async getProductCategories(id: string): Promise<ProductCategoriesResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}/categories`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to fetch product categories'
      );
    }
  }

  /**
   * Replace the product's category set.
   *
   * The server REPLACES wholesale rather than merging, and validates every id
   * before writing any of them: one bad id 400s with the existing links left
   * intact. So this must always be given the complete set - calling it with a
   * subset removes the rest.
   *
   * `categoryIds` is the key name the server reads, so it is load-bearing.
   */
  async setProductCategories(
    id: string,
    categoryIds: string[]
  ): Promise<{ success: boolean; count?: number; message?: string }> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}/categories`, {
        categoryIds,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to update product categories'
      );
    }
  }
}

export const productService = new ProductService();
