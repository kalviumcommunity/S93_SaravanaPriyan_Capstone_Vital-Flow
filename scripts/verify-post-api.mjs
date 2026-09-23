const baseUrl = process.env.API_URL ?? "http://localhost:3000";
const patientId = `PT-POST-TEST-${Date.now()}`;

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body = {};

  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { response, body };
}

try {
  console.log(`Testing POST ${baseUrl}/api/patients`);

  const result = await request("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId,
      bloodGroup: "O+",
      ward: "POST API Test Ward",
      contact: "+91 9000000000",
      notes: "POST API verification",
    }),
  });

  if (result.response.status !== 201) {
    throw new Error(
      `POST /api/patients failed with ${result.response.status}: ${JSON.stringify(result.body)}`,
    );
  }

  if (result.body?.patient?.patientId !== patientId) {
    throw new Error("POST /api/patients did not return the created patient.");
  }

  console.log(`PASS: POST /api/patients created ${patientId}.`);

  const cleanup = await request(
    `/api/patients/${encodeURIComponent(patientId)}`,
    { method: "DELETE" },
  );

  if (!cleanup.response.ok) {
    console.warn(`WARNING: Test patient cleanup returned ${cleanup.response.status}.`);
  } else {
    console.log("PASS: Test patient cleaned up.");
  }

  console.log("POST API verification completed successfully.");
} catch (error) {
  console.error("POST API verification failed:", error.message);
  process.exitCode = 1;
}
