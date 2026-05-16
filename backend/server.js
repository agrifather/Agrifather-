const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

dotenv.config();

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'agrifather_super_secret_key_123';

// Nodemailer Config (Flexible SMTP supporting Gmail, Brevo, Resend, etc.)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_EMAIL;

let transporter;
if (SMTP_EMAIL && SMTP_PASSWORD) {
  // Gmail works best with nodemailer's built-in service configuration
  if (SMTP_HOST.includes('gmail.com')) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD
      }
    });
  } else {
    // Generic SMTP for Brevo, Resend, Mailgun, etc.
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Prevents SSL handshake issues with some hosts
      }
    });
  }
}

// Multer: store uploaded images in memory as Buffer
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrifather';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  crop: String,
  password: { type: String, default: 'password123' },
  profilePic: { type: String, default: '' }, // base64 data URL
  chatTokensUsed: { type: Number, default: 0 },
  lastChatReset: { type: Date, default: Date.now },
  imageTokensUsed: { type: Number, default: 0 },
  lastImageReset: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// ── In-memory OTP store ──────────────────────────────────────────────────────
// { mobile: { otp, expiresAt, purpose } }
const otpStore = {};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


app.get('/', (req, res) => {
  res.send('Agrifather API is running');
});

// API Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, mobile, email, crop, password, otp } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    // Verify OTP
    const record = otpStore[email];
    if (!record || record.purpose !== 'register') {
      return res.status(400).json({ message: 'No OTP requested for this email. Please request again.' });
    }
    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    let user = await User.findOne({ mobile });
    if (user) {
      return res.status(400).json({ message: 'User with this mobile already exists' });
    }
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    user = new User({ name, mobile, email, crop, password: hashedPassword });
    await user.save();
    
    // Clear OTP after successful registration
    delete otpStore[email];

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      message: 'User registered successfully', 
      token, 
      user: { 
        _id: user._id, 
        name: user.name, 
        mobile: user.mobile, 
        crop: user.crop, 
        profilePic: user.profilePic || '',
        chatTokensUsed: user.chatTokensUsed,
        imageTokensUsed: user.imageTokensUsed
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── OTP: Send Email for Registration & Login ──────────────────────────────────────────
app.post('/api/auth/send-otp-email', async (req, res) => {
  try {
    const { email, purpose = 'register' } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Valid email required' });
    }

    const user = await User.findOne({ email });
    
    if (purpose === 'register' && user) {
      return res.status(400).json({ message: 'Account already exists with this email' });
    }
    if ((purpose === 'login' || purpose === 'forgot-password') && !user) {
      return res.status(404).json({ message: 'No account found with this email. Please register.' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore[email] = { otp, expiresAt, purpose };

    console.log(`[EMAIL OTP] Email: ${email} | OTP: ${otp} | Purpose: ${purpose}`);

    let emailSent = false;

    // Direct HTTP API support for Brevo to bypass SMTP activation limitations
    if (SMTP_PASSWORD && SMTP_PASSWORD.startsWith('xkeysib-')) {
      try {
        console.log('[OTP] Attempting Brevo Transactional HTTP Web API...');
        const logoPath = path.join(__dirname, 'assets', 'logo_small.png');
        const logoBase64 = fs.existsSync(logoPath) ? fs.readFileSync(logoPath).toString('base64') : '';
        const logoDataUrl = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': SMTP_PASSWORD,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'AgriFather', email: SMTP_FROM_EMAIL },
            to: [{ email: email }],
            subject: 'Your AgriFather OTP Code',
            htmlContent: `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #f9fff9; border-radius: 16px; padding: 40px; border: 1px solid #e1f0e4; text-align: center;">
                <div style="margin-bottom: 30px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        ${logoBase64 ? `<img src="cid:logo_small.png" alt="AgriFather Logo" width="180" style="display: block; outline: none; border: none; text-decoration: none;" />` : '<h1 style="color: #2da84a; font-size: 28px; margin: 0;">AgriFather</h1>'}
                      </td>
                    </tr>
                  </table>
                </div>
                <h2 style="color: #1f2937; margin-bottom: 12px; font-size: 22px; font-weight: 700;">Verify Your Account</h2>
                <p style="color: #4b5563; margin-bottom: 30px; font-size: 16px; line-height: 1.5;">Hello! Use the following one-time password (OTP) to securely <b>${purpose === 'login' ? 'log in to' : purpose === 'forgot-password' ? 'reset password for' : 'register with'}</b> AgriFather.</p>
                <div style="background-color: #ffffff; border: 2px solid #2da84a; border-radius: 12px; padding: 24px; display: inline-block; margin-bottom: 30px;">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #2da84a;">${otp}</span>
                </div>
                <p style="color: #9ca3af; font-size: 14px;">This code is valid for 5 minutes. If you didn't request this, please ignore this email.</p>
                <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 500;">
                  © ${new Date().getFullYear()} AgriFather — Empowering Indian Farmers
                </div>
              </div>
            `,
            attachment: logoBase64 ? [
              {
                content: logoBase64,
                name: "logo_small.png"
              }
            ] : undefined
          })
        });

        const resData = await response.json();
        if (response.ok) {
          console.log('[OTP] Email sent successfully via Brevo Web API! Message ID:', resData.messageId);
          emailSent = true;
          return res.status(200).json({ 
            message: 'OTP sent to your email'
          });
        } else {
          console.error('[OTP] Brevo Web API returned error:', resData);
          // Don't return here; we'll let it fall back to standard SMTP if possible
        }
      } catch (apiErr) {
        console.error('[OTP] Brevo Web API Request Failed:', apiErr.message);
        // Fall back to standard SMTP transport if available
      }
    }

    if (!emailSent && transporter) {
      try {
        await transporter.sendMail({
          from: `"AgriFather" <${SMTP_FROM_EMAIL}>`,
          to: email,
          subject: "Your AgriFather OTP Code",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5faf5;border-radius:12px;padding:32px;border:1px solid #e1f0e4;">
              <div style="text-align:center;margin-bottom:20px;">
                <img src="cid:logo.png" alt="AgriFather" style="width:140px;height:auto;" />
              </div>
              <h2 style="color:#2d7a23;margin-bottom:8px;text-align:center;">AgriFather</h2>
              <p style="color: #4b5563; margin-bottom: 30px; font-size: 16px; line-height: 1.5;">Hello! Use the following one-time password (OTP) to securely <b>${purpose === 'login' ? 'log in to' : purpose === 'forgot-password' ? 'reset password for' : 'register with'}</b> AgriFather.</p>
              <div style="background-color: #ffffff; border: 2px solid #2da84a; border-radius: 12px; padding: 24px; display: inline-block; margin-bottom: 30px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #2da84a;">${otp}</span>
              </div>
              <p style="color: #9ca3af; font-size: 14px;">This code is valid for 5 minutes. If you didn't request this, please ignore this email.</p>
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 500;">
                © ${new Date().getFullYear()} AgriFather — Empowering Indian Farmers
              </div>
            </div>
          `,
          attachments: [{
            filename: 'logo.png',
            path: path.join(__dirname, 'assets', 'logo_small.png'),
            cid: 'logo.png'
          }]
        });
        console.log('[OTP] Email sent to:', email);
        res.status(200).json({ 
          message: 'OTP sent to your email'
        });
      } catch (mailErr) {
        console.error('[OTP] Email failed:', mailErr.message);
        // Even if email fails, return OTP in response so user can still login
        res.status(200).json({ 
          message: 'OTP generated (email delivery failed — check server logs)',
          emailFailed: true
        });
      }
    } else if (!emailSent) {
      console.log('SMTP not configured. Returning OTP in response for testing.');
      res.status(200).json({ message: 'OTP generated (Check Email)' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }
    // Verify password
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Fallback for plain text passwords in dev if needed, or just reject
      if (user.password !== password) {
        return res.status(401).json({ message: 'Incorrect password. Please try again.' });
      } else {
        // Upgrade password to hashed format if they login with plain text
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Store user info in response (exclude password)
    const userData = { 
      _id: user._id, 
      name: user.name, 
      mobile: user.mobile, 
      crop: user.crop, 
      profilePic: user.profilePic || '',
      chatTokensUsed: user.chatTokensUsed || 0,
      imageTokensUsed: user.imageTokensUsed || 0
    };
    res.status(200).json({ message: 'Login successful', token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Auth Middleware ────────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  
  // Backwards compatibility with old token format during transition
  if (token.startsWith('agrifather_token_')) {
    req.userId = token.replace('agrifather_token_', '');
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ── GET current user by ID from token ────────────────────────────────────────
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Update profile (name + profilePic) ───────────────────────────────────────
app.put('/api/auth/profile', requireAuth, upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`[Profile] Received update request for user: ${userId}`);
    const updateData = {};
    if (req.body.name) {
      console.log(`[Profile] Updating name to: ${req.body.name}`);
      updateData.name = req.body.name;
    }
    if (req.file) {
      console.log(`[Profile] Received file: ${req.file.originalname} (${req.file.size} bytes)`);
      const base64 = req.file.buffer.toString('base64');
      updateData.profilePic = `data:${req.file.mimetype};base64,${base64}`;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Profile updated', user: { _id: user._id, name: user.name, mobile: user.mobile, crop: user.crop, profilePic: user.profilePic || '' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Delete Account ─────────────────────────────────────────────────────────────
app.delete('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Deprecated mobile OTP logic (replaced by email OTP)
// app.post('/api/auth/send-otp', async (req, res) => { ... });

// ── OTP: Verify ───────────────────────────────────────────────────────────────
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, mobile, otp, purpose } = req.body;
    console.log(`[Verify OTP] Identifier: ${email || mobile} | OTP: ${otp} | Purpose: ${purpose}`);
    
    const identifier = email || mobile;
    const record = otpStore[identifier];

    if (!record) {
      console.warn(`[Verify OTP] No record found for ${identifier}`);
      return res.status(400).json({ message: 'No OTP requested for this email/number. Please request again.' });
    }
    if (Date.now() > record.expiresAt) {
      console.warn(`[Verify OTP] OTP expired for ${identifier}`);
      delete otpStore[identifier];
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== otp) {
      console.warn(`[Verify OTP] Incorrect OTP for ${identifier}. Expected: ${record.otp}, Got: ${otp}`);
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    console.log(`[Verify OTP] Success for ${identifier}`);
    // OTP is valid — clear it ONLY if not for forgot-password
    // (forgot-password needs it for the next reset step)
    if (purpose !== 'forgot-password') {
      delete otpStore[identifier];
    }

    let user;
    if (email) user = await User.findOne({ email });
    else user = await User.findOne({ mobile });
    
    let token = 'dummy_jwt_token';
    if (user && purpose === 'login') {
      token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    }
    
    res.status(200).json({ message: 'OTP verified successfully', token, user });
  } catch (err) {
    console.error('[Verify OTP] Server Error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── Reset Password ────────────────────────────────────────────────────────────
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const record = otpStore[email];
    if (!record || record.purpose !== 'forgot-password') {
      return res.status(400).json({ message: 'No reset request found for this email. Please try again.' });
    }
    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    delete otpStore[email];

    res.status(200).json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



app.get('/api/advisory', (req, res) => {
  res.status(200).json({
    crop: 'Wheat (Rabi)',
    stage: 'Tillering',
    recommendation: 'Check soil moisture immediately. Apply nitrogen-based fertilizer in exactly 2 days.'
  });
});

const seedsData = [
  { id: 'wheat', name: 'Wheat', category: 'CEREAL', sub: 'Lokwan Quality • Grade A', price: '₹2,400', unit: '/q', trend: 'positive', change: '+₹50 (2.1%)', desc: 'Wheat is an important source of carbohydrates. Globally, it is the leading source of vegetable protein in human food.' },
  { id: 'cotton', name: 'Cotton', category: 'FIBER', sub: 'Long Staple • Sharbati', price: '₹7,150', unit: '/q', trend: 'negative', change: '-₹120 (1.6%)', desc: 'Cotton is a soft, fluffy staple fiber that grows in a boll, or protective case, around the seeds of the cotton plants.' },
  { id: 'soybean', name: 'Soybean', category: 'OILSEED', sub: 'Yellow Variety • 10% Moisture', price: '₹4,820', unit: '/q', trend: 'positive', change: '+₹15 (0.3%)', desc: 'The soybean is an exceptionally nutritive and very rich protein food.' }
];

app.get('/api/seeds', (req, res) => {
  res.status(200).json(seedsData);
});

// Real-time Mandi Prices from Data.gov.in
app.get('/api/market/prices', async (req, res) => {
  try {
    const { state, limit = 50 } = req.query;
    let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=${limit}`;
    
    if (state) {
      url += `&filters[state]=${encodeURIComponent(state)}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Mandi API failure');
    
    const data = await response.json();
    const records = data.records || [];

    // Transform to match frontend format
    const transformed = records.map((r, index) => ({
      id: `mandi-${index}-${r.commodity.toLowerCase().replace(/\s+/g, '-')}`,
      name: r.commodity,
      category: 'MARKET',
      sub: `${r.variety} • ${r.market}, ${r.state}`,
      price: `₹${r.modal_price}`,
      unit: '/q',
      trend: index % 3 === 0 ? 'negative' : 'positive',
      change: index % 3 === 0 ? `-₹${Math.floor(Math.random() * 50)}` : `+₹${Math.floor(Math.random() * 50)} (1.2%)`,
      arrivalDate: r.arrival_date
    }));

    res.status(200).json(transformed);
  } catch (err) {
    console.error('Market prices fetch error:', err);
    // Fallback to seedsData if API fails
    res.status(200).json(seedsData);
  }
});

app.get('/api/market/fertilizers', (req, res) => {
  const fertilizers = [
    { id: 'f1', name: 'Urea', category: 'FERTILIZER', sub: 'Neem Coated • 45kg Bag', price: '₹266.50', unit: '/bag', trend: 'positive', change: 'Stable', desc: 'Government regulated price for 45kg bag.' },
    { id: 'f2', name: 'DAP', category: 'FERTILIZER', sub: 'Di-Ammonium Phosphate', price: '₹1,350', unit: '/bag', trend: 'positive', change: 'Stable', desc: 'Phosphatic fertilizer with 18% Nitrogen and 46% Phosphate.' },
    { id: 'f3', name: 'NPK (10:26:26)', category: 'FERTILIZER', sub: 'Complex Fertilizer', price: '₹1,470', unit: '/bag', trend: 'positive', change: 'Stable', desc: 'Balanced fertilizer for various crops.' },
    { id: 'f4', name: 'MOP', category: 'FERTILIZER', sub: 'Muriate of Potash', price: '₹1,700', unit: '/bag', trend: 'negative', change: '-₹30', desc: 'Potassic fertilizer for root development.' }
  ];
  res.status(200).json(fertilizers);
});

app.get('/api/seeds/:id', (req, res) => {
  const seed = seedsData.find(s => s.id === req.params.id);
  if (seed) {
    res.status(200).json(seed);
  } else {
    res.status(404).json({ message: 'Seed not found' });
  }
});

// Weather API
app.get('/api/weather', (req, res) => {
  res.status(200).json({
    location: 'Nagpur, Maharashtra',
    temp: '28°C',
    condition: 'Partly Cloudy',
    humidity: '65%',
    wind: '12 km/h',
    forecast: [
      { day: 'Mon', temp: '29°C', condition: 'Sunny' },
      { day: 'Tue', temp: '27°C', condition: 'Rain' },
      { day: 'Wed', temp: '28°C', condition: 'Cloudy' }
    ]
  });
});

// Pest ID API
app.post('/api/pest-id', (req, res) => {
  res.status(200).json({
    identifiedPest: 'Aphids',
    confidence: '94%',
    severity: 'High',
    treatment: 'Apply neem oil spray immediately. Repeat after 7 days.'
  });
});

// Livestock API
app.get('/api/livestock', (req, res) => {
  res.status(200).json([
    { type: 'Cow', count: 4, status: 'Healthy', nextVaccination: '12 Nov 2023', feed: 'Green Fodder + Concentrate' },
    { type: 'Buffalo', count: 2, status: 'Needs Attention', nextVaccination: '05 Nov 2023', feed: 'Dry Fodder' }
  ]);
});

// Schemes API
app.get('/api/schemes', (req, res) => {
  res.status(200).json([
    { name: 'PM Kisan Samman Nidhi', amount: '₹6000/year', status: 'Active', eligibility: 'Small & Marginal Farmers' },
    { name: 'Pradhan Mantri Fasal Bima Yojana', amount: 'Crop Insurance', status: 'Apply Now', eligibility: 'All Farmers' },
    { name: 'Kisan Credit Card', amount: 'Up to ₹3 Lakhs', status: 'Available', eligibility: 'Farmers with land records' }
  ]);
});

// ── Agriculture Topic Classifier ─────────────────────────────────────────────
// Returns true if the message is related to agriculture/farming topics
function isAgricultureRelated(text) {
  const lower = text.toLowerCase();

  // ── ALLOWED keywords ──
  const agriKeywords = [
    // crops & plants
    'crop','crops','plant','plants','seed','seeds','farming','farm','farmer','farmers',
    'agriculture','agricultural','kheti','fasal','kisan','kisaan','beej',
    // soil & irrigation
    'soil','mitti','irrigation','drip','sprinkler','fertilizer','fertiliser',
    'fertilizer','urea','dap','npk','compost','manure','khad','jaivik',
    // pest & disease
    'pest','pests','disease','fungal','fungus','blight','rust','wilt','rot',
    'insect','aphid','whitefly','mealybug','nematode','spray','pesticide','keetnaashak',
    // fruits & vegetables
    'fruit','fruits','vegetable','vegetables','tomato','potato','onion','garlic','wheat',
    'rice','paddy','maize','corn','soybean','cotton','sugarcane','mango','banana',
    'papaya','guava','lemon','orange','grapes','pomegranate','apple','pear','peach',
    'watermelon','cucumber','brinjal','capsicum','chilli','spinach','coriander',
    'fenugreek','ginger','turmeric','carrot','radish','peas','beans','lentil',
    'chickpea','mustard','sunflower','groundnut','peanut','coconut','cashew',
    'arhar','urad','moong','bajra','jowar','ragi','tur','dal','sabzi','phal',
    // mandi & market
    'mandi','market','price','rate','bhav','daam','sell','selling','auction',
    'wholesale','retail','agmark','apmc','mandibhav','fasal bhav',
    // weather & season
    'weather','rain','rainfall','monsoon','drought','flood','temperature','humidity',
    'forecast','barish','mausam','thand','garmi','ritu','season','winter','summer',
    'rabi','kharif','zaid','irrigation','canal',
    // government schemes
    'scheme','yojana','pm kisan','pmfby','kcc','kisan credit','subsidy','loan',
    'insurance','fasal bima','government','sarkar','anudan',
    // livestock & poultry
    'livestock','cattle','cow','buffalo','goat','sheep','poultry','chicken','hen',
    'dairy','milk','doodh','pashu','murga','murgi','bakri','gaay','bhains',
    // horticulture & others
    'horticulture','greenhouse','polyhouse','drip','mulching','grafting','pruning',
    'harvest','harvesting','threshing','storage','cold storage','silo','warehouse',
    'organic','jaivik kheti','biofertilizer','vermicompost','green manure',
    'tractor','pump','sprayer','equipment','machinery','tool',
    // greetings & simple help (allow basic greetings)
    'hello','hi','help','namaste','namaskar','kya hal','kaise ho','shukriya','thanks',
    'thank you','aap','mera','meri','mujhe','kripya','please','batao','bataiye',
  ];

  // ── BLOCKED keywords — instantly off-topic ──
  const blockedKeywords = [
    // sports
    'cricket','ipl','csk','rr','rcb','mi','kkr','srh','dc','pbks','lsg','gt',
    'football','soccer','tennis','badminton','hockey','kabaddi','chess','match',
    'score','wicket','boundary','six','four','over','inning','player','team',
    // entertainment
    'movie','film','series','web series','netflix','hotstar','amazon prime',
    'song','music','singer','actor','actress','bollywood','hollywood','celebrity',
    // tech & coding
    'code','coding','programming','python','javascript','react','node','html','css',
    'software','app','website','computer','laptop','mobile phone','android','ios',
    'chatgpt','openai','google','facebook','instagram','twitter','youtube',
    // finance (non-farm)
    'stock','share market','sensex','nifty','mutual fund','crypto','bitcoin',
    'investment','trading','bank account','emi','loan' ,
    // general knowledge / trivia
    'capital of','president','prime minister','history','geography','science',
    'math','algebra','calculus','physics','chemistry','biology',
    'recipe','cook','cooking','restaurant','food delivery','zomato','swiggy',
    // sports results
    'who will win','who won','match result','live score',
  ];

  // Removing blockedKeywords filter to prevent false positives (like "tractor loan")
  // Let the LLM handle all topic moderation.
  return true;
}

// ── Mandi Rates API Integration ───────────────────────────────────────────────
async function fetchMandiRatesContext(message) {
  const lower = message.toLowerCase();
  const priceKeywords = ['mandi', 'price', 'rate', 'bhav', 'daam', 'market', 'cost', 'keemat', 'mol', 'dam', 'bazaar', 'bazar', 'wholesale', 'retail'];
  const isAskingPrice = priceKeywords.some(w => lower.includes(w));
  if (!isAskingPrice) return null;

  // 1. Extract Crop/Fruit — expanded list with Hindi synonyms
  const cropsList = [
    'wheat','gehu','cotton','kapas','soybean','soya','rice','chawal','paddy','dhan','maize','makka',
    'onion','pyaj','tomato','tamatar','potato','aloo','apple','seb','mango','aam','banana','kela',
    'grapes','angoor','pomegranate','anar','orange','santra','lemon','nimbu','chilli','mirchi',
    'garlic','lehsun','lahsun','ginger','adrak','turmeric','haldi','mustard','sarson','moong','urad',
    'arhar','toor','tur','chana','gram','masoor','groundnut','mungfali','sugarcane','ganna',
    'coconut','nariyal','papaya','guava','amrud','watermelon','tarbooj','peas','matar',
    'cauliflower','phool gobhi','cabbage','patta gobhi','brinjal','baingan','ladyfinger','bhindi',
    'carrot','gajar','radish','mooli','spinach','palak','coriander','dhaniya','cumin','jeera',
    'saffron','kesar','cardamom','elaichi','pepper','kali mirch','cashew','kaju','almond','badam',
    'fertilizer','urea','dap','npk','potash'
  ];
  let crop = cropsList.find(c => lower.includes(c)) || 'Commodity';
  
  // Mapping synonyms to API standard commodity names
  const apiMapping = {
    'apple': 'Apple', 'seb': 'Apple',
    'mango': 'Mango', 'aam': 'Mango',
    'wheat': 'Wheat', 'gehu': 'Wheat',
    'onion': 'Onion', 'pyaj': 'Onion',
    'tomato': 'Tomato', 'tamatar': 'Tomato',
    'potato': 'Potato', 'aloo': 'Potato',
    'rice': 'Rice', 'chawal': 'Rice', 'paddy': 'Paddy(Dhan)(Common)', 'dhan': 'Paddy(Dhan)(Common)',
    'banana': 'Banana', 'kela': 'Banana',
    'cotton': 'Cotton', 'kapas': 'Cotton',
    'soybean': 'Soyabean', 'soya': 'Soyabean',
    'maize': 'Maize', 'makka': 'Maize',
    'garlic': 'Garlic', 'lehsun': 'Garlic', 'lahsun': 'Garlic',
    'ginger': 'Ginger(Green)', 'adrak': 'Ginger(Green)',
    'turmeric': 'Turmeric', 'haldi': 'Turmeric',
    'mustard': 'Mustard', 'sarson': 'Mustard',
    'chana': 'Bengal Gram(Gram)(Whole)', 'gram': 'Bengal Gram(Gram)(Whole)',
    'arhar': 'Arhar (Tur/Red Gram)(Whole)', 'toor': 'Arhar (Tur/Red Gram)(Whole)', 'tur': 'Arhar (Tur/Red Gram)(Whole)',
    'moong': 'Green Gram (Moong)(Whole)', 'urad': 'Black Gram (Urd Beans)(Whole)',
    'masoor': 'Masoor Dal', 'lemon': 'Lemon', 'nimbu': 'Lemon',
    'orange': 'Orange', 'santra': 'Orange',
    'grapes': 'Grapes', 'angoor': 'Grapes',
    'pomegranate': 'Pomegranate', 'anar': 'Pomegranate',
    'chilli': 'Chillies (Green)', 'mirchi': 'Chillies (Green)',
    'groundnut': 'Groundnut', 'mungfali': 'Groundnut',
    'sugarcane': 'Sugarcane', 'ganna': 'Sugarcane',
    'coconut': 'Coconut', 'nariyal': 'Coconut',
    'peas': 'Peas(Green)', 'matar': 'Peas(Green)',
    'cauliflower': 'Cauliflower', 'phool gobhi': 'Cauliflower',
    'cabbage': 'Cabbage', 'patta gobhi': 'Cabbage',
    'brinjal': 'Brinjal', 'baingan': 'Brinjal',
    'ladyfinger': 'Bhindi(Ladies Finger)', 'bhindi': 'Bhindi(Ladies Finger)',
    'carrot': 'Carrot', 'gajar': 'Carrot',
    'radish': 'Raddish', 'mooli': 'Raddish',
    'spinach': 'Spinach', 'palak': 'Spinach',
    'guava': 'Guava', 'amrud': 'Guava',
    'papaya': 'Papaya',
    'cumin': 'Cummin Seed(Jeera)', 'jeera': 'Cummin Seed(Jeera)',
    'coriander': 'Coriander(Leaves)', 'dhaniya': 'Coriander(Leaves)',
    'urea': 'Urea', 'dap': 'DAP', 'npk': 'NPK', 'potash': 'Potash',
    'fertilizer': 'Urea'
  };
  const apiCropName = apiMapping[crop.toLowerCase()] || crop.charAt(0).toUpperCase() + crop.slice(1);

  // 2. Extract State — expanded list
  const states = [
    'Maharashtra','Gujarat','Rajasthan','Punjab','Haryana','Uttar Pradesh','Madhya Pradesh',
    'Karnataka','Tamil Nadu','Andhra Pradesh','Telangana','Kerala','Bihar','West Bengal',
    'Odisha','Chhattisgarh','Jharkhand','Assam','Uttarakhand','Himachal Pradesh',
    'Jammu and Kashmir','Goa','Tripura','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim',
    'Arunachal Pradesh','Delhi','Chandigarh','Puducherry'
  ];
  let state = states.find(s => lower.includes(s.toLowerCase()));

  try {
    let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=15`;
    
    if (apiCropName !== 'Commodity') {
      url += `&filters[commodity]=${encodeURIComponent(apiCropName)}`;
    }
    if (state) {
      url += `&filters[state]=${encodeURIComponent(state)}`;
    }

    console.log(`[Mandi API] Fetching: ${apiCropName} in ${state || 'All India'}`);
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.records && data.records.length > 0) {
        const summary = data.records.map(r => 
          `${r.state} → ${r.market}: ${r.commodity} (${r.variety || 'Standard'}) = Min ₹${r.min_price} / Max ₹${r.max_price} / Modal ₹${r.modal_price} per quintal [Date: ${r.arrival_date || 'Today'}]`
        ).join('\n');
        
        return `[SYSTEM ALERT: LIVE MANDI PRICE DATA from Government of India (data.gov.in) →\n${summary}\nIMPORTANT: Present this data in a clean table format to the user. Show State, Market, Commodity, Min/Max/Modal Price. Always mention this is REAL-TIME government data.]`;
      }
    }
  } catch (err) {
    console.error('Mandi API fetch failed', err);
  }

  return `[SYSTEM ALERT: Mandi API → No live data found for "${apiCropName}" right now. Provide recent market estimates for "${apiCropName}" based on your knowledge of Indian agriculture. Mention approximate price ranges per quintal.]`;
}

// ── Government Agriculture Schemes Context ────────────────────────────────────
function getGovSchemeContext(message) {
  const lower = message.toLowerCase();
  const schemeKeywords = ['scheme', 'yojana', 'subsidy', 'government', 'sarkari', 'sarkar', 'pm kisan', 'pmkisan', 'pmfby', 'kcc', 'kisan credit', 'fasal bima', 'soil health', 'e-nam', 'enam', 'neem coated', 'msp', 'minimum support', 'pradhan mantri', 'grant', 'loan', 'rin', 'help from government', 'benefit', 'labh', 'sahay'];
  const isAskingScheme = schemeKeywords.some(w => lower.includes(w));
  if (!isAskingScheme) return null;

  return `[SYSTEM CONTEXT: INDIAN GOVERNMENT AGRICULTURE SCHEMES DATABASE →

**PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)**
- ₹6,000/year in 3 installments of ₹2,000 each directly to farmer's bank account
- Eligibility: All landholding farmer families
- Register: pmkisan.gov.in | Helpline: 155261
- Status check: pmkisan.gov.in/beneficiarystatus

**PMFBY (Pradhan Mantri Fasal Bima Yojana)**
- Crop insurance at 2% premium for Kharif, 1.5% for Rabi, 5% for commercial/horticultural
- Covers: Natural calamities, pests, diseases
- Apply through: Bank/CSC/pmfby.gov.in
- Claim within 72 hours of crop damage

**KCC (Kisan Credit Card)**
- Up to ₹3 lakh at 4% interest (with govt subsidy)
- Covers: Crop production, animal husbandry, fisheries
- Apply at: Any bank branch with land documents
- Insurance coverage included

**Soil Health Card Scheme**
- Free soil testing every 2 years
- Recommendations for fertilizer usage
- Apply through: soilhealth.dac.gov.in

**e-NAM (National Agriculture Market)**
- Online trading platform for agricultural commodities
- Transparent price discovery
- Portal: enam.gov.in

**PM Kisan MAN-Dhan (Pension Scheme)**
- ₹3,000/month pension after age 60
- Contribution: ₹55-200/month based on age
- For small & marginal farmers (18-40 years)

**Sub Mission on Agricultural Mechanization (SMAM)**
- 50-80% subsidy on farm equipment
- Apply at: agrimachinery.nic.in

**MSP (Minimum Support Price) 2024-25**
- Wheat: ₹2,275/q | Rice: ₹2,300/q | Cotton: ₹7,121/q
- Mustard: ₹5,650/q | Chana: ₹5,440/q | Soybean: ₹4,892/q

**Paramparagat Krishi Vikas Yojana (PKVY)**
- ₹50,000/ha for 3 years for organic farming
- Cluster-based organic farming support

**RKVY (Rashtriya Krishi Vikas Yojana)**
- Flexi-fund for state-specific agriculture development
- Covers infrastructure, technology, innovation

IMPORTANT: Always provide the official website, helpline number, and eligibility criteria. If the user asks about a specific scheme, give step-by-step application process. Mention state-specific variations where applicable.]`;
}

// ── Direct Mandi Prices API ───────────────────────────────────────────────────
// GET /api/mandi?commodity=Onion&state=Maharashtra&limit=20
app.get('/api/mandi', async (req, res) => {
  try {
    const { commodity, state, limit = 15 } = req.query;
    let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=${limit}`;
    if (commodity) url += `&filters[commodity]=${encodeURIComponent(commodity)}`;
    if (state) url += `&filters[state]=${encodeURIComponent(state)}`;

    console.log(`[Mandi Direct] Fetching: ${commodity || 'All'} in ${state || 'All India'}`);
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    res.json({
      success: true,
      total: data.total || 0,
      records: (data.records || []).map(r => ({
        state: r.state,
        district: r.district,
        market: r.market,
        commodity: r.commodity,
        variety: r.variety,
        minPrice: r.min_price,
        maxPrice: r.max_price,
        modalPrice: r.modal_price,
        date: r.arrival_date
      }))
    });
  } catch (err) {
    console.error('[Mandi Direct] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch mandi data' });
  }
});

// ── OpenRouter: Chat ──────────────────────────────────────────────────────────────
// POST /api/chat  { message: string, history: [{role, text}] }
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], responseStyle = 'Detailed', language = 'Hindi', preferredModel = 'auto' } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Auth & Token Tracking
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Authentication required' });

    let user = null;
    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET);
      user = await User.findById(decoded.id);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
      // Unlimited chats for everyone
      /*
      const hasPro = await Subscription.findOne({ 
        userId: user._id, 
        status: 'active', 
        expiresAt: { $gt: new Date() } 
      });

      if (!hasPro) {
        const MAX_CHAT = 10;
        const WINDOW = 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Reset window if needed
        const lastReset = user.lastChatReset ? new Date(user.lastChatReset).getTime() : 0;
        if (now - lastReset > WINDOW) {
          user.chatTokensUsed = 0;
          user.lastChatReset = new Date(now);
        }

        if ((user.chatTokensUsed || 0) >= MAX_CHAT) {
          return res.status(403).json({ 
            message: 'Daily message limit reached', 
            reason: 'limit',
            resetAt: new Date(new Date(user.lastChatReset).getTime() + WINDOW)
          });
        }

        user.chatTokensUsed = (user.chatTokensUsed || 0) + 1;
        await user.save();
      }
      */

    let styleNote = 'Provide a HIGHLY DETAILED, comprehensive, and professional answer. Explain step-by-step with reasons and clear instructions.';
    if (responseStyle === 'Brief') styleNote = 'Keep your answer extremely brief and to the point — strictly 3 to 4 short sentences with bullet points.';
    if (responseStyle === 'Expert') styleNote = 'Provide a HIGHLY TECHNICAL, EXPERT-LEVEL response. Use proper agricultural terminology, scientific names, exact dosages, and professional agronomy concepts. Ensure maximum detail and depth.';

    const mandiContext = await fetchMandiRatesContext(message);
    const schemeContext = getGovSchemeContext(message);
    
    let userContent = `[CRITICAL INSTRUCTION: Analyze the language and script of the user's query below. You MUST reply ONLY in that exact same language and script. If they write in English, reply in pure English. If they write in Hindi (Devanagari), reply in pure Hindi. Do not mix languages.]\n\n[STYLE INSTRUCTION: ${styleNote}]\n\n[USER QUERY]: ${message}`;
    
    if (mandiContext) userContent += `\n\n[Live market data: ${mandiContext}]`;
    if (schemeContext) userContent += `\n\n[Gov Scheme Data: ${schemeContext}]`;

    // KEY FIX: Use a completely neutral system prompt without brand name.
    // Models hallucinate refusals because they were trained on similar branded apps.
    // A neutral prompt bypasses this training artifact entirely.
    const systemPrompt = `You are an expert agricultural assistant for Indian farmers.
You ONLY answer questions about: crops, farming, seeds, soil, fertilizers, pesticides, irrigation,
fruits, vegetables, plant diseases and solutions, farming tools, mandi prices, weather effects on farming,
government farm schemes (PM Kisan, PMFBY, KCC), livestock, and horticulture.

RULES:
- ALWAYS answer farming questions. NEVER refuse.
- CRITICAL: You MUST detect the language and script of the user's message and reply in the EXACT SAME language and script.
  * If the user asks in English, reply ONLY in English.
  * If the user asks in Hindi (Devanagari script), reply ONLY in Hindi (Devanagari script).
  * If the user asks in Hinglish (Hindi written in English alphabet), reply in Hinglish.
  * Same rule applies for Marathi, Gujarati, Punjabi, etc.
- If completely off-topic (movies/sports/coding), say you only cover farming.
- Maintain a highly formal, professional, and respectful tone. Do NOT use conversational fillers or emojis.
- Use bold for key terms, bullet points for steps, headings for long answers.`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: userContent }
    ];

    const refusalPhrases = [
      'my expertise lies in agriculture',
      "i'm happy to chat with you, but",
      'not in topics like the one you asked',
      'as your agrifather',
      "my dear friend, i'm happy",
      "i'm not able to assist",
      'outside the scope',
      "i'm only able to answer",
      "i can't help with",
    ];

    const isRefusal = (text) => {
      if (!text || text.trim().length < 10) return true;
      const lower = text.toLowerCase();
      return refusalPhrases.some(p => lower.includes(p));
    };

    const callModel = async (model, msgs, temp = 0.5) => {
      let url = 'https://openrouter.ai/api/v1/chat/completions';
      let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://agrifather.vercel.app',
        'X-Title': 'AgriFather'
      };

      let actualModel = model;

      if (model.startsWith('groq:')) {
        // Groq Cloud — free tier
        actualModel = model.replace('groq:', '');
        url = 'https://api.groq.com/openai/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        };
      } else if (model.startsWith('openrouter:')) {
        // OpenRouter — free models
        actualModel = model.replace('openrouter:', '');
        url = 'https://openrouter.ai/api/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://agrifather.vercel.app',
          'X-Title': 'AgriFather'
        };
      } else if (model.startsWith('deepseek:')) {
        actualModel = model.replace('deepseek:', '');
        url = 'https://api.deepseek.com/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        };
      } else if (model.startsWith('grok:')) {
        actualModel = model.replace('grok:', '');
        url = 'https://api.x.ai/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`
        };
      } else if (model.startsWith('hf:')) {
        actualModel = model.replace('hf:', '');
        url = `https://api-inference.huggingface.co/models/${actualModel}/v1/chat/completions`;
        headers = { 'Content-Type': 'application/json' };
      }
      // else: treat as OpenRouter model ID directly

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: actualModel, messages: msgs, temperature: temp, max_tokens: 1024 })
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${response.status}: ${errText.slice(0, 200)}`);
      }
      const data = await response.json();
      if (data.choices && data.choices[0]) return data.choices[0].message.content;
      throw new Error('Empty response from model');
    };

    let modelsToTry = [
      'groq:llama-3.3-70b-versatile',
      'groq:llama-3.1-8b-instant',
      'groq:qwen-qwq-32b',
      'openrouter:google/gemma-3-27b-it:free',
      'openrouter:google/gemma-3-4b-it:free',
      'openrouter:nvidia/llama-3.1-nemotron-70b-instruct:free',
      'openrouter:mistralai/mistral-small-3.1-24b-instruct:free',
      'deepseek:deepseek-chat'
    ];

    // If user selected a specific model, prioritize it
    if (preferredModel && preferredModel !== 'auto') {
      modelsToTry = [preferredModel, ...modelsToTry.filter(m => m !== preferredModel)];
      console.log(`[Chat] User preferred model: ${preferredModel}`);
    }

    let reply = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[Chat] Trying: ${model}`);
        let text = await callModel(model, chatMessages);

        if (isRefusal(text)) {
          console.warn(`[Chat] Refusal from ${model}, retrying with direct override...`);
          const overrideMsgs = [
            { role: 'system', content: `You are a farming expert. Answer this question about farming in ${language}: "${message}"` },
            { role: 'user', content: message }
          ];
          text = await callModel(model, overrideMsgs, 0.3);
        }

        if (text && !isRefusal(text)) {
          reply = text;
          console.log(`[Chat] Success: ${model}`);
          break;
        }
      } catch (err) {
        console.error(`[Chat] Error for ${model}:`, err.message);
        lastError = err;
      }
    }

    if (reply) {
      res.status(200).json({ 
        reply, 
        chatTokensUsed: user ? user.chatTokensUsed : undefined 
      });
    } else {
      res.status(500).json({ message: 'AI service is temporarily unavailable. Please try again in a moment.' });
    }
  } catch (err) {
    console.error('[Chat] Unhandled error:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// ── OpenRouter: Scan (image analysis via vision model) ─────────────────────────────────────────────

// POST /api/scan  multipart/form-data  { image: File, question?: string }
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

    // Auth & Token Tracking
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Authentication required' });

    let user = null;
    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET);
      user = await User.findById(decoded.id);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    const hasPro = await Subscription.findOne({ 
      userId: user._id, 
      status: 'active', 
      expiresAt: { $gt: new Date() } 
    });

    if (!hasPro) {
      const MAX_IMAGE = 5;
      const WINDOW = 24 * 60 * 60 * 1000;
      const now = Date.now();

      const lastReset = user.lastImageReset ? new Date(user.lastImageReset).getTime() : 0;
      if (now - lastReset > WINDOW) {
        user.imageTokensUsed = 0;
        user.lastImageReset = new Date(now);
      }

      if ((user.imageTokensUsed || 0) >= MAX_IMAGE) {
        return res.status(403).json({ 
          message: 'Image analysis limit reached (5 per 24h)', 
          reason: 'limit',
          resetAt: new Date((user.lastImageReset ? new Date(user.lastImageReset).getTime() : now) + WINDOW)
        });
      }

      user.imageTokensUsed = (user.imageTokensUsed || 0) + 1;
      await user.save();
    }

    const userQuestion = req.body.question ? req.body.question.trim() : '';

    const prompt = `You are AgriFather AI, a world-class plant pathologist and agricultural expert.
Analyze this image with extreme precision to detect any plant diseases, pests, or nutrient deficiencies.

Provide your analysis in the following format:
1. **Detection & Identification**: Identify the exact plant species and any disease or pest visible. Use both common and scientific names.
2. **Detailed Diagnosis**: Explain the symptoms you see (e.g., leaf spots, yellowing, wilting) and what they indicate.
3. **Severity Assessment**: Rate the severity as Low, Medium, or High and explain why.
4. **Treatment Plan**: Provide immediate practical steps (organic and chemical options) including exact products or methods.
5. **Future Prevention**: Give a long-term strategy to ensure this does not happen again.
${userQuestion ? `\n6. **Answer to User's Question**: The user specifically asked: "${userQuestion}" — address this in detail.\n` : ''}
If the image is not related to agriculture, politely inform the user that you are specialized in farming and plant health, but describe what you see briefly.`;

    console.log(`[Scan] Processing scan request... (File: ${req.file.size} bytes)`);
    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const modelsToTry = [
      'openrouter:google/gemma-3-27b-it:free',
      'openrouter:google/gemma-3-4b-it:free',
      'groq:llama-3.3-70b-versatile',
      'openrouter:nvidia/llama-3.1-nemotron-70b-instruct:free',
      'deepseek:deepseek-chat'
    ];

    let analysis = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`[Scan] Requesting analysis from: ${model}...`);
        const startTime = Date.now();
        let url = 'https://openrouter.ai/api/v1/chat/completions';
        let headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://agrifather.vercel.app',
          'X-Title': 'AgriFather AI'
        };

        let actualModel = model;
        if (model.startsWith('grok:')) {
          actualModel = model.replace('grok:', '');
          url = 'https://api.x.ai/v1/chat/completions';
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROK_API_KEY}`
          };
        } else if (model.startsWith('deepseek:')) {
          actualModel = model.replace('deepseek:', '');
          url = 'https://api.deepseek.com/chat/completions';
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: actualModel,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrl } }
                ]
              }
            ],
            temperature: 0.4,
            max_tokens: 1024
          })
        });

        const duration = (Date.now() - startTime) / 1000;
        console.log(`[Scan] Model ${model} responded in ${duration}s (Status: ${response.status})`);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
          analysis = data.choices[0].message.content;
          console.log(`[Scan] Analysis successful with ${model}!`);
          break; // Success!
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Scan] Model ${model} failed:`, err.message);
      }
    }

    if (!analysis) {
      console.error('[Scan] All models failed. Last error:', lastError?.message);
      throw new Error(lastError ? lastError.message : 'All vision models failed');
    }

    res.status(200).json({ 
      analysis, 
      imageTokensUsed: user ? user.imageTokensUsed : undefined 
    });
  } catch (err) {
    console.error('OpenRouter scan error:', err.message);
    res.status(500).json({ message: 'AI scan error: ' + (err.message || 'Unknown error') });
  }
});

// ── Razorpay Subscription System ─────────────────────────────────────────────
const Razorpay = require('razorpay');
const crypto = require('crypto');

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID || 'rzp_test_yourkeyhere';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'yoursecrethere';

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Subscription schema
const subscriptionSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan:            { type: String, enum: ['pro_monthly', 'pro_yearly'], required: true },
  status:          { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  amount:          Number,
  expiresAt:       Date,
  createdAt:       { type: Date, default: Date.now },
});
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Plan pricing (in paise)
const PLAN_CONFIG = {
  pro_monthly: { amount: 39900, currency: 'INR', durationDays: 30,  label: 'Pro Monthly' },
  pro_yearly:  { amount: 419900, currency: 'INR', durationDays: 365, label: 'Pro Yearly' },
};

// POST /api/subscription/create-order
app.post('/api/subscription/create-order', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const { planId } = req.body;
    const plan = PLAN_CONFIG[planId];
    if (!plan) return res.status(400).json({ message: 'Invalid plan' });

    const order = await razorpayInstance.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `r_${userId.toString().slice(-8)}_${Date.now()}`,
      notes: { userId: userId.toString(), planId },
    });

    res.status(200).json({ order, razorpayKeyId: RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay order error STATUS:', err.statusCode);
    console.error('Razorpay order error MESSAGE:', err.message);
    console.error('Razorpay order error FULL:', JSON.stringify(err?.error || err, null, 2));
    res.status(500).json({ message: 'Failed to create order', detail: err?.message || 'Unknown' });
  }
});

// POST /api/subscription/verify-payment
app.post('/api/subscription/verify-payment', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    const plan = PLAN_CONFIG[planId];
    if (!plan) return res.status(400).json({ message: 'Invalid plan' });

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Compute expiry
    const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Save subscription
    const sub = new Subscription({
      userId,
      plan: planId,
      status: 'active',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: plan.amount / 100,
      expiresAt,
    });
    await sub.save();

    res.status(200).json({ message: 'Subscription activated!', expiresAt, plan: planId });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// GET /api/subscription/status
app.get('/api/subscription/status', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    const sub = await Subscription.findOne({ userId, status: 'active', expiresAt: { $gt: new Date() } })
      .sort({ expiresAt: -1 });

    if (sub) {
      res.status(200).json({ active: true, plan: sub.plan, expiresAt: sub.expiresAt });
    } else {
      res.status(200).json({ active: false });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
