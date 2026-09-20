# Assumptions and open decisions

| | |
|---|---|
| **Document** | Assumptions Log |
| **ID** | ASM-GJ-FAM-001 |
| **Version** | 0.1 |
| **Date** | 20 September 2026 |

Locked assumptions are treated as true for the prototype. Open items stay open until we change the PRD — they are **not** an invitation to pause.

---

## Locked (do not reopen without a PRD bump)

| ID | Assumption |
|---|---|
| A-01 | Walk-in only for register writes. No citizen change-request ticket. |
| A-02 | Four roles: HEAD, REGISTRY, SCHEME_CREATOR, SCHEME_OFFICER. |
| A-03 | Applicant is always the current head. |
| A-04 | FAMILY vs MEMBER consumer model and duplicate keys. |
| A-05 | Member ID lifetime; Family ID stable on head death. |
| A-06 | Never delete membership. |
| A-07 | Sons stay in the same Family ID after marriage (joint family). |
| A-08 | Daughter leaves natal family and joins husband’s. |
| A-09 | `spouseOfMemberId` only on wife / daughter-in-law; empty on SON. |
| A-10 | `parentMemberId` = father in this prototype. |
| A-11 | relationToHead is computed. |
| A-12 | Head succession default = eldest son; widow stays. |
| A-13 | Proof is a typed note, not a file. |
| A-14 | No raw Aadhaar. |
| A-15 | Prototype auth = role switcher; **server still enforces writes**. |

---

## Open (default chosen so design can proceed)

| ID | Question | Default until PRD says otherwise |
|---|---|---|
| O-01 | Can Scheme Creator see beneficiary counts? | No. List schemes only. |
| O-02 | Can Registry see applications? | No. |
| O-03 | Newborn’s mother pointer? | Infer mother as ACTIVE daughter-in-law/wife whose spouseOf = parentMemberId. No `motherMemberId` field yet. |
| O-04 | Daughter-in-law’s `parentMemberId` in the new house? | Empty (she is not a child of this house). |
| O-05 | Who may be new head if no son? | Officer picks an ACTIVE adult male; if none, widow (not in default demo). |
| O-06 | Stop benefits when member LEFT? | Later (FR-BEN-04). Demo does not auto-stop. |
| O-07 | Scheme ID: auto from name vs officer-typed code? | Server generates `GJ-S-` + short code. |
| O-08 | Multiple Registry officers? | One `officerId` string in the role switcher is enough. |
| O-09 | Address change of the house? | Registry can edit address on Family; treat as mutation type ADDRESS Later if we need audit. MVP: editable with proofNote. |
| O-10 | Language (Gujarati/Hindi)? | English UI for prototype; labels can be bilingual Later. |

If an open item must change behaviour, update **PRD** first, then this log, then SDD/ICD if architecture shifts.
