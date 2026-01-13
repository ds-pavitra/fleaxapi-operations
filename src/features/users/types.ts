export type Role = "Operations" | "Finance" | "IT" | "User";

export type BusinessType = "PRIVATE" | "PUBLIC" | "PROPRIETOR" | "LLP";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
  businessName?: string | null;
  businessType?: BusinessType | null;
  registrationNo?: string | null;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  role: Role;
  businessName?: string | null;
  businessType?: BusinessType | null;
  registrationNo?: string | null;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  role?: Role;
  status?: "ACTIVE" | "INACTIVE";
  businessName?: string | null;
  businessType?: BusinessType | null;
  registrationNo?: string | null;
}

export interface UsersListResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
}