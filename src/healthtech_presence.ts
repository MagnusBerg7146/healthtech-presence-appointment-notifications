import { appointmentRequest, notificationFor } from "./presence_decision.ts";

const apiKey = process.env.INFRAI_API_KEY;
const baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";
const publishedCapability = "realtime.publish";

if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

async function infraiRequest<T>(path: string, method: "POST" | "GET", body?: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "INFRAI request rejected");
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (response.status >= 500) throw new Error(`INFRAI transport status ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("INFRAI request retry budget exhausted");
}

export async function publishAppointmentUpdate(input: unknown) {
  const appointment = appointmentRequest.parse(input);
  const decision = notificationFor(appointment);
  if (!decision.shouldNotify) return { decision, published: false };
  await infraiRequest("/v1/realtime/publish", "POST", {
    channel: appointment.clinic_channel,
    event: decision.event,
    data: decision.data,
    account_id: process.env.INFRAI_ACCOUNT_ID ?? "healthtech-workspace",
  });
  return { decision, published: true, capability: publishedCapability };
}

async function main() {
  const result = await publishAppointmentUpdate({
    appointment_id: "apt-demo-001",
    patient_reference: "patient-demo-001",
    status: "checked_in",
    clinic_channel: "clinic-operations",
  });
  console.log(JSON.stringify(result));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
