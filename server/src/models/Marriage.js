import mongoose from "mongoose";

const marriageSchema = new mongoose.Schema(
  {
    husbandMemberId: { type: String, required: true },
    wifeMemberId: { type: String, required: true, unique: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "ENDED"], required: true }
  },
  { collection: "marriages", timestamps: false }
);

marriageSchema.index(
  { husbandMemberId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" }, name: "marriage_active_husband_unique" }
);

export const Marriage = mongoose.model("Marriage", marriageSchema);
