const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const patientId = `PT-DB-TEST-${Date.now()}`;

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `${options?.method ?? "GET"} ${path} failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }

  return body;
}

try {
  console.log(`Testing database write for ${patientId}...`);

  const created = await request("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId,
      bloodGroup: "O-",
      ward: "Database Test Ward",
      contact: "+91 9000000000",
      notes: "Database read/write verification",
    }),
  });

  console.log("WRITE OK:", created.patient.patientId);

  console.log(`Testing database read for ${patientId}...`);

  const read = await request(`/api/patients/${encodeURIComponent(patientId)}`, {
    method: "GET",
  });

  console.log("READ OK:", read.patient.patientId);

  console.log(`Cleaning up test patient ${patientId}...`);

  await request(`/api/patients/${encodeURIComponent(patientId)}`, {
    method: "DELETE",
  });

  console.log("CLEANUP OK");
  console.log("Database read/write verification passed.");
} catch (error) {
  console.error("Database read/write verification failed:", error.message);
  process.exitCode = 1;
}
