# Gujarat Family ID

Walk-in family register and scheme desk for the Pravi **Build for Billions** prototype.

Design: [`docs/README.md`](docs/README.md) · APIs: [`docs/ICD.md`](docs/ICD.md) · Schema: [`docs/DB.md`](docs/DB.md)

## Configure

Copy [`.env.example`](./.env.example) to `.env` at the repo root. The API reads `MONGO_URI` from that file.

```
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/GovernmentSchemeManagement
MONGO_DB_NAME=GovernmentSchemeManagement
```

Atlas: Network Access must allow this machine (or `0.0.0.0/0` for a public demo). Database User must match the URI.

Local Docker Mongo is optional. If `MONGO_URI` is unset, the API falls back to `mongodb://127.0.0.1:27017/gj_family_id`.

`SEED_RESET=true` is required before `npm run seed`. That **wipes** the named database, then loads the demo families and schemes. Turn it back to `false` after the first load so you do not wipe Atlas by accident.

For a deployed web app, set `VITE_API_URL` to the public API origin when you build the client (leave empty for local Vite, which proxies to port 4000).

## Run locally

```bash
npm install
npm run install:all
npm run seed
npm run dev
```

| Process | URL |
|---|---|
| API | http://127.0.0.1:4000 |
| Web | http://127.0.0.1:5173 |

Seed household: Family ID `GJ-F-48291753` (Kudasan, head Ramesh Patel).

Log in at the web app with a stakeholder account. The server still enforces writes via `X-Role` / `X-Family-Id` / `X-Officer-Id`.

| Family ID / Username | Password | Dashboard |
|---|---|---|
| `GJ-F-48291753` | `Head@123` | Family Head |
| `registry.officer` | `Reg@123` | Registry Officer |
| `scheme.creator` | `Cre@123` | Scheme Creator |
| `scheme.officer` | `Off@123` | Scheme Manager (all schemes) |
| `so.food-fam-0001` | `Off@1001` | Ration (PDS) officer |
| `so.edu-mem-0001` | `Off@1002` | School Scholarship officer |
| `so.pen-mem-0001` | `Off@1003` | Old-age Pension officer |
| `so.wid-mem-0001` | `Off@1004` | Widow Pension officer |

Announcing a new scheme issues a fresh desk login. That username/password is shown to the creator and appended on the login page. A scheme officer only sees applications for that scheme. `scheme.officer` remains the manager who can see every scheme.

## Layout

```
server/src/
  app.js              Express app
  index.js            HTTP listener
  config.js
  http.js             HttpError + error handler
  db/connect.js
  models/             one collection per file
  domain/             relation + eligibility
  services/           register / schemes / applications
  controllers/        HTTP mapping
  routes/             ICD paths
  middleware/
  seed/run.js         Patel family + four schemes
client/src/
  api/                fetch client (sends role headers)
  session/            login session
  pages/LoginPage.jsx + head|registry|creator|officer
  layout/             Gujarat e-governance chrome
  pages/head|registry|creator|officer
  styles/gov.css
```
