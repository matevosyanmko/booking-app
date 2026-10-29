# Meeting Room Booking

A web app for booking one meeting room during the working day (09:00–18:00). You pick a date, see that day's bookings, and create, edit or delete a booking. Every business rule is checked live in the form **and** again on the mock server.

Frontend Engineer take-home task.

**Tech stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · date-fns · Vitest

---

## Deliverables

| Deliverable | Where |
| --- | --- |
| Repository | This repository |
| README: how to run, what is done, time spent | This file |
| Live demo | https://rome-metting.netlify.app/ |
| AI chat transcript | [`docs/ai-chat-history.pdf`](docs/ai-chat-history.pdf) |

> The demo runs on Netlify serverless functions with an in-memory store, so bookings can reset after a while.

---

## How to run

Requires **Node.js 18.18+** (20+ recommended). No environment variables, database or external services are needed.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the unit tests (Vitest) |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` / `npm start` | Production build / run it |

`npm test`, `npm run typecheck` and `npm run build` all pass.

The schedule starts empty. Bookings live in server memory, so restarting the server clears them.

---

## What is done

### Core features

- **Pick a date:** mini month calendar, ‹ / › buttons, **Today** button and a native date picker.
- **See the day's bookings:** a 09:00–18:00 timeline plus a list of the day's meetings with a count.
- **Create:** **New meeting** or **+ Add meeting** opens the booking form.
- **Edit:** click a booking on the timeline, or **Edit** in the list.
- **Delete:** **Delete** in the list, then confirm in the dialog.

### Business rules

Each rule is enforced twice: the form prevents or flags it, and the server rejects it. The logic lives in one shared file, [`src/domain/booking/rules.ts`](src/domain/booking/rules.ts).

| # | Rule | In the form | On the server |
| --- | --- | --- | --- |
| 1 | Within the working day (09:00–18:00) | Start times run 09:00–17:30; end times never go past 18:00 | `422 OUT_OF_WORKDAY` |
| 2 | start < end | End time options always come after the start | `422 END_BEFORE_START` |
| 3 | Minimum 30 minutes | Shortest end time option is start + 30 min | `422 TOO_SHORT` |
| 4 | Maximum 2 hours | Longest end time option is start + 2 h | `422 TOO_LONG` |
| 5 | No overlaps; touching is fine (10:00–11:00 + 11:00–12:00) | Live message "This time overlaps with another booking." | `409 Conflict` with the conflicting bookings |
| 6 | No past time | Today: passed start times are disabled. Past dates: read-only, no new bookings | `422 PAST` |
| 7 | Editing doesn't conflict with itself | The booking being edited is excluded from the overlap check | Same exclusion on `PATCH` |
| 8 | Server may report a conflict the UI didn't see | See [409 handling](#409-handling) | `409 Conflict` |

Also validated: title length (max 100 characters) and well-formed date and time values. Impossible dates such as `2026-02-30` are rejected.

### 409 handling

The server can reject a booking with **409 Conflict** even when the slot looked free, for example because someone else just booked it. The form then:

1. stays open and keeps everything the user entered,
2. shows an inline message: "This time was just taken by another booking. Please choose a different time.",
3. reloads the day's bookings,
4. re-runs its live validation against the fresh list, so the overlap is shown on the field,
5. re-enables the submit button.

The message stays inline rather than in a toast, so the user doesn't lose context.

**How to trigger it:**
- Put `!conflict` anywhere in the title. The server then returns 409 even for a free slot (demo switch).
- Or open the app in two browser tabs on the same day and book the same free slot in both.

### UI states

| State | What the user sees |
| --- | --- |
| Loading | Spinner with "Loading schedule…" (`aria-busy`) |
| Empty | "Your day is clear" with "No meetings booked for this date." |
| Error | Alert "Could not load this schedule." with a **Retry** button |
| Submitting | Button shows "Saving…"; Save, Cancel and Close are disabled |
| Deleting | Dialog button shows "Deleting…"; dialog can't be dismissed |
| Success | Toast "Meeting added successfully." / "Meeting updated successfully."; status message "Booking deleted." |
| Past date | Heading says "Past date · read-only"; New meeting is disabled and **+ Add meeting** is hidden |
| Past booking | Dimmed, marked "· Past", no Edit or Delete |

### Server errors

The API client turns HTTP statuses into typed errors, and the UI handles each one:

| Status | Error class | UI behaviour |
| --- | --- | --- |
| 409 | `ConflictError` | The 409 flow above |
| 422 / 400 | `ValidationError` | Server error codes shown as readable messages in the form |
| 404 | `NotFoundError` | "Booking not found" shown (and the list reloads after a delete) |
| Network failure | `ApiError` | "Network error. Check your connection and try again." |

Out-of-date responses are ignored: if you switch days quickly, the list never shows the wrong day.

### API layer separated from the UI

- [`src/api/bookingsClient.ts`](src/api/bookingsClient.ts) is the **only** file that calls `fetch`. To use a real backend, change `BASE` in that file.
- The mock server ([`src/server`](src/server) and [`src/app/api/bookings`](src/app/api/bookings)) can be removed without touching the UI.

### Responsiveness and accessibility

- The layout stacks at 850px and again at 600px, so it works on mobile.
- Every form field has a real `<label>`; the time selects use `aria-invalid` and `aria-describedby` to point at the error messages.
- Status and error messages are announced through `aria-live` regions and `role="alert"`.
- Visible focus rings (`:focus-visible`), and `aria-label` on icon-only buttons.
- Delete confirmation uses the native `<dialog>`: focus stays inside it and Esc closes it.

### Beyond the task

- **Visual day timeline**, in addition to the list.
- **Accessible confirm dialog** for delete, instead of `window.confirm`.
- An optional **User** field on bookings, alongside the title.

---

## Architecture

```
src/
├── domain/booking/          # Pure business logic: no React, no fetch
│   ├── rules.ts             # validateBooking, findConflicts, isPastSlot, isEditable
│   ├── time.ts              # date-fns helpers; dates stay "YYYY-MM-DD" strings
│   ├── types.ts             # Booking types
│   └── rules.test.ts        # Unit tests
├── api/                     # The only layer that knows about fetch
│   ├── bookingsClient.ts    # list / create / update / remove
│   └── errors.ts            # ApiError, ConflictError, ValidationError, NotFoundError
├── server/                  # Mock backend (replaceable)
│   ├── store.ts             # In-memory store, 400 ms artificial latency
│   └── service.ts           # Server-side validation, 409 / 422 responses, !conflict switch
├── app/
│   ├── page.tsx, layout.tsx
│   └── api/bookings/        # Route Handlers: GET, POST, PATCH, DELETE
├── features/bookings/
│   ├── BookingApp.tsx       # Day view: date controls, timeline, states
│   ├── BookingForm.tsx      # Create / edit form with live validation
│   └── useBookings.ts       # Data hook with stale-response protection
└── components/              # Header, meetings list, delete confirm dialog
```

**Why it's split this way:** `domain/` is pure and shared by the form and the mock server, so both apply exactly the same rules. `api/` is the only place that knows about HTTP, so the UI never deals with status codes directly.

Implementation notes:
- Dates stay as `YYYY-MM-DD` strings and times are compared as minutes since midnight, which avoids timezone off-by-one bugs.
- Overlap uses half-open intervals (`a.start < b.end && a.end > b.start`), so touching boundaries are allowed.
- Validation returns typed error codes (`OVERLAP`, `TOO_SHORT`, …). The UI maps them to messages.

### Mock API

Every response is delayed by 400 ms so loading states are visible.

| Method | Endpoint | Success | Errors |
| --- | --- | --- | --- |
| `GET` | `/api/bookings?date=YYYY-MM-DD` | `200` bookings for that day | `422` invalid date |
| `POST` | `/api/bookings` | `201` created booking | `409`, `422` |
| `PATCH` | `/api/bookings/:id` | `200` updated booking | `404`, `409`, `422` |
| `DELETE` | `/api/bookings/:id` | `204` | `404` |

```ts
type Booking = {
  id: string;
  date: string;   // YYYY-MM-DD
  start: string;  // HH:mm
  end: string;    // HH:mm
  title?: string;
  user?: string;  // optional extra field, not in the original contract
};
```

Error bodies: `409 { code: "CONFLICT", message, conflicts }` · `422 { code: "VALIDATION", errors }` · `404 { code: "NOT_FOUND" }`.

---

## Tests

```bash
npm test
```

12 unit tests in [`rules.test.ts`](src/domain/booking/rules.test.ts) cover:
- touching boundaries (10:00–11:00 and 11:00–12:00),
- overlap from the left, from the right, and an exact match,
- editing without conflicting with itself,
- exactly 30 minutes and exactly 2 hours, plus 15 minutes (too short) and 2 h 30 (too long),
- 08:30 start and 18:30 end (outside the working day),
- start equal to end, and start after end,
- past date, past time today, and the current time today (allowed),
- malformed input and impossible dates (`2026-02-30`),
- conflicts on other dates being ignored.

---

## Assumptions

These points weren't specified in the task, so I chose:

- **Time step:** 30 minutes.
- **Past and already-started bookings** are read-only (no edit or delete).
- **Time zone:** the user's local time, no conversion.
- **Rooms:** a single room, since the API contract has no `roomId`.
- **Title:** optional, max 100 characters. An optional **User** name was added as well.
- **Delete** asks for confirmation in a dialog.
- **No authentication:** anyone can edit or delete any booking.

---

## Time spent

Approximately 2 hours, including implementation, edge-case tests, and verification.
