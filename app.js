const { WAConnection, ReconnectMode } = require("@adiwajshing/baileys")
const chalk = require("chalk");
const fs = require("fs");

class App {
   App;
   constructor() {
      this.client = new WAConnection()
      this.client.autoReconnect = ReconnectMode.onAllErrors
      this.client.connectOptions.maxRetries = Infinity
      this.client.connectOptions.timeoutMs = 30 * 2000
   }

   async listen() {
      const authFile = '.auth_info_session.json'
      if (fs.existsSync(authFile)) {
         try {
           this.client.loadAuthInfo(authFile)
           await this.client.connect()
         } catch (err) {
           console.error(err)
         }
       } else {
         await this.client.connect()
         const authInfo = this.client.base64EncodedAuthInfo() // get all the auth info we need to restore this session
         fs.writeFileSync(authFile, JSON.stringify(authInfo, null, '\t')) // save this info to a file
              
       }
      var YourNumber = this.client.user.jid.substring(0, this.client.user.jid.lastIndexOf("@"));
      var filesTxt = "nomor.txt";          
   
      console.log(`${chalk.green("✓")} Whatsapp Connection is Open`)
      console.log(`${chalk.green("✓")} Ready - using Account Name: ${this.client.user.name}`)
      console.log(`${chalk.green("✓")} Ready - using Number of: `, YourNumber)

      const numberRaw =  fs.readFileSync(filesTxt, 'utf8')	
      const numberlist = numberRaw.replace(/\r/g, " ").replace(/\//g, "").replace(/\n/g, "").replace(/^\s*/, '').split(" ")
      console.log(`[${chalk.yellow('Work')}] Nomor Wa yang di cek ada ${numberlist.length} nomor...`)      
      
      await Promise.all(
         numberlist.map((number, i) => new Promise((resolve, reject) => {
           if (!isNaN(number) || number == '') {
             setTimeout(async () => {
                  const contactId = number.includes('@s.whatsapp.net') ? number.trim() : number.trim() + '@s.whatsapp.net'
                  const result = await this.client.isOnWhatsApp(contactId)             
                  result ? console.log(chalk.blue.bold(number.trim(),'|AKTIF')) : console.log(chalk.red.bold(number.trim(),'|NON-WA'))
               resolve()
             }, i * 5000)
           }
         } 
       )))
    console.log("Wassalam...");
    process.exit()
   }
}
const server = new App();
server.listen();