import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MockUser, Role } from "./types";
import { supabase } from "./supabase";

interface AuthCtx {
  user: MockUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: { name: string; email: string; password: string; role: Role }) => Promise<{ error?: string }>;
  signOut: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

// Hàm đảm bảo giáo viên được đồng bộ tự động sang bảng teachers khi có vai trò Teacher
const ensureTeacherProfile = async (userId: string, name: string) => {
  try {
    // 1. Kiểm tra xem giáo viên đã tồn tại trong bảng teachers chưa
    const { data: existingTeacher, error: checkError } = await supabase
      .from("teachers")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existingTeacher && !checkError) {
      // 2. Lấy branch_id đầu tiên làm mặc định để đảm bảo không bị lỗi khóa ngoại (foreign key constraint)
      const { data: branches } = await supabase
        .from("branches")
        .select("id")
        .limit(1);
      
      const branchId = branches?.[0]?.id || "e181a001-3456-4b6b-b86b-e2aee83afdc7";

      // 3. Tiến hành thêm dữ liệu vào bảng teachers
      const { error: insertError } = await supabase
        .from("teachers")
        .insert([{
          id: userId,
          name: name,
          subject: "General English",
          hourly_rate: 350000,
          branch_id: branchId
        }]);

      if (insertError) {
        console.error("Error creating teacher profile in teachers table:", insertError);
      } else {
        console.log("Successfully created teacher profile for user:", userId);
      }
    }
  } catch (err) {
    console.error("Error in ensureTeacherProfile:", err);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user;
        if (authUser) {
          const newProfile = {
            id: userId,
            name: authUser.user_metadata.name || authUser.email?.split("@")[0] || "User",
            email: authUser.email || "",
            role: authUser.user_metadata.role || "Teacher",
            branch_id: "b1",
            status: "Active"
          };
          const { data: inserted, error: insertError } = await supabase
            .from("users")
            .insert([newProfile])
            .select()
            .single();

          if (!insertError && inserted) {
            data = inserted;
            error = null;
          } else {
            console.error("Error creating missing user profile:", insertError);
          }
        }
      }

      if (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
      } else if (data) {
        setUser(data as MockUser);
        // Tự động kiểm tra và đồng bộ sang bảng teachers nếu vai trò là Teacher
        if (data.role === "Teacher") {
          ensureTeacherProfile(data.id, data.name);
        }
      }
    } catch (err) {
      console.error("Error in fetchProfile:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || "An unexpected error occurred." };
    }
  };

  const signUp: AuthCtx["signUp"] = async ({ name, email, password, role }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });
      if (error) return { error: error.message };
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || "An unexpected error occurred." };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("Error during sign out:", err);
    }
  };

  const switchRole = async (role: Role) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", user.id);
      
      if (error) {
        console.error("Error switching role:", error);
      } else {
        setUser((prev) => (prev ? { ...prev, role } : null));
        // Đảm bảo giáo viên được đồng bộ tự động sang bảng teachers nếu chuyển vai trò thành Teacher
        if (role === "Teacher") {
          ensureTeacherProfile(user.id, user.name);
        }
      }
    } catch (err) {
      console.error("Error in switchRole:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
