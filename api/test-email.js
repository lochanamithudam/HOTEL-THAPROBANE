const { transporter, mailUser, mailPass, setCors } = require('./_lib/db');

module.exports = async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') return res.status(200).end();

    const targetEmail = req.query.email || req.body?.email || mailUser || 'lochanamithudam097@gmail.com';
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
                <div style="font-family:Arial,sans-serif;max-width:550px;margin:auto;padding:25px;border:2px solid #0077b6;border-radius:10px;background-color:#f8fbff;">
                    <h2 style="color:#0077b6;margin-top:0;">🎉 Hotel Thaprobane Email System Online</h2>
                    <p style="font-size:15px;color:#333;">This is a real-time live test confirming that your Gmail Nodemailer integration is working properly!</p>
                    <hr style="border:none;border-top:1px solid #ddd;margin:15px 0;" />
                    <p style="margin:6px 0;"><strong>Recipient:</strong> ${targetEmail}</p>
                    <p style="margin:6px 0;"><strong>Sender:</strong> ${mailUser}</p>
                    <p style="margin:6px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                    <p style="margin:6px 0;"><strong>Status:</strong> ✅ Active &amp; Connected</p>
                </div>
            `
        });

        console.log(`✅ Test email sent to ${targetEmail} (ID: ${info.messageId})`);
        return res.json({
            success: true,
            message: `Test email dispatched to ${targetEmail}`,
            messageId: info.messageId,
            recipient: targetEmail,
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
};
