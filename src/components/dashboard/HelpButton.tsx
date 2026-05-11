import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      title="Mostrar tutorial desta página"
      data-tour="help-button"
      className="text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="size-5" />
    </Button>
  );
}
