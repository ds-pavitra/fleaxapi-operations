import { createApi } from "@reduxjs/toolkit/query/react";
import { generateFinancialReport } from "./mockReportsStore";

const fakeBaseQuery = async ({ url, method, body }: any) => {
  try {
    if (url === "/reports/financial" && method === "GET") {
      const { from, to } = body || {};
      return { data: await Promise.resolve(generateFinancialReport({ from, to })) };
    }
    return { error: { status: 404, data: "Not found" } };
  } catch (err: any) {
    return { error: { status: 500, data: err?.message || "Error" } };
  }
};

export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: fakeBaseQuery as any,
  tagTypes: ["Reports"],
  endpoints: (builder) => ({
    getFinancialReport: builder.query<any, { from?: string; to?: string } | void>({
      query: (q) => ({ url: "/reports/financial", method: "GET", body: q }),
    }),
  }),
});

export const { useGetFinancialReportQuery } = reportsApi;
export default reportsApi;
