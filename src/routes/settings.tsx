import { useEffect, useState } from "react";
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

type Settings = {
  name: string;
  regno: string;
  licence: string;
  address: string;
  pin: string;
  contact: string;
  autoRepush: boolean;
  notifyDesk: boolean;
  includeWardDetails: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  name: "St. Marian General Hospital",
  regno: "HSP-2291-KA",
  licence: "BB/LIC/2024/0918",
  address: "18 Richmond Road, Bengaluru",
  pin: "560025",
  contact: "+91 9845012300",
  autoRepush: true,
  notifyDesk: true,
  includeWardDetails: false,
};

const FIELDS: {
  id: keyof Pick<Settings, "name" | "regno" | "licence" | "address" | "pin" | "contact">;
  label: string;
}[] = [
  { id: "name", label: "Hospital name" },
  { id: "regno", label: "Registration number" },
  { id: "licence", label: "Licence number" },
  { id: "address", label: "Address" },
  { id: "pin", label: "Map pin code" },
  { id: "contact", label: "Primary emergency contact" },
];

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/hospital-settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load hospital settings.");
        return (await response.json()) as Partial<Settings>;
      })
      .then((data) => {
        if (active) setSettings({ ...DEFAULT_SETTINGS, ...data });
      })
      .catch((error: unknown) => {
        console.error("Load hospital settings error:", error);
        if (active) toast.error("Could not load saved hospital settings. Showing defaults.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/hospital-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = (await response.json()) as { error?: string; settings?: Partial<Settings> };
      if (!response.ok) throw new Error(result.error || "Unable to save hospital settings.");
      if (result.settings) setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
      toast.success("Hospital profile saved to MongoDB Atlas.");
    } catch (error) {
      console.error("Save hospital settings error:", error);
      toast.error(error instanceof Error ? error.message : "Unable to save hospital settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Hospital Profile & Settings"
      subtitle="Registration, licensing and the contact donors see on their alerts."
    >
      <form className="mx-auto max-w-3xl space-y-6" onSubmit={saveSettings}>
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
          {FIELDS.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                value={settings[field.id]}
                onChange={(event) => updateField(field.id, event.target.value)}
                disabled={loading || saving}
              />
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="stat-label">Alert preferences</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Auto re-push to next donor after 5 min silence</span>
            <Switch
              checked={settings.autoRepush}
              onCheckedChange={(value) => updateField("autoRepush", value)}
              disabled={loading || saving}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Notify desk when a donor approves</span>
            <Switch
              checked={settings.notifyDesk}
              onCheckedChange={(value) => updateField("notifyDesk", value)}
              disabled={loading || saving}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Include ward details in donor push alerts</span>
            <Switch
              checked={settings.includeWardDetails}
              onCheckedChange={(value) => updateField("includeWardDetails", value)}
              disabled={loading || saving}
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading || saving}>
          {saving ? "Saving..." : loading ? "Loading..." : "Save changes"}
        </Button>
      </form>
    </AppShell>
  );
}
