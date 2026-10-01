export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const ENDPOINTS = {
  BASE_URL,
  // Auth endpoints
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    PROFILE: `${BASE_URL}/auth/profile`,
    REFRESH: `${BASE_URL}/auth/refresh`,
    FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
    VERIFY_EMAIL: `${BASE_URL}/auth/verify-email`,
  },
  // User endpoints
  USER: {
    PROFILE: `${BASE_URL}/user/profile`,
    CHANGE_PASSWORD: `${BASE_URL}/user/change-password`,
  },
  // Products endpoints
  PRODUCTS: {
    GET: `${BASE_URL}/private/products`,
    ADD: `${BASE_URL}/private/products`,
    UPDATE: `${BASE_URL}/products/:id`,
    DELETE: `${BASE_URL}/private/products/:id`,
    PRIVATE: `${BASE_URL}/private/products`,
  },
  // RFQ endpoints
  RFQ: {
    GET: `${BASE_URL}/private/rfq`,
    GET_BY_ID: `${BASE_URL}/private/rfq/:id`,
  },
  // Orders endpoints
  ORDERS: {
    GET: `${BASE_URL}/private/customer-orders`,
    GET_BY_ID: `${BASE_URL}/private/customer-orders/:id`,
  },
  // Maps / geocoding endpoints
  MAPS: {
    REVERSE_GEOCODE: `${BASE_URL}/public/maps/reverse-geocode`,
  },
  // Customer Reviews endpoints
  CUSTOMER_REVIEWS: {
    GET: `${BASE_URL}/private/customer-reviews`,
    GET_BY_ID: `${BASE_URL}/private/customer-reviews/:id`,
    UPDATE: `${BASE_URL}/private/customer-reviews/:id`,
    DELETE: `${BASE_URL}/private/customer-reviews/:id`,
  },
  // Shipments endpoints
  SHIPMENTS: {
    GET: `${BASE_URL}/private/shipments`,
    GET_BY_ID: `${BASE_URL}/private/shipments/:id`,
    CREATE: `${BASE_URL}/private/shipments`,
    UPDATE: `${BASE_URL}/private/shipments/:id`,
    DELETE: `${BASE_URL}/private/shipments/:id`,
  },
} as const;
