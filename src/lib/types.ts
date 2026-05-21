export type Role =
  | "Admin"
  | "Academic Staff"
  | "Accountant"
  | "Director"
  | "Teacher"
  | "Receptionist";

export const ALL_ROLES: Role[] = [
  "Admin",
  "Academic Staff",
  "Accountant",
  "Director",
  "Teacher",
  "Receptionist",
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
