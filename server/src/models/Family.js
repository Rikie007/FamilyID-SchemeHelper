import mongoose from "mongoose";

const familySchema = new mongoose.Schema(
  {
    familyId: { type: String, required: true, unique: true },
    headMemberId: { type: String, required: true },
    contactPhone: { type: String, default: "" },
    village: { type: String, required: true },
    taluka: { type: String, required: true },
    district: { type: String, required: true },
    createdOn: { type: String, required: true }
  },
  { collection: "families", timestamps: false }
);

export const Family = mongoose.model("Family", familySchema);
