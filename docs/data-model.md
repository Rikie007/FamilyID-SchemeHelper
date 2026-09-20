# Gujarat Family ID — data shape (locked)

Logical field list. **Physical MongoDB design (collections, indexes, Docker): [`DB.md`](./DB.md).** Stack: [`TECH.md`](./TECH.md).

IDs are random + check digit. Never sequential. Never Aadhaar.
Member ID never changes. Family ID never changes on marriage or death of head.

**Who may write (PRD BR-08–10)**

- Family, Member, Membership, HeadTenure, RegisterMutation → **REGISTRY** only
- Scheme → **SCHEME_CREATOR** only
- Application status APPROVED/REJECTED → **SCHEME_OFFICER** only
- Application SUBMITTED → **HEAD** only
- Head never writes the family register (walk-in)

```
Family ID   GJ-F-########-C        8 random digits + check
Member ID   GJ-M-##########-C      10 random digits + check  (lifetime)
Scheme ID   GJ-S-{DOMAIN}-{CODE}   e.g. GJ-S-FOOD-PDS
```

A person has **one ACTIVE membership at a time**. Old rows stay as LEFT (never delete).

---

Family
  familyId            GJ-F-...
  headMemberId        GJ-M-...     ← first point of contact (moves on death)
  contactPhone                     ← phone of current head
  address             village, taluka, district

Member
  memberId            GJ-M-...     ← lifetime, even after marriage / death
  name
  dob
  gender
  phone               optional
  (optional later)    aadhaarHash  ← never store raw Aadhaar

Membership             ← “this person in this house, for this period”
  familyId
  memberId
  parentMemberId      GJ-M-... or empty
                      whose CHILD this is (father in this prototype)
                      fill for SON / DAUGHTER / GRANDSON / … in this house
  spouseOfMemberId    GJ-M-... or empty
                      whose WIFE she is
                      fill only for wife / daughter-in-law in this house
                      SON / HEAD / children: empty
  status              ACTIVE | LEFT
  openedHow           FOUNDING | BIRTH | MARRIAGE_IN     ← how they entered; never overwritten
  closedHow           "" | MARRIAGE_OUT | DEATH          ← how they left; "" while ACTIVE
  fromDate
  toDate              empty while ACTIVE

HeadTenure             ← audit of who was head (Family.headMemberId is “now”)
  familyId
  memberId
  fromDate
  toDate
  startedHow          FOUNDING | SUCCESSION_DEATH

RegisterMutation       ← walk-in audit (Registry Officer)
  mutationId
  familyId
  type                FOUNDING | BIRTH | MARRIAGE_IN | MARRIAGE_OUT | DEATH | HEAD_CHANGE
  officerId           who committed the edit
  proofNote           physical proof seen (text; no file upload in MVP)
  createdAt

Scheme                 ← Scheme Creator writes
  schemeId            GJ-S-FOOD-PDS | GJ-S-PEN-OLDAGE | GJ-S-EDU-SCH | GJ-S-WCD-WIDOW
  name
  domain              FOOD | EDUCATION | PENSION | WIDOW | ...
  appliesTo           FAMILY | MEMBER
                      FAMILY  = one benefit for the whole house (ration)
                      MEMBER  = one benefit per person; many members in
                                the same family may each receive it (scholarship)
  ageMin              optional
  ageMax              optional
  gender              optional  M | F | ANY
  requiresWidow       true if spouse must be LEFT/DEATH (widow pension)

Application            ← head applies; Scheme Officer reviews
  applicationId       GJ-A-...
  schemeId
  familyId            always (which house applied)
  memberId            empty if appliesTo = FAMILY
                      required if appliesTo = MEMBER (who consumes)
  appliedByMemberId   always the current head
  status              SUBMITTED | APPROVED | REJECTED
  rejectNote          officer text on reject
  reviewedByOfficerId empty until Scheme Officer decides
  createdAt

Beneficiary            ← “who is taking advantage” (after APPROVED)
  schemeId
  familyId            always
  memberId            empty if FAMILY scheme
                      the person if MEMBER scheme
  status              ACTIVE | STOPPED
  fromDate
  toDate

Unique while SUBMITTED or APPROVED / ACTIVE (anti-duplicate)
  FAMILY scheme  → one open row per (schemeId, familyId)
  MEMBER scheme  → one open row per (schemeId, memberId)
                   two children in one house = two applications, allowed
```

`relationToHead` is **not stored**. It is computed from `headMemberId` + `parentMemberId` + `spouseOfMemberId`.

```
HEAD             memberId == family.headMemberId
WIFE             spouseOfMemberId == current head
MOTHER           spouseOfMemberId == current head’s parentMemberId  (widow after father dies)
SON / DAUGHTER   parentMemberId == current head
BROTHER          same parentMemberId as current head, not the head
DAUGHTER_IN_LAW  spouseOfMemberId is a SON of current head
SISTER_IN_LAW    spouseOfMemberId is a BROTHER of current head
GRANDSON / …     parentMemberId is a SON of current head
NEPHEW / …       parentMemberId is a BROTHER of current head
```

---

Rules

- Never delete a membership row. Mark LEFT.
- Only Registry Officer writes family register (walk-in + proofNote).
- Daughter marries: natal row LEFT / MARRIAGE_OUT; new ACTIVE row on husband’s family / MARRIAGE_IN; same memberId.
- Sons stay on the same Family ID after marriage. Son’s wife: new ACTIVE row, spouseOfMemberId = that son.
- Newborn: new memberId, new ACTIVE membership, parentMemberId = the father, openedHow BIRTH.
- Head dies: father LEFT / DEATH; Family.headMemberId + contactPhone → eldest son; new HeadTenure row; Family ID unchanged; widow stays ACTIVE.
- Only one ACTIVE spouse per living man (prototype).
- spouseOfMemberId target should be a member of the same family (living or LEFT/DEATH for a widow).
- parentMemberId never points at self. spouseOfMemberId never points at self.
- Applicant is always the Head. Consumer is Family or Member, based on `scheme.appliesTo`.
- FAMILY scheme (ration): `application.memberId` empty; one application per family; all ACTIVE members are household consumers on the screen, not extra DB rows.
- MEMBER scheme (scholarship / pension / widow): `application.memberId` required; several members of the same family may apply; block only the same person + same scheme twice.
- Scheme Officer “who is taking advantage”: FAMILY → one beneficiary row per family; MEMBER → one row per person.
