import assert from "node:assert/strict";
import { appointmentRequest, notificationFor } from "../src/presence_decision.ts";

const checkedIn = appointmentRequest.parse({
  appointment_id: "apt-1",
  patient_reference: "patient-1",
  status: "checked_in",
  clinic_channel: "clinic-operations",
});
assert.deepEqual(notificationFor(checkedIn), {
  shouldNotify: true,
  event: "appointment.patient_ready",
  data: { appointment_id: "apt-1", patient_reference: "patient-1", status: "checked_in" },
});

const completed = appointmentRequest.parse({
  appointment_id: "apt-2",
  patient_reference: "patient-2",
  status: "completed",
  clinic_channel: "clinic-operations",
});
assert.equal(notificationFor(completed).shouldNotify, false);
console.log("patient notification decision: ok");
