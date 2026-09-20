# Tech stack (locked)

| | |
|---|---|
| **Document** | Technology Decision Record |
| **ID** | TDR-GJ-FAM-001 |
| **Version** | 0.1 |
| **Date** | 20 September 2026 |

No application code until [database design](./DB.md) is accepted.

---

## Decisions

| Layer | Choice | Why |
|---|---|---|
| Backend | **Node.js + Express** | Same as Aurora; you can defend routes, middleware, write locks. |
| Database | **MongoDB 7** in **Docker** (local volume) | Fast for the hackathon; documents match families/schemes; Docker means judges can run `docker compose up` without Atlas. |
| Frontend | **React (JavaScript) + CSS** | You already ship React. No TypeScript, no shadcn. CSS we control so it can look like a **Gujarat government** site, not a SaaS dashboard. |
| Auth (MVP) | Role switcher + server checks | PRD: HEAD / REGISTRY / SCHEME_CREATOR / SCHEME_OFFICER. JWT later. |

**Not used now:** PostgreSQL, Next.js, Tailwind-as-the-look, Pravi marketing layout, MongoDB Atlas (optional later).

---

## Frontend look (Gujarat e-governance, not Pravi.com)

Target feel: [Digital Gujarat](https://www.digitalgujarat.gov.in) / GIL citizen services — **not** a consulting landing page.

| Rule | Detail |
|---|---|
| Language | English first; Gujarati labels on key actions where cheap (`અરજી`, `કુટુંબ`, `યોજના`). |
| Header | State-style top bar: product name “Gujarat Family ID”, role, high contrast. **No Ashoka emblem, no copied GoG logo** (PRD BR-06). |
| Colour | White content, navy text, **Gujarat-gov blue** for nav/primary, saffron/orange only for alerts/CTAs, green for approved. Large type, 44px tap targets. |
| Forms | One column on mobile, labels above fields, required marks, proof-note always visible for Registry. |
| Status | Plain language: Eligible / Not eligible / Already receiving — Gujarati+English if space. |
| Density | Officer tables like a NIC MIS; citizen screens like a Jan Seva form (few fields, big next button). |

---

## Local Mongo (Docker only — no app)

When we implement, Mongo runs as:

```text
docker compose up -d
# mongodb://127.0.0.1:27017/gj_family_id
```

Compose file (Mongo service only): [../docker-compose.yml](../docker-compose.yml).
