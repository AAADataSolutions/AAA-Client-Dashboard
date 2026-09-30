const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > -1) {
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      env[k] = v;
    }
  }
});

async function testEmail() {
  console.log('--- Testing SMTP connection with current .env.local ---');
  console.log('Host:', env.SMTP_HOST);
  console.log('Port:', env.SMTP_PORT);
  console.log('User:', env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.office365.com',
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_SECURE === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('Connecting and verifying...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    console.log('Sending test email to', env.SMTP_USER, '...');
    const info = await transporter.sendMail({
      from: `"AAA Data Solutions" <${env.SMTP_USER}>`,
      to: env.SMTP_USER,
      subject: 'Test Email Verification',
      text: 'SMTP test successful.',
    });
    console.log('✅ Success! Message ID:', info.messageId);
  } catch (err) {
    console.error('\n❌ SMTP ERROR DETAILS:');
    console.error('Code:', err.code);
    console.error('Response:', err.response);
    console.error('Message:', err.message);
  }
}

testEmail();
