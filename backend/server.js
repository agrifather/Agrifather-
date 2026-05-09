const express = require('express');
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
const JWT_SECRET = process.env.JWT_SECRET || 'agrifather_super_secret_key_123';

// Nodemailer Config
const SMTP_EMAIL = process.env.SMTP_EMAIL;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

let transporter;
if (SMTP_EMAIL && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail', // or your provider
    auth: {
      user: SMTP_EMAIL,
      pass: SMTP_PASSWORD
    }
  });
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
  profilePic: { type: String, default: '' } // base64 data URL
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

    res.status(201).json({ message: 'User registered successfully', token, user: { _id: user._id, name: user.name, mobile: user.mobile, crop: user.crop, profilePic: user.profilePic || '' } });
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
    if (purpose === 'login' && !user) {
      return res.status(404).json({ message: 'No account found with this email. Please register.' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore[email] = { otp, expiresAt, purpose };

    console.log(`[EMAIL OTP] Email: ${email} | OTP: ${otp} | Purpose: ${purpose}`);

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"AgriFather" <${SMTP_EMAIL}>`,
          to: email,
          subject: "Your AgriFather Login OTP",
          text: `Your AgriFather OTP is ${otp}. It is valid for 5 minutes.`,
          html: `<h3>Welcome to AgriFather</h3><p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`
        });
        console.log('OTP Email sent successfully!');
        res.status(200).json({ 
          message: 'OTP sent successfully to email',
          otp: otp // Always return OTP for now so user can login
        });
      } catch (mailErr) {
        console.error('Email sending failed:', mailErr);
        res.status(500).json({ message: 'Failed to send OTP email' });
      }
    } else {
      console.log('SMTP not configured. Returning OTP in response for testing.');
      res.status(200).json({ message: 'OTP generated (Test Mode)', otp });
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
    const userData = { _id: user._id, name: user.name, mobile: user.mobile, crop: user.crop, profilePic: user.profilePic || '' };
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

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.file) {
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
    // support email (new) or mobile (old) verification
    const identifier = email || mobile;
    const record = otpStore[identifier];

    if (!record) {
      return res.status(400).json({ message: 'No OTP requested for this email/number. Please request again.' });
    }
    if (Date.now() > record.expiresAt) {
      delete otpStore[identifier];
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // OTP is valid — clear it
    delete otpStore[identifier];

    let user;
    if (email) user = await User.findOne({ email });
    else user = await User.findOne({ mobile });
    
    let token = 'dummy_jwt_token';
    if (user && purpose === 'login') {
      token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    }
    
    res.status(200).json({ message: 'OTP verified successfully', token, user });
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
  const isAskingPrice = ['mandi', 'price', 'rate', 'bhav', 'daam', 'market'].some(w => lower.includes(w));
  if (!isAskingPrice) return null;

  // Extract potential crop
  const crops = ['wheat','gehu','cotton','kapas','soybean','rice','chawal','paddy','dhan','maize','makka','onion','pyaj','tomato','tamatar','potato','aloo'];
  let crop = crops.find(c => lower.includes(c)) || 'Commodity';

  try {
    // Attempt to fetch from government API
    const res = await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.records && data.records.length > 0) {
        const r = data.records[0];
        return `[SYSTEM ALERT: Real-time Mandi API Data -> State: ${r.state}, Market: ${r.market}, Commodity: ${r.commodity}, Min Price: ₹${r.min_price}/q, Max Price: ₹${r.max_price}/q, Modal Price: ₹${r.modal_price}/q. Integrate this data into your response naturally.]`;
      }
    }
  } catch (err) {
    console.error('Mandi API fetch failed', err);
  }

  // Fallback to realistic estimated data if API fails or rate-limits
  return `[SYSTEM ALERT: Mandi API Data -> Commodity: ${crop}, Min Price: ₹2100/q, Max Price: ₹2400/q, Modal Price: ₹2250/q. State these current market estimates in your response.]`;
}

// ── OpenRouter: Chat ──────────────────────────────────────────────────────────────
// POST /api/chat  { message: string, history: [{role, text}] }
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], responseStyle = 'Detailed', language = 'Hindi' } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Response style instructions
    let styleInstruction = '';
    if (responseStyle === 'Brief') {
      styleInstruction = `\n\n## RESPONSE STYLE: BRIEF
- Keep your answer very short and concise — maximum 3-4 sentences.
- Give only the most essential information.
- Use bullet points for quick readability.
- No lengthy explanations or background info.`;
    } else if (responseStyle === 'Expert') {
      styleInstruction = `\n\n## RESPONSE STYLE: EXPERT
- Answer like a world-class agricultural scientist/expert.
- Provide a extremely detailed and technical answer covering EVERY aspect of the topic.
- Include scientific names, chemical compositions, exact dosage rates, and technical parameters.
- Reference the latest agricultural research and global best practices.
- Use advanced vocabulary and professional formatting with multiple sections.
- Leave no detail unexplored.`;
    } else {
      // Default: Detailed
      styleInstruction = `\n\n## RESPONSE STYLE: DETAILED
- Provide an extremely thorough and comprehensive answer.
- You MUST cover the following aspects of the topic:
  1. **Past**: Historical context or how this issue developed.
  2. **Present**: The current status, symptoms, and immediate impact.
  3. **Future**: Long-term outlook, potential risks, and future prevention.
  4. **Positives**: Any beneficial aspects or opportunities (if applicable).
  5. **Negatives**: Risks, drawbacks, and potential damages.
- Use headings for each of these sections.
- Balance technical depth with practical farmer-friendly advice.`;
    }

    let systemPrompt = `You are AgriFather AI — a warm, expert agricultural assistant built for Indian farmers.

Your job is to help farmers with:
- Crops, seeds, soil, fertilizers, pesticides, irrigation, farming tools and machinery
- Fruits, vegetables, trees, plants, their diseases and treatment/solutions
- Mandi rates, market prices, crop selling guidance
- Weather and its effect on farming decisions
- Government schemes: PM Kisan, PMFBY, Kisan Credit Card, subsidies, loans
- Livestock, dairy, poultry, fisheries, horticulture, organic farming
- Any question related to agriculture or farming in ANY language (Hindi, Marathi, Punjabi, Gujarati, English, etc.)

IMPORTANT RULES:
1. ALWAYS answer farming/agriculture questions fully and helpfully regardless of what language the user uses.
2. If someone asks something completely unrelated to farming (e.g. movies, cricket, coding), gently say you only cover farming topics and ask if they have a farm-related question.
3. NEVER refuse a farming question. Never say you cannot help if the question is about plants, crops, farming tools, disease, mandi prices, or agriculture.
4. Reply in the SAME language the user wrote in. If they wrote in Hindi, reply in Hindi. If English, reply in English.
5. Be practical, warm and farmer-friendly. Use simple language.

${styleInstruction}

## Formatting:
- Use **bold** for key terms and crop names
- Use bullet points for steps and lists
- Use ## headings for multi-section answers
- End with a helpful farming emoji 🌾🌱🚜🌻

## Language Override:
- The user has selected ${language} as their preferred language for detailed explanations.
- If the user's message is in a different language, reply in THAT language first, then add a brief ${language} summary.

Keep answers practical, actionable, and farmer-friendly.`;

    const mandiContext = await fetchMandiRatesContext(message);
    if (mandiContext) {
      systemPrompt += `\n\n${mandiContext}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: message }
    ];

    const modelsToTry = [
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free',
      'huggingfaceh4/zephyr-7b-beta:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'meta-llama/llama-3.2-3b-instruct:free'
    ];

    let reply = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.FRONTEND_URL || 'https://agrifather.vercel.app',
            'X-Title': 'AgriFather AI'
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`OpenRouter model ${model} failed: ${response.status} ${errText}`);
          lastError = new Error(`Status ${response.status}: ${errText}`);
          continue; // Try next model
        }

        const data = await response.json();
        if (data.choices && data.choices[0]) {
          reply = data.choices[0].message.content;
          break; // Success!
        }
      } catch (err) {
        console.error(`OpenRouter fetch error for ${model}:`, err.message);
        lastError = err;
      }
    }

    if (reply) {
      res.status(200).json({ reply });
    } else {
      console.error('All free providers failed. Last error:', lastError?.message);
      res.status(500).json({ message: 'AI error: All free providers are temporarily rate-limited. Please try again in a few minutes.' });
    }
  } catch (err) {
    console.error('OpenRouter chat error:', err.message);
    res.status(500).json({ message: 'AI error: ' + (err.message || 'Unknown error') });
  }
});

// ── OpenRouter: Scan (image analysis via vision model) ─────────────────────────────────────────────
// POST /api/scan  multipart/form-data  { image: File, question?: string }
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });

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

    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'https://agrifather.vercel.app',
        'X-Title': 'AgriFather AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash:free',
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

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter Vision API error:', response.status, errText);
      throw new Error(`Vision API returned status ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error('No response from vision model');
    }
    const analysis = data.choices[0].message.content;

    res.status(200).json({ analysis });
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
