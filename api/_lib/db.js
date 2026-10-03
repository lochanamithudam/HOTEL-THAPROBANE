const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// ─── MongoDB Connection (cached for serverless warm reuse) ───────────────────
let cached = global._mongooseConnection;

async function connectDB() {
    if (cached && mongoose.connection.readyState === 1) return;

    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.warn('⚠️  No MONGO_URI in env — DB features disabled.');
        return;
    }

    try {
        await mongoose.connect(uri);
        global._mongooseConnection = true;
        console.log('✅ MongoDB Atlas connected');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
    }
}

// ─── Schemas & Models ────────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema({
    roomCategory:  String,
    checkIn:       String,
    checkOut:      String,
    guests:        String,
    nights:        Number,
    subtotal:      Number,
    tax:           Number,
    totalAmount:   Number,
    guestName:     { type: String, default: 'Website Guest' },
    guestEmail:    { type: String, default: 'Not Provided' },
    guestPhone:    { type: String, default: 'Not Provided' },
    bookingRef:    String,
    createdAt:     { type: Date, default: Date.now }
});

const subscriberSchema = new mongoose.Schema({
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    subscribedAt: { type: Date, default: Date.now }
});

const Booking    = mongoose.models.Booking    || mongoose.model('Booking',    bookingSchema);
const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

// ─── Nodemailer Transporter ──────────────────────────────────────────────────
const mailUser = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
const mailPass = (process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: mailUser, pass: mailPass },
    tls: { rejectUnauthorized: false }
});

// ─── CORS Helper ─────────────────────────────────────────────────────────────
function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ─── Room Banner Image Helper ─────────────────────────────────────────────────
function getRoomBannerImage(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('penthouse') || cat.includes('suite'))
        return 'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1200&auto=format&fit=crop';
    if (cat.includes('villa') || cat.includes('plunge') || cat.includes('heritage'))
        return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop';
    if (cat.includes('king') || cat.includes('deluxe') || cat.includes('pavilion'))
        return 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop';
}

module.exports = { connectDB, Booking, Subscriber, transporter, mailUser, mailPass, setCors, getRoomBannerImage };
