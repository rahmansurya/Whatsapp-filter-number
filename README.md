# WhatsApp Number Filter

> This implementation uses [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) to check if phone numbers are registered on WhatsApp.

**00. Intro**
WhatsApp number filter tool comes in handy to check if a particular phone number is on WhatsApp or not.

You just need to enter your phone numbers into the "nomor.txt" file for bulk number checking.

**01. How to use ?**
- Clone or download this repo
- Enter to the project directory
- Run `npm install`
- Run `node app.js`
- Don't forget to input list of numbers (country code without +) in file "nomor.txt"     

Example format in nomor.txt:
```
6283XXXXXXXXX 
6282XXXXXXXXX 
6285XXXXXXXXX
```

**02. Process**
- Wait for connecting to WhatsApp Web
- Scan the QR Code with your phone
- The tool will automatically check your number list
- Results will be displayed showing AKTIF (active) or NON-WA (not on WhatsApp)

**03. Features**
- Uses WhatsApp Web client for reliable checking
- Automatic session persistence (no need to scan QR every time)
- Rate limiting to avoid being blocked
- Clear status indicators for each number
- Supports Indonesian phone number formatting

**04. Requirements**
- Node.js (v14 or higher recommended)
- Chrome/Chromium browser (automatically handled by Puppeteer)
- Active WhatsApp account for scanning QR code

**05. Notes**
- The first run requires QR code scanning
- Subsequent runs will use saved session data
- Add delays between checks to avoid rate limiting
- Tool automatically formats Indonesian numbers (adds 62 country code)

![Screenshot](https://user-images.githubusercontent.com/3745442/129669674-b924db39-0ec6-4556-bc84-581a2a926666.png)