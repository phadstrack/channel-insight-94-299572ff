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
    const loadRole = async (s: Session | null) => {
      if (!s?.user) {
        setRole(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", s.user.id);
      const roles = (data ?? []).map((r) => r.role as string);
      setRole(roles.includes("admin") ? "admin" : "user");
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      loadRole(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadRole(data.session);
    });

    return () => sub.subscription.unsubscribe();
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
