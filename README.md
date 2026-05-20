# Seattle Grace Hospital — MediPortal

A role-based hospital portal web application built for the **Secure Web Technologies** university module (CST2572).

---

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML | Page structure and dashboard layout |
| CSS | Styling and design system |
| JavaScript | Auth logic, routing, interactivity |
| IndexedDB | Client-side data storage (Phase 2) |
| Web Crypto API (AES-256-GCM) | Encryption of sensitive fields (Phase 2) |

---

## Project Structure

```
Seattle-Grace-Hospital-MediPortal/
├── index.html          ← Single-page app shell (all dashboards live here)
├── css/
│   └── styles.css      ← Global design system (owned by Ayush)
├── js/
│   ├── dummy-data.js   ← Hardcoded mock data for Phase 1 (owned by Tiana)
│   ├── auth.js         ← Login, session management, role routing (owned by Ayush)
│   ├── validate.js     ← Form validation and input sanitisation (owned by Tiana)
│   └── admin.js        ← Admin dashboard logic (owned by Ayush)
└── README.md
```

---

## Developers

| Developer | Branch | Responsibilities |
|---|---|---|
| Ayush | `Ayush` | `styles.css`, `auth.js`, `admin.js`, Login page HTML, Admin / Nurse / Receptionist dashboards |
| Tiana | `Tiana` | `dummy-data.js`, `validate.js`, Patient / Doctor / Guardian dashboards |

---

## Roles & Credentials (Phase 1 — Hardcoded)

All credentials are defined in `js/dummy-data.js`. The role is determined automatically from the username and password — no manual role selection needed.

| Username | Password | Role |
|---|---|---|
| `ayush.admin` | `Admin123` | Admin |
| `dr.carter` | `Doctor123` | Doctor |
| `nurse.jane` | `Nurse123` | Nurse |
| `reception1` | `Recep123` | Receptionist |
| `p.sarah` | `Patient123` | Patient |
| `guardian1` | `Guard123` | Guardian |

---

## How It Works — Login Flow

1. Page loads → `auth.js` checks `sessionStorage` for an existing session
2. If a session exists → user is routed directly to their dashboard (no login needed after refresh)
3. If no session → login page is shown
4. User enters credentials → `auth.js` searches the `USERS` array in `dummy-data.js`
5. Match found → session saved to `sessionStorage`, correct dashboard and sidebar nav revealed
6. Match not found → error message shown, password field cleared, focus returned to password input
7. Logout → session cleared from `sessionStorage`, login page forced

---

## Single-Page Architecture

All dashboards live as hidden `<div>` blocks inside one `index.html`. Role switching shows and hides the correct block — no page reloads.

```
index.html
├── #sidebar                  ← Shared across all roles, hidden on login
│   ├── #nav-admin            ← Shown only for admin role
│   ├── #nav-nurse            ← Shown only for nurse role
│   ├── #nav-receptionist     ← Shown only for receptionist role
│   ├── #nav-doctor           ← Shown only for doctor role
│   ├── #nav-patient          ← Shown only for patient role
│   └── #nav-guardian         ← Shown only for guardian role
│
├── #dashboard-login          ← Ayush
├── #dashboard-admin          ← Ayush
├── #dashboard-nurse          ← Ayush
├── #dashboard-receptionist   ← Ayush
├── #dashboard-patient        ← Tiana
├── #dashboard-doctor         ← Tiana
└── #dashboard-guardian       ← Tiana
```

---

## CSS Naming Convention

Classes use a single underscore separator (e.g. `sidebar_item`, `login_card`).

| Prefix | Used for |
|---|---|
| `sidebar_` | Sidebar and nav components |
| `login_` | Login page components |
| `dashboard_` | Dashboard layout wrappers |
| `stat_card` | Stat summary cards |
| `data_table` | Patient/appointment tables |
| `badge_` | Status pills (confirmed, pending, cancelled) |
| `btn_` | Buttons |

---

## Collaboration Rules (GitHub)

- Neither developer pushes directly to `main`
- Ayush works on branch `Ayush`, Tiana works on branch `Tiana`
- Daily workflow:
  ```
  git add .
  git commit -m "describe what you did"
  git push origin Ayush   # or Tiana
  ```
- When a section is complete, open a Pull Request on GitHub to merge into `main`
- **Ayush never edits:** `dummy-data.js`, `validate.js`, or Tiana's dashboard divs
- **Tiana never edits:** `styles.css`, `auth.js`, or Ayush's dashboard divs
- `dummy-data.js` must be kept up to date — `auth.js` depends on the `USERS` array

---

## Data (Phase 1 — Hardcoded)

- Awaiting Tiana's input for her dummy data.

---

## Phase 2 — Planned (Post Front-End Submission)

- Replace all hardcoded arrays with IndexedDB reads/writes
- Fetch seed data from the four server endpoints:
  - `https://simulacra.uk/CST2572/doctor.json`
  - `https://simulacra.uk/CST2572/people.json`
  - `https://simulacra.uk/CST2572/admin.json`
  - `https://simulacra.uk/CST2572/medicine.json`
- Implement AES-256-GCM encryption via the Web Crypto API (`crypto.subtle`) for:
  - Passwords (never stored in plaintext)
  - Patient NHS numbers
  - Medical notes
- Add service worker for full offline capability
- Implement Tiana's login rate-limit / lockout logic

---

## Running the Project

1. Clone the repository:
   ```
   git clone https://github.com/dwifh/Seattle-Grace-Hospital-MediPortal.git
   ```
2. Open the project folder in VS Code
3. Install the **Live Server** extension if not already installed
4. Right-click `index.html` → **Open with Live Server**
5. The app opens at `http://127.0.0.1:5500`

> **Note:** The app must be opened via Live Server or another local server. Opening `index.html` directly as a file (`file://`) will block the JavaScript modules from loading.

---

## Known Issues / Placeholders

| Item | Status | Owner |
|---|---|---|
| Login rate-limit / lockout after failed attempts | Placeholder in `auth.js` | Tiana |
| Form input validation (`validate.js`) | Empty — coming Phase 2 | Tiana |
| Admin dashboard content | HTML structure pending | Ayush |
| Nurse / Receptionist dashboard content | HTML structure pending | Ayush |
| Patient / Doctor / Guardian dashboard content | HTML structure pending | Tiana |
| IndexedDB wiring | Phase 2 | Both |
| AES-256 encryption module | Phase 2 | Ayush |

---

## References

- [Web Crypto API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [IndexedDB API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Workers — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [DM Sans Font — Google Fonts](https://fonts.google.com/specimen/DM+Sans)