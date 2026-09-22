import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Droplets, History, Settings, Siren } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useHospital } from "@/lib/hospital-store";

const NAV = [
  { to: "/", label: "Emergency Request", icon: Siren },
  { to: "/active", label: "Active & Tracking", icon: Activity },
  { to: "/history", label: "Request History", icon: History },
  { to: "/settings", label: "Profile & Settings", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { active } = useHospital();
  const pending = active.reduce(
    (n, r) => n + r.donors.filter((d) => d.state === "MATCHED").length,
    0,
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Droplets className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold">LifeLine Console</p>
            <p className="text-xs text-sidebar-foreground/60">St. Marian General</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {to === "/active" && pending > 0 && (
                  <span className="rounded-full bg-pending px-1.5 py-0.5 text-[10px] font-bold text-urgent-foreground">
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60">
          <p className="font-semibold text-sidebar-foreground">Hospital ID · HSP-2291</p>
          <p className="mt-1">Emergency desk online</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-card/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold md:text-2xl">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-standard-soft px-3 py-1.5 text-xs font-semibold text-standard">
              <span className="size-2 rounded-full bg-standard" />
              Emergency Status: Online
            </span>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto md:hidden">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium",
                  pathname === to ? "bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
