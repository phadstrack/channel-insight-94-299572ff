import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const navItemClass = (path: string) =>
    cn(
      "block px-4 py-2 rounded-md text-sm transition-colors",
      isActive(path)
        ? "bg-primary text-primary-foreground font-medium"
        : "text-foreground hover:bg-accent"
    );

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col"
      style={{
        "--app-sidebar-w": collapsed ? "4rem" : "15rem",
      } as React.CSSProperties}
    >
      {/* Header com logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs">
            A3
          </div>
          {!collapsed && <span className="font-semibold text-sm">ARC3</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-accent rounded"
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {role === "admin" ? (
          <>
            {/* Admin navigation */}
            <div className="space-y-1">
              <Link to="/" className={navItemClass("/")} title="Dashboard">
                {!collapsed && "📊 Dashboard"}
              </Link>
              <Link to="/clientes" className={navItemClass("/clientes")} title="Clientes">
                {!collapsed && "👥 Clientes"}
              </Link>
            </div>

            {/* Divider */}
            {!collapsed && <div className="border-t border-border my-2"></div>}
          </>
        ) : (
          <>
            {/* Client navigation */}
            <div className="space-y-1">
              <Link to="/workspace" className={navItemClass("/workspace")} title="Minhas Auditorias">
                {!collapsed && "📋 Minhas Auditorias"}
              </Link>
            </div>

            {/* Divider */}
            {!collapsed && <div className="border-t border-border my-2"></div>}
          </>
        )}
      </nav>

      {/* Footer com conta */}
      <div className="border-t border-border p-3">
        <Link to="/conta" className={navItemClass("/conta")} title="Minha conta">
          {!collapsed && "⚙️ Minha conta"}
        </Link>
      </div>
    </aside>
  );
}
