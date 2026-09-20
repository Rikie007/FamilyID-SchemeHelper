import mongoose from "mongoose";

const schemeOfficerSchema = new mongoose.Schema(
  {
    officerId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    issuedPassword: { type: String, required: true, select: false },
    displayName: { type: String, required: true },
    schemeId: { type: String, required: true, unique: true }
  },
  { collection: "scheme_officers", timestamps: false }
);

schemeOfficerSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.issuedPassword;
    delete ret.__v;
    return ret;
  }
});

schemeOfficerSchema.set("toObject", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.issuedPassword;
    delete ret.__v;
    return ret;
  }
});

export const SchemeOfficer = mongoose.model("SchemeOfficer", schemeOfficerSchema);
