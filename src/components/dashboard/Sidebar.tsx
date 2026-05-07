import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Radio, GraduationCap, Tag, MapPin, ShoppingCart, Upload, User, Package, UserCircle, Users, ShieldCheck, Database, ChevronLeft, ChevronRight } from "lucide-react";

const links = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/turmas", label: "Turmas", icon: GraduationCap },
  { to: "/pacotes", label: "Pacotes", icon: Package },
  { to: "/proprietarios", label: "Proprietários", icon: UserCircle },
  { to: "/origem", label: "Origem do Lead", icon: Users },
  { to: "/canais", label: "Canais", icon: Radio },
  { to: "/utms", label: "Campanhas", icon: Tag },
  { to: "/geografia", label: "Geografia", icon: MapPin },
  { to: "/modelo", label: "Modelo de Dados", icon: Database },
  { to: "/auditoria", label: "Auditoria", icon: ShieldCheck },
  { to: "/admin/import", label: "Importar planilha", icon: Upload },
  { to: "/conta", label: "Minha conta", icon: User },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar_collapsed") === "1";
  });

  useEffect(() => {
    const w = collapsed ? "4rem" : "15rem";
    document.documentElement.style.setProperty("--app-sidebar-w", w);
    try { localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 border-r border-border bg-[var(--sidebar-bg)] flex flex-col transition-[width] duration-200"
      style={{ width: collapsed ? "4rem" : "15rem" }}
    >
      <div className={`${collapsed ? "px-2" : "px-6"} py-5 border-b border-border flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="size-8 shrink-0 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white">
            F
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-semibold text-sm tracking-tight truncate">Febracis</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5 truncate">MKT Attribution</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="size-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center"
            title="Recolher"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-2 mt-2 h-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center"
          title="Expandir"
        >
          <ChevronRight className="size-4" />
        </button>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "bg-primary/15 text-foreground border border-primary/30" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent" }}
            className={`flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-3"} py-2 rounded-md text-sm font-medium transition-colors`}
            title={collapsed ? label : undefined}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-6 py-3 text-[11px] text-muted-foreground border-t border-border">
          v1.0 · 2026
        </div>
      )}
    </aside>
  );
}
