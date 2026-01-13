import { ApiItem, CreateApiRequest, UpdateApiRequest } from "./types";

const seedData: ApiItem[] = [
  {
    id: "api_1",
    baseUrl: "https://api.vendor1.com",
    endpoint: "/v1/payments",
    vendorId: "vendor_1",
    apiKey: "abcd-1234-efgh-5678",
    vendorName: "Acme Vendor",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    dailyHitLimit: 10000,
    perApiCost: 0.01,
  },
  {
    id: "api_2",
    baseUrl: "https://api.vendor2.net",
    endpoint: "/v2/orders",
    vendorId: "vendor_2",
    apiKey: "zyxw-9876-vuts-5432",
    vendorName: "Beta Supplies",
    status: "INACTIVE",
    createdAt: new Date().toISOString(),
    dailyHitLimit: 5000,
    perApiCost: 0.02,
  },
];

let store: ApiItem[] = [...seedData];

const genId = (prefix = "api_") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

export const listApis = ({ page = 1, pageSize = 10, search, status, vendorName }: any) => {
  let items = store.slice();
  if (search) {
    const s = search.toLowerCase();
    items = items.filter((i) => i.vendorName.toLowerCase().includes(s) || (i.vendorId || "").toLowerCase().includes(s) || i.endpoint.toLowerCase().includes(s));
  }
  if (vendorName) {
    const s = String(vendorName).toLowerCase();
    items = items.filter((i) => i.vendorName.toLowerCase().includes(s));
  }
  if (status) items = items.filter((i) => i.status === status);
  const total = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return Promise.resolve({ data, total });
};

export const getApi = (id: string) => Promise.resolve(store.find((s) => s.id === id) || null);

export const createApi = (body: CreateApiRequest) => {
  const item: ApiItem = {
    id: genId(),
    baseUrl: body.baseUrl,
    endpoint: body.endpoint,
    vendorId: body.vendorId,
    apiKey: body.apiKey,
    vendorName: body.vendorName,
    status: body.status || "ACTIVE",
    dailyHitLimit: body.dailyHitLimit,
    perApiCost: body.perApiCost,
    createdAt: new Date().toISOString(),
  };
  store.unshift(item);
  return Promise.resolve(item);
};

export const updateApi = (id: string, body: UpdateApiRequest) => {
  const idx = store.findIndex((s) => s.id === id);
  if (idx === -1) return Promise.reject(new Error("Not found"));
  store[idx] = { ...store[idx], ...body } as ApiItem;
  return Promise.resolve(store[idx]);
};

export const deleteApi = (id: string) => {
  store = store.filter((s) => s.id !== id);
  return Promise.resolve({ success: true });
};

export default {
  listApis,
  getApi,
  createApi,
  updateApi,
  deleteApi,
};
