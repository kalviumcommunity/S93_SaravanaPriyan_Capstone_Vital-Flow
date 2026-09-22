import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  SEED_HISTORY,
  SEED_REQUESTS,
  makeDonors,
  newRequestId,
  type BloodGroup,
  type BloodRequest,
  type Urgency,
} from "./hospital-data";

interface NewRequestInput {
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: Urgency;
  patientId: string;
  ward: string;
  contact: string;
  notes?: string;
}

interface Store {
  active: BloodRequest[];
  history: BloodRequest[];
  broadcast: (input: NewRequestInput) => string;
  rePush: (requestId: string, donorId: string) => void;
  simulateApproval: (requestId: string, donorId: string) => void;
  markReceived: (requestId: string, donorId: string) => void;
  cancelRequest: (requestId: string) => void;
}

const HospitalContext = createContext<Store | null>(null);

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<BloodRequest[]>(SEED_REQUESTS);
  const [history, setHistory] = useState<BloodRequest[]>(SEED_HISTORY);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const updateRequest = useCallback(
    (requestId: string, fn: (r: BloodRequest) => BloodRequest) => {
      setActive((prev) => prev.map((r) => (r.id === requestId ? fn(r) : r)));
    },
    [],
  );

  const approveDonor = useCallback(
    (requestId: string, donorId: string) => {
      updateRequest(requestId, (r) => {
        const donors = r.donors.map((d) =>
          d.id === donorId
            ? {
                ...d,
                state: "APPROVED" as const,
                etaMinutes: Math.max(6, Math.round(d.distanceKm * 4)),
              }
            : d,
        );
        const approvedDonor = donors.find((d) => d.id === donorId);
        if (approvedDonor) {
          toast.success(`${approvedDonor.name} approved the request`, {
            description: `Call & fulfil controls unlocked · ETA ${approvedDonor.etaMinutes} mins`,
          });
        }
        return { ...r, donors, state: r.state === "SEARCHING" ? "APPROVED" : r.state };
      });
    },
    [updateRequest],
  );

  const broadcast = useCallback(
    (input: NewRequestInput) => {
      const id = newRequestId();
      const request: BloodRequest = {
        id,
        createdAt: new Date().toISOString(),
        ...input,
        state: "SEARCHING",
        donors: makeDonors(input.bloodGroup, 3 + Math.floor(Math.random() * 2)),
      };
      setActive((prev) => [request, ...prev]);

      // Simulated donor responses arriving from the mobile app.
      const first = request.donors[0];
      if (first) {
        timers.current.push(setTimeout(() => approveDonor(id, first.id), 7000));
      }
      return id;
    },
    [approveDonor],
  );

  const rePush = useCallback(
    (requestId: string, donorId: string) => {
      updateRequest(requestId, (r) => ({
        ...r,
        donors: r.donors.map((d) =>
          d.id === donorId ? { ...d, pushCount: d.pushCount + 1, state: "MATCHED" } : d,
        ),
      }));
      toast("Push notification re-sent", {
        description: "Waiting for the donor to tap Approve on their phone.",
      });
    },
    [updateRequest],
  );

  const markReceived = useCallback(
    (requestId: string, donorId: string) => {
      let completed: BloodRequest | undefined;
      setActive((prev) => {
        const next = prev.map((r) => {
          if (r.id !== requestId) return r;
          const donors = r.donors.map((d) =>
            d.id === donorId ? { ...d, state: "DONATED" as const } : d,
          );
          const units = donors.filter((d) => d.state === "DONATED").length;
          const updated: BloodRequest = {
            ...r,
            donors,
            state: units >= r.unitsNeeded ? "FULFILLED" : r.state,
          };
          if (updated.state === "FULFILLED") completed = updated;
          return updated;
        });
        return next.filter((r) => r.state !== "FULFILLED");
      });
      if (completed) {
        setHistory((h) => [completed as BloodRequest, ...h]);
        toast.success("Request fulfilled and logged to history");
      } else {
        toast.success("Unit received from donor");
      }
    },
    [],
  );

  const cancelRequest = useCallback((requestId: string) => {
    setActive((prev) => {
      const target = prev.find((r) => r.id === requestId);
      if (target) {
        setHistory((h) => [{ ...target, state: "CANCELLED" }, ...h]);
      }
      return prev.filter((r) => r.id !== requestId);
    });
    toast("Request cancelled", { description: "Matched donors have been notified." });
  }, []);

  const value = useMemo<Store>(
    () => ({
      active,
      history,
      broadcast,
      rePush,
      simulateApproval: approveDonor,
      markReceived,
      cancelRequest,
    }),
    [active, history, broadcast, rePush, approveDonor, markReceived, cancelRequest],
  );

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used inside HospitalProvider");
  return ctx;
}
