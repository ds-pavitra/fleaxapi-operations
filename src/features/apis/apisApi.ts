import { createApi } from "@reduxjs/toolkit/query/react";
import type { ListApisRequest, ApiItem, CreateApiRequest, UpdateApiRequest } from "./types";
import * as mock from "./mockApisStore";

// fake base query that calls mock store
const fakeBaseQuery = async ({ url, method, body }: any) => {
  try {
    if (url === "/apis" && method === "GET") return { data: await mock.listApis(body) };
    if (url === "/apis" && method === "POST") return { data: await mock.createApi(body) };
    if (url?.startsWith("/apis/") && method === "GET") {
      const id = url.split("/")[2];
      return { data: await mock.getApi(id) };
    }
    if (url?.startsWith("/apis/") && method === "PUT") {
      const id = url.split("/")[2];
      return { data: await mock.updateApi(id, body) };
    }
    if (url?.startsWith("/apis/") && method === "DELETE") {
      const id = url.split("/")[2];
      return { data: await mock.deleteApi(id) };
    }
    return { error: { status: 404, data: "Not found" } };
  } catch (err: any) {
    return { error: { status: 500, data: err?.message || "Error" } };
  }
};

export const apisApi = createApi({
  reducerPath: "apisApi",
  baseQuery: fakeBaseQuery as any,
  tagTypes: ["Apis"],
  endpoints: (builder) => ({
    listApis: builder.query<{ data: ApiItem[]; total: number }, ListApisRequest>({
      query: (q) => ({ url: "/apis", method: "GET", body: q }),
      providesTags: ["Apis"],
    }),
    getApi: builder.query<ApiItem | null, string>({
      query: (id) => ({ url: `/apis/${id}`, method: "GET" }),
    }),
    createApi: builder.mutation<ApiItem, CreateApiRequest>({
      query: (body) => ({ url: "/apis", method: "POST", body }),
      invalidatesTags: ["Apis"],
    }),
    updateApi: builder.mutation<ApiItem, { id: string; body: UpdateApiRequest }>({
      query: ({ id, body }) => ({ url: `/apis/${id}`, method: "PUT", body }),
      invalidatesTags: ["Apis"],
    }),
    deleteApi: builder.mutation<{ success: true }, string>({
      query: (id) => ({ url: `/apis/${id}`, method: "DELETE" }),
      invalidatesTags: ["Apis"],
    }),
  }),
});

export const { useListApisQuery, useGetApiQuery, useCreateApiMutation, useUpdateApiMutation, useDeleteApiMutation } = apisApi;
export default apisApi;