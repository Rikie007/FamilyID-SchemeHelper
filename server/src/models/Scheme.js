import mongoose from "mongoose";

const schemeSchema = new mongoose.Schema(
  {
    schemeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    domain: { type: String, required: true },
    appliesTo: { type: String, enum: ["FAMILY", "MEMBER"], required: true },
    status: { type: String, enum: ["OPEN", "CLOSED"], required: true },
    minAge: { type: Number, default: null },
    maxAge: { type: Number, default: null },
    gender: { type: String, enum: ["ANY", "M", "F"], default: "ANY" },
    requiresWidow: { type: Boolean, default: false }
  },
  { collection: "schemes", timestamps: false }
);

export const Scheme = mongoose.model("Scheme", schemeSchema);
