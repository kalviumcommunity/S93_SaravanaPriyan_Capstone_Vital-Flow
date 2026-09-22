import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Hospital Profile & Settings · LifeLine Console" },
      {
        name: "description",
        content:
          "Manage hospital registration, licence verification, address, map pin code and the primary emergency contact.",
      },
      { property: "og:title", content: "Hospital Profile & Settings · LifeLine Console" },
      {
        property: "og:description",
        content: "Registration, licensing and emergency contact settings for your hospital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const FIELDS = [
  { id: "name", label: "Hospital name", value: "St. Marian General Hospital" },
  { id: "regno", label: "Registration number", value: "HSP-2291-KA" },
  { id: "licence", label: "Licence number", value: "BB/LIC/2024/0918" },
  { id: "address", label: "Address", value: "18 Richmond Road, Bengaluru" },
  { id: "pin", label: "Map pin code", value: "560025" },
  { id: "contact", label: "Primary emergency contact", value: "+91 9845012300" },
];

function SettingsPage() {
  return (
    <AppShell
      title="Hospital Profile & Settings"
      subtitle="Registration, licensing and the contact donors see on their alerts."
    >
      <form
        className="mx-auto max-w-3xl space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Hospital profile saved");
        }}
      >
        <div className="flex items-center gap-3 rounded-xl border border-border bg-approved-soft p-4">
          <BadgeCheck className="size-6 text-approved" />
          <div>
            <p className="font-semibold text-approved">Licence verified</p>
            <p className="text-sm text-muted-foreground">
              Verified on 12 Mar 2026 · valid through 31 Dec 2027
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input id={f.id} defaultValue={f.value} />
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="stat-label">Alert preferences</p>
          {[
            ["Auto re-push to next donor after 5 min silence", true],
            ["Notify desk when a donor approves", true],
            ["Include ward details in donor push alerts", false],
          ].map(([label, checked]) => (
            <div key={label as string} className="flex items-center justify-between gap-4">
              <span className="text-sm">{label as string}</span>
              <Switch defaultChecked={checked as boolean} />
            </div>
          ))}
        </div>

        <Button type="submit" size="lg">
          Save changes
        </Button>
      </form>
    </AppShell>
  );
}
