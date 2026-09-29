export { authService } from './authService';
export { userService } from './userService';
// export { productsService } from './products';
export { productService } from './products';
export { productVariantService } from './productVariants';
export { productFiltersService } from './productFilters';
export { rfqService } from './rfq';
export { ordersService } from './orders';
export { customerReviewsService } from './customerReviews';
export { shipmentsService } from './shipments';
export { supplierService } from './suppliers';
export { warehouseService } from './warehouses';
export type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
} from './authService';
export type { UpdateProfileData, ChangePasswordData } from './userService';

export type {
  RFQItem,
  GetRFQParams,
  RFQResponse,
  ApiResponse as RFQApiResponse,
} from './rfq';
export type {
  OrderItem,
  // ProductInfo,
  // LocationInfo,
  GetOrdersParams,
  OrdersResponse,
  // ApiResponse as OrderApiResponse,
} from './orders';
export type {
  CustomerReview,
  GetCustomerReviewsParams,
  CustomerReviewsResponse,
  UpdateReviewRequest,
  ApiResponse as CustomerReviewApiResponse,
} from './customerReviews';
export type {
  Shipment,
  TrackingEvent,
  GetShipmentsParams,
  ShipmentsResponse,
  ApiResponse as ShipmentApiResponse,
} from './shipments';
export * from './refundTransactions';
// export type {
//   Supplier,
//   CreateSupplierRequest,
//   SupplierResponse,
//   SuppliersListResponse,
// } from './suppliers';

// Restored. This whole block was commented out, so `@/api/services` exported no
// product types at all, and the pages importing them failed to compile:
//   inventory/add-product/page.tsx  TS2305: no exported member 'CreateProductFormData'
//   inventory/update/Detail.tsx      TS2305: no exported member 'CreateProductRequest'
// Only names that actually exist in ./products are listed - GetProductsParams,
// ProductsResponse and ApiResponse never existed there and are not resurrected.
export type {
  Product,
  CreateProductRequest,
  CreateProductFormData,
  ProductResponse,
  ProductsListResponse,
} from './products';
export { supplierRefundTransactionsService } from './supplierRefundTransactions';
export { customerAddressService } from './customerAddresses';
export type {
  CustomerAddress,
  AddAddressRequest,
  UpdateAddressRequest,
  AddressResponse,
  AddressesListResponse,
  CustomerAddressData,
} from './customerAddresses';
export type {
  WishlistProduct,
  CustomerWishlistData,
  CustomerWishlistResponse,
} from './customers';
export type {
  ProductVariant,
  CreateProductVariantRequest,
  UpdateProductVariantRequest,
  ProductVariantResponse,
  ProductVariantsListResponse,
} from './productVariants';
export type {
  Category,
  Application,
  Tag,
  Function,
  CountryOfOrigin,
  ProductFiltersData,
  ProductFiltersResponse,
} from './productFilters';
