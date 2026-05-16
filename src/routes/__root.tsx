import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate, redirect } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { installServerFnAuth } from "@/integrations/supabase/server-fn-auth";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

installServerFnAuth();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">Verifique a URL ou volte ao início.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Ir para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ARC3 · Auditoria de Marketing" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
  }));

  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <AuthGate />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { session, loading, role, clientId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/login";

  useEffect(() => {
    if (!loading && !session && !isLogin) {
      navigate({ to: "/login" });
    }

    // Redirecionar clientes para workspace
    if (!loading && session && role === "client" && location.pathname === "/" && !isLogin) {
      navigate({ to: "/workspace" });
    }
  }, [loading, session, role, isLogin, navigate, location.pathname]);

  if (isLogin) return <Outlet />;
  if (loading || !session) return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Carregando...
    </div>
  );

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="px-8 py-6 transition-[margin] duration-200" style={{ marginLeft: "var(--app-sidebar-w, 15rem)" }}>
        <Outlet />
      </main>
    </div>
  );
}
