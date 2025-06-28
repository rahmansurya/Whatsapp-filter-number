const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const chalk = require("chalk");
const fs = require("fs");
const qrcode = require('qrcode-terminal');

class App {
   constructor() {
      this.sock = null;
   }

   async listen() {
      try {
         // Use multi-file auth state
         const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
         
         this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true,
            fireInitQueries: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
         })

         this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            
            if (qr) {
               console.log('QR Code generated, scan it with your phone')
               qrcode.generate(qr, { small: true })
            }
            
            if (connection === 'close') {
               const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
               console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)
               
               if (shouldReconnect) {
                  this.listen()
               }
            } else if (connection === 'open') {
               console.log(`${chalk.green("✓")} WhatsApp Connection is Open`)
               console.log(`${chalk.green("✓")} Ready - using Account Name: ${this.sock.user?.name || 'Unknown'}`)
               console.log(`${chalk.green("✓")} Ready - using Number: ${this.sock.user?.id?.split(':')[0] || 'Unknown'}`)
               
               // Start checking numbers after connection is established
               await this.checkNumbers()
            }
         })

         this.sock.ev.on('creds.update', saveCreds)

      } catch (error) {
         console.error('Error in listen:', error)
      }
   }

   async checkNumbers() {
      try {
         const filesTxt = "nomor.txt";
         
         if (!fs.existsSync(filesTxt)) {
            console.log(`${chalk.red("✗")} File ${filesTxt} not found!`)
            process.exit(1)
         }

         const numberRaw = fs.readFileSync(filesTxt, 'utf8')	
         const numberlist = numberRaw.replace(/\r/g, " ").replace(/\//g, "").replace(/\n/g, "").replace(/^\s*/, '').split(" ").filter(num => num.trim() !== '')
         
         console.log(`[${chalk.yellow('Work')}] Nomor WA yang di cek ada ${numberlist.length} nomor...`)

         // Check numbers with delay to avoid rate limiting
         for (let i = 0; i < numberlist.length; i++) {
            const number = numberlist[i].trim()
            if (number) {
               try {
                  // Format number properly
                  const contactId = number.includes('@s.whatsapp.net') ? number : number + '@s.whatsapp.net'
                  
                  // Use onWhatsApp method from new Baileys
                  const [result] = await this.sock.onWhatsApp(contactId)
                  
                  if (result && result.exists) {
                     console.log(chalk.blue.bold(number, '|AKTIF'))
                  } else {
                     console.log(chalk.bgRed(number, '|NON-WA'))
                  }
               } catch (error) {
                  console.log(chalk.red(number, '|ERROR:', error.message))
               }
               
               // Add delay between requests to avoid rate limiting
               if (i < numberlist.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 2000))
               }
            }
         }

         console.log("Checking completed. Bye...");
         process.exit(0);

      } catch (error) {
         console.error('Error in checkNumbers:', error)
         process.exit(1)
      }
   }
}

const server = new App();
server.listen();