import type { User, CreateUserRequest, UpdateUserRequest } from "./types";

// Simple id generator to avoid adding an extra dependency
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

// Seed some dummy users
let users: User[] = [
  {
    id: genId(),
    firstName: "Asha",
    lastName: "Kumar",
    email: "asha.kumar@example.com",
    mobile: "9876543210",
    role: "Operations",
    status: "ACTIVE",
  },
  {
    id: genId(),
    firstName: "Ravi",
    lastName: "Sharma",
    email: "ravi.sharma@example.com",
    mobile: "9123456789",
    role: "IT",
    status: "INACTIVE",
    businessName: "Ravi Tech",
    businessType: "PRIVATE",
    registrationNo: null,
  },
];

export async function listUsers({ page = 1, pageSize = 10, search = "", role, status }: any) {
  // Simulate latency
  await new Promise((r) => setTimeout(r, 200));

  let filtered = users.slice();
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobile.includes(q)
    );
  }
  if (role) filtered = filtered.filter((u) => u.role === role);
  if (status) filtered = filtered.filter((u) => u.status === status);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

export async function getUser(id: string) {
  await new Promise((r) => setTimeout(r, 100));
  const u = users.find((x) => x.id === id);
  return u || null;
}

export async function createUser(payload: CreateUserRequest) {
  await new Promise((r) => setTimeout(r, 200));
  const newUser: User = {
    id: genId(),
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    mobile: payload.mobile,
    role: payload.role,
    status: "ACTIVE",
    businessName: payload.businessName || null,
    businessType: payload.businessType || null,
    registrationNo: payload.registrationNo || null,
  };
  users.unshift(newUser);
  return newUser;
}

export async function updateUser(id: string, payload: UpdateUserRequest) {
  await new Promise((r) => setTimeout(r, 200));
  const idx = users.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error("User not found");
  users[idx] = { ...users[idx], ...payload } as User;
  return users[idx];
}

export async function deleteUser(id: string) {
  await new Promise((r) => setTimeout(r, 150));
  users = users.filter((x) => x.id !== id);
  return { success: true };
}
