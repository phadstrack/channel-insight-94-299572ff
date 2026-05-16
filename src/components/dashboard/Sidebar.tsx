import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: string; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/", label: "Visão Geral", icon: "📊" },
  { to: "/vendas", label: "Vendas", icon: "💰" },
  { to: "/leads", label: "Leads", icon: "🎯" },
  { to: "/canais", label: "Canais", icon: "📡" },
  { to: "/geografia", label: "Geografia", icon: "🗺️" },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin/cadastros", label: "Cadastros", icon: "📚", adminOnly: true },
  { to: "/admin/import", label: "Importar", icon: "⬆️", adminOnly: true },
  { to: "/auditoria", label: "Auditoria", icon: "🔍", adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();
  const location = useLocation();
  const isAdmin = role === "admin";

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(path + "/");

  const itemCls = (path: string) =>
    cn(
      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
      isActive(path)
        ? "bg-primary text-primary-foreground font-medium"
        : "text-foreground hover:bg-accent"
    );

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col"
      style={{ "--app-sidebar-w": collapsed ? "4rem" : "15rem" } as React.CSSProperties}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs">
            A3
          </div>
          {!collapsed && <span className="font-semibold text-sm">Pipeline</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-accent rounded"
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} className={itemCls(item.to)} title={item.label}>
            <span>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-3 pb-1 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                Admin
              </div>
            )}
            {ADMIN_NAV.map((item) => (
              <Link key={item.to} to={item.to} className={itemCls(item.to)} title={item.label}>
                <span>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <Link to="/conta" className={itemCls("/conta")} title="Minha conta">
          <span>⚙️</span>
          {!collapsed && <span>Minha conta</span>}
        </Link>
      </div>
    </aside>
  );
}
