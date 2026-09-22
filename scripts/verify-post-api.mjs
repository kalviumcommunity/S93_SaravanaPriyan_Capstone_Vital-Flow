const baseUrl = process.env.API_URL ?? "http://localhost:3000";

async function readResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const patientId = `PT-POST-${Date.now()}`;
const payload = {
  patientId,
  bloodGroup: "O+",
  ward: "General Ward",
  contact: "9876543210",
  notes: "POST API verification record",
};

console.log(`Testing POST ${baseUrl}/api/patients`);

const response = await fetch(`${baseUrl}/api/patients`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const body = await readResponse(response);

if (response.status !== 201) {
  throw new Error(
    `POST /api/patients failed with ${response.status}: ${JSON.stringify(body)}`,
  );
}

if (body?.patient?.patientId !== patientId) {
  throw new Error("POST /api/patients did not return the created patient.");
}

console.log(`PASS: POST /api/patients created ${patientId}.`);

console.log(`Cleaning up ${patientId}`);
const deleteResponse = await fetch(
  `${baseUrl}/api/patients/${encodeURIComponent(patientId)}`,
  { method: "DELETE" },
);

if (!deleteResponse.ok) {
  console.warn(
    `WARNING: Created patient ${patientId}, but cleanup returned ${deleteResponse.status}.`,
  );
} else {
  console.log(`PASS: Cleanup deleted ${patientId}.`);
}

console.log("POST API verification completed successfully.");
