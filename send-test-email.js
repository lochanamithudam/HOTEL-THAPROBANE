// send-test-email.js - Directly sends a real test email to check delivery
require('dotenv').config();
const nodemailer = require('nodemailer');

const gmailUser = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
const gmailPass = (process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');
const targetRecipient = process.argv[2] || gmailUser;

console.log('--------------------------------------------------');
console.log('📤 Sending Test Email From:', gmailUser);
console.log('📥 Recipient              :', targetRecipient);
console.log('--------------------------------------------------');

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

async function sendTest() {
    try {
        console.log('Connecting to smtp.gmail.com:465...');
        const timeNow = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateNow = new Date().toLocaleString();
        
        const info = await transporter.sendMail({
            from: `"Hotel Thaprobane" <${gmailUser}>`,
            to: targetRecipient,
            subject: `🛎️ TEST NOTIFICATION: Hotel Thaprobane [${timeNow}]`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; border: 2px solid #0077b6; border-radius: 12px; background-color: #f8fbff; max-width: 550px; margin: auto;">
                    <h2 style="color: #0077b6; margin-top: 0;">🏨 Hotel Thaprobane Email Test</h2>
                    <p style="font-size: 15px; color: #333;">This email confirms that Nodemailer is successfully communicating with Google SMTP.</p>
                    <div style="background-color: #ffffff; padding: 14px 18px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 16px 0;">
                        <p style="margin: 4px 0;"><strong>Sender Account:</strong> ${gmailUser}</p>
                        <p style="margin: 4px 0;"><strong>Delivered To:</strong> ${targetRecipient}</p>
                        <p style="margin: 4px 0;"><strong>Sent Timestamp:</strong> ${dateNow}</p>
                        <p style="margin: 4px 0;"><strong>Status:</strong> ✅ 250 OK Delivered</p>
                    </div>
                    <p style="font-size: 12px; color: #777; margin-bottom: 0;">Tip: If checking the sender account, also check the "Sent" folder or search <code>in:anywhere Thaprobane</code> in Gmail.</p>
                </div>
            `
        });
        console.log('✅ EMAIL ACCEPTED BY GMAIL SMTP!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response  :', info.response);
        console.log('   Accepted  :', info.accepted);
        console.log('\n📬 Delivery Checklist:');
        console.log('   1. If checking ' + targetRecipient + ': Check Inbox, Updates, Spam, and "Sent" folders.');
        console.log('   2. In Gmail search bar, type:  in:anywhere Thaprobane');
    } catch (err) {
        console.error('❌ EMAIL FAILED TO SEND!');
        console.error('   Error message:', err.message);
        console.error('   Error stack  :', err.stack);
    }
}

sendTest();
