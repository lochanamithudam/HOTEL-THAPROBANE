const { connectDB, Booking, transporter, mailUser, mailPass, setCors, getRoomBannerImage } = require('./_lib/db');

module.exports = async function handler(req, res) {
    setCors(res);

    // Vercel preflight
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    await connectDB();

    const bookingData = req.body;
    let savedToCloud = false;
    let emailSent = false;
    let emailErrorMessage = null;
    const bookingRef = 'HT-' + Date.now().toString().slice(-6);
    const roomName = bookingData.roomName || bookingData.roomCategory || 'Royal Oceanfront Suite';

    console.log(`📩 Booking: ${bookingData.guestName || 'Unknown'} (${roomName}) [${bookingRef}]`);

    // ── 1. Save to MongoDB ───────────────────────────────────────────────────
    try {
        const newBooking = new Booking({ ...bookingData, bookingRef });
        await newBooking.save();
        savedToCloud = true;
        console.log('✅ Booking saved to MongoDB Atlas');
    } catch (dbErr) {
        console.warn('⚠️ DB save failed:', dbErr.message);
    }

    // ── 2. Send Email ────────────────────────────────────────────────────────
    if (mailUser && mailPass) {
        try {
            const roomImage = getRoomBannerImage(roomName);
            const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const mailHtml = `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Reservation Confirmation - Hotel Thaprobane</title>
                <style type="text/css">
                    body { margin: 0; padding: 0; background-color: #0B192C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                    table { border-collapse: collapse; }
                    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    @media only screen and (max-width: 620px) {
                        .wrapper-table { width: 100% !important; padding: 10px !important; }
                        .content-cell { padding: 20px 16px !important; }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 30px 10px; background-color: #0B192C; -webkit-font-smoothing: antialiased;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B192C;">
                    <tr><td align="center">
                        <table class="wrapper-table" width="600" border="0" cellspacing="0" cellpadding="0"
                            style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.3);border:1px solid #1E293B;">

                            <!-- Header -->
                            <tr>
                                <td align="center" style="background:linear-gradient(180deg,#071322 0%,#0B192C 100%);padding:38px 24px 30px;text-align:center;border-bottom:2px solid #C5A880;">
                                    <div style="color:#D4AF37;font-size:13px;letter-spacing:5px;margin-bottom:8px;">★ ★ ★ ★ ★</div>
                                    <h1 style="margin:0;color:#FFFFFF;font-size:26px;font-weight:700;letter-spacing:4px;font-family:Georgia,serif;text-transform:uppercase;">HOTEL THAPROBANE</h1>
                                    <div style="margin-top:8px;font-size:11px;font-weight:600;letter-spacing:2.5px;color:#C5A880;text-transform:uppercase;">CEYLON LUXURY BEACHFRONT SANCTUARY &amp; SPA</div>
                                </td>
                            </tr>

                            <!-- Room Image -->
                            <tr>
                                <td style="padding:24px 28px 0;background-color:#FFFFFF;">
                                    <img src="${roomImage}" alt="${roomName}" width="544"
                                        style="width:100%;max-height:250px;object-fit:cover;display:block;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,0.08);" />
                                </td>
                            </tr>

                            <!-- Confirmation Badge -->
                            <tr>
                                <td style="padding:20px 28px 10px;background-color:#FFFFFF;text-align:center;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                        style="background-color:#F8FAF7;border:1px solid #D4E8D4;border-radius:10px;padding:12px 16px;">
                                        <tr><td align="center">
                                            <span style="display:inline-block;background-color:#0F5132;color:#D1E7DD;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 14px;border-radius:20px;">✓ RESERVATION CONFIRMED</span>
                                            <div style="font-size:13px;color:#475569;margin-top:6px;">
                                                Booking Reference: <strong style="color:#0B192C;font-family:'Courier New',monospace;font-size:14px;">${bookingRef}</strong>
                                            </div>
                                        </td></tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Welcome -->
                            <tr>
                                <td class="content-cell" style="padding:16px 28px 20px;background-color:#FFFFFF;">
                                    <h2 style="margin:0 0 8px;color:#0B192C;font-size:20px;font-family:Georgia,serif;font-weight:600;">Ayubowan, ${bookingData.guestName || 'Distinguished Guest'}</h2>
                                    <p style="margin:0;color:#475569;font-size:14px;line-height:1.65;">We are delighted to confirm your upcoming stay at <strong>Hotel Thaprobane</strong>. Nestled upon the pristine south-western coastline of Sri Lanka, our sanctuary awaits to offer you an unforgettable journey of serenity, oceanfront luxury, and bespoke Ayurvedic wellness.</p>
                                </td>
                            </tr>

                            <!-- Stay Details -->
                            <tr>
                                <td class="content-cell" style="padding:0 28px 24px;background-color:#FFFFFF;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                        style="background-color:#F8F9FA;border-radius:12px;border:1px solid #E2E8F0;margin-bottom:18px;overflow:hidden;">
                                        <tr>
                                            <td style="padding:12px 18px;background-color:#0B192C;border-bottom:1px solid #C5A880;">
                                                <span style="color:#D4AF37;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">🛎️ STAY &amp; SANCTUARY SPECIFICATIONS</span>
                                            </td>
                                        </tr>
                                        <tr><td style="padding:16px 18px;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="7" style="font-size:13.5px;color:#1E293B;">
                                                <tr>
                                                    <td width="38%" style="color:#64748B;font-weight:500;">Sanctuary Category:</td>
                                                    <td><strong style="color:#0B192C;font-size:14px;">${roomName}</strong></td>
                                                </tr>
                                                <tr style="border-top:1px solid #EDEDED;">
                                                    <td style="color:#64748B;font-weight:500;">Check-In Date:</td>
                                                    <td><strong>${bookingData.checkIn || 'N/A'}</strong> <span style="font-size:11.5px;color:#94A3B8;">(From 2:00 PM)</span></td>
                                                </tr>
                                                <tr style="border-top:1px solid #EDEDED;">
                                                    <td style="color:#64748B;font-weight:500;">Check-Out Date:</td>
                                                    <td><strong>${bookingData.checkOut || 'N/A'}</strong> <span style="font-size:11.5px;color:#94A3B8;">(Until 11:00 AM)</span></td>
                                                </tr>
                                                <tr style="border-top:1px solid #EDEDED;">
                                                    <td style="color:#64748B;font-weight:500;">Duration &amp; Party:</td>
                                                    <td><strong>${bookingData.nights || 1} Night(s)</strong> · <strong>${bookingData.guests || '2 Guests'}</strong></td>
                                                </tr>
                                            </table>
                                        </td></tr>
                                    </table>

                                    <!-- Guest Info -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                        style="background-color:#F8F9FA;border-radius:12px;border:1px solid #E2E8F0;margin-bottom:18px;overflow:hidden;">
                                        <tr>
                                            <td style="padding:12px 18px;background-color:#F1F5F9;border-bottom:1px solid #E2E8F0;">
                                                <span style="color:#334155;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">👤 GUEST INFORMATION</span>
                                            </td>
                                        </tr>
                                        <tr><td style="padding:14px 18px;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13.5px;color:#1E293B;">
                                                <tr>
                                                    <td width="38%" style="color:#64748B;font-weight:500;">Primary Guest:</td>
                                                    <td><strong>${bookingData.guestName || 'Website Guest'}</strong></td>
                                                </tr>
                                                <tr style="border-top:1px solid #EDEDED;">
                                                    <td style="color:#64748B;font-weight:500;">Email Address:</td>
                                                    <td><strong style="color:#0077B6;">${bookingData.guestEmail || 'Not Provided'}</strong></td>
                                                </tr>
                                                <tr style="border-top:1px solid #EDEDED;">
                                                    <td style="color:#64748B;font-weight:500;">Contact Phone:</td>
                                                    <td><strong>${bookingData.guestPhone || 'Not Provided'}</strong></td>
                                                </tr>
                                            </table>
                                        </td></tr>
                                    </table>

                                    <!-- Financial Breakdown -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                        style="background:linear-gradient(145deg,#071322 0%,#0B192C 100%);border-radius:12px;border:1px solid #1E293B;margin-bottom:22px;overflow:hidden;">
                                        <tr><td style="padding:22px 24px;">
                                            <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#C5A880;text-transform:uppercase;margin-bottom:12px;">FINANCIAL INVESTMENT BREAKDOWN</div>
                                            <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size:13.5px;color:rgba(255,255,255,0.85);">
                                                <tr>
                                                    <td>Subtotal Sanctuary Rate:</td>
                                                    <td align="right" style="font-weight:600;color:#FFFFFF;">$${bookingData.subtotal || 0} USD</td>
                                                </tr>
                                                <tr>
                                                    <td>Government Taxes &amp; Tourism Levy (12%):</td>
                                                    <td align="right" style="font-weight:600;color:#FFFFFF;">$${bookingData.tax || 0} USD</td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="border-top:1px solid rgba(197,168,128,0.3);padding-top:12px;"></td>
                                                </tr>
                                                <tr>
                                                    <td style="font-size:16px;font-weight:700;color:#D4AF37;font-family:Georgia,serif;">Total Guaranteed Amount:</td>
                                                    <td align="right" style="font-size:22px;font-weight:700;color:#D4AF37;font-family:Georgia,serif;">$${bookingData.totalAmount || 0} USD</td>
                                                </tr>
                                            </table>
                                            <div style="margin-top:14px;padding:8px 12px;background-color:rgba(197,168,128,0.12);border-radius:6px;border:1px solid rgba(197,168,128,0.25);text-align:center;font-size:11.5px;color:#E2E8F0;">
                                                🔒 Best Direct Rate Guaranteed · No upfront charge · Pay upon check-in
                                            </div>
                                        </td></tr>
                                    </table>

                                    <!-- Inclusions -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0"
                                        style="background-color:#FAF8F5;border-radius:12px;border:1px solid #EFE6D8;padding:18px 20px;margin-bottom:22px;">
                                        <tr><td>
                                            <strong style="color:#926C35;font-size:13px;letter-spacing:0.5px;display:block;margin-bottom:8px;text-transform:uppercase;">✨ COMPLIMENTARY SANCTUARY PRIVILEGES</strong>
                                            <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size:12.5px;color:#57442A;line-height:1.5;">
                                                <tr><td width="20" valign="top">☕</td><td>Daily Gourmet Ceylon Breakfast &amp; Sunset High Tea.</td></tr>
                                                <tr><td valign="top">🍹</td><td>Welcome Tropical Spiced Elixir &amp; Chilled Jasmine Towels.</td></tr>
                                                <tr><td valign="top">🏊</td><td>Unlimited Access to Cliffside Infinity Pools &amp; Secluded Beach.</td></tr>
                                                <tr><td valign="top">🛎️</td><td>Dedicated 24/7 Island Concierge &amp; Luggage Butler.</td></tr>
                                            </table>
                                        </td></tr>
                                    </table>

                                    <!-- WhatsApp CTA -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="center" style="padding:10px 0 16px;">
                                                <a href="https://wa.me/94771234567" target="_blank"
                                                    style="display:inline-block;background:linear-gradient(135deg,#0B192C 0%,#1E3A5F 100%);color:#D4AF37;font-size:13.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 34px;border-radius:8px;border:1px solid #C5A880;">
                                                    💬 Contact Island Concierge on WhatsApp
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color:#071322;padding:28px 24px;border-top:1px solid #1E293B;text-align:center;font-size:12px;color:#94A3B8;line-height:1.6;">
                                    <div style="font-family:Georgia,serif;font-size:14px;font-weight:600;color:#C5A880;letter-spacing:1px;margin-bottom:4px;">HOTEL THAPROBANE RESORT &amp; SPA</div>
                                    Galle Coastal Highway, Southwestern Coastline, Sri Lanka<br />
                                    Inquiries &amp; Reservations: +94 77 123 4567 · <a href="mailto:${mailUser}" style="color:#C5A880;text-decoration:none;">${mailUser}</a><br />
                                    <div style="margin-top:12px;font-size:11px;color:#64748B;">© 2026 Hotel Thaprobane. All Rights Reserved. Timeless Ceylon Hospitality.</div>
                                </td>
                            </tr>

                        </table>
                    </td></tr>
                </table>
            </body>
            </html>`;

            // Send to hotel admin
            await transporter.sendMail({
                from: `"Hotel Thaprobane" <${mailUser}>`,
                to: mailUser,
                replyTo: bookingData.guestEmail?.includes('@') ? bookingData.guestEmail : mailUser,
                subject: `🛎️ [${bookingRef}] Reservation: ${bookingData.guestName || 'Guest'} - ${roomName} (${timeStr})`,
                html: mailHtml
            });
            emailSent = true;
            console.log(`📧 Admin email sent [${bookingRef}]`);

            // Send copy to guest if different
            if (bookingData.guestEmail?.includes('@') &&
                bookingData.guestEmail.trim().toLowerCase() !== mailUser.toLowerCase()) {
                try {
                    await transporter.sendMail({
                        from: `"Hotel Thaprobane" <${mailUser}>`,
                        to: bookingData.guestEmail.trim(),
                        subject: `🛎️ [${bookingRef}] Your Reservation Confirmation - Hotel Thaprobane (${timeStr})`,
                        html: mailHtml
                    });
                    console.log(`📧 Guest copy sent to ${bookingData.guestEmail} [${bookingRef}]`);
                } catch (guestErr) {
                    console.warn('⚠️ Could not send guest copy:', guestErr.message);
                }
            }
        } catch (mailError) {
            emailErrorMessage = mailError.message;
            console.error('❌ Email send failed:', mailError.message);
        }
    }

    // ── 3. Respond ───────────────────────────────────────────────────────────
    return res.status(201).json({
        success: true,
        message: savedToCloud ? 'Booking saved to MongoDB Atlas' : 'Booking processed (DB unavailable)',
        savedToCloud,
        emailSent,
        bookingRef,
        emailError: emailErrorMessage
    });
};
