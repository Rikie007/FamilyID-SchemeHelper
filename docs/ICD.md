# Logical API Contract

| | |
|---|---|
| **Document** | Interface Control Document (ICD) — logical APIs |
| **ID** | ICD-GJ-FAM-001 |
| **Version** | 0.1 |
| **Date** | 20 September 2026 |
| **Related** | [SDD.md](./SDD.md) §9 · [PRD.md](./PRD.md) · [data-model.md](./data-model.md) |

This is **design**, not implementation. Paths can stay as-is when we build. Every write is rejected unless the role matches.

**Prototype identity:** header `X-Role` = HEAD | REGISTRY | SCHEME_CREATOR | SCHEME_OFFICER. If HEAD, also `X-Family-Id` (and optionally `X-Member-Id` of the head). No JWT in MVP.

---

## Errors (all roles)

| Code | When |
|---|---|
| 403 | Role not allowed to this method |
| 409 | Duplicate application / second ACTIVE membership / second living spouse |
| 404 | Family or member not found |
| 422 | Missing proofNote on a registry mutation; missing memberId on MEMBER apply |

---

## Register (REGISTRY only for writes)

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/register/families` | REGISTRY | UC-01 new family. Body: address, head, members[], proofNote. Returns familyId, memberIds. |
| GET | `/register/families/:familyId` | REGISTRY, SCHEME_OFFICER, HEAD (own only) | Household + ACTIVE members + computed relationToHead. Officer/Registry may include LEFT history. |
| GET | `/register/lookup?q=` | REGISTRY, SCHEME_OFFICER | Search Family ID / member name / phone. |
| POST | `/register/families/:familyId/births` | REGISTRY | UC-02. Body: name, dob, gender, parentMemberId, proofNote. |
| POST | `/register/marriages` | REGISTRY | UC-03 / UC-04. Body: memberId, fromFamilyId, toFamilyId, spouseOfMemberId, proofNote. |
| POST | `/register/deaths` | REGISTRY | UC-05. Body: memberId, familyId, deathDate, newHeadMemberId (required if deceased is head), proofNote. |

HEAD **GET** own family only. HEAD **POST** register → 403.

---

## Schemes (CREATOR writes)

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/schemes` | SCHEME_CREATOR | UC-06. Body: name, domain, appliesTo, ageMin, ageMax, gender, requiresWidow. |
| PATCH | `/schemes/:schemeId` | SCHEME_CREATOR | Edit criteria. |
| GET | `/schemes` | all roles | Announced list. |

---

## Eligibility + apply (HEAD)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/me/family` | HEAD | Same as GET family, own id only. |
| GET | `/me/schemes` | HEAD | Each scheme: Eligible \| NotEligible \| AlreadyReceiving + reason. |
| POST | `/me/applications` | HEAD | Body: schemeId, memberId? (required iff MEMBER). Duplicate → 409. |
| GET | `/me/applications` | HEAD | Own family’s applications. |

---

## Decisions (SCHEME_OFFICER)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/officer/applications?status=` | SCHEME_OFFICER | Inbox. |
| POST | `/officer/applications/:id/approve` | SCHEME_OFFICER | Creates Beneficiary. Duplicate still 409. Sets reviewedByOfficerId. |
| POST | `/officer/applications/:id/reject` | SCHEME_OFFICER | Body: rejectNote (required). |
| GET | `/officer/beneficiaries?schemeId=` | SCHEME_OFFICER | Who is taking advantage. |
| GET | `/register/families/:familyId` | SCHEME_OFFICER | Read-only verify. |

Approve/reject by HEAD, REGISTRY, CREATOR → 403.

---

## Eligibility (server-side, not a public “cheat” API)

Used by `GET /me/schemes` and again on POST apply and POST approve.

```
if duplicate key open → AlreadyReceiving
else if appliesTo MEMBER and member missing → 422
else if age / gender / requiresWidow fail → NotEligible
else Eligible
```

`requiresWidow`: target member has `spouseOfMemberId` pointing at someone whose membership in this (or any) family is LEFT/DEATH — in prototype: spouse membership LEFT/DEATH.

---

## Idempotency notes

- Registry mutations always insert history (Membership LEFT or new ACTIVE). They are not silent overwrites.
- Approving twice: second call 409 if beneficiary already ACTIVE.
