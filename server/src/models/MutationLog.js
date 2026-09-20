import mongoose from "mongoose";

const mutationLogSchema = new mongoose.Schema(
  {
    mutationId: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    kind: { type: String, required: true },
    officerId: { type: String, required: true },
    proofNote: { type: String, required: true },
    at: { type: Date, default: Date.now }
  },
  { collection: "mutationLogs", timestamps: false }
);

export const MutationLog = mongoose.model("MutationLog", mutationLogSchema);
