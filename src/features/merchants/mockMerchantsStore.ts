import { Merchant, CreateMerchantRequest, UpdateMerchantRequest } from "./types";
import * as apisMock from "../apis/mockApisStore";

const seed: Merchant[] = [
  {
    id: "merch_1",
    firstName: "Alice",
    lastName: "Singh",
    email: "alice@example.com",
    mobile: "+911234567890",
    businessName: "Alice Retail",
    businessType: "Retail",
    registrationType: "GST",
    paymentReceived: true,
    status: "ACTIVE",
    walletAmount: 500.0,
    assignedApis: [{ apiId: "api_1", apiName: "Acme Vendor" }],
    createdAt: new Date().toISOString(),
  },
  {
    id: "merch_2",
    firstName: "Bob",
    lastName: "Khan",
    email: "bob@example.com",
    mobile: "+919876543210",
    businessName: "Bob Enterprises",
    businessType: "Services",
    registrationType: "MSME",
    paymentReceived: false,
    status: "INACTIVE",
    walletAmount: 0,
    assignedApis: [{ apiId: "api_2", apiName: "Beta Supplies" }],
    createdAt: new Date().toISOString(),
  },
];

let store: Merchant[] = [...seed];

const genId = (prefix = "merch_") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

export const listMerchants = ({ page = 1, pageSize = 10, search, status }: any) => {
  let items = store.slice();
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(
      (m) =>
        m.firstName.toLowerCase().includes(s) ||
        m.lastName.toLowerCase().includes(s) ||
        (m.businessName || "").toLowerCase().includes(s) ||
        (m.email || "").toLowerCase().includes(s)
    );
  }
  if (status) items = items.filter((i) => i.status === status);
  const total = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return Promise.resolve({ data, total });
};

export const getMerchant = (id: string) => Promise.resolve(store.find((s) => s.id === id) || null);

export const createMerchant = (body: CreateMerchantRequest) => {
  const item: Merchant = {
    id: genId(),
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    mobile: body.mobile,
    businessName: body.businessName,
    businessType: body.businessType,
    registrationType: body.registrationType,
    paymentReceived: typeof body.paymentReceived === 'boolean' ? body.paymentReceived : false,
    status: body.status || "ACTIVE",
    walletAmount: body.walletAmount || 0,
    assignedApis: (body.assignedApis || []).map((a) => ({ apiId: a.apiId })),
    createdAt: new Date().toISOString(),
  };
  store.unshift(item);
  return Promise.resolve(item);
};

export const updateMerchant = (id: string, body: UpdateMerchantRequest) => {
  const idx = store.findIndex((s) => s.id === id);
  if (idx === -1) return Promise.reject(new Error("Not found"));
  // if assignedApis provided, we might want to enrich any newly added ids
  if (body.assignedApis) {
    const existing = new Set((store[idx].assignedApis || []).map((a) => a.apiId));
    const added = body.assignedApis.filter((a) => !existing.has(a.apiId));
    for (const a of added) {
      // append placeholder with id (details will be fetched/enriched when assigning via assignApis)
      store[idx].assignedApis = store[idx].assignedApis || [];
      store[idx].assignedApis.push({ apiId: a.apiId });
    }
    delete (body as any).assignedApis; // avoid overwriting in next merge
  }
  store[idx] = { ...store[idx], ...body } as Merchant;
  return Promise.resolve(store[idx]);
};

export const deleteMerchant = (id: string) => {
  store = store.filter((s) => s.id !== id);
  return Promise.resolve({ success: true });
};

export const assignApis = async (merchantId: string, apiIds: string[]) => {
  const m = store.find((s) => s.id === merchantId);
  if (!m) return Promise.reject(new Error("Not found"));
  const existing = new Set((m.assignedApis || []).map((a) => a.apiId));
  for (const id of apiIds) {
    if (!existing.has(id)) {
      m.assignedApis = m.assignedApis || [];
      // try to fetch api details from apis mock and enrich
      try {
        const apiItem: any = await apisMock.getApi(id);
        m.assignedApis.push({ apiId: id, apiName: apiItem?.vendorName, baseUrl: apiItem?.baseUrl, endpoint: apiItem?.endpoint, perApiCost: apiItem?.perApiCost, dailyHitLimit: apiItem?.dailyHitLimit });
      } catch (e) {
        m.assignedApis.push({ apiId: id });
      }
    }
  }
  return Promise.resolve(m);
};

export const removeAssignedApi = (merchantId: string, apiId: string) => {
  const m = store.find((s) => s.id === merchantId);
  if (!m) return Promise.reject(new Error("Not found"));
  m.assignedApis = (m.assignedApis || []).filter((a) => a.apiId !== apiId);
  return Promise.resolve(m);
};

export const addWalletAmount = (merchantId: string, amount: number) => {
  const m = store.find((s) => s.id === merchantId);
  if (!m) return Promise.reject(new Error("Not found"));
  m.walletAmount = (m.walletAmount || 0) + amount;
  return Promise.resolve(m);
};

export const updateAssignedApi = (merchantId: string, apiId: string, body: Partial<{ perApiCost: number; dailyHitLimit: number; apiName: string; endpoint: string; baseUrl: string }>) => {
  const m = store.find((s) => s.id === merchantId);
  if (!m) return Promise.reject(new Error("Not found"));
  m.assignedApis = m.assignedApis || [];
  const idx = m.assignedApis.findIndex((a) => a.apiId === apiId);
  if (idx === -1) return Promise.reject(new Error("Assigned API not found"));
  m.assignedApis[idx] = { ...m.assignedApis[idx], ...body };
  return Promise.resolve(m);
};

export const listAllMerchants = () => store.slice();

export default {
  listMerchants,
  getMerchant,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  assignApis,
  removeAssignedApi,
  addWalletAmount,
  updateAssignedApi,
  listAllMerchants,
};