const dotenv = require('dotenv');
dotenv.config();

const BREVO_API_KEY = process.env.SMTP_PASSWORD; // Your xsmtpsib- key
const SENDER_EMAIL = process.env.SMTP_FROM_EMAIL || 'agrifather26@gmail.com';

console.log('Testing Brevo Web API...');
console.log('Sender Email:', SENDER_EMAIL);

if (!BREVO_API_KEY) {
  console.error('Error: SMTP_PASSWORD (Brevo API Key) not found in .env');
  process.exit(1);
}

// Brevo Transactional Email v3 API is standard fetch
const body = JSON.stringify({
  sender: { name: 'AgriFather', email: SENDER_EMAIL },
  to: [{ email: SENDER_EMAIL }],
  subject: 'Brevo API Test Code 🌾',
  htmlContent: `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5faf5;border-radius:12px;padding:32px;">
      <h2 style="color:#2d7a23;margin-bottom:8px;">AgriFather Brevo Web API Test 🌾</h2>
      <p style="color:#333;">If you receive this, your Brevo Web API is working perfectly! Your test code is:</p>
      <div style="font-size:2.5rem;font-weight:bold;letter-spacing:12px;color:#2d7a23;text-align:center;padding:20px;background:#fff;border-radius:8px;border:2px dashed #a8d8a8;margin:20px 0;">888888</div>
      <p style="color:#666;font-size:0.9rem;">This is sent via Brevo HTTPS API. You are ready to go live!</p>
    </div>
  `
});

fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'api-key': BREVO_API_KEY,
    'content-type': 'application/json'
  },
  body: body
})
.then(async (res) => {
  const data = await res.json();
  if (res.ok) {
    console.log('✅ Success! Email sent via Brevo Web API. Message ID:', data.messageId);
  } else {
    console.error('❌ Failed to send via Brevo Web API:', data);
  }
})
.catch((err) => {
  console.error('❌ Network Error:', err.message);
});
