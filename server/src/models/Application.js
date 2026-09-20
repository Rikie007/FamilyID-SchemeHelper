import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, required: true, unique: true },
    schemeId: { type: String, required: true, index: true },
    familyId: { type: String, required: true, index: true },
    memberId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      required: true
    },
    appliedOn: { type: String, required: true },
    decidedOn: { type: String, default: "" },
    rejectNote: { type: String, default: "" },
    reviewedByOfficerId: { type: String, default: "" }
  },
  { collection: "applications", timestamps: false }
);

applicationSchema.index(
  { schemeId: 1, familyId: 1 },
  {
    unique: true,
    name: "application_family_open_unique",
    partialFilterExpression: {
      memberId: "",
      status: { $in: ["PENDING", "APPROVED"] }
    }
  }
);
applicationSchema.index(
  { schemeId: 1, memberId: 1 },
  {
    unique: true,
    name: "application_member_open_unique",
    partialFilterExpression: {
      memberId: { $gt: "" },
      status: { $in: ["PENDING", "APPROVED"] }
    }
  }
);

export const Application = mongoose.model("Application", applicationSchema);
