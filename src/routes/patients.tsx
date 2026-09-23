import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BLOOD_GROUPS, type BloodGroup } from "@/lib/hospital-data";

export const Route = createFileRoute("/patients")({
  component: PatientsPage,
});

type Patient = {
  patientId: string;
  bloodGroup: BloodGroup;
  ward: string;
  contact: string;
  notes?: string;
};

const emptyForm = {
  bloodGroup: "O-" as BloodGroup,
  ward: "",
  contact: "",
  notes: "",
};

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/patients");
      if (!response.ok) throw new Error("Unable to load patients");
      const data = (await response.json()) as { patients: Patient[] };
      setPatients(data.patients);
    } catch {
      setMessage("Unable to load patients. Check MongoDB and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPatients();
  }, []);

  const startEdit = (patient: Patient) => {
    setEditingId(patient.patientId);
    setForm({
      bloodGroup: patient.bloodGroup,
      ward: patient.ward,
      contact: patient.contact,
      notes: patient.notes ?? "",
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const updatePatient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    try {
      const response = await fetch(`/api/patients/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string; patient?: Patient };
      if (!response.ok) throw new Error(data.error ?? "Patient update failed");

      setPatients((current) =>
        current.map((patient) =>
          patient.patientId === editingId && data.patient ? data.patient : patient,
        ),
      );
      setMessage("Patient updated successfully.");
      cancelEdit();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Patient update failed.");
    }
  };

  const deletePatient = async (patientId: string) => {
    if (!window.confirm(`Delete patient ${patientId}?`)) return;

    try {
      const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Patient deletion failed");

      setPatients((current) => current.filter((patient) => patient.patientId !== patientId));
      if (editingId === patientId) cancelEdit();
      setMessage("Patient deleted successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Patient deletion failed.");
    }
  };

  return (
    <AppShell title="Patient Management" subtitle="Update or delete MongoDB patient records.">
      <div className="mx-auto max-w-6xl space-y-6">
        {message && (
          <p className="rounded-lg border border-border bg-card p-3 text-sm" aria-live="polite">
            {message}
          </p>
        )}

        {editingId && (
          <form onSubmit={updatePatient} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4">
              <p className="stat-label">Update patient</p>
              <h2 className="font-display text-2xl font-bold">{editingId}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bloodGroup">Blood group</Label>
                <select
                  id="bloodGroup"
                  value={form.bloodGroup}
                  onChange={(event) => setForm({ ...form, bloodGroup: event.target.value as BloodGroup })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ward">Ward / Location</Label>
                <Input id="ward" value={form.ward} onChange={(event) => setForm({ ...form, ward: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact">Emergency contact</Label>
                <Input id="contact" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
            </div>
          </form>
        )}

        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="stat-label">MongoDB records</p>
              <h2 className="font-display text-2xl font-bold">Patients</h2>
            </div>
            <Button variant="outline" onClick={() => void loadPatients()}>Refresh</Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading patients…</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No patient records found.</p>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <div key={patient.patientId} className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{patient.patientId}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.bloodGroup} · {patient.ward} · {patient.contact}
                    </p>
                    {patient.notes && <p className="mt-1 text-sm">{patient.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => startEdit(patient)}>Update</Button>
                    <Button variant="destructive" onClick={() => void deletePatient(patient.patientId)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
