import { Schema, Types, model } from "mongoose";
import { NumberModel } from "../types/types";
const NumberSchema = new Schema<NumberModel>({
  _id: Types.ObjectId,
  nombre: String,
  cedula: {
    type: String,
    required: true,
  },
  provincia: {
    type: Types.ObjectId,
    ref: 'Provincia'
  },
  fecha_defuncion: Date,
  telefono: {
    type: String,
    unique: true,
    required: true,
  },
  eliminar: {
    type: Boolean,
    default: false,
  },
  enviado: {
    default: false,
    type: Boolean
  },
  email: String,
  causa: String,
});

export default model<NumberModel>("Number", NumberSchema);