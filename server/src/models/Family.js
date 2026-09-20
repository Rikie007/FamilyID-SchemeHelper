import mongoose from "mongoose";

const familySchema = new mongoose.Schema(
  {
    familyId: { type: String, required: true, unique: true },
    headMemberId: { type: String, required: true },
    contactPhone: { type: String, default: "" },
    village: { type: String, required: true },
    taluka: { type: String, required: true },
    district: { type: String, required: true },
    createdOn: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false }
  },
  { collection: "families", timestamps: false }
);

familySchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

familySchema.set("toObject", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export const Family = mongoose.model("Family", familySchema);
