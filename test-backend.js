
// test-backend.js - Comprehensive Diagnostic & Live Test Tool
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) { }

require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

console.log('====================================================');
console.log('🔍 HOTEL THAPROBANE - FULL BACKEND & EMAIL TEST');
console.log('====================================================\n');

const mongoURI = process.env.MONGO_URI;
const gmailUser = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
const gmailPass = (process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

console.log('📋 STEP 1: Environment Variables (.env)');
console.log('------------------------------------------------');
console.log('• MONGO_URI :', mongoURI ? `Found (${mongoURI.substring(0, 32)}...)` : '❌ MISSING in .env');
console.log('• GMAIL_USER:', gmailUser ? `Found (${gmailUser})` : '❌ MISSING in .env');
console.log('• GMAIL_PASS:', gmailPass ? `Found (${gmailPass.length} chars: ${gmailPass.substring(0, 3)}***)` : '❌ MISSING in .env');
console.log('');

async function runDiagnostics() {
    // -----------------------------------------------------------------
    // TEST 1: MongoDB Atlas Connection & Collection Check
    // -----------------------------------------------------------------
    console.log('📋 STEP 2: Testing MongoDB Atlas Connection');
    console.log('------------------------------------------------');
    if (!mongoURI) {
        console.error('❌ Cannot test MongoDB: MONGO_URI is missing in .env');
    } else {
        try {
            console.log('Connecting to MongoDB Atlas (5s timeout)...');
            await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
            console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
            console.log(`   Database Name : ${mongoose.connection.name}`);
            console.log(`   Host          : ${mongoose.connection.host}`);

            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('   Collections   :', collections.map(c => c.name).join(', ') || '(None yet)');

            // Check existing bookings count
            if (mongoose.connection.db) {
                const count = await mongoose.connection.db.collection('bookings').countDocuments();
                console.log(`   Total Bookings in Database: ${count}`);
            }

            await mongoose.disconnect();
        } catch (err) {
            console.error('❌ FAILED: MongoDB Atlas Connection Error!');
            console.error('   Error Code/Name:', err.name);
            console.error('   Error Message  :', err.message);
        }
    }
    console.log('');

    // -----------------------------------------------------------------
    // TEST 2: Gmail SMTP Authentication & Real Email Dispatch
    // -----------------------------------------------------------------
    console.log('📋 STEP 3: Testing Gmail & Sending Live Test Email');
    console.log('------------------------------------------------');
    if (!gmailUser || !gmailPass) {
        console.error('❌ Cannot test Gmail: GMAIL_USER or GMAIL_PASS is missing in .env');
    } else {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: gmailUser,
                pass: gmailPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        try {
            console.log('1. Verifying credentials with smtp.gmail.com...');
            await transporter.verify();
            console.log('   ✅ Gmail Login OK!');

            console.log(`2. Sending a live test email directly to: ${gmailUser}...`);
            const timestamp = new Date().toLocaleTimeString();
            const info = await transporter.sendMail({
                from: `"Hotel Thaprobane" <${gmailUser}>`,
                to: gmailUser,
                subject: `🛎️ TEST EMAIL: Hotel Thaprobane System Test at ${timestamp}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 25px; border: 2px solid #0077b6; border-radius: 10px; background-color: #f8fbff;">
                        <h2 style="color: #0077b6; margin-top: 0;">🎉 Hotel Thaprobane Email Test</h2>
                        <p style="font-size: 15px; color: #333;">This is a live confirmation that your Gmail Nodemailer integration is working 100% properly!</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />
                        <p style="margin: 6px 0;"><strong>Sender:</strong> ${gmailUser}</p>
                        <p style="margin: 6px 0;"><strong>Recipient:</strong> ${gmailUser}</p>
                        <p style="margin: 6px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                        <p style="margin: 6px 0;"><strong>Status:</strong> ✅ Active & Connected</p>
                    </div>
                `
            });

            console.log('   ✅ LIVE EMAIL DISPATCH SUCCESSFUL!');
            console.log('   • Message ID:', info.messageId);
            console.log('   • Accepted by Gmail Server:', info.accepted);
            console.log('\n📬 Check your Gmail account now:');
            console.log('   👉 Look for email labeled "me" or subject "🛎️ TEST EMAIL" in your Inbox / All Mail / Spam');
        } catch (err) {
            console.error('   ❌ EMAIL FAILED TO SEND!');
            console.error('   Error Code   :', err.code || err.responseCode);
            console.error('   Error Message:', err.message);
        }
    }

    console.log('\n====================================================');
    console.log('🏁 DIAGNOSTIC COMPLETE');
    console.log('====================================================\n');
    process.exit(0);
}

runDiagnostics();
