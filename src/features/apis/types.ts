export type ApiStatus = "ACTIVE" | "INACTIVE";

export interface ApiItem {
  id: string;
  baseUrl: string;
  endpoint: string;
  vendorId: string;
  apiKey: string;
  vendorName: string;
  status: ApiStatus;
  createdAt: string;
  dailyHitLimit: number; // daily limit for hits
  perApiCost: number; // cost per API call (global)
}

export interface ListApisRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ApiStatus | string;
  vendorName?: string;
}

export interface CreateApiRequest {
  baseUrl: string;
  endpoint: string;
  vendorId: string;
  apiKey: string;
  vendorName: string;
  status?: ApiStatus;
  dailyHitLimit: number;
  perApiCost: number;
}

export interface UpdateApiRequest extends Partial<CreateApiRequest> {}
