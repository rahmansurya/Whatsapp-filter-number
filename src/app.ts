import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import * as fs from "fs/promises";
import * as XLSX from "xlsx";
import * as path from "path";
import NumberModel from "./models/Number";
import Provincia from "./models/Provincia";
import Client from "./models/Cliente";
import "./db";
import {
  Cliente as ClienteType,
  Province as ProvinceType,
} from "./types/types";
import { ObjectId, Types } from "mongoose";

const xlsxPath = path.join(__dirname, "xlsx");

async function listen(client: any) {
  console.log("Cliente autenticado");
  await Provincia.deleteMany();
  await NumberModel.deleteMany();
  console.log('db borrada pa');
  if (!(await Client.findOne({ nombre: "NM" }))) {
    await Client.create({ nombre: "NM" });
  }
  if (!(await Client.findOne({ nombre: "FSL" }))) {
    await Client.create({ nombre: "FSL" });
  }
  const files = await fs.readdir(xlsxPath);
  for (const file of files) {
    const filePath = path.join(xlsxPath, file);
    if (file.endsWith(".xlsx")) {
      console.log(file);
      await processFile(filePath, client, "NM", file);
    }
  }
  console.log("Bye...");
  process.exit();
}

async function processFile(filePath: string, client: any, nombre: string, file: string) {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const checkedNumbers = [];
  const cliente: ClienteType = await (
    await Client.findOne({ nombre })
  ).populate("provincias");
  if (!cliente) throw Error("Ese cliente no existe");
  const provinceName = path
    .parse(path.basename(filePath))
    .name.split(" ")
    .slice(0, -1)
    .join(" ");
  let foundProvince: ProvinceType = cliente.provincias.find(
    (p) =>
      p.name ===
      path.parse(path.basename(filePath)).name.split(" ").slice(0, -1).join(" ")
  );
  if (!foundProvince) {
    const content = await fs.readFile(
      path.join(__dirname, "/text", provinceName),
      "utf-8"
    );
    foundProvince = new Provincia({
      name: provinceName,
      content
    });
    foundProvince = await foundProvince.save();
    cliente.provincias.push(foundProvince._id);
    await cliente.save();
    console.log(provinceName, "se guardó correctamente");
  } else {
    foundProvince = await Provincia.findById(foundProvince._id);
  }

  console.log(
    "Tiempo de ejecución aproximado:",
    (sheetData.length * 50) / 1000,
    "segundos"
  );
  await Promise.all(
    sheetData.map((row: any, i: number) => {
      return new Promise<void>(async (resolve) => {
        let phoneNumber = row[3];
        if (!phoneNumber) return;
        const contactId = phoneNumber.includes("@s.whatsapp.net")
          ? phoneNumber.replace(/^\s*/, "")
          : phoneNumber.replace(/^\s*/, "") + "@s.whatsapp.net";
        setTimeout(async () => {
          const result = await client.onWhatsApp(contactId);
          //console.log(result);
          if (result.length !== 0 && result[0].exists) {
            if (!/^5930/.test(phoneNumber) && !/^593\d/.test(phoneNumber)) {
              phoneNumber = phoneNumber.replace(/^(0*)(?!5930)(.*)$/, "5930$2");
            }
            const transformedPhone = phoneNumber
              .replace(/[- ]/g, "")
              .replace(/(?<=593)0/g, "");
            try {
              const newPhone = new NumberModel({
                _id: new Types.ObjectId(),
                nombre: row[0],
                cedula: row[1],
                telefono: transformedPhone,
                provincia: foundProvince._id,
              });
              await newPhone.save();
              checkedNumbers.push(newPhone);
            } catch (e) {
              console.log("No se pudo guardar", row[1], transformedPhone, i);
            }
          }
          resolve();
        }, i);
      });
    })
  );
  console.log(
    "Se obtuvo un total de",
    checkedNumbers.length,
    "/",
    sheetData.length,
    "de número válidos"
  );
  saveCheckedNumbersToFile(checkedNumbers, foundProvince);
}

async function saveCheckedNumbersToFile(numbers: any[], province) {
  province.numbers = province.numbers.concat(numbers);
  const savedProvince = await province.save();
  console.log(
    "Se guardaron",
    savedProvince.numbers.length,
    "números en la provincia",
    savedProvince.name
  );
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (lastDisconnect?.error?.output?.statusCode !== 401) {
        connectToWhatsApp();
      } else {
        console.log("Log out :(");
      }
    } else if (connection === "open") {
      console.log("opened connection");
      listen(sock);
    }
  });
}

connectToWhatsApp();
