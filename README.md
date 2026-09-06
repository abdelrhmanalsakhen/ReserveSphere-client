# ReserveSphere - Client

Front-end for **ReserveSphere**, a meeting, training and conference room reservation
system for the Ministry of Transport and its affiliated authorities.

Built with **React 19**, **Vite**, **Redux Toolkit** (with RTK Query) and **Bootstrap 5**.
The API it talks to lives in [`ReserveSphere-server`](../ReserveSphere-server).

---

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Build tool | Vite 7 | Native ES modules in dev, Rollup build for production |
| UI library | React 19 | Component model, hooks |
| State | Redux Toolkit | One store for the session; RTK Query owns all server state |
| Data fetching | RTK Query | Caching, request de-duplication and tag-based invalidation |
| Styling | Bootstrap 5 + React-Bootstrap | Responsive grid and accessible components out of the box |
| Routing | React Router 7 | Nested routes and route-level role guards |
| Icons | Bootstrap Icons | Matches the Bootstrap visual language |

---

## Getting started

The API must be running first (see the server README).

```bash
npm install
cp .env.example .env     # VITE_API_URL, defaults to http://localhost:4000/api
npm run dev              # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot module replacement |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Serve the production bundle locally |

Sign in with any seeded account - the login screen lists three of them, and the password
for all seeded accounts is `Password123!`.

---

## Why React rather than plain HTML, CSS and JavaScript

This application is a good illustration of the difference:

- **Declarative rendering.** The room list, the approval queue and the notification badge
  are functions of state. With hand-written DOM code every one of those would need its own
  imperative update path, and each path is a place for the screen to drift out of sync with
  the data.
- **Components instead of copies.** `StatusBadge`, `RoomCard` markup and the shell in
  `Layout` are written once and reused on every screen. In a multi-page static site the
  same header and sidebar are copied into each page and must then be changed in each page.
- **Client-side routing.** Moving between the dashboard and the approval queue re-renders
  one region instead of reloading the document, so the session, the cached room list and
  scroll position survive the navigation.
- **State management that scales.** RTK Query keeps one cache of server data for the whole
  app: approving a request invalidates the `Reservation` and `Stats` tags, and every screen
  showing that data refreshes itself. The equivalent by hand is manual bookkeeping in each
  event handler.
- **Ecosystem.** Form controls, modals, offcanvas navigation and route guards come from
  maintained libraries rather than bespoke code.

The trade-off is a build step and a JavaScript bundle, which is the right trade for an
authenticated internal application and the wrong one for a static brochure page.

---

## Project layout

```
src/main.jsx              Entry point: Redux Provider, Router, Bootstrap CSS
src/App.jsx               Route table, including role-guarded branches
src/index.css             Design tokens and the application shell styling
src/app/store.js          Redux store
src/app/api.js            RTK Query API slice - every server call is defined here
src/features/authSlice.js Session state (token + user), persisted to localStorage
src/lib/format.js         Date, status and error formatting helpers
src/components/           Layout, RequireAuth, NotificationBell, StatusBadge, Feedback
src/pages/                One component per screen
```

### Architecture notes

**Separation of concerns.** Pages render and collect input; every HTTP concern lives in
`src/app/api.js`; formatting lives in `src/lib/format.js`. No component builds a URL or a
date string itself.

**One source of truth for server data.** Components never copy server data into local
state. Local `useState` is only used for form drafts and open/closed UI state.

**DRY.** Shared behaviour is a component (`StatusBadge`, `Loading`, `ErrorAlert`,
`EmptyState`) or a helper (`apiErrorMessage`, `formatSlot`), used by every screen that
needs it.

**Error handling.** `apiErrorMessage` normalises validation errors, business-rule errors
and network failures into one sentence, which `ErrorAlert` renders. A `401` anywhere drops
the session through a single wrapper around `fetchBaseQuery`, so an expired token cannot
leave the UI retrying forever.

**Consistent naming.** Components and files are `PascalCase`, hooks and helpers
`camelCase`, RTK Query hooks keep their generated `use<Endpoint>Query`/`Mutation` names.

---

## Screens

| Route | Who can open it | What it does |
| --- | --- | --- |
| `/login`, `/register` | Everyone | Sign in or create an employee account |
| `/` | Signed in | Role-aware dashboard: availability, upcoming bookings, pending counts, today's schedule |
| `/rooms` | Signed in | Room search with a time window, capacity, floor and amenity filters, and live availability badges |
| `/reserve/:roomId` | Signed in | Booking form: title, window, expected attendees, priority, invitees, purpose. `?edit=<id>` modifies an existing request |
| `/my-reservations` | Signed in | Personal ledger tabbed by upcoming / pending / past / closed, with modify, cancel and calendar download |
| `/approvals` | Room admin, owner | Approve, reject with a note, or run an emergency override |
| `/reports` | Room admin, owner | Utilisation by room, outcome breakdown, busiest hours |
| `/manage/rooms` | Owner | Room CRUD, admin assignment, take a room out of service |
| `/manage/users` | Owner | Staff directory and role changes |

Guards are declared in the route table, so an employee who types `/approvals` is redirected
to the dashboard. The API enforces the same rules independently - the client guard is for
usability, not security.

---

## Responsiveness

Bootstrap's grid does the work, with three deliberate breakpoints:

- **Mobile.** The sidebar collapses into an offcanvas drawer behind a menu button, room
  cards stack in one column, and every table scrolls horizontally inside its own container.
- **Tablet.** Two-column room grid; filters wrap onto several rows.
- **Desktop (`lg` and up).** The sidebar becomes a sticky column and the dashboard splits
  into a room list and a schedule panel.

Native inputs (`type="date"`, `type="time"`, `type="email"`) are used throughout, so mobile
browsers show their own pickers and keyboards instead of a JavaScript widget.

---

## Notes and limitations

- **Authentication** uses a bearer token in `localStorage`, attached by RTK Query's
  `prepareHeaders`. That is exposed to XSS in principle; a production deployment behind the
  Ministry's gateway should move to an `httpOnly` cookie.
- **Notifications** are polled once a minute rather than pushed over a socket.
- The interface is **English only**. The requirement for an Arabic interface would be met by
  routing the existing strings through a translation lookup and setting `dir="rtl"`.

---

## Deployment

`npm run build` produces a static `dist/` directory that any static host or CDN can serve.

1. Set `VITE_API_URL` to the deployed API before building - Vite inlines it at build time,
   so it cannot be changed afterwards without rebuilding.
2. Configure the host to rewrite unknown paths to `/index.html`, otherwise a refresh on a
   client-side route returns 404.
3. Add the deployed origin to the API's `CLIENT_ORIGIN` allowlist.
4. Serve over HTTPS so the bearer token is never sent in clear.
