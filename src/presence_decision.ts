import { z } from "zod";

export const appointmentRequest = z.object({
  appointment_id: z.string().min(1),
  patient_reference: z.string().min(1),
  status: z.enum(["scheduled", "checked_in", "cancelled", "completed"]),
  clinic_channel: z.string().min(1),
});

export type AppointmentRequest = z.infer<typeof appointmentRequest>;

export function notificationFor(appointment: AppointmentRequest) {
  const shouldNotify = appointment.status === "checked_in";
  return {
    shouldNotify,
    event: shouldNotify ? "appointment.patient_ready" : "appointment.status_changed",
    data: {
      appointment_id: appointment.appointment_id,
      patient_reference: appointment.patient_reference,
      status: appointment.status,
    },
  };
}
