import { ReactNode } from "react";
import { useTutorial } from "@/hooks/useTutorial";
import { HelpButton } from "./HelpButton";

export function PageHeader({
  title,
  subtitle,
  actions,
  tutorialKey,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tutorialKey?: string;
}) {
  const { start } = useTutorial(tutorialKey);
  return (
    <div className="flex items-start justify-between gap-4 mb-6" data-tour="page-header">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {tutorialKey && <HelpButton onClick={start} />}
      </div>
    </div>
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      {title && <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>}
      {children}
    </div>
  );
}
