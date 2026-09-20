import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    gender: { type: String, enum: ["M", "F"], required: true },
    dob: { type: String, required: true },
    maritalStatus: {
      type: String,
      enum: ["UNMARRIED", "MARRIED", "WIDOWED"],
      required: true
    },
    fatherMemberId: { type: String, default: "" },
    motherMemberId: { type: String, default: "" },
    spouseMemberId: { type: String, default: "" },
    isAlive: { type: Boolean, default: true },
    deathDate: { type: String, default: "" }
  },
  { collection: "members", timestamps: false }
);

export const Member = mongoose.model("Member", memberSchema);
