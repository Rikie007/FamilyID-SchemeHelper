# Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Gujarat Family ID — Beneficiary & Scheme Management |
| **Document** | Product Requirements Document (PRD) |
| **ID** | PRD-GJ-FAM-001 |
| **Version** | 0.2 |
| **Status** | Draft — source of truth for product functionality |
| **Date** | 20 September 2026 |
| **Related** | System design / solution idea: [`SDD.md`](./SDD.md) · Schema: [`data-model.md`](./data-model.md) |

This is the **only** document to update when a product function is added, changed, or removed. Do not scatter new features in chat, READMEs, or the data-model file. If a change needs a new field, update **this PRD** (requirement + rule) and then [`data-model.md`](./data-model.md) (shape only). Architecture and goals-in-context live in the SDD; do not start implementation until the SDD is accepted.

---

## 1. How to update this document

1. Add, change, or retire a requirement using its ID (`FR-…` / `BR-…`).
2. Set status: `MVP` | `Later` | `Removed`.
3. Append a row to the **Change log** (section 10).
4. Bump **Version** (0.2 → 0.3 for behaviour; 1.0 when the demo scope is frozen).

Do not delete retired requirements. Mark them `Removed` and say why.

---

## 2. Problem

Gujarat delivers many schemes (food, scholarship, pension, widow support, and other general categories) through separate lists and forms. The same household is recorded differently in each department. Eligible people re-submit documents; ineligible or duplicate claims are hard to see.

**Family ID** is one official ID for the household. Members sit under it. Schemes are searched, applied for, and monitored through that register — simpler for the family, harder to forge or double-claim.

The family **cannot** write this register themselves. Changes happen at a government counter after physical proofs.

---

## 3. Business goals

| ID | Goal |
|---|---|
| G-1 | **Citizen (Head):** search schemes and apply only where the family or member is eligible. |
| G-2 | **Registry Officer:** keep the family register correct (new family, birth, marriage, death, head) after seeing proofs. |
| G-3 | **Scheme Creator:** announce schemes with eligibility criteria. |
| G-4 | **Scheme Officer:** verify applications against the register, approve or reject, and see who is taking the benefit. |

Family ID is the engine under these goals. It is not the product by itself.

---

## 4. Scope

### 4.1 In scope (MVP)

- Walk-in family register: only **Registry Officer** creates/updates Family, Member, Membership, HeadTenure.
- Head (citizen): view own family, eligibility, apply, track — **read/apply only**.
- Scheme Creator: create/edit scheme (name, domain, `appliesTo`, simple criteria).
- Scheme Officer: application inbox, verify, approve/reject, beneficiaries, **read-only** family lookup.
- Family-level vs member-level consumption (`appliesTo`).
- Anti-duplicate rules.
- Role switcher: **HEAD** | **REGISTRY** | **SCHEME_CREATOR** | **SCHEME_OFFICER**.

### 4.2 Out of scope (Later / not in demo unless promoted here)

- Citizen login per member (only the head acts for apply).
- Digital family-change **request** ticket from the citizen (walk-in only).
- Real Aadhaar/KYC, payments/DBT, DigiLocker, proof file upload (officer types a proof note only).
- Splitting sons into new Family IDs (joint family prototype).

---

## 5. Stakeholders and permissions

Prototype roles: **HEAD**, **REGISTRY**, **SCHEME_CREATOR**, **SCHEME_OFFICER**.

No family member — including the head — may insert or update Family, Member, Membership, or HeadTenure.

### 5.1 Family Head (citizen) — first point of contact

The member stored as `headMemberId`. Family contact phone is this person’s phone.

| ID | Status | Function |
|---|---|---|
| FR-H-01 | MVP | View own Family ID and **ACTIVE** members only. |
| FR-H-02 | MVP | Search / browse announced schemes. |
| FR-H-03 | MVP | See eligibility per scheme: Eligible / Not eligible / Already receiving. |
| FR-H-04 | MVP | Apply for an eligible **FAMILY** scheme (no member picker). |
| FR-H-05 | MVP | Apply for an eligible **MEMBER** scheme for a chosen ACTIVE member (self or child, etc.). |
| FR-H-06 | MVP | Track own applications: SUBMITTED / APPROVED / REJECTED. |
| FR-H-07 | MVP | Cannot see another family; cannot approve applications; cannot create schemes; **cannot edit the family register**. |
| FR-H-08 | Removed | Record birth / marriage / death. Citizen never writes the register (v0.2: walk-in + Registry Officer only). |

To change the house (birth, death, marriage, new head): the family **goes to the office with physical proofs**. There is no in-app request form in MVP.

### 5.2 Family member (beneficiary)

No separate login in MVP. They are consumers, not operators. They also cannot edit the register; they accompany the head (or go themselves) to the Registry Officer with proofs.

| ID | Status | Function |
|---|---|---|
| FR-M-01 | MVP | Appear on the household list; can be selected as consumer on a MEMBER scheme. |
| FR-M-02 | MVP | Receive member-level benefits in their own Member ID. |

### 5.3 Registry Officer

Talati / civil registry desk. Sees proofs in person, then commits the change.

| ID | Status | Function |
|---|---|---|
| FR-REG-01 | MVP | Register a **new family**: head + members, generate Family ID and Member IDs, first HeadTenure, mutation FOUNDING. |
| FR-REG-02 | MVP | **Add child (birth):** new Member ID, ACTIVE membership, `parentMemberId` = father, `openedHow` BIRTH. |
| FR-REG-03 | MVP | **Marriage out / in:** natal `LEFT / MARRIAGE_OUT`; husband’s family `ACTIVE / MARRIAGE_IN`; same Member ID. Sons stay on the same Family ID; son’s wife joins with `spouseOfMemberId` = that son. |
| FR-REG-04 | MVP | **Death** (including death of head): deceased `LEFT / DEATH`. If the dead person was head: Family ID unchanged; `headMemberId` + contact phone → eldest son (or officer-chosen eligible son); widow stays ACTIVE; new HeadTenure SUCCESSION_DEATH. |
| FR-REG-05 | MVP | Each mutation stores `officerId`, `proofNote` (what was seen, typed — no file upload), timestamp. |
| FR-REG-06 | MVP | Look up Family ID / member and open the household (read + mutate). |
| FR-REG-07 | MVP | Cannot apply for schemes, create schemes, or approve/reject scheme applications. |

### 5.4 Scheme Creator (government)

Department / scheme owner. Announces schemes with criteria.

| ID | Status | Function |
|---|---|---|
| FR-SC-01 | MVP | Create a scheme: name, domain, `appliesTo` (FAMILY \| MEMBER), eligibility criteria (ageMin, ageMax, gender, requiresWidow / spouseDeceased). |
| FR-SC-02 | MVP | Edit / list announced schemes (criteria). |
| FR-SC-03 | MVP | Cannot edit the family register; cannot approve citizen applications. |

### 5.5 Scheme Officer

Scheme desk. Verifies applications against the register and decides.

| ID | Status | Function |
|---|---|---|
| FR-SO-01 | MVP | View announced schemes. |
| FR-SO-02 | MVP | Open application inbox: pending / approved / rejected. |
| FR-SO-03 | MVP | Verify against the family register (read-only), then approve or reject (reject requires a short reason). Store `reviewedByOfficerId`. |
| FR-SO-04 | MVP | View beneficiaries (“who is taking advantage”) per scheme. |
| FR-SO-05 | MVP | Look up a Family ID and open the household **read-only**. |
| FR-SO-06 | MVP | System blocks approve when a duplicate ACTIVE/SUBMITTED benefit already exists. |
| FR-SO-07 | MVP | Cannot edit Family/Membership; cannot create schemes. |

### 5.6 Retired — generic Officer (v0.1)

| ID | Status | Function |
|---|---|---|
| FR-O-01 | Removed | View announced schemes. Split to FR-SO-01 / FR-SC-02. |
| FR-O-02 | Removed | Application inbox. Now FR-SO-02. |
| FR-O-03 | Removed | Approve or reject. Now FR-SO-03. |
| FR-O-04 | Removed | Beneficiaries. Now FR-SO-04. |
| FR-O-05 | Removed | Family lookup. Now FR-REG-06 (write) and FR-SO-05 (read). |
| FR-O-06 | Removed | Duplicate block on approve. Now FR-SO-06. |
| FR-O-07 | Removed | Record life events. Now FR-REG-02–04 (MVP). |
| FR-O-08 | Removed | Create/edit scheme rules. Now FR-SC-01 (MVP). |

---

## 6. Functional requirements — domain

### 6.1 Identifiers

| ID | Status | Function |
|---|---|---|
| FR-ID-01 | MVP | Family ID format `GJ-F-########-C` (8 random digits + check). Not sequential. Not Aadhaar. |
| FR-ID-02 | MVP | Member ID format `GJ-M-##########-C` (10 random digits + check). Lifetime; never changes on marriage or death. |
| FR-ID-03 | MVP | Scheme ID format `GJ-S-{DOMAIN}-{CODE}` (e.g. `GJ-S-FOOD-PDS`). |
| FR-ID-04 | MVP | Application ID `GJ-A-…`. |
| FR-ID-05 | MVP | Never store raw Aadhaar. Optional hash is Later. |

### 6.2 Family register

Writes: **Registry Officer only** (BR-08).

| ID | Status | Function |
|---|---|---|
| FR-FAM-01 | MVP | A family has one Family ID, one current head (`headMemberId`), one contact phone, and an address (village, taluka, district). |
| FR-FAM-02 | MVP | A person has one Member ID for life and at most **one ACTIVE membership** at a time. |
| FR-FAM-03 | MVP | Membership rows are **never deleted**. Leaving the house sets `LEFT` + `closedHow` + `toDate`. `openedHow` is not overwritten. |
| FR-FAM-04 | MVP | `parentMemberId`: whose **child** this is (father in this prototype). Empty for head. Required for children in the house. |
| FR-FAM-05 | MVP | `spouseOfMemberId`: whose **wife** she is. Filled only for wife / daughter-in-law. **Empty** for HEAD, SON, and children. Never the father’s ID on a son. |
| FR-FAM-06 | MVP | `relationToHead` is **computed**, not stored (HEAD, WIFE, MOTHER, SON, DAUGHTER, BROTHER, DAUGHTER_IN_LAW, SISTER_IN_LAW, GRANDSON, NEPHEW, …). |
| FR-FAM-07 | MVP | First point of contact = current `headMemberId` + `contactPhone`. |

### 6.3 Life events (Registry Officer commits; same table effects as before)

| ID | Status | Function |
|---|---|---|
| FR-LE-01 | MVP | **Marriage of daughter:** natal membership `LEFT / MARRIAGE_OUT`; new `ACTIVE / MARRIAGE_IN` on husband’s family; same Member ID. |
| FR-LE-02 | MVP | **Sons stay** on the same Family ID after marriage (no new house in prototype). Son’s wife: new ACTIVE membership, `spouseOfMemberId` = that son. |
| FR-LE-03 | MVP | **Birth:** new Member ID + ACTIVE membership, `parentMemberId` = father, `openedHow` `BIRTH`. Grandchild of current head is not labelled SON of head. |
| FR-LE-04 | MVP | **Death of head:** father `LEFT / DEATH`; Family ID unchanged; `headMemberId` + phone → eldest son; widow stays ACTIVE; new HeadTenure row. Parent/spouse pointers do not change. |
| FR-LE-05 | MVP | Seed data may pre-build a household for demo; **performing** events is Registry Officer UI (FR-REG-*). |

Joint-family simplification is intentional for the prototype (sons do not form new Family IDs).

### 6.4 Schemes, eligibility, apply

| ID | Status | Function |
|---|---|---|
| FR-SCH-01 | MVP | Every scheme has `domain` and `appliesTo`: **FAMILY** or **MEMBER**. |
| FR-SCH-02 | MVP | **FAMILY** (e.g. ration): one benefit per house. `application.memberId` empty. All ACTIVE members are shown as household consumers (display only, not extra benefit rows). |
| FR-SCH-03 | MVP | **MEMBER** (e.g. scholarship, old-age pension, widow): consumer is one person. `application.memberId` required. Several members of the same family may each receive the scheme. |
| FR-SCH-04 | MVP | Applicant is always the current Head (`appliedByMemberId`). Applicant ≠ consumer unless the head is the chosen member. |
| FR-SCH-05 | MVP | Eligibility is evaluated on the **family** (FAMILY schemes) or on the **chosen member** (MEMBER schemes) using scheme criteria plus dob, gender, and household facts (e.g. widow = spouse LEFT/DEATH). |
| FR-SCH-06 | MVP | Demo may still **seed** four schemes (ration, scholarship, old-age pension, widow). Creator UI can add more. |
| FR-SCH-07 | MVP | Scheme Creator sets criteria fields (ageMin, ageMax, gender, requiresWidow). Not a free-form code engine. |

### 6.5 Applications and anti-duplicate

| ID | Status | Function |
|---|---|---|
| FR-APP-01 | MVP | Application states: SUBMITTED → APPROVED \| REJECTED. |
| FR-APP-02 | MVP | FAMILY unique key while open/active: `(schemeId, familyId)`. |
| FR-APP-03 | MVP | MEMBER unique key while open/active: `(schemeId, memberId)`. Two siblings = two scholarships: allowed. Same child twice: blocked. |
| FR-APP-04 | MVP | Head cannot submit a duplicate that violates FR-APP-02 or FR-APP-03. Scheme Officer cannot approve one either. |
| FR-APP-05 | MVP | Approve creates a Beneficiary row (ACTIVE). Reject does not. |

### 6.6 Beneficiaries (government “who is taking advantage”)

| ID | Status | Function |
|---|---|---|
| FR-BEN-01 | MVP | FAMILY scheme: one beneficiary row per family. |
| FR-BEN-02 | MVP | MEMBER scheme: one beneficiary row per person. |
| FR-BEN-03 | MVP | Scheme Officer can filter beneficiaries by scheme and see Family ID, member (if any), from date, status. |
| FR-BEN-04 | Later | Auto-stop benefit if member LEFT (married out / death) while still ACTIVE. |

---

## 7. Screens (MVP)

| ID | Role | Screen | Functions covered |
|---|---|---|---|
| UI-01 | HEAD | My family (read-only) | FR-H-01 |
| UI-02 | HEAD | Schemes (eligible / not / already receiving) | FR-H-02, FR-H-03 |
| UI-03 | HEAD | Apply | FR-H-04, FR-H-05, FR-APP-* |
| UI-04 | HEAD | My applications | FR-H-06 |
| UI-09 | REGISTRY | Family lookup | FR-REG-06 |
| UI-10 | REGISTRY | Register family | FR-REG-01, FR-REG-05 |
| UI-11 | REGISTRY | Add child / member | FR-REG-02, FR-LE-03 |
| UI-12 | REGISTRY | Marriage in / out | FR-REG-03, FR-LE-01, FR-LE-02 |
| UI-13 | REGISTRY | Death + head succession | FR-REG-04, FR-LE-04 |
| UI-14 | SCHEME_CREATOR | New scheme (criteria) | FR-SC-01 |
| UI-15 | SCHEME_CREATOR | Announced schemes | FR-SC-02 |
| UI-05 | SCHEME_OFFICER | Schemes announced (read) | FR-SO-01 |
| UI-06 | SCHEME_OFFICER | Applications inbox | FR-SO-02, FR-SO-03, FR-SO-06 |
| UI-07 | SCHEME_OFFICER | Beneficiaries | FR-SO-04, FR-BEN-* |
| UI-08 | SCHEME_OFFICER | Family lookup (read-only) | FR-SO-05 |

Role switcher is sufficient for auth in MVP.

---

## 8. Business rules (constraints)

| ID | Status | Rule |
|---|---|---|
| BR-01 | MVP | Do not delete membership or person records. |
| BR-02 | MVP | Do not encode Family ID inside Member ID. |
| BR-03 | MVP | Do not use running serial IDs (`000001`). |
| BR-04 | MVP | Prototype: at most one ACTIVE wife per living man. |
| BR-05 | MVP | `parentMemberId` / `spouseOfMemberId` must not point at self. |
| BR-06 | MVP | No government emblem; no real Aadhaar numbers in seed/demo data. |
| BR-07 | MVP | Head succession: eldest son becomes head; widow remains in the family. |
| BR-08 | MVP | Only REGISTRY may insert/update Family, Member, Membership, HeadTenure. |
| BR-09 | MVP | Only SCHEME_CREATOR may insert/update Scheme. |
| BR-10 | MVP | Only SCHEME_OFFICER may set Application APPROVED or REJECTED. |
| BR-11 | MVP | Walk-in only — no citizen FamilyChangeRequest entity. |

---

## 9. Glossary

| Term | Meaning |
|---|---|
| Family ID | Household identifier. Stable if head dies. |
| Member ID | Person identifier. Stable for life. |
| Membership | Link of a person to a house for a period (ACTIVE or LEFT). |
| Head / first point of contact | Current operator of the household for apply. |
| Applicant | Who submits a scheme application (always Head in MVP). |
| Consumer | Who the scheme is for: the family or one member. |
| Beneficiary | Approved consumer currently taking the scheme. |
| Registry Officer | Government actor who writes the family register after proofs. |
| Scheme Creator | Government actor who announces schemes and criteria. |
| Scheme Officer | Government actor who verifies and decides applications. |
| Proof note | Short text of which physical document was seen (no scan in MVP). |

---

## 10. Change log

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-09-20 | Initial PRD: goals, stakeholders, Family ID rules, FAMILY vs MEMBER schemes, apply/beneficiary, MVP screens. |
| 0.2 | 2026-09-20 | Walk-in register only. Split Officer into Registry, Scheme Creator, Scheme Officer. Head cannot edit family. Scheme create + life-event officer UI moved to MVP. Retired FR-O-* and FR-H-08. Added BR-08–11, FR-REG-*, FR-SC-*, FR-SO-*. |
