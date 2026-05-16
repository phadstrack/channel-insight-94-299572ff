import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: "admin" | "client" | null;
  clientId: string | null;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  loading: true,
  role: null,
  clientId: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "client" | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async (session: Session | null) => {
      if (!session?.user) {
        setRole(null);
        setClientId(null);
        setLoading(false);
        return;
      }

      // Determine role: check if user created any clients (=admin) or is member of client (=client)
      const { data: createdClients } = await supabase
        .from("arc3_clients")
        .select("id")
        .eq("created_by", session.user.id)
        .limit(1);

      if (createdClients && createdClients.length > 0) {
        setRole("admin");
        setClientId(null);
      } else {
        // Check if user is client member
        const { data: membership } = await supabase
          .from("arc3_client_members")
          .select("client_id")
          .eq("user_id", session.user.id)
          .limit(1);

        if (membership && membership.length > 0) {
          setRole("client");
          setClientId(membership[0].client_id);
        } else {
          setRole("admin"); // Default to admin for first user
          setClientId(null);
        }
      }
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      loadUser(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadUser(data.session);
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
        clientId,
        signOut: async () => {
          await supabase.auth.signOut();
          setRole(null);
          setClientId(null);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
