export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
export type Urgency = "critical" | "urgent" | "standard";
export type DonorState = "MATCHED" | "APPROVED" | "DECLINED" | "DONATED";
export type RequestState = "SEARCHING" | "APPROVED" | "FULFILLED" | "CANCELLED";

export const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export const URGENCY_META: Record<Urgency, { label: string; dot: string; tone: string }> = {
  critical: { label: "Critical", dot: "🔴", tone: "critical" },
  urgent: { label: "Urgent", dot: "🟡", tone: "urgent" },
  standard: { label: "Standard", dot: "🟢", tone: "standard" },
};

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  distanceKm: number;
  phone: string;
  lastDonation: string;
  state: DonorState;
  pushCount: number;
  etaMinutes?: number;
}

export interface BloodRequest {
  id: string;
  createdAt: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: Urgency;
  patientId: string;
  ward: string;
  contact: string;
  notes?: string;
  state: RequestState;
  donors: Donor[];
}

const FIRST = [
  "Aarav Mehta",
  "Priya Nair",
  "Rohan Das",
  "Sneha Kulkarni",
  "Imran Sheikh",
  "Divya Raman",
  "Kabir Anand",
  "Meera Joshi",
  "Vikram Rao",
  "Ananya Bose",
];

let seq = 1;

export function makeDonors(bloodGroup: BloodGroup, count: number): Donor[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `DNR-${1000 + seq++}`,
    name: FIRST[(seq + i) % FIRST.length] ?? "Registered Donor",
    bloodGroup,
    distanceKm: Number((0.8 + Math.random() * 6).toFixed(1)),
    phone: `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
    lastDonation: `${2 + Math.floor(Math.random() * 10)} months ago`,
    state: "MATCHED" as DonorState,
    pushCount: 1,
  }));
}

export function newRequestId() {
  return `REQ-${String(Math.floor(1000 + Math.random() * 8999))}`;
}

export const SEED_REQUESTS: BloodRequest[] = [
  {
    id: "REQ-4821",
    createdAt: new Date(Date.now() - 9 * 60000).toISOString(),
    bloodGroup: "O-",
    unitsNeeded: 3,
    urgency: "critical",
    patientId: "PT-77120",
    ward: "Trauma ICU · Bed 4",
    contact: "+91 9845012300",
    state: "SEARCHING",
    donors: [
      {
        id: "DNR-0912",
        name: "Aarav Mehta",
        bloodGroup: "O-",
        distanceKm: 1.4,
        phone: "+91 9845067711",
        lastDonation: "5 months ago",
        state: "APPROVED",
        pushCount: 1,
        etaMinutes: 12,
      },
      {
        id: "DNR-0913",
        name: "Priya Nair",
        bloodGroup: "O-",
        distanceKm: 2.9,
        phone: "+91 9812234455",
        lastDonation: "8 months ago",
        state: "MATCHED",
        pushCount: 1,
      },
      {
        id: "DNR-0914",
        name: "Imran Sheikh",
        bloodGroup: "O-",
        distanceKm: 4.6,
        phone: "+91 9900112233",
        lastDonation: "3 months ago",
        state: "DECLINED",
        pushCount: 2,
      },
    ],
  },
  {
    id: "REQ-4818",
    createdAt: new Date(Date.now() - 42 * 60000).toISOString(),
    bloodGroup: "B+",
    unitsNeeded: 2,
    urgency: "urgent",
    patientId: "PT-77094",
    ward: "Maternity · Ward 2",
    contact: "+91 9845012300",
    state: "SEARCHING",
    donors: [
      {
        id: "DNR-0921",
        name: "Meera Joshi",
        bloodGroup: "B+",
        distanceKm: 3.2,
        phone: "+91 9811777221",
        lastDonation: "7 months ago",
        state: "MATCHED",
        pushCount: 1,
      },
      {
        id: "DNR-0922",
        name: "Vikram Rao",
        bloodGroup: "B+",
        distanceKm: 5.1,
        phone: "+91 9822556677",
        lastDonation: "11 months ago",
        state: "MATCHED",
        pushCount: 1,
      },
    ],
  },
];

export const SEED_HISTORY: BloodRequest[] = [
  {
    id: "REQ-4790",
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    bloodGroup: "A+",
    unitsNeeded: 2,
    urgency: "critical",
    patientId: "PT-76880",
    ward: "Surgery · OT 1",
    contact: "+91 9845012300",
    state: "FULFILLED",
    donors: [
      {
        id: "DNR-0801",
        name: "Sneha Kulkarni",
        bloodGroup: "A+",
        distanceKm: 2.1,
        phone: "+91 9834455662",
        lastDonation: "1 day ago",
        state: "DONATED",
        pushCount: 1,
      },
      {
        id: "DNR-0802",
        name: "Kabir Anand",
        bloodGroup: "A+",
        distanceKm: 3.8,
        phone: "+91 9844332211",
        lastDonation: "1 day ago",
        state: "DONATED",
        pushCount: 2,
      },
    ],
  },
  {
    id: "REQ-4771",
    createdAt: new Date(Date.now() - 52 * 3600000).toISOString(),
    bloodGroup: "AB-",
    unitsNeeded: 1,
    urgency: "urgent",
    patientId: "PT-76740",
    ward: "Oncology · Day Care",
    contact: "+91 9845012300",
    state: "CANCELLED",
    donors: [],
  },
];
