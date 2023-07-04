import { Document, Types } from "mongoose";

export class Phone {
  nombre: string;
  cedula: string;
  fecha_defuncion?: Date;
  telefono: string;
  eliminar?: boolean;
  email?: string;
  causa?: string;
}

export interface Province extends Document {
  numbers: Types.ObjectId[];
  name: string;
  message: string;
}

export interface Cliente extends Document {
  nombre: string;
  provincias: Province[];
}

export interface NumberModel extends Document {
  _id: Types.ObjectId;
  nombre: string;
  cedula: string;
  fecha_defuncion?: Date;
  provincia: Province;
  telefono: string;
  eliminar?: boolean;
  email?: string;
  causa?: string;
  enviado: Boolean;
}

export interface Params {
  phones: Phone[];
  province: Province;
}