import { model, Schema, Types } from "mongoose";
import { Province } from "../types/types";

const ProvinciaSchema = new Schema({
  name: { type: String, required: true },
  message: String,
  numbers: [{ type: Types.ObjectId, ref: "Number" }],
  cliente: { type: Types.ObjectId, ref: "Cliente" },
});

export default model<Province>("Provincia", ProvinciaSchema);