import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    familyId: { type: String, required: true, index: true },
    memberId: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "LEFT"], required: true },
    openedHow: {
      type: String,
      enum: ["FOUNDING", "BIRTH", "MARRIAGE_IN"],
      required: true
    },
    closedHow: {
      type: String,
      enum: ["", "MARRIAGE_OUT", "DEATH"],
      default: ""
    },
    fromDate: { type: String, required: true },
    toDate: { type: String, default: "" }
  },
  { collection: "memberships", timestamps: false }
);

membershipSchema.index(
  { memberId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" }, name: "membership_active_unique" }
);
membershipSchema.index(
  { familyId: 1, memberId: 1, fromDate: 1 },
  { unique: true, name: "membership_history_unique" }
);

export const Membership = mongoose.model("Membership", membershipSchema);
