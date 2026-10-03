# 🏨 Hotel Thaprobane — Full Stack & Docker Email Fix Guide

> **Technical Reference & Step-by-Step Documentation**  
> මෙම ලේඛනය මඟින් ඇති වූ ගැටලු, ඒවා විසඳූ ආකාරය සහ අනාගතයේදී නැවත කර බලන අයුරු පියවරෙන් පියවර පැහැදිලි කරයි.

---

## 📌 1. පද්ධතියේ පසුබිම (System Overview)

* **Frontend:** HTML5, Modern CSS, Vanilla JavaScript (`js/app.js`)
* **Backend:** Node.js & Express (`server.js`)
* **Database:** MongoDB Atlas / Docker Mongo Container
* **Email System:** Nodemailer (Gmail SMTP - Port 465 SSL)
* **Containerization:** Docker & Docker Compose (Port Mapping: `8080:5000`)

---

## ⚠️ 2. ඇති වූ ප්‍රධාන ගැටලු (Problems Identified)

### ❌ ගැටලුව 1: Frontend එකෙන් වැරදි Port එකකට (`:5000`) Request යැවීම
* **හේතුව:** `js/app.js` හි fetch endpoints වල `window.location.port === '5000'` නම් පමණක් relative path එකක් ලෙස සකසා තිබුණි. වෙබ් අඩවිය Docker හරහා **Port 8080** මඟින් open කළ විට, Frontend එකෙන් request එක යවා තිබුණේ විවෘතව නොමැති `http://localhost:5000/api/bookings` වෙතය. එම නිසා request එක Server එකට නොපැමිණ fail විය.

### ❌ ගැටලුව 2: Email Environment Variable නම් නොගැලපීම
* **හේතුව:** `server.js` හි Nodemailer මඟින් Email යැවීම සඳහා `process.env.GMAIL_USER` සහ `process.env.GMAIL_PASS` බලාපොරොත්තු වූ නමුත්, `docker-compose.yml` හි තිබුණේ `EMAIL_USER` සහ `EMAIL_PASS` වේ.

### ❌ ගැටලුව 3: Nodemailer SSL / Port 465 සහ Password හි හිස්තැන් (Spaces)
* **හේතුව:** Docker Linux container තුළ `service: 'gmail'` භාවිතා කිරීමේදී DNS/IPv6 ගැටලු ඇතිවිය හැක. එසේම Google App Password එක Copy කරගැනීමේදී හිස්තැන් (spaces) තිබීමෙන් Authentication දෝෂ මතු විය හැක.

### ❌ ගැටලුව 4: CSS හි Empty Ruleset Warning එකක් තිබීම
* **හේතුව:** `css/style.css` හි Line 2132 හි `.gallery-item--wide { /* comment */ }` ලෙස හිස් block එකක් තිබීම නිසා ලින්ටර් warning එකක් මතු විය.

---

## 🛠️ 3. ගැටලු විසඳූ ආකාරය (Code Modifications)

### ✅ විසඳුම 1: `js/app.js` හි Fetch Endpoint නිවැරදි කිරීම
Port 8080 හෝ ඕනෑම HTTP/HTTPS සම්බන්ධතාවයකින් වෙබ් අඩවිය open කළ විට කෙලින්ම relative path එක (`/api/bookings`) භාවිතා වන ලෙස සකස් කරන ලදී.

```javascript
// පෙර (Before):
const endpoint = window.location.port === '5000'
  ? '/api/bookings'
  : 'http://localhost:5000/api/bookings';

// පසුව (After Fix):
const endpoint = window.location.protocol.startsWith('http')
  ? '/api/bookings'
  : 'http://localhost:5000/api/bookings';
```

---

### ✅ විසඳුම 2: `server.js` හි Email Transporter ශක්තිමත් කිරීම
`GMAIL_USER` සහ `EMAIL_USER` යන දෙකටම සහය දැක්වීම, Port 465 SSL භාවිතා කිරීම, App Password spaces ඉවත් කිරීම සහ Startup Verification එක් කිරීම:

```javascript
// 4. Email Transporter (supports GMAIL_USER or EMAIL_USER)
const mailUser = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
const mailPass = (process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
        user: mailUser,
        pass: mailPass
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Startup verification for Gmail SMTP
if (mailUser && mailPass) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Gmail SMTP Authentication/Connection Error:', error.message);
        } else {
            console.log(`✅ Gmail SMTP is authenticated & ready to send from: ${mailUser}`);
        }
    });
}
```

---

### ✅ විසඳුම 3: `docker-compose.yml` හි Environment Variables යාවත්කාලීන කිරීම

```yaml
services:
  web-app:
    build: .
    container_name: hotel-site
    restart: always
    ports:
      - "8080:5000"
    environment:
      - MONGO_URI=mongodb://database:27017/hotel_db
      - GMAIL_USER=lochanamithudam097@gmail.com
      - GMAIL_PASS=gljguakkenemhrkz
      - EMAIL_USER=lochanamithudam097@gmail.com
      - EMAIL_PASS=gljguakkenemhrkz
    depends_on:
      - database
```

---

### ✅ විසඳුම 4: `css/style.css` හි Empty Ruleset එක ඉවත් කිරීම
හිස්ව තිබූ `.gallery-item--wide { }` කොටස ඉවත් කර, සැබෑ styles අඩංගු `.gallery-item--wide img` කොටස නිවැරදිව තබා ගන්නා ලදී.

---

## 🚀 4. අනාගතයේදී නැවත කර බලන ආකාරය (How to Run & Test from Scratch)

### පියවර 1: පැරණි Container එක ඉවත් කරන්න
```powershell
docker compose down
```

### පියවර 2: අලුත් කේතය සමඟ Rebuild කර Start කරන්න
```powershell
docker compose up -d --build
```

### පියවර 3: Live Logs පරීක්ෂා කරන්න
```powershell
docker compose logs -f web-app
```
**බලාපොරොත්තු වන Log සටහන:**
```text
hotel-site  | Server running on http://localhost:5000
hotel-site  | Connecting to Primary DB: mongodb://database:27017/hotel_db
hotel-site  | ✅ Connected successfully to MongoDB Atlas: hotel_thaprobane (Primary)
hotel-site  | ✅ Gmail SMTP is authenticated & ready to send from: lochanamithudam097@gmail.com
```

### පියවර 4: Browser එකෙන් Form එක Submit කරන්න
1. Browser එකේ `http://localhost:8080` open කරන්න.
2. පැරණි cache ඉවත් වීමට **Ctrl + F5** (Hard Refresh) ඔබන්න.
3. Booking Form එක පුරවා Submit කරන්න.
4. Logs වල `📧 Confirmation email sent successfully to hotel admin` දැකගත හැකි වන අතර Gmail එකට Notification ලැබේ!

---

## 💡 5. මතක තබාගත යුතු වැදගත් කරුණු (Key Checklist)

1. **Docker Port Forwarding:** Frontend එක Docker container එකක් තුළ run වන විට hardcoded ports (උදා: `:5000`) වෙනුවට dynamic හෝ relative URLs (උදා: `/api/...`) භාවිතා කරන්න.
2. **Google App Password:** Gmail SMTP සඳහා සාමාන්‍ය Login Password එක වෙනුවට අනිවාර්යයෙන්ම **16-Digit App Password** එකක් (2-Step Verification සක්‍රිය කර) භාවිතා කළ යුතුය.
3. **Self-Sent Emails:** ඔබේම Gmail ලිපිනයෙන් එම ලිපිනයටම email එවූ විට Gmail විසින් එය **"All Mail"**, **"Sent"** හෝ **"Spam"** folders වලට දැමිය හැක.
