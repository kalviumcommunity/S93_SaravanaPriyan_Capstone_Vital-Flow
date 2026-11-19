import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
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
  broadcast: (input: NewRequestInput) => Promise<string>;
  rePush: (requestId: string, donorId: string) => void;
  simulateApproval: (requestId: string, donorId: string) => void;
  markReceived: (requestId: string, donorId: string) => void;
  cancelRequest: (requestId: string) => void;
}

type ApiRequest = BloodRequest & { requestId?: string };

const HospitalContext = createContext<Store | null>(null);

async function updateRequestOnServer(
  requestId: string,
  action: "repush" | "approve" | "received" | "cancel",
  donorId?: string,
): Promise<ApiRequest> {
  const response = await fetch("/api/blood-requests", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, action, donorId }),
  });
  const body = (await response.json()) as { request?: ApiRequest; error?: string };
  if (!response.ok || !body.request) {
    throw new Error(body.error ?? "Could not update the blood request.");
  }
  return body.request;
}

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<BloodRequest[]>([]);
  const [history, setHistory] = useState<BloodRequest[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;
    const activeTimers = timers.current;

    fetch("/api/blood-requests")
      .then(async (response) => {
        const body = (await response.json()) as {
          requests?: ApiRequest[];
          error?: string;
        };
        if (!response.ok) throw new Error(body.error ?? "Could not load blood requests.");
        return body.requests ?? [];
      })
      .then((requests) => {
        if (cancelled) return;
        setActive(
          requests.filter((request) => !["FULFILLED", "CANCELLED"].includes(request.state)),
        );
        setHistory(
          requests.filter((request) => ["FULFILLED", "CANCELLED"].includes(request.state)),
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Blood request loading failed:", error);
          toast.error("Could not load blood requests from MongoDB.");
        }
      });

    return () => {
      cancelled = true;
      activeTimers.forEach(clearTimeout);
    };
  }, []);

  const broadcast = useCallback(async (input: NewRequestInput) => {
    const requestId = newRequestId();
    const donors = makeDonors(input.bloodGroup, 3 + Math.floor(Math.random() * 2));
    const response = await fetch("/api/blood-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        requestId,
        state: "SEARCHING",
        donors,
      }),
    });
    const body = (await response.json()) as { request?: ApiRequest; error?: string };
    if (!response.ok || !body.request) {
      throw new Error(body.error ?? "Blood request could not be saved to MongoDB.");
    }

    const savedRequest = body.request;
    setActive((previous) => [savedRequest, ...previous]);

    const firstDonor = savedRequest.donors[0];
    if (firstDonor) {
      timers.current.push(
        setTimeout(() => {
          void updateRequestOnServer(savedRequest.id, "approve", firstDonor.id)
            .then((updated) => {
              setActive((previous) =>
                previous.map((item) => (item.id === updated.id ? updated : item)),
              );
            })
            .catch((error: unknown) => console.error("Donor simulation failed:", error));
        }, 7000),
      );
    }

    return savedRequest.id;
  }, []);

  const rePush = useCallback(async (requestId: string, donorId: string) => {
    try {
      const updated = await updateRequestOnServer(requestId, "repush", donorId);
      setActive((previous) => previous.map((item) => (item.id === requestId ? updated : item)));
      toast("Push notification re-sent", {
        description: "Waiting for the donor to tap Approve on their phone.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend notification.");
    }
  }, []);

  const simulateApproval = useCallback(async (requestId: string, donorId: string) => {
    try {
      const updated = await updateRequestOnServer(requestId, "approve", donorId);
      setActive((previous) => previous.map((item) => (item.id === requestId ? updated : item)));
      const donor = updated.donors.find((item) => item.id === donorId);
      if (donor) toast.success(`${donor.name} approved the request`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update donor approval.");
    }
  }, []);

  const markReceived = useCallback(async (requestId: string, donorId: string) => {
    try {
      const updated = await updateRequestOnServer(requestId, "received", donorId);
      if (updated.state === "FULFILLED") {
        setActive((previous) => previous.filter((item) => item.id !== requestId));
        setHistory((previous) => [updated, ...previous.filter((item) => item.id !== requestId)]);
        toast.success("Request fulfilled and saved to history");
      } else {
        setActive((previous) => previous.map((item) => (item.id === requestId ? updated : item)));
        toast.success("Unit received from donor");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save received unit.");
    }
  }, []);

  const cancelRequest = useCallback(async (requestId: string) => {
    try {
      const updated = await updateRequestOnServer(requestId, "cancel");
      setActive((previous) => previous.filter((item) => item.id !== requestId));
      setHistory((previous) => [updated, ...previous.filter((item) => item.id !== requestId)]);
      toast("Request cancelled", { description: "The cancellation was saved to MongoDB." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel request.");
    }
  }, []);

  const value = useMemo<Store>(
    () => ({
      active,
      history,
      broadcast,
      rePush,
      simulateApproval,
      markReceived,
      cancelRequest,
    }),
    [active, history, broadcast, rePush, simulateApproval, markReceived, cancelRequest],
  );

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospital must be used inside HospitalProvider");
  return ctx;
}
