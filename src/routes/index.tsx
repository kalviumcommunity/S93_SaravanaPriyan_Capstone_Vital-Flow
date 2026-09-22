import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Radio } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BLOOD_GROUPS, URGENCY_META, type BloodGroup, type Urgency } from "@/lib/hospital-data";
import { useHospital } from "@/lib/hospital-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Emergency Blood Request · LifeLine Hospital Console" },
      {
        name: "description",
        content:
          "Broadcast an emergency blood request to nearby verified donors in under 30 seconds and track approvals live.",
      },
      { property: "og:title", content: "Emergency Blood Request · LifeLine Hospital Console" },
      {
        property: "og:description",
        content: "Broadcast emergency blood requests and track donor approvals in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmergencyRequestPage,
});

function EmergencyRequestPage() {
  const navigate = useNavigate();
  const { broadcast } = useHospital();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O-");
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<Urgency>("critical");
  const [patientId, setPatientId] = useState("");
  const [ward, setWard] = useState("");
  const [contact, setContact] = useState("+91 9845012300");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    broadcast({
      bloodGroup,
      unitsNeeded: units,
      urgency,
      patientId: patientId || "PT-UNASSIGNED",
      ward: ward || "Emergency Desk",
      contact,
      notes,
    });
    navigate({ to: "/active" });
  };

  return (
    <AppShell
      title="Emergency Blood Request"
      subtitle="Submit in under 30 seconds — matched donors get an instant push alert."
    >
      <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="stat-label">Blood group required</p>
            <div className="mt-3 grid grid-cols-4 gap-2.5">
              {BLOOD_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBloodGroup(g)}
                  className={cn(
                    "rounded-lg border-2 py-5 font-display text-xl font-bold transition-all",
                    bloodGroup === g
                      ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-emergency)]"
                      : "border-border bg-background hover:border-primary/50",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <p className="stat-label">Units needed</p>
              <div className="mt-3 flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setUnits((u) => Math.max(1, u - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="font-display text-4xl font-bold tabular-nums">{units}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setUnits((u) => Math.min(20, u + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <p className="stat-label">Urgency level</p>
              <div className="mt-3 space-y-2">
                {(Object.keys(URGENCY_META) as Urgency[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUrgency(u)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                      urgency === u
                        ? u === "critical"
                          ? "border-critical bg-critical-soft text-critical"
                          : u === "urgent"
                            ? "border-urgent bg-urgent-soft text-urgent"
                            : "border-standard bg-standard-soft text-standard"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/25",
                    )}
                  >
                    <span>{URGENCY_META[u].dot}</span>
                    {URGENCY_META[u].label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="patient">Patient / Ward ID</Label>
              <Input
                id="patient"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="PT-77120"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ward">Ward / Location</Label>
              <Input
                id="ward"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="Trauma ICU · Bed 4"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Emergency contact</Label>
              <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes for donors (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Report at Gate 2, Blood Bank counter."
                rows={2}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="stat-label">Request summary</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-5xl font-bold text-primary">{bloodGroup}</span>
              <span className="text-lg font-semibold">
                {units} unit{units > 1 ? "s" : ""}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {URGENCY_META[urgency].dot} {URGENCY_META[urgency].label} ·{" "}
              {ward || "Emergency Desk"}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Broadcasting matches nearby eligible donors and sends each of them a push alert. Call
              controls stay locked until a donor taps Approve.
            </p>
          </div>

          <Button type="submit" size="lg" className="h-14 w-full text-base font-bold">
            <Radio className="size-5" />
            Broadcast Emergency Request
          </Button>
        </aside>
      </form>
    </AppShell>
  );
}
