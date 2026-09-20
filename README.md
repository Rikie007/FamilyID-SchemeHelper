# Gujarat Family ID

Walk-in family register and scheme desk for the Pravi **Build for Billions** prototype.

Design: [`docs/README.md`](docs/README.md) · APIs: [`docs/ICD.md`](docs/ICD.md) · Schema: [`docs/DB.md`](docs/DB.md)

## Run locally

```bash
docker compose up -d
npm install
npm run install:all
npm run seed
npm run dev
```

| Process | URL |
|---|---|
| API | http://127.0.0.1:4000 |
| Web | http://127.0.0.1:5173 |
| Mongo | `mongodb://127.0.0.1:27017/gj_family_id` |

Seed household: Family ID `GJ-F-48291753-6` (Kudasan, head Ramesh Patel). Switch the header role to Registry / Scheme Creator / Scheme Officer.

Prototype auth is headers `X-Role`, `X-Family-Id`, `X-Officer-Id`. The server still enforces every write.

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
  session/            role switcher
  layout/             Gujarat e-governance chrome
  pages/head|registry|creator|officer
  styles/gov.css
```
