import mongoose from "mongoose";

const headTenureSchema = new mongoose.Schema(
  {
    familyId: { type: String, required: true },
    memberId: { type: String, required: true },
    startedHow: { type: String, enum: ["FOUNDING", "SUCCESSION_DEATH"], required: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, default: "" }
  },
  { collection: "headTenures", timestamps: false }
);

headTenureSchema.index(
  { familyId: 1 },
  { unique: true, partialFilterExpression: { toDate: "" }, name: "headTenure_open_unique" }
);

export const HeadTenure = mongoose.model("HeadTenure", headTenureSchema);
