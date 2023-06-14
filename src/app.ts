import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import * as fs from "fs/promises";
import * as XLSX from "xlsx";
import * as path from "path";

const xlsxPath = path.join(__dirname, "xlsx");
const checkedPath = path.join(__dirname, "checked");

async function listen(client: any) {
  console.log("Cliente autenticado");
  const files = await fs.readdir(xlsxPath);

  for (const file of files) {
    const filePath = path.join(xlsxPath, file);
    if (file.endsWith(".xlsx")) {
      console.log(file);
      await processFile(filePath, client, xlsxPath);
    }
  }

  console.log("Bye...");
  process.exit();
}

async function processFile(filePath: string, client: any, fileXlsx: string) {
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const checkedNumbers = [];
  await Promise.all(
    sheetData.map((row: any, i: number) => {
      return new Promise<void>(async (resolve) => {
        const phoneNumber = row[1];
        const contactId = phoneNumber.includes("@s.whatsapp.net")
          ? phoneNumber.replace(/^\s*/, "")
          : phoneNumber.replace(/^\s*/, "") + "@s.whatsapp.net";
        setTimeout(async () => {
          const result = await client.onWhatsApp(contactId);
          console.log(result);
          if (result.exists) {
            checkedNumbers.push(phoneNumber);
            console.log(phoneNumber);
          }
          resolve();
        }, i * 1000);
      });
    })
  );
  saveCheckedNumbersToFile(checkedNumbers, path.basename(fileXlsx));
}

function saveCheckedNumbersToFile(numbers: any[], originalFileName: string) {
  const modifiedFileName = `modificado_${originalFileName}`;
  const newWorkbook = XLSX.utils.book_new();
  const newWorksheet = XLSX.utils.json_to_sheet(numbers);
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");
  XLSX.writeFile(newWorkbook, path.join(checkedPath, modifiedFileName));
  console.log("hola");
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update: any) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      );
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");
      listen(sock);
    }
  });
}

connectToWhatsApp();
