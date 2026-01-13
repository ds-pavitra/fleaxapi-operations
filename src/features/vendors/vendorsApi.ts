import { createApi } from "@reduxjs/toolkit/query/react";
import type { ListVendorsRequest, Vendor, CreateVendorRequest, UpdateVendorRequest } from "./types";
import * as mock from "./mockVendorsStore";

const fakeBaseQuery = async ({ url, method, body }: any) => {
  try {
    if (url === "/vendors" && method === "GET") return { data: await mock.listVendors(body) };
    if (url === "/vendors" && method === "POST") return { data: await mock.createVendor(body) };
    if (url?.startsWith("/vendors/") && method === "GET") {
      const id = url.split("/")[2];
      return { data: await mock.getVendor(id) };
    }
    if (url?.startsWith("/vendors/") && method === "PUT") {
      const id = url.split("/")[2];
      return { data: await mock.updateVendor(id, body) };
    }
    if (url?.startsWith("/vendors/") && method === "DELETE") {
      const id = url.split("/")[2];
      return { data: await mock.deleteVendor(id) };
    }
    if (url?.startsWith("/vendors/") && url.endsWith("/apis") && method === "POST") {
      const id = url.split("/")[2];
      return { data: await mock.addApi(id, body) };
    }
    if (url?.startsWith("/vendors/") && url.includes("/apis/") && method === "DELETE") {
      const parts = url.split("/");
      const id = parts[2];
      const apiId = parts[4];
      return { data: await mock.removeApi(id, apiId) };
    }
    if (url?.startsWith("/vendors/") && url.includes("/apis/") && method === "PUT") {
      const parts = url.split("/");
      const id = parts[2];
      const apiId = parts[4];
      return { data: await mock.updateApi(id, apiId, body) };
    }

    return { error: { status: 404, data: "Not found" } };
  } catch (err: any) {
    return { error: { status: 500, data: err?.message || "Error" } };
  }
};

export const vendorsApi = createApi({
  reducerPath: "vendorsApi",
  baseQuery: fakeBaseQuery as any,
  tagTypes: ["Vendors"],
  endpoints: (builder) => ({
    listVendors: builder.query<{ data: Vendor[]; total: number }, ListVendorsRequest>({
      query: (q) => ({ url: "/vendors", method: "GET", body: q }),
      providesTags: ["Vendors"],
    }),
    getVendor: builder.query<Vendor | null, string>({
      query: (id) => ({ url: `/vendors/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: 'Vendors' as const, id }],
    }),
    createVendor: builder.mutation<Vendor, CreateVendorRequest>({
      query: (body) => ({ url: "/vendors", method: "POST", body }),
      invalidatesTags: ["Vendors"],
    }),
    updateVendor: builder.mutation<Vendor, { id: string; body: UpdateVendorRequest }>({
      query: ({ id, body }) => ({ url: `/vendors/${id}`, method: "PUT", body }),
      invalidatesTags: ["Vendors"],
    }),
    deleteVendor: builder.mutation<{ success: true }, string>({
      query: (id) => ({ url: `/vendors/${id}`, method: "DELETE" }),
      invalidatesTags: ["Vendors"],
    }),
    addApi: builder.mutation<any, { id: string; body: Partial<any> }>({
      query: ({ id, body }) => ({ url: `/vendors/${id}/apis`, method: "POST", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Vendors' as const, id }],
    }),
    removeApi: builder.mutation<any, { id: string; apiId: string }>({
      query: ({ id, apiId }) => ({ url: `/vendors/${id}/apis/${apiId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Vendors' as const, id }],
    }),
    updateApi: builder.mutation<any, { id: string; apiId: string; body: Partial<any> }>({
      query: ({ id, apiId, body }) => ({ url: `/vendors/${id}/apis/${apiId}`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Vendors' as const, id }],
    }),
  }),
});

export const {
  useListVendorsQuery,
  useGetVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useAddApiMutation,
  useRemoveApiMutation,
  useUpdateApiMutation,
} = vendorsApi;

export default vendorsApi;
