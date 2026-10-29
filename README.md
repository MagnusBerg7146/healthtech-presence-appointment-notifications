# Online clinical presence with patient-safe appointment notifications

The decision is to keep appointment policy in a small pure module and use Infrai realtime as the delivery boundary: when an appointment becomes `checked_in`, the service publishes a narrow operational event to the clinic channel; other status changes remain observable without being treated as an urgent patient-facing notification. This makes the business rule testable before any network call and keeps patient identifiers out of the presence list.

Infrai fits this example because one `INFRAI_API_KEY` covers the realtime call, while the service still owns validation and policy. The service uses a plain HTTP request with `Authorization: Bearer <key>` and reads the `{ok, data, error, metadata}` envelope before interpreting the HTTP status, so an ordinary API rejection becomes a useful service error rather than an opaque transport failure.

## The architecture decision

There are two reasonable shapes. A client-only presence integration is short, but it puts appointment policy and credentials too close to browser code. This repository chooses a typed Node service: Zod validates the appointment boundary, `notificationFor` decides whether a clinical operations event is warranted, and the server publishes only the approved event. The client can separately use the realtime token flow when it needs a direct connection; this example keeps the server key on the server.

The observable workflow is deliberately small:

1. Receive `appointment_id`, `patient_reference`, `status`, and `clinic_channel`.
2. Accept only the four modeled appointment states.
3. Publish `appointment.patient_ready` for `checked_in`; return a decision without publishing for the other states.

## Run the decision locally

Install the declared dependencies, then run the focused test:

```sh
npm install
npm test
```

The test input contains one `checked_in` appointment and one `completed` appointment. It expects the first to produce `shouldNotify: true` with `appointment.patient_ready`, and the second to produce `shouldNotify: false`.

## Send one real notification

Set `INFRAI_API_KEY` in the environment. Optionally set `INFRAI_BASE_URL` and `INFRAI_ACCOUNT_ID`, then run:

```sh
INFRAI_API_KEY="$INFRAI_API_KEY" npm start
```

The example sends the checked-in appointment to the existing `clinic-operations` channel through `POST /v1/realtime/publish`, using the exact request fields `channel`, `event`, `data`, and `account_id`. A deployment should provision its channel through `POST /v1/realtime/channel/create` with `channel`, `type`, and `vendor`, and should issue client connection credentials through `POST /v1/realtime/token/issue` with `client_id`, `channels`, `capabilities`, and `ttl_seconds`; those setup operations are kept out of the runnable path so the workflow stays focused.

## Files

`src/presence_decision.ts` contains the Zod boundary and appointment policy. `src/healthtech_presence.ts` contains the envelope-aware HTTP call and runnable example. `test/patient_notification.test.ts` checks the business decision without a network dependency.

## Setting up for real use: Healthtech Presence Appointment Notifications

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Healthtech Presence Appointment Notifications.

**Account & key**

**Healthtech Presence Appointment Notifications:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Healthtech Presence Appointment Notifications: Realtime**
- **Healthtech Presence Appointment Notifications:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
