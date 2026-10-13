# EcoCycle Melbourne — FIT5032 A3 (Advanced Web Application)

Vue 3 + Vite + Bootstrap front end, Firebase (Auth, Firestore, Cloud Functions, Hosting), SendGrid email and Mapbox maps.
Extends the A1.2 / A1.3 EcoCycle Melbourne project.

## Business requirements → where to find them

| BR | Feature | Code |
|----|---------|------|
| D.1 External authentication | Firebase Auth: email/password (+ verification email, password reset) and **Google sign-in**; role-based route guards; roles are custom claims set by a Cloud Function | `src/stores/auth.js`, `src/router/index.js`, `src/components/LoginForm.vue`, `RegisterForm.vue`, `functions/index.js` (`initUser`) |
| D.2 Email | SendGrid via Cloud Function `sendEmail`: compose, single / selected / bulk recipients, **attachments**, send log; automatic registration confirmation with `.ics` attachment | `src/components/EmailComposer.vue`, `functions/index.js` |
| D.3 Interactive tables | `DataTable`: sort, global search, **per-column search**, **10 rows/page** pagination. Used for 5 tables (Registrations, Events, Users, Email log, My registrations) | `src/components/DataTable.vue` |
| D.4 Cloud deployment | Firebase Hosting (SPA rewrite, security headers, immutable asset caching) | `firebase.json`, section "Deploy" below |
| E.1 Cloud Functions | 4 callables + 2 Firestore triggers (see below) | `functions/index.js` |
| E.2 Geo-location | Mapbox GL map: event markers, **place search** (Geocoding API), **nearest events** from browser geolocation, **turn-by-turn directions** with distance/time (Directions API) | `src/components/EventMap.vue`, `src/services/mapbox.js` |
| E.3 Accessibility | WCAG 2.1 AA work: skip link, landmarks, labelled forms, `aria-invalid`/`aria-describedby`, live regions, `aria-sort`, ARIA tabs with arrow-key support, focus management on route change, text alternatives for map and charts, contrast, reduced motion | whole app, `src/assets/main.css`, `/accessibility` page |
| E.4 Export | CSV (UTF-8 BOM, formula-injection safe) and PDF (jsPDF + autoTable) of any table's filtered rows; `.ics` calendar export | `src/services/export.js`, `DataTable.vue` |
| F.1 Innovation | 1) Bulk email, 2) Analytics dashboard (Chart.js, server-side aggregation), 3) Add-to-calendar `.ics` + confirmation invite, 4) Eco-points, badges & leaderboard | see below |

### Cloud Functions (`functions/index.js`)
| Function | Type | Purpose |
|----------|------|---------|
| `initUser` | callable | Creates the user profile, sets the `role` custom claim (admins bootstrapped by verified email in `ADMIN_EMAILS`) |
| `setUserRole` | callable (admin) | Promote / demote users, revokes refresh tokens |
| `sendEmail` | callable (admin) | Validates recipients/attachments and sends through SendGrid; writes an audit log |
| `getAnalytics` | callable (admin) | Aggregates events / registrations / ratings for the dashboard |
| `onRegistrationCreated` | Firestore trigger | Sends confirmation email with `.ics`, awards +10 eco points |
| `onRatingWritten` | Firestore trigger | Recomputes event rating average, awards +2 eco points |

## Local setup

```bash
npm install
cp .env.example .env.local        # fill in Firebase + Mapbox values
npm run dev
```

### 1. Firebase project
1. Create a project at <https://console.firebase.google.com> (Blaze plan is required for Cloud Functions; the free allowance is ample).
2. **Authentication → Sign-in method**: enable **Email/Password** and **Google**. Add your deployed domain under *Settings → Authorized domains*.
3. **Firestore Database**: create in **australia-southeast1** (must match the function region).
4. **Project settings → Your apps → Web app**: copy the config into `.env.local`.
5. `npm i -g firebase-tools && firebase login && firebase use <project-id>` (or edit `.firebaserc`).

### 2. SendGrid (D.2)
1. Create a SendGrid account, verify a **Single Sender** address, create an API key with *Mail Send* permission.
2. `cd functions && cp .env.example .env` and set `SENDGRID_FROM` (the verified sender) and `ADMIN_EMAILS` (your email).
3. `firebase functions:secrets:set SENDGRID_API_KEY` and paste the key.

### 3. Mapbox (E.2)
Create a public token at <https://account.mapbox.com>, put it in `VITE_MAPBOX_TOKEN`, and (recommended) restrict it to your deployed URL.

### 4. Deploy (D.4)
```bash
cd functions && npm install && cd ..
npm run build
firebase deploy            # hosting + functions + firestore rules
```
The site is served at `https://<project-id>.web.app`. (Cloudflare Pages also works for the front end: build command `npm run build`, output `dist`, set the `VITE_*` variables, and add the domain to Firebase authorized domains.)

### 5. First run
1. Sign in with Google (or register + verify email) using an address listed in `ADMIN_EMAILS` → you become **admin**.
2. Admin → Events → **Load sample events**.
3. Register a second (volunteer) account, register for an event → confirmation email + eco points.

### Emulators (optional)
`VITE_USE_EMULATORS=true`, then `firebase emulators:start`. Emails need a real SendGrid key even in the emulator.

## Security notes
- Firestore rules (`firestore.rules`) enforce ownership, admin-only writes and field validation; profile/role/points/rating aggregates are writable only by Cloud Functions.
- Roles are **custom claims**, never trusted from the client; every admin function re-checks the claim.
- All user text is sanitised on input and HTML-escaped in emails; CSV export neutralises spreadsheet formulas; attachments are size/type limited.
- No secrets in the repo: `.env*` is git-ignored; SendGrid key lives in Secret Manager.

## Project structure
```
src/components  DataTable, EventMap, EmailComposer, AnalyticsCharts, forms, cards
src/views       Home, Events, Map, Join, Impact, Admin, Login, Register, …
src/services    api (callables), db (Firestore), export (CSV/PDF/ICS), mapbox
src/stores      auth (Firebase Auth state, roles)
functions/      Cloud Functions (Node 22)
```
