const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn('DNS server configuration skipped:', e.message);
}

const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();

// Security: Trust exactly 1 upstream reverse proxy (Cloudflare / Nginx / Vercel).
// This ensures req.ip reflects the real client IP from X-Forwarded-For safely,
// preventing attackers from spoofing the header to bypass rate limits. (SEC-03)
app.set('trust proxy', 1);

// Security: Helmet for HTTP headers protection with custom CSP for fonts/CDNs
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                mediaSrc: ["'self'", "blob:", "data:"],
                connectSrc: ["'self'", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

// Security & Robust Payload Handling: Body Parsers with limits & error handling
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Body-parser error handler (catches invalid JSON and oversized payload errors gracefully)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ Malformed JSON payload received:', err.message);
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload. Please verify request body formatting.',
            error: err.message
        });
    }
    if (err.status === 413 || err.type === 'entity.too.large') {
        console.error('❌ Payload too large rejected:', err.message);
        return res.status(413).json({
            success: false,
            message: 'Payload too large. Request body exceeds permitted size limit.',
            error: err.message
        });
    }
    next(err);
});

// Security: In-Memory Rate Limiter for API endpoints (prevents spam bots & DOS)
const apiRateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_API_REQUESTS = 30; // Max 30 requests per minute per IP

const apiRateLimiter = (req, res, next) => {
    // req.ip is safe because trust proxy is configured above (SEC-03)
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const clientData = apiRateLimitMap.get(clientIp) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    } else {
        clientData.count++;
    }

    apiRateLimitMap.set(clientIp, clientData);

    // Housekeeping: clean up stale entries periodically
    if (apiRateLimitMap.size > 1000) {
        for (const [ip, data] of apiRateLimitMap.entries()) {
            if (now > data.resetTime) apiRateLimitMap.delete(ip);
        }
    }

    if (clientData.count > MAX_API_REQUESTS) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please wait a minute and try again.'
        });
    }

    next();
};

app.use('/api/', apiRateLimiter);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (curl, Postman, mobile, server-to-server)
        if (!origin) return callback(null, true);
        // Allow any localhost / 127.0.0.1 port (covers Live Server, file://, etc.)
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // Allow file:// protocol (direct HTML open)
        if (origin === 'null') return callback(null, true);
        callback(null, true); // Allow all origins in development
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    credentials: true
}));

// Serve static frontend files (HTML, CSS, JS, Images, Videos) with optimized caching
const staticOptions = {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            // Never cache HTML so users always get fresh markup immediately
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
};

const mediaStaticOptions = {
    maxAge: '7d',
    setHeaders: (res) => {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
};

app.use('/css', express.static(path.join(__dirname, 'css'), staticOptions));
app.use('/js', express.static(path.join(__dirname, 'js'), staticOptions));
app.use('/Images', express.static(path.join(__dirname, 'Images'), mediaStaticOptions));
app.use('/Videos', express.static(path.join(__dirname, 'Videos'), mediaStaticOptions));
app.use('/fonts', express.static(path.join(__dirname, 'fonts'), mediaStaticOptions));
app.use(express.static(path.join(__dirname), staticOptions));

// 1. Connect to MongoDB Atlas (with Backup Fallback & Fast Timeout Protection)
const primaryURI = process.env.MONGO_URI;
const backupURI = process.env.MONGO_BACKUP_URI || primaryURI;

const MONGO_OPTIONS = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    bufferCommands: false
};

async function connectDB() {
    if (!primaryURI) {
        console.warn('⚠️ No MONGO_URI provided in .env. Server is in OFFLINE mode.');
        return;
    }

    try {
        console.log('Connecting to Primary DB:', primaryURI.replace(/:([^:@]+)@/, ':****@'));
        await mongoose.connect(primaryURI, MONGO_OPTIONS);
        console.log('✅ Connected successfully to MongoDB Atlas: hotel_thaprobane (Primary)');
    } catch (err) {
        console.warn('⚠️ Primary MongoDB connection failed / timed out:', err.message || err);
        if (backupURI && backupURI !== primaryURI) {
            console.log('🔄 Attempting backup connection...');
            try {
                console.log('Connecting to Backup DB:', backupURI.replace(/:([^:@]+)@/, ':****@'));
                await mongoose.connect(backupURI, MONGO_OPTIONS);
                console.log('✅ Connected successfully to MongoDB Atlas: hotel_thaprobane (Backup)');
            } catch (backupErr) {
                console.error('❌ Backup MongoDB connection error:', backupErr.message || backupErr);
                console.log('ℹ️ Server running in resilient in-memory mode (Cloud DB unavailable).');
            }
        } else {
            console.log('ℹ️ Server running in resilient in-memory mode (Cloud DB unavailable).');
        }
    }
}

// 2. Schemas & Models
const bookingSchema = new mongoose.Schema({
    roomCategory: String,
    roomName: String,
    checkIn: String,
    checkOut: String,
    guests: String,
    nights: Number,
    subtotal: Number,
    tax: Number,
    totalAmount: Number,
    guestName: { type: String, default: 'Website Guest' },
    guestEmail: { type: String, default: 'Not Provided' },
    guestPhone: { type: String, default: 'Not Provided' },
    bookingRef: String,
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    }
});

const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

// 4. Email Transporter (supports GMAIL_USER or EMAIL_USER)
const mailUser = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
const mailPass = (process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
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
} else {
    console.warn('⚠️ GMAIL_USER / EMAIL_USER or GMAIL_PASS / EMAIL_PASS is missing in environment.');
}

// Helper: Get high-resolution banner image URL based on room category
function getRoomBannerImage(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('penthouse') || cat.includes('suite')) {
        return 'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1200&auto=format&fit=crop';
    }
    if (cat.includes('villa') || cat.includes('plunge') || cat.includes('heritage')) {
        return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop';
    }
    if (cat.includes('king') || cat.includes('deluxe') || cat.includes('pavilion')) {
        return 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop';
}

// 5. API Routes
app.post('/api/bookings', async (req, res) => {
    // Safely parse request body across environments (handles objects, strings, buffers)
    let rawBody = req.body || {};
    if (typeof rawBody === 'string') {
        try {
            rawBody = JSON.parse(rawBody);
        } catch (e) {
            console.warn('⚠️ Could not parse req.body string as JSON:', e.message);
            rawBody = {};
        }
    } else if (Buffer.isBuffer(rawBody)) {
        try {
            rawBody = JSON.parse(rawBody.toString('utf-8'));
        } catch (e) {
            console.warn('⚠️ Could not parse req.body Buffer as JSON:', e.message);
            rawBody = {};
        }
    }

    const bodyObj = (rawBody.data && typeof rawBody.data === 'object')
        ? rawBody.data
        : (rawBody.booking && typeof rawBody.booking === 'object')
            ? rawBody.booking
            : rawBody;

    const bookingRef = 'HT-' + Date.now().toString().slice(-6);

    // Robust field normalization to avoid default value fallback
    const guestName = (bodyObj.guestName || bodyObj.name || bodyObj.fullName || bodyObj.guest_name || '').toString().trim();
    const guestEmail = (bodyObj.guestEmail || bodyObj.email || bodyObj.guest_email || '').toString().trim();
    const guestPhone = (bodyObj.guestPhone || bodyObj.phone || bodyObj.guest_phone || bodyObj.contact || bodyObj.tel || '').toString().trim();
    const roomName = (bodyObj.roomName || bodyObj.roomCategory || bodyObj.roomType || bodyObj.room || 'Royal Oceanfront Suite').toString().trim();
    const roomCategory = bodyObj.roomCategory || roomName;
    const checkIn = bodyObj.checkIn || bodyObj.checkin || bodyObj.check_in || '';
    const checkOut = bodyObj.checkOut || bodyObj.checkout || bodyObj.check_out || '';
    const guests = bodyObj.guests || bodyObj.guestCount || '2 Adults (Couple)';
    const nights = Number(bodyObj.nights) || 1;
    const subtotal = Number(bodyObj.subtotal) || 0;
    const tax = Number(bodyObj.tax) || 0;
    const totalAmount = Number(bodyObj.totalAmount || bodyObj.total || bodyObj.amount) || (subtotal + tax);

    const bookingData = {
        ...bodyObj,
        bookingRef,
        roomName,
        roomCategory,
        checkIn,
        checkOut,
        guests,
        nights,
        subtotal,
        tax,
        totalAmount,
        guestName: guestName || 'Website Guest',
        guestEmail: guestEmail || 'Not Provided',
        guestPhone: guestPhone || 'Not Provided'
    };

    let savedToCloud = false;
    let emailSent = false;
    let emailErrorMessage = null;

    console.log(`📩 Incoming booking request for: ${bookingData.guestName} (${roomName}) [${bookingRef}]`);

    // Step 1: Save to MongoDB Atlas with graceful fallback (no local file writes on read-only environments)
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
            const newBooking = new Booking(bookingData);
            await newBooking.save();
            savedToCloud = true;
            console.log(`✅ Booking [${bookingRef}] saved directly to MongoDB Atlas`);
        } catch (dbErr) {
            console.warn(`⚠️ Cloud save failed for [${bookingRef}]:`, dbErr.message);
            console.log('📋 Backup Reservation Log [In-Memory]:', JSON.stringify(bookingData));
        }
    } else {
        console.warn(`⚠️ Database not connected (readyState=${mongoose.connection ? mongoose.connection.readyState : 0}). Skipping cloud save gracefully.`);
        console.log('📋 Backup Reservation Log [In-Memory]:', JSON.stringify(bookingData));
    }

    // Step 2: Send Email notification
    if (mailUser && mailPass) {
        try {
            const roomImage = getRoomBannerImage(roomName);

            const mailHtml = `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Reservation Confirmation - Hotel Thaprobane</title>
                <style type="text/css">
                    body { margin: 0; padding: 0; background-color: #0B192C; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                    table { border-collapse: collapse; }
                    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    @media only screen and (max-width: 620px) {
                        .wrapper-table { width: 100% !important; padding: 10px !important; }
                        .content-cell { padding: 20px 16px !important; }
                        .col-stack { display: block !important; width: 100% !important; }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 30px 10px; background-color: #0B192C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B192C;">
                    <tr>
                        <td align="center">
                            
                            <!-- Master Card Container -->
                            <table class="wrapper-table" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid #1E293B;">
                                
                                <!-- 1. Luxury Dark Header -->
                                <tr>
                                    <td align="center" style="background: linear-gradient(180deg, #071322 0%, #0B192C 100%); padding: 38px 24px 30px 24px; text-align: center; border-bottom: 2px solid #C5A880;">
                                        
                                        <!-- Gold Stars / Crown Emblem -->
                                        <div style="color: #D4AF37; font-size: 13px; letter-spacing: 5px; margin-bottom: 8px;">★ ★ ★ ★ ★</div>
                                        
                                        <!-- Brand Title -->
                                        <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 700; letter-spacing: 4px; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; text-transform: uppercase;">
                                            HOTEL THAPROBANE
                                        </h1>
                                        
                                        <!-- Gold Subtitle Badge -->
                                        <div style="margin-top: 8px; font-size: 11px; font-weight: 600; letter-spacing: 2.5px; color: #C5A880; text-transform: uppercase;">
                                            CEYLON LUXURY BEACHFRONT SANCTUARY & SPA
                                        </div>

                                    </td>
                                </tr>

                                <!-- 2. Hero Room Banner Area -->
                                <tr>
                                    <td style="padding: 24px 28px 0 28px; background-color: #FFFFFF;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.08);">
                                            <tr>
                                                <td style="padding: 0; line-height: 0;">
                                                    <img src="${roomImage}" alt="${roomName}" width="544" style="width: 100%; max-height: 250px; object-fit: cover; display: block; border-radius: 12px;" />
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- 3. Reservation Confirmation Status Ribbon -->
                                <tr>
                                    <td style="padding: 20px 28px 10px 28px; background-color: #FFFFFF; text-align: center;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAF7; border: 1px solid #D4E8D4; border-radius: 10px; padding: 12px 16px;">
                                            <tr>
                                                <td align="center">
                                                    <span style="display: inline-block; background-color: #0F5132; color: #D1E7DD; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 14px; border-radius: 20px;">
                                                        ✓ RESERVATION CONFIRMED
                                                    </span>
                                                    <div style="font-size: 13px; color: #475569; margin-top: 6px;">
                                                        Booking Reference: <strong style="color: #0B192C; font-family: 'Courier New', monospace; font-size: 14px;">${bookingRef}</strong>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- 4. Welcome Note -->
                                <tr>
                                    <td class="content-cell" style="padding: 16px 28px 20px 28px; background-color: #FFFFFF;">
                                        <h2 style="margin: 0 0 8px 0; color: #0B192C; font-size: 20px; font-family: Georgia, serif; font-weight: 600;">
                                            Ayubowan, ${bookingData.guestName || 'Distinguished Guest'}
                                        </h2>
                                        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.65;">
                                            We are delighted to confirm your upcoming stay at <strong>Hotel Thaprobane</strong>. Nestled upon the pristine south-western coastline of Sri Lanka, our sanctuary awaits to offer you an unforgettable journey of serenity, oceanfront luxury, and bespoke Ayurvedic wellness.
                                        </p>
                                    </td>
                                </tr>

                                <!-- 5. Structured Details Cards -->
                                <tr>
                                    <td class="content-cell" style="padding: 0 28px 24px 28px; background-color: #FFFFFF;">
                                        
                                        <!-- Stay Details Card -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 18px; overflow: hidden;">
                                            <tr>
                                                <td style="padding: 12px 18px; background-color: #0B192C; border-bottom: 1px solid #C5A880;">
                                                    <span style="color: #D4AF37; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                                                        🛎️ STAY & SANCTUARY SPECIFICATIONS
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 16px 18px;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="7" style="font-size: 13.5px; color: #1E293B;">
                                                        <tr>
                                                            <td width="38%" style="color: #64748B; font-weight: 500;">Sanctuary Category:</td>
                                                            <td width="62%"><strong style="color: #0B192C; font-size: 14px;">${roomName}</strong></td>
                                                        </tr>
                                                        <tr style="border-top: 1px solid #EDEDED;">
                                                            <td style="color: #64748B; font-weight: 500;">Check-In Date:</td>
                                                            <td><strong>${bookingData.checkIn || 'N/A'}</strong> <span style="font-size: 11.5px; color: #94A3B8;">(From 2:00 PM)</span></td>
                                                        </tr>
                                                        <tr style="border-top: 1px solid #EDEDED;">
                                                            <td style="color: #64748B; font-weight: 500;">Check-Out Date:</td>
                                                            <td><strong>${bookingData.checkOut || 'N/A'}</strong> <span style="font-size: 11.5px; color: #94A3B8;">(Until 11:00 AM)</span></td>
                                                        </tr>
                                                        <tr style="border-top: 1px solid #EDEDED;">
                                                            <td style="color: #64748B; font-weight: 500;">Duration & Party:</td>
                                                            <td><strong>${bookingData.nights || 1} Night(s)</strong> · <strong>${bookingData.guests || '2 Guests'}</strong></td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Guest Information Card -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F9FA; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 18px; overflow: hidden;">
                                            <tr>
                                                <td style="padding: 12px 18px; background-color: #F1F5F9; border-bottom: 1px solid #E2E8F0;">
                                                    <span style="color: #334155; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                                                        👤 GUEST INFORMATION
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 14px 18px;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 13.5px; color: #1E293B;">
                                                        <tr>
                                                            <td width="38%" style="color: #64748B; font-weight: 500;">Primary Guest:</td>
                                                            <td width="62%"><strong>${bookingData.guestName || 'Website Guest'}</strong></td>
                                                        </tr>
                                                        <tr style="border-top: 1px solid #EDEDED;">
                                                            <td style="color: #64748B; font-weight: 500;">Email Address:</td>
                                                            <td><strong style="color: #0077B6;">${bookingData.guestEmail || 'Not Provided'}</strong></td>
                                                        </tr>
                                                        <tr style="border-top: 1px solid #EDEDED;">
                                                            <td style="color: #64748B; font-weight: 500;">Contact Phone:</td>
                                                            <td><strong>${bookingData.guestPhone || 'Not Provided'}</strong></td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Financial Investment Breakdown Card -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(145deg, #071322 0%, #0B192C 100%); border-radius: 12px; border: 1px solid #1E293B; margin-bottom: 22px; overflow: hidden; box-shadow: 0 10px 25px rgba(11,25,44,0.2);">
                                            <tr>
                                                <td style="padding: 22px 24px;">
                                                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #C5A880; text-transform: uppercase; margin-bottom: 12px;">
                                                        FINANCIAL INVESTMENT BREAKDOWN
                                                    </div>
                                                    
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13.5px; color: rgba(255,255,255,0.85);">
                                                        <tr>
                                                            <td>Subtotal Sanctuary Rate:</td>
                                                            <td align="right" style="font-weight: 600; color: #FFFFFF;">$${bookingData.subtotal || 0} USD</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Government Taxes & Tourism Levy (12%):</td>
                                                            <td align="right" style="font-weight: 600; color: #FFFFFF;">$${bookingData.tax || 0} USD</td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2" style="border-top: 1px solid rgba(197, 168, 128, 0.3); padding-top: 12px; margin-top: 8px;"></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="font-size: 16px; font-weight: 700; color: #D4AF37; font-family: Georgia, serif;">Total Guaranteed Amount:</td>
                                                            <td align="right" style="font-size: 22px; font-weight: 700; color: #D4AF37; font-family: Georgia, serif;">$${bookingData.totalAmount || 0} USD</td>
                                                        </tr>
                                                    </table>

                                                    <div style="margin-top: 14px; padding: 8px 12px; background-color: rgba(197, 168, 128, 0.12); border-radius: 6px; border: 1px solid rgba(197, 168, 128, 0.25); text-align: center; font-size: 11.5px; color: #E2E8F0;">
                                                        🔒 Best Direct Rate Guaranteed · No upfront charge · Pay upon check-in
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Complimentary Inclusions Box -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5; border-radius: 12px; border: 1px solid #EFE6D8; padding: 18px 20px; margin-bottom: 22px;">
                                            <tr>
                                                <td>
                                                    <strong style="color: #926C35; font-size: 13px; letter-spacing: 0.5px; display: block; margin-bottom: 8px; text-transform: uppercase;">
                                                        ✨ COMPLIMENTARY SANCTUARY PRIVILEGES
                                                    </strong>
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 12.5px; color: #57442A; line-height: 1.5;">
                                                        <tr>
                                                            <td width="20" valign="top">☕</td>
                                                            <td>Daily Gourmet Ceylon Breakfast & Sunset High Tea.</td>
                                                        </tr>
                                                        <tr>
                                                            <td valign="top">🍹</td>
                                                            <td>Welcome Tropical Spiced Elixir & Chilled Jasmine Towels.</td>
                                                        </tr>
                                                        <tr>
                                                            <td valign="top">🏊</td>
                                                            <td>Unlimited Access to Cliffside Infinity Pools & Secluded Beach.</td>
                                                        </tr>
                                                        <tr>
                                                            <td valign="top">🛎️</td>
                                                            <td>Dedicated 24/7 Island Concierge & Luggage Butler.</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Action / Concierge Button -->
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center" style="padding: 10px 0 16px 0;">
                                                    <a href="https://wa.me/94771234567" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0B192C 0%, #1E3A5F 100%); color: #D4AF37; font-size: 13.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; padding: 14px 34px; border-radius: 8px; border: 1px solid #C5A880; box-shadow: 0 4px 14px rgba(11,25,44,0.25);">
                                                        💬 Contact Island Concierge on WhatsApp
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>

                                <!-- 6. Luxury Footer -->
                                <tr>
                                    <td style="background-color: #071322; padding: 28px 24px; border-top: 1px solid #1E293B; text-align: center; font-size: 12px; color: #94A3B8; line-height: 1.6;">
                                        <div style="font-family: Georgia, serif; font-size: 14px; font-weight: 600; color: #C5A880; letter-spacing: 1px; margin-bottom: 4px;">
                                            HOTEL THAPROBANE RESORT & SPA
                                        </div>
                                        Galle Coastal Highway, Southwestern Coastline, Sri Lanka<br />
                                        Inquiries & Reservations: +94 77 123 4567 · <a href="mailto:${mailUser}" style="color: #C5A880; text-decoration: none;">${mailUser}</a><br />
                                        <div style="margin-top: 12px; font-size: 11px; color: #64748B;">
                                            © 2026 Hotel Thaprobane. All Rights Reserved. Timeless Ceylon Hospitality.
                                        </div>
                                    </td>
                                </tr>

                            </table>
                            <!-- End Master Card Container -->

                        </td>
                    </tr>
                </table>

            </body>
            </html>
            `;

            const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            // Send to Hotel Admin Email
            await transporter.sendMail({
                from: `"Hotel Thaprobane" <${mailUser}>`,
                to: mailUser,
                replyTo: bookingData.guestEmail && bookingData.guestEmail.includes('@') ? bookingData.guestEmail : mailUser,
                subject: `🛎️ [${bookingRef}] Reservation Confirmation: ${bookingData.guestName || 'Guest'} - ${roomName} (${timeStr})`,
                html: mailHtml
            });
            emailSent = true;
            console.log(`📧 Confirmation email sent successfully to hotel admin: ${mailUser} [${bookingRef}]`);

            // Send copy to guest if different valid email provided
            if (bookingData.guestEmail && bookingData.guestEmail.includes('@') && bookingData.guestEmail.trim().toLowerCase() !== mailUser.toLowerCase()) {
                try {
                    await transporter.sendMail({
                        from: `"Hotel Thaprobane" <${mailUser}>`,
                        to: bookingData.guestEmail.trim(),
                        subject: `🛎️ [${bookingRef}] Your Hotel Thaprobane Reservation Confirmation (${timeStr})`,
                        html: mailHtml
                    });
                    console.log(`📧 Confirmation copy sent to guest: ${bookingData.guestEmail} [${bookingRef}]`);
                } catch (guestErr) {
                    console.warn('⚠️ Could not send guest confirmation copy:', guestErr.message);
                }
            }
        } catch (mailError) {
            emailErrorMessage = mailError.message;
            console.error('❌ Email could not be sent:', mailError);
        }
    } else {
        console.warn('⚠️ GMAIL_USER / EMAIL_USER or GMAIL_PASS / EMAIL_PASS missing in environment');
    }

    // Step 3: Respond to frontend
    res.status(201).json({
        success: true,
        message: savedToCloud ? 'Booking saved to MongoDB Atlas' : 'Reservation received & processed (Database offline)',
        savedToCloud,
        emailSent,
        bookingRef: typeof bookingRef !== 'undefined' ? bookingRef : null,
        emailError: emailErrorMessage
    });
});

// ==========================================
// Subscription API Endpoint
// ==========================================
app.post('/api/subscribe', async (req, res) => {
    const email = req.body?.email;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        console.log(`📩 Incoming subscription request for: ${cleanEmail}`);

        // Save or update subscriber in MongoDB Atlas (upsert so repeat tests don't fail)
        if (mongoose.connection.readyState === 1) {
            await Subscriber.findOneAndUpdate(
                { email: cleanEmail },
                { email: cleanEmail, subscribedAt: new Date() },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log('✅ Subscription saved/updated in MongoDB Atlas');
        }

        // Mail options
        const adminEmail = mailUser || 'lochanamithudam097@gmail.com';
        const newsletterBanner = 'https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=1200&auto=format&fit=crop';
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const newsletterHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Thaprobane Club Privileges</title>
        </head>
        <body style="margin: 0; padding: 20px 0; background-color: #f1f5f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                            
                            <!-- Header -->
                            <tr>
                                <td align="center" style="background: linear-gradient(135deg, #023e8a 0%, #0077b6 100%); padding: 30px 20px; text-align: center;">
                                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #d4af37; text-transform: uppercase; margin-bottom: 4px;">Exclusive Guest Register</div>
                                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 2px; font-family: Georgia, serif;">THAPROBANE CLUB PRIVILEGES</h1>
                                </td>
                            </tr>

                            <!-- Banner Image -->
                            <tr>
                                <td style="padding: 0; line-height: 0;">
                                    <img src="${newsletterBanner}" alt="Hotel Thaprobane Ocean Panorama" width="600" style="width: 100%; max-height: 220px; object-fit: cover; display: block; border: 0;" />
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding: 30px 32px;">
                                    <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">Ayubowan & Welcome,</h2>
                                    <p style="margin: 0 0 18px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                        Thank you for subscribing to our private guest register. You have unlocked exclusive privileges reserved only for our distinguished club members.
                                    </p>

                                    <!-- Privileges List -->
                                    <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 22px;">
                                        <strong style="color: #023e8a; font-size: 14px; display: block; margin-bottom: 12px;">🌟 Your Unlocked Privileges:</strong>
                                        <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 13px; color: #334155;">
                                            <tr>
                                                <td width="30">💎</td>
                                                <td><strong>15% VIP Direct Rate Guarantee</strong> on all suites and pool villas.</td>
                                            </tr>
                                            <tr>
                                                <td>🍹</td>
                                                <td><strong>Complimentary Sunset Cocktails</strong> at the Cliffside Ocean Bar.</td>
                                            </tr>
                                            <tr>
                                                <td>🕒</td>
                                                <td><strong>Priority Early Check-in & Late Check-out</strong> upon availability.</td>
                                            </tr>
                                            <tr>
                                                <td>📖</td>
                                                <td><strong>Curated Ceylon Chronicles</strong> & secret seasonal travel experiences.</td>
                                            </tr>
                                        </table>
                                    </div>

                                    <p style="font-size: 13px; color: #64748b; margin: 0;">
                                        Registered Email: <strong style="color: #0f172a;">${cleanEmail}</strong>
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11.5px; color: #94a3b8;">
                                    Hotel Thaprobane Luxury Resort & Spa · Southwestern Coastline, Sri Lanka<br>
                                    © 2026 Hotel Thaprobane. All Rights Reserved.
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        // Send email
        let emailSent = false;
        if (mailUser && mailPass) {
            try {
                // Send to subscriber
                await transporter.sendMail({
                    from: `"Hotel Thaprobane" <${adminEmail}>`,
                    to: cleanEmail,
                    subject: `✨ Welcome to Thaprobane Club Privileges (${timeStr})`,
                    html: newsletterHtml
                });

                // Also send notification to admin if different
                if (cleanEmail !== adminEmail.toLowerCase()) {
                    try {
                        await transporter.sendMail({
                            from: `"Hotel Thaprobane" <${adminEmail}>`,
                            to: adminEmail,
                            subject: `📬 New Newsletter Subscriber: ${cleanEmail} (${timeStr})`,
                            html: `<p>New subscriber registered on Hotel Thaprobane website:</p><p><strong>Email:</strong> ${cleanEmail}</p><p><strong>Date:</strong> ${new Date().toLocaleString()}</p>`
                        });
                    } catch (adminErr) {
                        console.warn('Could not notify admin of subscriber:', adminErr.message);
                    }
                }

                emailSent = true;
                console.log(`📧 Confirmation email sent successfully to ${cleanEmail}`);
            } catch (mailErr) {
                console.error('❌ Subscription email failed:', mailErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            emailSent,
            message: emailSent ? 'Subscription successful! Check your email for confirmation.' : 'Subscribed successfully'
        });
    } catch (error) {
        console.error('❌ Error processing subscription:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process subscription. Please try again.',
            error: error.message
        });
    }
});

// ==========================================
// Instant Diagnostic / Test Email Endpoint
// ==========================================
app.all('/api/test-email', async (req, res) => {
    const adminEmail = (mailUser || 'lochanamithudam097@gmail.com').trim().toLowerCase();
    const requestedEmail = (req.query.email || req.body?.email || '').trim().toLowerCase();
    const adminKey = req.headers['x-admin-key'] || req.query.key;

    // Security (SEC-02): ADMIN_KEY is ALWAYS required to send to any address
    // other than the configured admin. No localhost/IP exception — fail-closed.
    const configuredAdminKey = process.env.ADMIN_KEY;
    let targetEmail = adminEmail;
    if (requestedEmail && requestedEmail !== adminEmail) {
        if (!configuredAdminKey || adminKey !== configuredAdminKey) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Test email can only be dispatched to the verified administrator address.'
            });
        }
        targetEmail = requestedEmail;
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!mailUser || !mailPass) {
        return res.status(500).json({
            success: false,
            message: 'GMAIL_USER or GMAIL_PASS is missing in environment.'
        });
    }

    try {
        const info = await transporter.sendMail({
            from: `"Hotel Thaprobane" <${mailUser}>`,
            to: targetEmail,
            subject: `🛎️ LIVE TEST EMAIL: Hotel Thaprobane System (${timeStr})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 25px; border: 2px solid #0077b6; border-radius: 10px; background-color: #f8fbff;">
                    <h2 style="color: #0077b6; margin-top: 0;">🎉 Hotel Thaprobane Email System Online</h2>
                    <p style="font-size: 15px; color: #333;">This is a real-time live test confirming that your Gmail Nodemailer integration is working 100% properly!</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />
                    <p style="margin: 6px 0;"><strong>Recipient:</strong> ${targetEmail}</p>
                    <p style="margin: 6px 0;"><strong>Sender:</strong> ${mailUser}</p>
                    <p style="margin: 6px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                    <p style="margin: 6px 0;"><strong>Status:</strong> ✅ Active & Connected</p>
                </div>
            `
        });

        console.log(`✅ Live test email dispatched to ${targetEmail} (ID: ${info.messageId})`);
        return res.json({
            success: true,
            message: `Live test email successfully dispatched to ${targetEmail}`,
            messageId: info.messageId,
            recipient: targetEmail,
            accepted: info.accepted,
            sentAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('❌ Test email failed:', err);
        return res.status(500).json({
            success: false,
            message: 'Email failed to send',
            error: err.message
        });
    }
});

// Fallback for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server & Connect DB
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    connectDB();
});