import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export function useCurrentUserDepartment() {
  const { user, loading: authLoading } = useAuth();
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canViewAllDepartments = user?.role === "Director";

  useEffect(() => {
    let active = true;

    async function fetchDepartment() {
      if (authLoading) return;
      if (!user?.role) {
        setDepartment(null);
        setLoading(false);
        return;
      }

      if (user.role === "Director") {
        setDepartment(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("roles")
        .select("department_name")
        .eq("role_name", user.role)
        .maybeSingle();

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setDepartment(null);
      } else {
        setDepartment(data?.department_name?.trim() || null);
      }

      setLoading(false);
    }

    fetchDepartment();

    return () => {
      active = false;
    };
  }, [authLoading, user?.role]);

  return { department, canViewAllDepartments, loading: authLoading || loading, error };
}
