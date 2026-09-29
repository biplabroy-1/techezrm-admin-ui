import { BASE_URL } from '../config/endpoints';

export interface ShippingCalculationRequest {
  includedServices: string;
  portFromFees: boolean;
  portToFees: boolean;
  shippingType: string;
  coordinatesFrom: [number, number];
  coordinatesTo: [number, number];
  date: string;
  container: string;
}

export interface Location {
  name: string;
  country: string;
  lat: number;
  lng: number;
  code: string | null;
  inaccessible: boolean | null;
  pointType: string;
}

export interface Load {
  unit: string;
  amount: string;
}

export interface LumpsumTariff {
  price: number | null;
  currency: string | null;
}

export interface Co2 {
  amount: number;
  price: number;
  placeAmount: number;
  placePrice: number;
}

export interface TransitTime {
  rate: number | null;
  port: any | null;
  route: any | null;
}

export interface ShippingPoint {
  location: Location;
  shippingType: string;
  provider: string | null;
  loads: Load[];
  pointTariff: any[];
  routeTariff: any[];
  lumpsumTariff: LumpsumTariff;
  co2: Co2;
  transitTime: TransitTime;
  distance: string | null;
  totalPrice: number;
  totalCurrency: string;
  pointTotal: number;
  routeTotal: number;
}

export interface ShippingGeneral {
  shipmentId: string;
  validityFrom: string;
  validityTo: string;
  individual: boolean;
  totalPrice: number;
  totalCurrency: string;
  totalTransitTime: number;
  totalCo2: {
    amount: number;
    price: number;
  };
  alternative: boolean;
  expired: boolean;
  spaceGuarantee: boolean;
  spot: boolean;
  indicative: boolean;
  queryShippingType: string;
}

export interface ShippingRate {
  points: ShippingPoint[];
  general: ShippingGeneral;
}

export interface ShippingCalculationResponse {
  success: boolean;
  data: {
    rates: ShippingRate[];
  };
}

class ShippingService {
  private baseURL: string;

  constructor() {
    // Use the shared BASE_URL rather than re-reading the env var, so there is one
    // place that knows where the API lives. The old fallback was
    // `http://localhost:3001`, but the server listens on 5007 (server/.env PORT),
    // so a missing env var silently sent every shipping request to a dead port.
    this.baseURL = BASE_URL || 'http://localhost:5007/api/v1';
  }

  async calculateShippingCost(
    data: ShippingCalculationRequest
  ): Promise<ShippingCalculationResponse> {
    const response = await fetch(`${this.baseURL}/private/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Shipping calculation failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const shippingService = new ShippingService();
