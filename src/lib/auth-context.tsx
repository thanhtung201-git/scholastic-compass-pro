import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MockUser, Role } from "./types";
import { mockUsers, userByRole } from "./mock-data";

interface AuthCtx {
  user: MockUser | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: { name: string; email: string; password: string; role: Role }) => Promise<{ error?: string }>;
  signOut: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "mcnaedu_mock_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const persist = (u: MockUser | null) => {
    setUser(u);
    if (typeof window === "undefined") return;
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const signIn: AuthCtx["signIn"] = async (email) => {
    // STUB: Replace with: await supabase.auth.signInWithPassword({ email, password })
    const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { error: "No account found. Try admin@mcnaedu.vn or use Sign Up." };
    persist(found);
    return {};
  };

  const signUp: AuthCtx["signUp"] = async ({ name, email, role }) => {
    // STUB: Replace with: await supabase.auth.signUp({ email, password, options: { data: { name, role } } })
    const newUser: MockUser = {
      id: `u${Date.now()}`,
      name,
      email,
      role,
      branch_id: "b1",
      status: "Active",
    };
    persist(newUser);
    return {};
  };

  const signOut = () => persist(null);

  const switchRole = (role: Role) => {
    const u = userByRole(role);
    persist(u);
  };

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut, switchRole }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
