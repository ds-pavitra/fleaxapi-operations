import { Vendor, CreateVendorRequest, UpdateVendorRequest } from "./types";

const seed: Vendor[] = [
  {
    id: "vendor_1",
    name: "Acme Vendor",
    baseUrl: "https://api.acme.com",
    apiKey: "key_acme_123",
    email: "contact@acme.com",
    mobile: "+911234567890",
    balance: 1000,
    totalUsed: 150,
    pending: 25,
    status: "ACTIVE",

    apis: [
      { id: "vapi_1", baseUrl: "https://api.acme.com", apiKey: "ak_1", endpoint: "/v1/pay", costPerCall: 0.01, dailyHitLimit: 1000 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "vendor_2",
    name: "Beta Supplies",
    baseUrl: "https://api.beta.com",
    apiKey: "key_beta_456",
    email: "support@beta.com",
    mobile: "+919876543210",
    balance: 50,
    totalUsed: 500,
    pending: 0,
    status: "INACTIVE",

    apis: [{ id: "vapi_2", baseUrl: "https://api.beta.com", apiKey: "ak_2", endpoint: "/v1/charge", costPerCall: 0.05, dailyHitLimit: 200 }],
    createdAt: new Date().toISOString(),
  },


];

let store: Vendor[] = [...seed];

const genId = (prefix = "vendor_") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

export const listVendors = ({ page = 1, pageSize = 10, search, status }: any) => {
  let items = store.slice();
  if (search) {
    const s = search.toLowerCase();
    items = items.filter((v) => v.name.toLowerCase().includes(s));
  }
  if (status) items = items.filter((i) => i.status === status);
  const total = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return Promise.resolve({ data, total });
};

export const getVendor = (id: string) => Promise.resolve(store.find((s) => s.id === id) || null);

export const createVendor = (body: CreateVendorRequest) => {
  const item: Vendor = {
    id: genId(),
    name: body.name,
    baseUrl: body.baseUrl || "",
    apiKey: body.apiKey,
    email: body.email,
    mobile: body.mobile,
    balance: 0,
    totalUsed: 0,
    pending: 0,
    status: body.status || "ACTIVE",
    apis: [],
    createdAt: new Date().toISOString(),
  };
  store.unshift(item);
  return Promise.resolve(item);
};

export const updateVendor = (id: string, body: UpdateVendorRequest) => {
  const idx = store.findIndex((s) => s.id === id);
  if (idx === -1) return Promise.reject(new Error("Not found"));
  store[idx] = { ...store[idx], ...body } as Vendor;
  return Promise.resolve(store[idx]);
};

export const deleteVendor = (id: string) => {
  store = store.filter((s) => s.id !== id);
  return Promise.resolve({ success: true });
};

export const addApi = (vendorId: string, api: Partial<any>) => {
  const v = store.find((s) => s.id === vendorId);
  if (!v) return Promise.reject(new Error("Not found"));
  const id = `vapi_${Math.random().toString(36).slice(2, 9)}`;
  v.apis = v.apis || [];
  const item = { id, baseUrl: api.baseUrl, apiKey: api.apiKey, endpoint: api.endpoint, costPerCall: api.costPerCall || 0, dailyHitLimit: api.dailyHitLimit || 0 };
  v.apis.push(item);
  return Promise.resolve(item);
};

export const removeApi = (vendorId: string, apiId: string) => {
  const v = store.find((s) => s.id === vendorId);
  if (!v) return Promise.reject(new Error("Not found"));
  v.apis = (v.apis || []).filter((a) => a.id !== apiId);
  return Promise.resolve(v);
};

export const updateApi = (vendorId: string, apiId: string, body: Partial<any>) => {
  const v = store.find((s) => s.id === vendorId);
  if (!v) return Promise.reject(new Error("Not found"));
  v.apis = v.apis || [];
  const idx = v.apis.findIndex((a) => a.id === apiId);
  if (idx === -1) return Promise.reject(new Error("API not found"));
  v.apis[idx] = { ...v.apis[idx], ...body };
  return Promise.resolve(v.apis[idx]);
};

export const listAllVendors = () => store.slice();
export const listVendorApisShort = () => store.flatMap(v => (v.apis || []).map(a => ({ id: a.id, endpoint: a.endpoint, perApiCost: a.costPerCall  || 0, baseUrl: a.baseUrl })));

export default { listVendors, getVendor, createVendor, updateVendor, deleteVendor, addApi, removeApi, updateApi, listAllVendors, listVendorApisShort };
