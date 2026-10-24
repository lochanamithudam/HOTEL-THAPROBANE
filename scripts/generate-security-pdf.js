const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function generatePDF() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const htmlFile = path.resolve(__dirname, '..', 'security-audit-report.html');
    const outputFile = path.resolve(__dirname, '..', 'HOTEL_THAPROBANE_SECURITY_AUDIT_REPORT.pdf');
    const htmlUrl = 'file:///' + htmlFile.replace(/\\/g, '/');

    console.log('📄 Launching Edge to generate Security Audit PDF...');
    console.log('Input HTML :', htmlUrl);
    console.log('Output PDF :', outputFile);

    const browser = await puppeteer.launch({
        executablePath: edgePath,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--allow-file-access-from-files'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Emulate screen / print media
        await page.emulateMediaType('print');

        await page.goto(htmlUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Small delay to ensure all webfonts from Google Fonts are rendered
        await new Promise(resolve => setTimeout(resolve, 1500));

        await page.pdf({
            path: outputFile,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '12mm',
                bottom: '14mm',
                left: '12mm',
                right: '12mm'
            },
            displayHeaderFooter: false
        });

        console.log('✅ Security Audit PDF successfully generated!');
        const stats = fs.statSync(outputFile);
        console.log(`📁 File Size: ${(stats.size / 1024).toFixed(2)} KB`);
    } catch (err) {
        console.error('❌ Failed to generate PDF:', err);
    } finally {
        await browser.close();
    }
}

generatePDF();
