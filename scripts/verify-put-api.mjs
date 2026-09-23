const baseUrl = process.env.API_URL ?? "http://localhost:3000";

async function readResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const patientId = process.env.PATIENT_ID ?? `PT-PUT-${Date.now()}`;
const createPayload = {
  patientId,
  bloodGroup: "O+",
  ward: "General Ward",
  contact: "9876543210",
  notes: "PUT API verification record",
};

const updatePayload = {
  bloodGroup: "A+",
  ward: "Emergency Ward",
  contact: "9123456780",
  notes: "Updated by PUT API verification",
};

async function request(url, options) {
  const response = await fetch(url, options);
  const body = await readResponse(response);
  return { response, body };
}

console.log(`Testing PUT ${baseUrl}/api/patients/${patientId}`);

let createdByScript = false;
const existing = await request(`${baseUrl}/api/patients/${encodeURIComponent(patientId)}`, { method: "GET" });

if (existing.response.status === 404) {
  const created = await request(`${baseUrl}/api/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPayload),
  });

  if (created.response.status !== 201) {
    throw new Error(`Could not create verification patient: ${created.response.status}: ${JSON.stringify(created.body)}`);
  }
  createdByScript = true;
} else if (!existing.response.ok) {
  throw new Error(`Could not check patient ${patientId}: ${existing.response.status}: ${JSON.stringify(existing.body)}`);
}

const updated = await request(`${baseUrl}/api/patients/${encodeURIComponent(patientId)}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(updatePayload),
});

if (updated.response.status !== 200) {
  throw new Error(`PUT /api/patients/:patientId failed with ${updated.response.status}: ${JSON.stringify(updated.body)}`);
}

if (updated.body?.patient?.bloodGroup !== updatePayload.bloodGroup || updated.body?.patient?.ward !== updatePayload.ward) {
  throw new Error("PUT /api/patients/:patientId did not return the updated patient data.");
}

console.log(`PASS: PUT /api/patients/${patientId} updated the patient.`);

if (createdByScript) {
  const deleted = await request(`${baseUrl}/api/patients/${encodeURIComponent(patientId)}`, { method: "DELETE" });
  if (!deleted.response.ok) {
    console.warn(`WARNING: Verification patient ${patientId} could not be cleaned up (${deleted.response.status}).`);
  } else {
    console.log(`PASS: Cleanup deleted ${patientId}.`);
  }
}

console.log("PUT API verification completed successfully.");
