import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "user" | null;

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: Role;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  role: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    let mounted = true;
    let requestId = 0;

    const loadRole = async (s: Session | null) => {
      const currentRequest = ++requestId;
      if (!s?.user) {
        if (mounted && currentRequest === requestId) {
          setRole(null);
          setLoading(false);
        }
        return;
      }
      try {
        const roleResult = await Promise.race([
          supabase.from("user_roles").select("role").eq("user_id", s.user.id),
          new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 5000)),
        ]);

        const roles =
          roleResult && "data" in roleResult
            ? (roleResult.data ?? []).map((r) => r.role as string)
            : [];

        if (mounted && currentRequest === requestId) {
          setRole(roles.includes("admin") ? "admin" : "user");
        }
      } catch {
        if (mounted && currentRequest === requestId) setRole("user");
      } finally {
        if (mounted && currentRequest === requestId) setLoading(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      window.setTimeout(() => void loadRole(s), 0);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        void loadRole(data.session);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setRole(null);
        setLoading(false);
      });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        role,
        signOut: async () => {
          await supabase.auth.signOut();
          setRole(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
