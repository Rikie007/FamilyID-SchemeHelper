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

const MODELS = [
  Family,
  Member,
  Membership,
  Marriage,
  HeadTenure,
  Scheme,
  Application,
  Beneficiary,
  MutationLog
];

export async function syncAllIndexes() {
  await Promise.all(MODELS.map((m) => m.syncIndexes()));
}
