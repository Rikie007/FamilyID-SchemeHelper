# Use Cases and Worked Examples

| | |
|---|---|
| **Document** | Use Case Specification (UCS) |
| **ID** | UCS-GJ-FAM-001 |
| **Version** | 0.1 |
| **Date** | 20 September 2026 |
| **Related** | [SDD.md](./SDD.md) · [PRD.md](./PRD.md) · [data-model.md](./data-model.md) |

IDs used below are **examples** for reading. Real IDs are random + check digit.

---

## Actors

| Actor | Enters the system how |
|---|---|
| Family Head | Role HEAD + own Family ID |
| Other members | No login. Walk to the counter with the head (or alone) with proofs. |
| Registry Officer | Role REGISTRY |
| Scheme Creator | Role SCHEME_CREATOR |
| Scheme Officer | Role SCHEME_OFFICER |

---

## UC-01 — Register a new family (walk-in)

**Trigger:** A household has no Family ID. They come to the counter with proofs (ration card, birth dates, etc.).

**Main success**

1. Registry looks up by name/phone — no existing ACTIVE family.
2. Officer enters: address (village, taluka, district), head (name, dob, gender, phone), other members with `parentMemberId` / `spouseOfMemberId`.
3. System generates Family ID + Member IDs.
4. Memberships ACTIVE, `openedHow` FOUNDING. HeadTenure `startedHow` FOUNDING. RegisterMutation FOUNDING + proofNote.
5. Officer gives the Family ID to the head. Head can later apply; they cannot edit this data.

**Fail:** duplicate guessable serial IDs — forbidden. Missing head phone — reject.

---

## UC-02 — Birth of a child (t = 2T)

**Trigger:** Son A already in family `GJ-F-48291753-6`. Couple brings birth proof.

**Before:** Son A `GJ-M-1003`, relation computed SON (or later HEAD). `spouseOfMemberId` on Son A is empty.

**Main success**

1. Registry looks up Family ID.
2. Officer adds child: name, dob, gender, `parentMemberId = GJ-M-1003`, proofNote e.g. “birth certificate seen”.
3. New Member ID. New membership ACTIVE, `openedHow` BIRTH.
4. Child is **not** labelled SON of the grandfather-head. Computed: GRANDSON if current head is still the grandfather; SON if Son A is already head.

Son A’s row is **unchanged**.

---

## UC-03 — Daughter marries out

**Trigger:** Daughter of this house marries into family `GJ-F-OTHER`.

**Main success**

1. Registry opens natal family. Daughter membership → LEFT, MARRIAGE_OUT, toDate = marriage date. Row **not** deleted.
2. Registry opens husband’s family. New membership ACTIVE, MARRIAGE_IN, same Member ID. `relation` computed as WIFE if husband is head, else DAUGHTER_IN_LAW. `spouseOfMemberId` = husband’s Member ID.
3. Two mutations (or one with both familyIds): MARRIAGE_OUT and MARRIAGE_IN + proofNote.

**Invariant:** one ACTIVE membership at a time.

---

## UC-04 — Son marries (same Family ID)

**Trigger:** Son A marries. Joint-family prototype: no new Family ID.

**Main success**

1. New member (wife) or existing Member ID if she had one (LEFT on natal, ACTIVE here).
2. Her membership: `spouseOfMemberId = Son A`. She is not stored as WIFE of the **head** unless Son A is head.
3. Son A’s `spouseOfMemberId` stays **empty**.

---

## UC-05 — Head dies; Son A becomes head (t = 3T)

**Trigger:** Death certificate of current head (father).

**Main success**

1. Father membership LEFT / DEATH. Not deleted.
2. `family.headMemberId` → Son A. `contactPhone` → Son A. New HeadTenure SUCCESSION_DEATH. Mutation DEATH + HEAD_CHANGE. Family ID **unchanged**.
3. Widow stays ACTIVE. `spouseOfMemberId` still = father. Computed relation: MOTHER.
4. Parent/spouse pointers on everyone else **unchanged**. Computed labels refresh (Son B → BROTHER, Son A’s wife → WIFE, Son A’s boy → SON).

Head cannot do this in the app. Walk-in only.

---

## UC-06 — Scheme Creator announces a scheme

**Trigger:** Department wants a new benefit.

**Main success:** name, domain, `appliesTo`, ageMin/Max, gender, requiresWidow. Scheme ID generated. Listed for Head and Scheme Officer.

**Examples to seed / create**

| Scheme | appliesTo | Typical criteria |
|---|---|---|
| Ration (PDS) | FAMILY | none (or household only) |
| Scholarship | MEMBER | age 6–18 |
| Old-age pension | MEMBER | age ≥ 60 |
| Widow pension | MEMBER | female + requiresWidow |

---

## UC-07 — Head: search and apply (FAMILY — ration)

1. Head opens own family (read-only).
2. Schemes list: Ration → Eligible (or Already receiving).
3. Apply: no member picker. Application `{ familyId, memberId: empty }`.
4. Duplicate: second ration for same family blocked.

Officer sees one beneficiary row for the **family**. Screen may list ACTIVE members as household consumers (display only).

---

## UC-08 — Head: apply (MEMBER — two scholarships)

Same house, two school-age children.

1. Apply scholarship for child 1 → allowed.
2. Apply scholarship for child 2 → allowed (different memberId).
3. Apply scholarship for child 1 again → **blocked**.
4. Father not in age band → Not eligible; no apply.

Officer sees **two** beneficiary rows (one per child) after both approvals.

---

## UC-09 — Widow pension after UC-05

Mother’s spouse is LEFT/DEATH. Scheme requiresWidow.

Head (now Son A) applies **for the mother** (MEMBER, memberId = mother). Eligible. Officer verifies register and approves. One beneficiary = the widow, not the whole house.

---

## UC-10 — Scheme Officer verify / reject

1. Inbox: SUBMITTED.
2. Open family read-only. Check member still ACTIVE; check duplicate.
3. Approve → Beneficiary ACTIVE, `reviewedByOfficerId` set.
4. Or Reject + reason (e.g. “proof mismatch at scheme desk”). No beneficiary.

Officer cannot edit membership to “make them eligible.” That is Registry’s job with proofs.

---

## Demo script (one sitting)

1. Creator: four schemes exist (seed or UI).
2. Registry: register family (UC-01) **or** open seeded family.
3. Head: apply ration (UC-07) + scholarship for one child (UC-08).
4. Officer: approve both; open beneficiaries.
5. Registry: death of head (UC-05).
6. Head (Son A): apply widow pension for mother (UC-09). Officer approves.

That is the story the architecture must support. No code in this document.
