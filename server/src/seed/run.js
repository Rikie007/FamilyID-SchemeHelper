import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../db/connect.js";
import { syncAllIndexes } from "../db/syncIndexes.js";
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

const FAMILY_ID = "GJ-F-48291753-6";
const RAMESH = "GJ-M-1001001001-1";
const SITA = "GJ-M-1001001002-2";
const AMIT = "GJ-M-1001001003-3";
const BHARAT = "GJ-M-1001001004-4";
const KAVITA = "GJ-M-1001001005-5";
const FOUNDING = "2010-01-01";

async function reset() {
  await mongoose.connection.dropDatabase();
}

async function seedPatelFamily() {
  await Family.create({
    familyId: FAMILY_ID,
    headMemberId: RAMESH,
    contactPhone: "9876543210",
    village: "Kudasan",
    taluka: "Gandhinagar",
    district: "Gandhinagar",
    createdOn: FOUNDING
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
    mutationId: "GJ-X-00000001-8",
    familyId: FAMILY_ID,
    kind: "REGISTER_FAMILY",
    officerId: "REG-SEED",
    proofNote: "Ration card and birth dates seen at Kudasan Jan Seva Kendra (seed)."
  });
}

const DESAI_FAMILY = "GJ-F-61002847-3";
const MAHESH = "GJ-M-2002002001-2";
const ROHAN = "GJ-M-2002002002-3";

async function seedDesaiFamily() {
  await Family.create({
    familyId: DESAI_FAMILY,
    headMemberId: MAHESH,
    contactPhone: "9876500001",
    village: "Sargasan",
    taluka: "Gandhinagar",
    district: "Gandhinagar",
    createdOn: FOUNDING
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
      requiresWidow: false
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
      requiresWidow: false
    },
    {
      schemeId: "GJ-S-PEN-MEM-0001",
      name: "Old-age Pension",
      domain: "PEN",
      appliesTo: "MEMBER",
      status: "OPEN",
      minAge: 60,
      maxAge: null,
      gender: "ANY",
      requiresWidow: false
    },
    {
      schemeId: "GJ-S-WID-MEM-0001",
      name: "Widow Pension",
      domain: "WID",
      appliesTo: "MEMBER",
      status: "OPEN",
      minAge: null,
      maxAge: null,
      gender: "F",
      requiresWidow: true
    }
  ]);
}

async function main() {
  await connectDb();
  await reset();
  await syncAllIndexes();
  await seedPatelFamily();
  await seedDesaiFamily();
  await seedSchemes();
  console.log("Seeded Patel household", FAMILY_ID);
  console.log("Head:", RAMESH, "Ramesh Patel");
  console.log("Seeded Desai household", DESAI_FAMILY, "(Rohan Desai for marriage-in demo)");
  console.log("Schemes: 4 OPEN");
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
