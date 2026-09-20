import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../db/connect.js";
import { config, redactedMongoUri } from "../config.js";
import { syncAllIndexes } from "../db/syncIndexes.js";
import { hashPassword } from "../auth/password.js";
import {
  Family,
  Member,
  Membership,
  Marriage,
  HeadTenure,
  Scheme,
  Application,
  Beneficiary,
  MutationLog
} from "../models/index.js";
import { issueForScheme } from "../services/schemeOfficerService.js";

const FAMILY_ID = "GJ-F-48291753";
const RAMESH = "GJ-M-1001001001";
const SITA = "GJ-M-1001001002";
const AMIT = "GJ-M-1001001003";
const BHARAT = "GJ-M-1001001004";
const KAVITA = "GJ-M-1001001005";
const FOUNDING = "2010-01-01";

async function reset() {
  if (!config.seedReset) {
    throw new Error(
      `Refusing to wipe ${config.dbName} (${redactedMongoUri()}). Set SEED_RESET=true in .env if you want to reload demo data.`
    );
  }
  console.log(`SEED_RESET=true · clearing collections in ${config.dbName}`);
  const cols = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of cols) {
    if (name.startsWith("system.")) continue;
    await mongoose.connection.db.collection(name).deleteMany({});
  }
}

async function seedPatelFamily() {
  await Family.create({
    familyId: FAMILY_ID,
    headMemberId: RAMESH,
    contactPhone: "9876543210",
    village: "Kudasan",
    taluka: "Gandhinagar",
    district: "Gandhinagar",
    createdOn: FOUNDING,
    passwordHash: await hashPassword("Head@123")
  });

  await Member.insertMany([
    {
      memberId: RAMESH,
      fullName: "Ramesh Patel",
      gender: "M",
      dob: "1968-03-12",
      maritalStatus: "MARRIED",
      spouseMemberId: "",
      isAlive: true
    },
    {
      memberId: SITA,
      fullName: "Sita Patel",
      gender: "F",
      dob: "1972-07-08",
      maritalStatus: "MARRIED",
      spouseMemberId: RAMESH,
      isAlive: true
    },
    {
      memberId: AMIT,
      fullName: "Amit Patel",
      gender: "M",
      dob: "1996-01-20",
      maritalStatus: "UNMARRIED",
      fatherMemberId: RAMESH,
      motherMemberId: SITA,
      isAlive: true
    },
    {
      memberId: BHARAT,
      fullName: "Bharat Patel",
      gender: "M",
      dob: "1999-11-02",
      maritalStatus: "UNMARRIED",
      fatherMemberId: RAMESH,
      motherMemberId: SITA,
      isAlive: true
    },
    {
      memberId: KAVITA,
      fullName: "Kavita Patel",
      gender: "F",
      dob: "2001-05-15",
      maritalStatus: "UNMARRIED",
      fatherMemberId: RAMESH,
      motherMemberId: SITA,
      isAlive: true
    }
  ]);

  await Membership.insertMany(
    [RAMESH, SITA, AMIT, BHARAT, KAVITA].map((memberId) => ({
      familyId: FAMILY_ID,
      memberId,
      status: "ACTIVE",
      openedHow: "FOUNDING",
      closedHow: "",
      fromDate: FOUNDING,
      toDate: ""
    }))
  );

  await Marriage.create({
    husbandMemberId: RAMESH,
    wifeMemberId: SITA,
    fromDate: "1994-05-01",
    status: "ACTIVE"
  });

  await HeadTenure.create({
    familyId: FAMILY_ID,
    memberId: RAMESH,
    startedHow: "FOUNDING",
    fromDate: FOUNDING,
    toDate: ""
  });

  await MutationLog.create({
    mutationId: "GJ-X-00000001",
    familyId: FAMILY_ID,
    kind: "REGISTER_FAMILY",
    officerId: "REG-SEED",
    proofNote: "Ration card and birth dates seen at Kudasan Jan Seva Kendra (seed)."
  });
}

const DESAI_FAMILY = "GJ-F-61002847";
const MAHESH = "GJ-M-2002002001";
const ROHAN = "GJ-M-2002002002";

async function seedDesaiFamily() {
  await Family.create({
    familyId: DESAI_FAMILY,
    headMemberId: MAHESH,
    contactPhone: "9876500001",
    village: "Sargasan",
    taluka: "Gandhinagar",
    district: "Gandhinagar",
    createdOn: FOUNDING,
    passwordHash: await hashPassword("Head@123")
  });
  await Member.insertMany([
    {
      memberId: MAHESH,
      fullName: "Mahesh Desai",
      gender: "M",
      dob: "1965-09-01",
      maritalStatus: "WIDOWED",
      isAlive: true
    },
    {
      memberId: ROHAN,
      fullName: "Rohan Desai",
      gender: "M",
      dob: "1998-04-18",
      maritalStatus: "UNMARRIED",
      fatherMemberId: MAHESH,
      isAlive: true
    }
  ]);
  await Membership.insertMany(
    [MAHESH, ROHAN].map((memberId) => ({
      familyId: DESAI_FAMILY,
      memberId,
      status: "ACTIVE",
      openedHow: "FOUNDING",
      closedHow: "",
      fromDate: FOUNDING,
      toDate: ""
    }))
  );
  await HeadTenure.create({
    familyId: DESAI_FAMILY,
    memberId: MAHESH,
    startedHow: "FOUNDING",
    fromDate: FOUNDING,
    toDate: ""
  });
}

async function seedSchemes() {
  await Scheme.insertMany([
    {
      schemeId: "GJ-S-FOOD-FAM-0001",
      name: "Ration (PDS)",
      domain: "FOOD",
      appliesTo: "FAMILY",
      status: "OPEN",
      minAge: null,
      maxAge: null,
      gender: "ANY",
      requiresWidow: false,
      summary: "Foodgrain entitlement for the whole household under the Public Distribution System."
    },
    {
      schemeId: "GJ-S-EDU-MEM-0001",
      name: "School Scholarship",
      domain: "EDU",
      appliesTo: "MEMBER",
      status: "OPEN",
      minAge: 6,
      maxAge: 25,
      gender: "ANY",
      requiresWidow: false,
      summary: "Education support for one student in the family, aged 6 to 25 years."
    },
    {
      schemeId: "GJ-S-PEN-MEM-0001",
      name: "Old-age Pension",
      domain: "SOCIAL",
      appliesTo: "MEMBER",
      status: "OPEN",
      minAge: 60,
      maxAge: null,
      gender: "ANY",
      requiresWidow: false,
      summary: "Monthly pension for one living member of the household aged 60 years or above."
    },
    {
      schemeId: "GJ-S-WID-MEM-0001",
      name: "Widow Pension",
      domain: "WCD",
      appliesTo: "MEMBER",
      status: "OPEN",
      minAge: null,
      maxAge: null,
      gender: "F",
      requiresWidow: true,
      summary: "Pension for a woman in the household whose spouse is recorded as deceased."
    }
  ]);
}

async function seedSchemeOfficers() {
  const desks = [
    ["GJ-S-FOOD-FAM-0001", "Ration (PDS)", "so.food-fam-0001", "Off@1001", "SO-FOOD-1"],
    ["GJ-S-EDU-MEM-0001", "School Scholarship", "so.edu-mem-0001", "Off@1002", "SO-EDU-1"],
    ["GJ-S-PEN-MEM-0001", "Old-age Pension", "so.pen-mem-0001", "Off@1003", "SO-PEN-1"],
    ["GJ-S-WID-MEM-0001", "Widow Pension", "so.wid-mem-0001", "Off@1004", "SO-WID-1"]
  ];
  for (const [schemeId, schemeName, username, password, officerId] of desks) {
    await issueForScheme({ schemeId, schemeName, username, password, officerId });
  }
}

async function main() {
  await connectDb();
  await reset();
  await syncAllIndexes();
  await seedPatelFamily();
  await seedDesaiFamily();
  await seedSchemes();
  await seedSchemeOfficers();
  console.log("Seeded Patel household", FAMILY_ID);
  console.log("Head:", RAMESH, "Ramesh Patel");
  console.log("Seeded Desai household", DESAI_FAMILY, "(Rohan Desai for marriage-in demo)");
  console.log("Schemes: 4 OPEN + 4 scheme officer desks");
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
