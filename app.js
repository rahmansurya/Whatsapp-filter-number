const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require("socket.io");
const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const qrcode = require('qrcode-terminal');
const chalk = require("chalk");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

class App {
   constructor() {
      this.client = null;
      this.setupExpress();
   }

   setupExpress() {
      // Security middleware
      app.use(helmet());
      
      // Session middleware
      app.use(session({
         secret: 'whatsapp-checker-secret',
         resave: false,
         saveUninitialized: true,
         cookie: { secure: false }
      }));

      // Parse JSON bodies
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      // Serve static files
      app.use(express.static(path.join(__dirname, 'public')));

      // Routes
      app.get('/', (req, res) => {
         res.send('WhatsApp Number Checker is running!');
      });

      // Socket.IO connection handling
      io.on('connection', (socket) => {
         console.log('A user connected');
         
         socket.on('disconnect', () => {
            console.log('User disconnected');
         });
      });
   }

   async listen() {
      try {
         // Initialize WhatsApp Web client without Puppeteer/Chromium
         this.client = new Client({
            authStrategy: new LocalAuth({
               clientId: "whatsapp-checker"
            }),
            // Remove puppeteer configuration to avoid Chromium dependency
            webVersionCache: {
               type: 'remote',
               remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
            }
         });

         // Event listeners
         this.client.on('qr', (qr) => {
            console.log('QR Code generated, scan it with your phone');
            qrcode.generate(qr, { small: true });
         });

         this.client.on('ready', async () => {
            console.log(`${chalk.green("✓")} WhatsApp Web Client is ready!`);
            
            // Get client info
            const clientInfo = this.client.info;
            console.log(`${chalk.green("✓")} Ready - using Account Name: ${clientInfo.pushname || 'Unknown'}`);
            console.log(`${chalk.green("✓")} Ready - using Number: ${clientInfo.wid.user || 'Unknown'}`);
            
            // Start checking numbers after client is ready
            await this.checkNumbers();
         });

         this.client.on('authenticated', () => {
            console.log(`${chalk.green("✓")} WhatsApp Web Client authenticated`);
         });

         this.client.on('auth_failure', (msg) => {
            console.error(`${chalk.red("✗")} Authentication failed:`, msg);
         });

         this.client.on('disconnected', (reason) => {
            console.log(`${chalk.yellow("!")} WhatsApp Web Client disconnected:`, reason);
         });

         // Initialize the client
         await this.client.initialize();

      } catch (error) {
         console.error('Error in listen:', error);
      }
   }

   async checkNumbers() {
      try {
         const filesTxt = "nomor.txt";
         
         if (!fs.existsSync(filesTxt)) {
            console.log(`${chalk.red("✗")} File ${filesTxt} not found!`);
            process.exit(1);
         }

         const numberRaw = fs.readFileSync(filesTxt, 'utf8');	
         const numberlist = numberRaw.replace(/\r/g, " ").replace(/\//g, "").replace(/\n/g, "").replace(/^\s*/, '').split(" ").filter(num => num.trim() !== '');
         
         console.log(`[${chalk.yellow('Work')}] Nomor WA yang di cek ada ${numberlist.length} nomor...`);

         // Check numbers with delay to avoid rate limiting
         for (let i = 0; i < numberlist.length; i++) {
            const number = numberlist[i].trim();
            if (number) {
               try {
                  // Format number properly for whatsapp-web.js
                  let formattedNumber = number;
                  
                  // Remove any existing country code formatting
                  formattedNumber = formattedNumber.replace(/^\+/, '');
                  
                  // Add country code if not present (assuming Indonesian numbers)
                  if (!formattedNumber.startsWith('62')) {
                     if (formattedNumber.startsWith('0')) {
                        formattedNumber = '62' + formattedNumber.substring(1);
                     } else {
                        formattedNumber = '62' + formattedNumber;
                     }
                  }
                  
                  // Format for WhatsApp Web (add @c.us)
                  const formattedTarget = formattedNumber + '@c.us';
                  
                  // Check if number is registered on WhatsApp
                  const isRegistered = await this.client.isRegisteredUser(formattedTarget);
                  
                  if (isRegistered) {
                     console.log(chalk.blue.bold(number, '|AKTIF'));
                  } else {
                     console.log(chalk.bgRed(number, '|NON-WA'));
                  }
               } catch (error) {
                  console.log(chalk.red(number, '|ERROR:', error.message));
               }
               
               // Add delay between requests to avoid rate limiting
               if (i < numberlist.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay for stability
               }
            }
         }

         console.log("Checking completed. Bye...");
         
         // Destroy the client and exit
         await this.client.destroy();
         process.exit(0);

      } catch (error) {
         console.error('Error in checkNumbers:', error);
         await this.client.destroy();
         process.exit(1);
      }
   }

   startServer() {
      server.listen(PORT, () => {
         console.log(`${chalk.green("✓")} Express server running on port ${PORT}`);
         this.listen(); // Start WhatsApp client after server starts
      });
   }
}

const whatsappApp = new App();
whatsappApp.startServer();