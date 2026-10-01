import { api } from '../config';

/**
 * The global list of certification KINDS (FSSAI, ISO 22000, KOSHER, HALAL - 10
 * rows in the source), as opposed to the per-product `Certification` documents.
 *
 * Distinct from `certification.service` on the server side for the same reason the
 * server has two models: they share no fields, so one shape cannot serve both.
 */
export interface CertificationType {
  _id: string;
  name: string;
  description?: string;
  /** MUI icon name shown in the storefront's certification strip. */
  iconName?: string;
  /** Public URL of the certificate PDF. */
  fileUrl?: string;
  /** Ascending sort key for the admin list and the storefront strip. */
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCertificationTypeRequest {
  name: string;
  description?: string;
  iconName?: string;
  fileUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * The list response nests under `data`, matching every other service here.
 *
 * Declared rather than left `any` for the reason `categories.ts` documents: a
 * shape mismatch between the declaration and reality then fails at compile time
 * instead of rendering an empty table with no error.
 */
export interface CertificationTypesListResponse {
  success: boolean;
  data?: CertificationType[];
  message?: string;
  error?: string;
}

export interface CertificationTypeResponse {
  success: boolean;
  data?: CertificationType;
  message?: string;
  error?: string;
}

class CertificationTypeService {
  private baseUrl = '/private/certification-types';

  async getAll(): Promise<CertificationTypesListResponse> {
    try {
      const response = await api.get(this.baseUrl);
      return response.data;
    } catch (error: any) {
      // Read the message from BOTH shapes. The axios interceptor in
      // api/config/api.ts ends with `Promise.reject(error?.response?.data || error)`,
      // so a failed request rejects with the response BODY
      // ({ success, message }) rather than an axios error - reading only
      // `error.response?.data?.message` finds undefined and every cause collapses
      // into one useless string. See categories.ts `fetchAllCategories`.
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to fetch certification types'
      );
    }
  }

  async create(
    data: CreateCertificationTypeRequest
  ): Promise<CertificationTypeResponse> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to create certification type'
      );
    }
  }

  async update(
    id: string,
    data: Partial<CreateCertificationTypeRequest>
  ): Promise<CertificationTypeResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to update certification type'
      );
    }
  }

  async remove(id: string): Promise<CertificationTypeResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.message ||
          error?.response?.data?.message ||
          'Failed to delete certification type'
      );
    }
  }
}

export const certificationTypeService = new CertificationTypeService();