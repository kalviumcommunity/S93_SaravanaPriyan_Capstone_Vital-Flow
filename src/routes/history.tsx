import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { URGENCY_META } from "@/lib/hospital-data";
import { useHospital } from "@/lib/hospital-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Request History & Logs · LifeLine Hospital Console" },
      {
        name: "description",
        content:
          "Searchable log of every emergency blood request with units, urgency, outcome and approved donors.",
      },
      { property: "og:title", content: "Request History & Logs · LifeLine Hospital Console" },
      {
        property: "og:description",
        content: "Audit every past emergency blood request and the donors who responded.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { history } = useHospital();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () =>
      history.filter((r) => {
        const matchesQuery =
          !query ||
          `${r.id} ${r.bloodGroup} ${r.patientId} ${r.ward}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesStatus = status === "all" || r.state.toLowerCase() === status;
        return matchesQuery && matchesStatus;
      }),
    [history, query, status],
  );

  return (
    <AppShell
      title="Request History & Logs"
      subtitle="Every closed request, with the donors who approved and donated."
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search request ID, blood group, patient or ward"
            className="max-w-sm bg-card"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44 bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved Donors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No requests match your filters.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-semibold">{r.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-display font-bold text-primary">
                    {r.bloodGroup}
                  </TableCell>
                  <TableCell>{r.unitsNeeded}</TableCell>
                  <TableCell className="text-sm">
                    {URGENCY_META[r.urgency].dot} {URGENCY_META[r.urgency].label}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        r.state === "FULFILLED"
                          ? "bg-approved-soft text-approved"
                          : "bg-critical-soft text-critical",
                      )}
                    >
                      {r.state === "FULFILLED" ? "Fulfilled" : "Cancelled"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.donors.length
                      ? r.donors.map((d) => d.name).join(", ")
                      : "No donor approvals"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
