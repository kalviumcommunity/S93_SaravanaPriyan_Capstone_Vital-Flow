const baseUrl = process.env.API_URL ?? "http://localhost:3000";
const patientId = process.env.PATIENT_ID;

async function getJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { response, body };
}

console.log(`Testing GET ${baseUrl}/api/patients`);
const listResult = await getJson(`${baseUrl}/api/patients`);
if (!listResult.response.ok) {
  throw new Error(`GET /api/patients failed with ${listResult.response.status}: ${JSON.stringify(listResult.body)}`);
}

if (!listResult.body || !Array.isArray(listResult.body.patients)) {
  throw new Error("GET /api/patients did not return a patients array.");
}

console.log(`PASS: GET /api/patients returned ${listResult.body.patients.length} patient(s).`);

if (patientId) {
  console.log(`Testing GET ${baseUrl}/api/patients/${patientId}`);
  const patientResult = await getJson(`${baseUrl}/api/patients/${encodeURIComponent(patientId)}`);

  if (!patientResult.response.ok) {
    throw new Error(`GET /api/patients/${patientId} failed with ${patientResult.response.status}: ${JSON.stringify(patientResult.body)}`);
  }

  if (!patientResult.body?.patient?.patientId) {
    throw new Error("GET patient by ID did not return a patient record.");
  }

  console.log(`PASS: GET /api/patients/${patientId} returned the patient record.`);
} else {
  console.log("SKIP: Set PATIENT_ID to also verify GET /api/patients/:patientId.");
}

console.log("GET API verification completed successfully.");
