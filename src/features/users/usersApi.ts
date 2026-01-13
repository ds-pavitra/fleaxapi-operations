import { createApi } from "@reduxjs/toolkit/query/react";
import type { UsersListResponse, CreateUserRequest, UpdateUserRequest, User } from "./types";
import { client } from "../../api/client";
import { ENDPOINTS } from "../../api/constants";

// Use a queryFn to call the real backend endpoint and map response shape
export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: async () => ({ error: { status: 500, data: "Not implemented" } }),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    listUsers: builder.query<UsersListResponse, { page?: number; pageSize?: number; search?: string; role?: string; status?: string } | void>({
      // queryFn allows custom fetch logic
      async queryFn(params: any) {
        try {
          const p = params || {};
          // backend expects zero-based page (page=0..)
          const qs = new URLSearchParams();
          if (typeof p.page === "number") qs.set("page", String(Math.max(0, p.page - 1)));
          if (typeof p.pageSize === "number") qs.set("size", String(p.pageSize));
          if (p.search) qs.set("search", p.search);
          if (p.role) qs.set("role", p.role);
          if (p.status) qs.set("status", p.status);

          const path = `${ENDPOINTS.USERS}${qs.toString() ? `?${qs.toString()}` : ""}`;
          const res: any = await client.get(path);

          // expected backend shape: { success: true, message: '...', data: { content: [...], totalElements, size, number, ... } }
          const content = Array.isArray(res?.data?.content) ? res.data.content : [];
          const total = typeof res?.data?.totalElements === "number" ? res.data.totalElements : (res?.data?.total || 0);
          const pageNumber = typeof res?.data?.number === "number" ? res.data.number : (typeof p.page === "number" ? p.page - 1 : 0);
          const pageSize = typeof res?.data?.size === "number" ? res.data.size : (p.pageSize || 0);

          const mapped: UsersListResponse = {
            data: content,
            total,
            page: pageNumber + 1, // convert back to 1-based for UI
            pageSize,
          };

          return { data: mapped };
        } catch (err: any) {
          const e = { status: err?.status || 500, data: err?.data || err?.message || String(err) };
          return { error: e };
        }
      },
      providesTags: ["Users"],
    }),
    getUser: builder.query<User | null, string>({
      async queryFn(id: string) {
        try {
          const res: any = await client.get(`${ENDPOINTS.USERS}/${id}`);
          // backend returns { success, message, data: { ... } }
          return { data: res?.data || null };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    createUser: builder.mutation<User, CreateUserRequest>({
      async queryFn(body: CreateUserRequest) {
        try {
          // API expects POST /user for creating main users (singular)
          const createPath = ENDPOINTS.MAIN_USER;
          const res: any = await client.post(createPath, body);
          return { data: res?.data };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation<User, { id: string; body: UpdateUserRequest }>({
      async queryFn({ id, body }) {
        try {
          const res: any = await client.put(`${ENDPOINTS.MAIN_USER}/${id}`, body);
          return { data: res?.data };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation<{ success: boolean }, string>({
      async queryFn(id: string) {
        try {
          const res: any = await client.del(`${ENDPOINTS.MAIN_USER}/${id}`);
          return { data: res };
        } catch (err: any) {
          return { error: { status: err?.status || 500, data: err?.data || err?.message || String(err) } };
        }
      },
      invalidatesTags: ["Users"],
    }),
  }),
});

export const { useListUsersQuery, useGetUserQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } = usersApi;