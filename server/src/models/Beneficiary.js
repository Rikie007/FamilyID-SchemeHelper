import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema(
  {
    schemeId: { type: String, required: true, index: true },
    familyId: { type: String, required: true, index: true },
    memberId: { type: String, default: "" },
    enrolledOn: { type: String, required: true }
  },
  { collection: "beneficiaries", timestamps: false }
);

beneficiarySchema.index(
  { schemeId: 1, familyId: 1 },
  { unique: true, name: "beneficiary_family_unique", partialFilterExpression: { memberId: "" } }
);
beneficiarySchema.index(
  { schemeId: 1, memberId: 1 },
  { unique: true, name: "beneficiary_member_unique", partialFilterExpression: { memberId: { $gt: "" } } }
);

export const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);
