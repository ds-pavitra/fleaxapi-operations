import { createApi } from "@reduxjs/toolkit/query/react";
import type { ListMerchantsRequest, Merchant, CreateMerchantRequest, UpdateMerchantRequest } from "./types";
import { client } from "../../api/client";
import { ENDPOINTS } from "../../api/constants";

export const merchantsApi = createApi({
  reducerPath: "merchantsApi",
  baseQuery: async () => ({ error: { status: 500, data: "Not implemented" } }),
  tagTypes: ["Merchants"],
  endpoints: (builder) => ({
    listMerchants: builder.query<{ data: Merchant[]; total: number }, ListMerchantsRequest>({
      async queryFn(params: any) {
        try {
          const p = params || {};
          const qs = new URLSearchParams();
          if (typeof p.page === "number") qs.set("page", String(Math.max(0, p.page - 1)));
          if (typeof p.pageSize === "number") qs.set("size", String(p.pageSize));
          if (p.search) qs.set("search", p.search);
          if (p.status) qs.set("status", p.status);

          const path = `${ENDPOINTS.MERCHANTS}${qs.toString() ? `?${qs.toString()}` : ""}`;
          const res: any = await client.get(path);

          const content = Array.isArray(res?.data?.content) ? res.data.content : [];
          const total = typeof res?.data?.totalElements === "number" ? res.data.totalElements : (res?.data?.total || 0);
          // const pageNumber = typeof res?.data?.number === "number" ? res.data.number : (typeof p.page === "number" ? p.page - 1 : 0);
          // const pageSize = typeof res?.data?.size === "number" ? res.data.size : (p.pageSize || 0);

          return { data: { data: content, total } };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      providesTags: ["Merchants"],
    }),
    getMerchant: builder.query<Merchant | null, string>({
      async queryFn(id: string) {
        try {
          const res: any = await client.get(`${ENDPOINTS.MERCHANTS}/${id}`);
          return { data: res?.data || null };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Merchants' as const, id }],
    }),
    createMerchant: builder.mutation<Merchant, CreateMerchantRequest>({
      async queryFn(body: CreateMerchantRequest) {
        try {
          // create merchant happens on /user (main user create endpoint)
          const createPath = ENDPOINTS.MAIN_USER;
          const res: any = await client.post(createPath, body);
          return { data: res?.data };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Merchants"],
    }),
    updateMerchant: builder.mutation<Merchant, { id: string; body: UpdateMerchantRequest }>({
      async queryFn({ id, body }) {
        try {
          const res: any = await client.put(`${ENDPOINTS.MAIN_USER}/${id}`, body);
          return { data: res?.data };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Merchants"],
    }),
    deleteMerchant: builder.mutation<{ success: true }, string>({
      async queryFn(id: string) {
        try {
          const res: any = await client.del(`${ENDPOINTS.MAIN_USER}/${id}`);
          return { data: res };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Merchants"],
    }),
    assignApis: builder.mutation<any, { id: string; apiIds: string[] }>({
      async queryFn({ id, apiIds }) {
        try {
          const res: any = await client.post(`${ENDPOINTS.MERCHANTS}/${id}/assign`, { apiIds });
          return { data: res?.data };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Merchants"],
    }),
    removeAssignedApi: builder.mutation<any, { id: string; apiId: string }>({
      async queryFn({ id, apiId }) {
        try {
          const res: any = await client.post(`${ENDPOINTS.MERCHANTS}/${id}/remove-assigned`, { apiId });
          return { data: res?.data };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Merchants"],
    }),
    updateAssignedApi: builder.mutation<any, { id: string; apiId: string; body: Partial<{ perApiCost: number; dailyHitLimit: number; apiName: string }> }>({
      async queryFn({ id, apiId, body }) {
        try {
          const res: any = await client.put(`${ENDPOINTS.MERCHANTS}/${id}/assigned/${apiId}`, body);
          return { data: res?.data };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Merchants' as const, id }],
    }),
    addWallet: builder.mutation<any, { id: string; amount: number }>({
      async queryFn({ id, amount }) {
        try {
          const res: any = await client.post(`${ENDPOINTS.MERCHANTS}/${id}/wallet`, { amount });
          return { data: res?.data };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Merchants"],
    }),
  }),
});

export const {
  useListMerchantsQuery,
  useGetMerchantQuery,
  useCreateMerchantMutation,
  useUpdateMerchantMutation,
  useDeleteMerchantMutation,
  useAssignApisMutation,
  useRemoveAssignedApiMutation,
  useUpdateAssignedApiMutation,
  useAddWalletMutation,
} = merchantsApi;

export default merchantsApi;