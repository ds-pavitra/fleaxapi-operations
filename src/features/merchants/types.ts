export interface Merchant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  businessName?: string;
  businessType?: string;
  registrationType?: "GUMASTA" | "MSME" | "GST" | string;
  paymentReceived?: boolean;
  status: "ACTIVE" | "INACTIVE";
  walletAmount: number;
  assignedApis?: Array<{ apiId: string; apiName?: string; endpoint?: string; baseUrl?: string; perApiCost?: number; dailyHitLimit?: number }>;
  // additional optional fields used by customers/channel partners in UI
  customerType?: "DIRECT" | "ORGANIZATION" | string;
  modeOfPayment?: "PREPAID" | "POSTPAID" | string;
  // legacy alias (some APIs may use paymentMode)
  paymentMode?: string;
  commissionPercentage?: number;
  subscriptionPlan?: any;
  subUsers?: any[];
  createdAt: string; 
}

export interface ListMerchantsRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface CreateMerchantRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  businessName?: string;
  businessType?: string;
  registrationType?: "GUMASTA" | "MSME" | "GST" | string;
  paymentReceived?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  walletAmount?: number;
  assignedApis?: Array<{ apiId: string }>;
}

export interface UpdateMerchantRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  businessName?: string;
  businessType?: string;
  registrationType?: "GUMASTA" | "MSME" | "GST" | string;
  paymentReceived?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  walletAmount?: number;
  assignedApis?: Array<{ apiId: string }>;
}

