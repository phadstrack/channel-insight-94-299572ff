import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Radio, GraduationCap, Route as RouteIcon, AlertTriangle } from "lucide-react";

const links = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/canais", label: "Canais", icon: Radio },
  { to: "/turmas", label: "Turmas", icon: GraduationCap },
  { to: "/jornada", label: "Jornada do Lead", icon: RouteIcon },
  { to: "/gaps", label: "Gaps de Atribuição", icon: AlertTriangle },
] as const;

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-60 border-r border-border bg-[var(--sidebar-bg)] flex flex-col">
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white">
            F
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight">Febracis</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">MKT Attribution</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{
              className:
                "bg-primary/15 text-foreground border border-primary/30",
            }}
            inactiveProps={{
              className: "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent",
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-6 py-4 text-[11px] text-muted-foreground border-t border-border">
        v1.0 · 2026
      </div>
    </aside>
  );
}
