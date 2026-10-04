const { connectDB, Subscriber, transporter, mailUser, mailPass, setCors } = require('./_lib/db');

module.exports = async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    await connectDB();

    const email = req.body?.email;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminEmail = mailUser || 'lochanamithudam097@gmail.com';

    console.log(`📩 Subscription: ${cleanEmail}`);

    // ── Save to MongoDB ───────────────────────────────────────────────────────
    try {
        await Subscriber.findOneAndUpdate(
            { email: cleanEmail },
            { email: cleanEmail, subscribedAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log('✅ Subscriber saved to MongoDB');
    } catch (dbErr) {
        console.warn('⚠️ Subscriber DB save failed:', dbErr.message);
    }

    // ── Send Emails ──────────────────────────────────────────────────────────
    let emailSent = false;
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
    <body style="margin:0;padding:20px 0;background-color:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:20px 0;">
            <tr><td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0"
                    style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background:linear-gradient(135deg,#023e8a 0%,#0077b6 100%);padding:30px 20px;text-align:center;">
                            <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#d4af37;text-transform:uppercase;margin-bottom:4px;">Exclusive Guest Register</div>
                            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:2px;font-family:Georgia,serif;">THAPROBANE CLUB PRIVILEGES</h1>
                        </td>
                    </tr>

                    <!-- Banner -->
                    <tr>
                        <td style="padding:0;line-height:0;">
                            <img src="${newsletterBanner}" alt="Hotel Thaprobane" width="600"
                                style="width:100%;max-height:220px;object-fit:cover;display:block;" />
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:30px 32px;">
                            <h2 style="margin:0 0 12px;color:#0f172a;font-size:18px;">Ayubowan &amp; Welcome,</h2>
                            <p style="margin:0 0 18px;color:#475569;font-size:14px;line-height:1.6;">
                                Thank you for subscribing to our private guest register. You have unlocked exclusive privileges reserved only for our distinguished club members.
                            </p>

                            <div style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:20px;margin-bottom:22px;">
                                <strong style="color:#023e8a;font-size:14px;display:block;margin-bottom:12px;">🌟 Your Unlocked Privileges:</strong>
                                <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13px;color:#334155;">
                                    <tr><td width="30">💎</td><td><strong>15% VIP Direct Rate Guarantee</strong> on all suites and pool villas.</td></tr>
                                    <tr><td>🍹</td><td><strong>Complimentary Sunset Cocktails</strong> at the Cliffside Ocean Bar.</td></tr>
                                    <tr><td>🕒</td><td><strong>Priority Early Check-in &amp; Late Check-out</strong> upon availability.</td></tr>
                                    <tr><td>📖</td><td><strong>Curated Ceylon Chronicles</strong> &amp; secret seasonal travel experiences.</td></tr>
                                </table>
                            </div>

                            <p style="font-size:13px;color:#64748b;margin:0;">
                                Registered Email: <strong style="color:#0f172a;">${cleanEmail}</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:11.5px;color:#94a3b8;">
                            Hotel Thaprobane Luxury Resort &amp; Spa · Southwestern Coastline, Sri Lanka<br>
                            © 2026 Hotel Thaprobane. All Rights Reserved.
                        </td>
                    </tr>

                </table>
            </td></tr>
        </table>
    </body>
    </html>`;

    if (mailUser && mailPass) {
        try {
            await transporter.sendMail({
                from: `"Hotel Thaprobane" <${adminEmail}>`,
                to: cleanEmail,
                subject: `✨ Welcome to Thaprobane Club Privileges (${timeStr})`,
                html: newsletterHtml
            });

            if (cleanEmail !== adminEmail.toLowerCase()) {
                try {
                    await transporter.sendMail({
                        from: `"Hotel Thaprobane" <${adminEmail}>`,
                        to: adminEmail,
                        subject: `📬 New Subscriber: ${cleanEmail} (${timeStr})`,
                        html: `<p>New subscriber on Hotel Thaprobane website:</p><p><strong>Email:</strong> ${cleanEmail}</p><p><strong>Date:</strong> ${new Date().toLocaleString()}</p>`
                    });
                } catch (adminErr) {
                    console.warn('Could not notify admin:', adminErr.message);
                }
            }

            emailSent = true;
            console.log(`📧 Subscription email sent to ${cleanEmail}`);
        } catch (mailErr) {
            console.error('❌ Subscription email failed:', mailErr.message);
        }
    }

    return res.status(200).json({
        success: true,
        emailSent,
        message: emailSent ? `Confirmation sent to ${cleanEmail}` : 'Subscribed successfully'
    });
};
