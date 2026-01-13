export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://semisolemn-carter-arctically.ngrok-free.dev";
  // import.meta.env.VITE_API_BASE_URL || "http://192.168.1.17:8082";

export const ENDPOINTS = {
  LOGIN: "/auth/login",
  SEND_OTP: "/otp/resend",
  VERIFY_OTP: "/otp/verify",
  REGISTER: "/auth/register",
  REFRESH: "/api/auth/refresh",
  INITIATE: "/auth/initiate/register",
  USERS: "/users/internal-users",
  MAIN_USER: "/users",
  MERCHANTS: "/users/merchants",
  PROVIDER: "/provider",
};
