import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, Lock, Phone, Search, Smartphone, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { URGENCY_META, type BloodRequest, type Donor } from "@/lib/hospital-data";
import { useHospital } from "@/lib/hospital-store";

export const Route = createFileRoute("/active")({
  head: () => ({
    meta: [
      { title: "Active Requests & Live Donor Tracking · LifeLine" },
      {
        name: "description",
        content:
          "Monitor pushed donor alerts, approvals and ETAs in real time. Call and fulfil controls unlock only after donor approval.",
      },
      { property: "og:title", content: "Active Requests & Live Donor Tracking · LifeLine" },
      {
        property: "og:description",
        content: "Live donor approval tracking for active emergency blood requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivePage,
});

function StatusBadge({ donor }: { donor: Donor }) {
  const map = {
    MATCHED: {
      text: "🟡 Notification Pushed — Waiting for Donor Response",
      cls: "bg-pending-soft text-pending",
    },
    APPROVED: {
      text: `🟢 Approved & En Route (ETA: ${donor.etaMinutes ?? 15} mins)`,
      cls: "bg-approved-soft text-approved",
    },
    DECLINED: { text: "🔴 Declined / Timed Out", cls: "bg-critical-soft text-critical" },
    DONATED: { text: "✅ Unit Received", cls: "bg-approved-soft text-approved" },
  } as const;
  const s = map[donor.state];
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>{s.text}</span>
  );
}

function DonorRow({ request, donor }: { request: BloodRequest; donor: Donor }) {
  const { rePush, simulateApproval, markReceived } = useHospital();
  const approved = donor.state === "APPROVED";
  const donated = donor.state === "DONATED";

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {donor.name}{" "}
            <span className="font-mono text-xs text-muted-foreground">({donor.id})</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {donor.bloodGroup} · {donor.distanceKm} km away · last donated {donor.lastDonation} ·{" "}
            {donor.pushCount} push{donor.pushCount > 1 ? "es" : ""} sent
          </p>
        </div>
        <StatusBadge donor={donor} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!approved && !donated && (
          <Button variant="outline" size="sm" onClick={() => rePush(request.id, donor.id)}>
            <Bell className="size-4" />
            Send Re-Push Notification
          </Button>
        )}

        {approved || donated ? (
          <>
            <Button size="sm" asChild>
              <a href={`tel:${donor.phone.replace(/\s/g, "")}`}>
                <Phone className="size-4" />
                Call Donor · {donor.phone}
              </a>
            </Button>
            {!donated && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => markReceived(request.id, donor.id)}
              >
                <CheckCircle2 className="size-4" />
                Mark Received / Fulfilled
              </Button>
            )}
          </>
        ) : (
          <>
            <Button size="sm" disabled>
              <Lock className="size-4" />
              Call Donor
            </Button>
            <Button size="sm" variant="secondary" disabled>
              <Lock className="size-4" />
              Mark Received
            </Button>
          </>
        )}

        {donor.state === "MATCHED" && (
          <button
            type="button"
            onClick={() => simulateApproval(request.id, donor.id)}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <Smartphone className="size-3.5" />
            Simulate donor tapping “Approve”
          </button>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: BloodRequest }) {
  const { cancelRequest } = useHospital();
  const urgency = URGENCY_META[request.urgency];
  const accepted = request.donors.filter(
    (d) => d.state === "APPROVED" || d.state === "DONATED",
  ).length;
  const anyApproved = accepted > 0;

  return (
    <article className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-lg bg-primary font-display text-xl font-bold text-primary-foreground">
            {request.bloodGroup}
          </span>
          <div>
            <p className="font-display text-lg font-bold">
              {request.id} · {accepted}/{request.unitsNeeded} units accepted
            </p>
            <p className="text-sm text-muted-foreground">
              {urgency.dot} {urgency.label} · {request.ward} · Patient {request.patientId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              anyApproved ? "bg-approved-soft text-approved" : "bg-pending-soft text-pending",
            )}
          >
            {anyApproved ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <Search className="size-3.5 animate-pulse" />
            )}
            {anyApproved ? "Donor Approved" : "Searching donors…"}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!anyApproved}
            onClick={() => cancelRequest(request.id)}
          >
            {anyApproved ? <XCircle className="size-4" /> : <Lock className="size-4" />}
            Cancel Request
          </Button>
        </div>
      </header>

      <div className="space-y-3 p-5">
        <p className="stat-label">Matched donors ({request.donors.length})</p>
        {request.donors.map((d) => (
          <DonorRow key={d.id} request={request} donor={d} />
        ))}
      </div>
    </article>
  );
}

function ActivePage() {
  const { active } = useHospital();

  return (
    <AppShell
      title="Active Requests & Real-Time Tracking"
      subtitle="Call and fulfil controls unlock the moment a donor approves on their phone."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-lg font-bold">No active requests</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Broadcast an emergency request to start matching donors.
            </p>
            <Button asChild className="mt-4">
              <Link to="/">New Emergency Request</Link>
            </Button>
          </div>
        ) : (
          active.map((r) => <RequestCard key={r.id} request={r} />)
        )}
      </div>
    </AppShell>
  );
}
