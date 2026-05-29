export type Role =
  | "Admin"
  | "Academic Staff"
  | "Accountant"
  | "Director"
  | "Finance Manager"
  | "Academic Manager"
  | "HR Manager"
  | "HR Staff"
  | "Marketing Manager"
  | "Marketing Staff";

export const ALL_ROLES: Role[] = [
  "Admin",
  "Academic Staff",
  "Accountant",
  "Director",
  "Finance Manager",
  "Academic Manager",
  "HR Manager",
  "HR Staff",
  "Marketing Manager",
  "Marketing Staff",
];

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  branch_id: string;
  status: "Active" | "Blocked";
  avatar?: string;
}
