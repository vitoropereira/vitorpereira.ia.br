import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type CalloutType = "info" | "warn" | "success" | "note";

const STYLES: Record<CalloutType, { icon: typeof Info; classes: string }> = {
  info: {
    icon: Info,
    classes:
      "border-blue-500/30 bg-blue-500/10 text-blue-950 dark:text-blue-100",
  },
  warn: {
    icon: TriangleAlert,
    classes:
      "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  },
  success: {
    icon: CheckCircle2,
    classes:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
  },
  note: {
    icon: AlertCircle,
    classes:
      "border-slate-500/30 bg-slate-500/10 text-slate-950 dark:text-slate-100",
  },
};

export function Callout({
  type = "info",
  children,
}: {
  type?: CalloutType;
  children: ReactNode;
}) {
  const { icon: Icon, classes } = STYLES[type];
  return (
    <aside
      className={cn(
        "my-6 flex gap-3 rounded-lg border px-4 py-3 text-sm",
        classes,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="flex-1 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}
