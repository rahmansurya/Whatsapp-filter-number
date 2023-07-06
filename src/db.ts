import mongoose from "mongoose";
import { config } from 'dotenv';

config();

mongoose.connect(process.env.URI).then(db => console.log('DB Connected'));