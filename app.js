const { WAConnection, ReconnectMode } = require("@adiwajshing/baileys");
const chalk = require("chalk");
const fs = require("fs");
const XLSX = require("xlsx");
const path = require('path');

const xlsxPath = path.join(__dirname, 'xlsx');
const checkedPath = path.join(__dirname, 'checked');

class App {
  constructor() {
    this.client = new WAConnection();
    this.client.autoReconnect = ReconnectMode.onAllErrors;
    this.client.connectOptions.maxRetries = Infinity;
    this.client.connectOptions.timeoutMs = 30 * 5000;
  }

  async listen() {
    const authFile = ".auth_info_session.json";
    if (fs.existsSync(authFile)) {
      try {
        this.client.loadAuthInfo(authFile);
        await this.client.connect();
      } catch (err) {
        console.error(err);
      }
    } else {
      await this.client.connect();
      const authInfo = this.client.base64EncodedAuthInfo();
      fs.writeFileSync(authFile, JSON.stringify(authInfo, null, "\t"));
    }

    const YourNumber = this.client.user.jid.substring(
      0,
      this.client.user.jid.lastIndexOf("@")
    );
    const fileXlsx = xlsxPath + "/numbers.xlsx";

    console.log(`${chalk.green("✓")} Whatsapp Connection is Open`);
    console.log(
      `${chalk.green("✓")} Ready - using Account Name: ${this.client.user.name}`
    );
    console.log(`${chalk.green("✓")} Ready - using Number of: `, YourNumber);

    const workbook = XLSX.readFile(fileXlsx);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "B" });

    console.log(
      `[${chalk.yellow("Work")}] Number of WhatsApp contacts to check: ${
        jsonData.length
      }`
    );

    await Promise.all(
      jsonData.map((row, i) => {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            const phoneNumber = row["Phone Number"];
            const contactId = phoneNumber.includes("@s.whatsapp.net")
              ? phoneNumber.replace(/^\s*/, "")
              : phoneNumber.replace(/^\s*/, "") + "@s.whatsapp.net";
            const result = await this.client.isOnWhatsApp(contactId);
            result
              ? console.log(chalk.blue.bold(phoneNumber.trim(), "| ACTIVE"))
              : console.log(chalk.bgRed(phoneNumber.trim(), "| NON-WA"));
            resolve();
          }, i * 1000);
        });
      })
    );

    console.log("Bye...");
    process.exit();
  }
}

const server = new App();
server.listen();
