import { model, Schema, Types } from "mongoose";
import { Cliente } from "../types/types";

const ClienteSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    unique: true
  },
  provincias: [{ type: Types.ObjectId, ref: "Provincia" }],
});

export default model<Cliente>("Cliente", ClienteSchema);