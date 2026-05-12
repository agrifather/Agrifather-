const nodemailer = require('nodemailer');
require('dotenv').config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_EMAIL;

console.log('--- Mailer Config ---');
console.log('Host:', SMTP_HOST);
console.log('Port:', SMTP_PORT);
console.log('Secure:', SMTP_SECURE);
console.log('User/Email:', SMTP_EMAIL);
console.log('From:', SMTP_FROM_EMAIL);
console.log('---------------------');

if (!SMTP_EMAIL || !SMTP_PASSWORD) {
  console.error('Error: SMTP_EMAIL and SMTP_PASSWORD must be configured in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_EMAIL,
    pass: SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const mailOptions = {
  from: `"AgriFather Test" <${SMTP_FROM_EMAIL}>`,
  to: SMTP_FROM_EMAIL, // Send test email to yourself
  subject: 'Brevo SMTP Test Code 🌾',
  html: `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5faf5;border-radius:12px;padding:32px;">
      <h2 style="color:#2d7a23;margin-bottom:8px;">AgriFather Brevo Test 🌾</h2>
      <p style="color:#333;">If you receive this, your Brevo SMTP is successfully configured and working! Your test code is:</p>
      <div style="font-size:2.5rem;font-weight:bold;letter-spacing:12px;color:#2d7a23;text-align:center;padding:20px;background:#fff;border-radius:8px;border:2px dashed #a8d8a8;margin:20px 0;">999999</div>
      <p style="color:#666;font-size:0.9rem;">This is a test notification. You are ready to go live!</p>
    </div>
  `
};

console.log('Sending test email to', SMTP_FROM_EMAIL, '...');
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Send Mail Failed:', error.message);
  } else {
    console.log('✅ Success! Test email sent successfully:', info.messageId);
    console.log('Response:', info.response);
  }
});
