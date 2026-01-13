export interface VendorApi {
  id: string;
  baseUrl: string;
  apiKey?: string;
  endpoint: string;
  costPerCall?: number;
  dailyHitLimit?: number;
}


export interface Vendor {
  id: string;
  name: string;
  baseUrl?: string;
  apiKey?: string;
  email?: string;
  mobile?: string;
  balance: number;
  totalUsed?: number;
  pending?: number;
  status: "ACTIVE" | "INACTIVE";
  apis?: VendorApi[];
  createdAt?: string;
} 

export interface ListVendorsRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface CreateVendorRequest {
  name: string;
  baseUrl?: string;
  apiKey?: string;
  email?: string;
  mobile?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateVendorRequest {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  email?: string;
  mobile?: string;
  status?: "ACTIVE" | "INACTIVE";
  apis?: Partial<VendorApi>[];
}
