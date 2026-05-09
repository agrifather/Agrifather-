import React, { createContext, useState, useContext, useEffect } from 'react';

// ── Translation bundles ───────────────────────────────────────────────────────
const translations = {
  en: {
    // ── Bottom Nav ──
    navHome: 'Home', navChat: 'Chat', navScan: 'Scan', navNotifications: 'Notifications', navSettings: 'Settings',

    // ── Home ──
    greeting: 'Hello',
    greetingSuffix: 'ji ⛅',
    greetingFarmer: 'Hello, Farmer ji ⛅',
    quickActions: 'Quick Actions',
    cropAdvisory: 'Crop Advisory',
    pestId: 'Pest ID',
    weather: 'Weather',
    recentConv: 'Recent Conversations',
    viewAll: 'View All',
    noConvYet: 'No conversations yet',
    noConvSub: 'Tap to start chatting with AgriFather AI',
    locustAlert: '⚠️ Locust swarm threat in your area — learn now',
    locustAlertEn: 'Locust swarm alert in your area',

    // ── Chat ──
    chatTitle: 'AgriFather AI',
    chatStatus: 'Smart Farming Assistant',
    howCanIHelp: 'How can I help you today?',
    chatDesc: 'Ask me anything about crops, pests, weather, soil, mandi rates or government schemes.',
    freeMessages: 'free messages remaining today',
    msgPlaceholder: 'Message AgriFather AI…',
    limitReached: 'Message limit reached — Upgrade to Pro',
    listeningPlaceholder: '🎤 Listening... speak now',
    brief: 'Brief', detailed: 'Detailed', expert: 'Expert',
    clearChat: 'Clear chat',
    scanImage: 'Scan image',
    dailyLimit: 'Daily Message Limit Reached',
    waitReset: 'Wait for Reset',

    // ── Settings ──
    settings: 'Settings',
    appearance: 'APPEARANCE',
    theme: 'Theme',
    lightMode: 'Light Mode', darkMode: 'Dark Mode',
    preferences: 'PREFERENCES',
    language: 'Language',
    appLang: 'App display language',
    voiceMode: 'Voice Mode',
    voiceEnabled: 'Voice responses enabled', voiceDisabled: 'Voice responses disabled',
    responseStyle: 'Response Style',
    aiLength: 'AI response length',
    notifications: 'NOTIFICATIONS',
    pushNotif: 'Push Notifications',
    alertsUpdates: 'Alerts and updates',
    support: 'SUPPORT',
    privacyPolicy: 'Privacy Policy',
    readPrivacy: 'Read our privacy policy',
    helpSupport: 'Help & Support',
    faqContact: 'FAQs and contact us',
    logout: 'Logout',

    // ── Scan ──
    scanTitle: 'Scan Plant',
    // ── Weather ──
    weatherTitle: 'Weather',
  },
  hi: {
    navHome: 'होम', navChat: 'चैट', navScan: 'स्कैन', navNotifications: 'सूचनाएं', navSettings: 'सेटिंग्स',

    greeting: 'नमस्ते',
    greetingSuffix: 'जी ⛅',
    greetingFarmer: 'नमस्ते, किसान जी ⛅',
    quickActions: 'त्वरित कार्य',
    cropAdvisory: 'फसल सलाह',
    pestId: 'कीट पहचान',
    weather: 'मौसम',
    recentConv: 'हाल की बातचीत',
    viewAll: 'सभी देखें',
    noConvYet: 'अभी कोई बातचीत नहीं',
    noConvSub: 'AgriFather AI से बात शुरू करने के लिए टैप करें',
    locustAlert: '⚠️ आपके क्षेत्र में टिड्डी दल का खतरा — अभी जानें',
    locustAlertEn: 'आपके क्षेत्र में टिड्डी दल की चेतावनी',

    chatTitle: 'अग्रिफादर AI',
    chatStatus: 'स्मार्ट कृषि सहायक',
    howCanIHelp: 'आज मैं आपकी कैसे मदद कर सकता हूं?',
    chatDesc: 'फसल, कीट, मौसम, मिट्टी, मंडी भाव या सरकारी योजनाओं के बारे में कुछ भी पूछें।',
    freeMessages: 'मुफ्त संदेश आज शेष हैं',
    msgPlaceholder: 'AgriFather AI को संदेश भेजें…',
    limitReached: 'संदेश सीमा पूरी — Pro में अपग्रेड करें',
    listeningPlaceholder: '🎤 सुन रहा हूं... अभी बोलें',
    brief: 'संक्षिप्त', detailed: 'विस्तृत', expert: 'विशेषज्ञ',
    clearChat: 'चैट साफ करें',
    scanImage: 'फोटो स्कैन करें',
    dailyLimit: 'दैनिक संदेश सीमा पूरी',
    waitReset: 'रीसेट की प्रतीक्षा करें',

    settings: 'सेटिंग्स',
    appearance: 'दिखावट',
    theme: 'थीम',
    lightMode: 'लाइट मोड', darkMode: 'डार्क मोड',
    preferences: 'प्राथमिकताएं',
    language: 'भाषा',
    appLang: 'ऐप की भाषा',
    voiceMode: 'आवाज मोड',
    voiceEnabled: 'आवाज प्रतिक्रिया चालू', voiceDisabled: 'आवाज प्रतिक्रिया बंद',
    responseStyle: 'प्रतिक्रिया शैली',
    aiLength: 'AI उत्तर की लंबाई',
    notifications: 'सूचनाएं',
    pushNotif: 'पुश सूचनाएं',
    alertsUpdates: 'अलर्ट और अपडेट',
    support: 'सहायता',
    privacyPolicy: 'गोपनीयता नीति',
    readPrivacy: 'हमारी गोपनीयता नीति पढ़ें',
    helpSupport: 'मदद और सहायता',
    faqContact: 'FAQ और संपर्क करें',
    logout: 'लॉगआउट करें',

    scanTitle: 'पौधा स्कैन करें',
    weatherTitle: 'मौसम',
  },
  mr: {
    navHome: 'होम', navChat: 'चॅट', navScan: 'स्कॅन', navNotifications: 'सूचना', navSettings: 'सेटिंग्ज',

    greeting: 'नमस्कार',
    greetingSuffix: 'जी ⛅',
    greetingFarmer: 'नमस्कार, शेतकरी जी ⛅',
    quickActions: 'जलद कार्य',
    cropAdvisory: 'पीक सल्ला',
    pestId: 'कीड ओळख',
    weather: 'हवामान',
    recentConv: 'अलीकडील संवाद',
    viewAll: 'सर्व पहा',
    noConvYet: 'अद्याप संवाद नाही',
    noConvSub: 'AgriFather AI शी बोलायला टॅप करा',
    locustAlert: '⚠️ तुमच्या भागात टोळधाड — आता जाणून घ्या',
    locustAlertEn: 'तुमच्या भागात टोळधाड सूचना',

    chatTitle: 'अग्रिफादर AI',
    chatStatus: 'स्मार्ट शेती सहाय्यक',
    howCanIHelp: 'आज मी तुमची कशी मदत करू शकतो?',
    chatDesc: 'पीक, कीड, हवामान, माती, बाजारभाव किंवा सरकारी योजनांबद्दल काहीही विचारा.',
    freeMessages: 'मोफत संदेश आज शिल्लक',
    msgPlaceholder: 'AgriFather AI ला संदेश पाठवा…',
    limitReached: 'संदेश मर्यादा संपली — Pro मध्ये अपग्रेड करा',
    listeningPlaceholder: '🎤 ऐकत आहे... आता बोला',
    brief: 'संक्षिप्त', detailed: 'विस्तृत', expert: 'तज्ञ',
    clearChat: 'चॅट साफ करा',
    scanImage: 'फोटो स्कॅन करा',
    dailyLimit: 'दैनिक संदेश मर्यादा संपली',
    waitReset: 'रिसेटची वाट पहा',

    settings: 'सेटिंग्ज',
    appearance: 'दिखावट',
    theme: 'थीम',
    lightMode: 'लाइट मोड', darkMode: 'डार्क मोड',
    preferences: 'प्राथमिकता',
    language: 'भाषा',
    appLang: 'अ‍ॅप प्रदर्शन भाषा',
    voiceMode: 'आवाज मोड',
    voiceEnabled: 'आवाज प्रतिसाद चालू', voiceDisabled: 'आवाज प्रतिसाद बंद',
    responseStyle: 'प्रतिसाद शैली',
    aiLength: 'AI उत्तराची लांबी',
    notifications: 'सूचना',
    pushNotif: 'पुश सूचना',
    alertsUpdates: 'सूचना आणि अपडेट',
    support: 'सहाय्य',
    privacyPolicy: 'गोपनीयता धोरण',
    readPrivacy: 'आमचे गोपनीयता धोरण वाचा',
    helpSupport: 'मदत व सहाय्य',
    faqContact: 'FAQ आणि संपर्क',
    logout: 'लॉगआउट करा',

    scanTitle: 'पीक स्कॅन करा',
    weatherTitle: 'हवामान',
  },
  pa: {
    navHome: 'ਹੋਮ', navChat: 'ਚੈਟ', navScan: 'ਸਕੈਨ', navNotifications: 'ਸੂਚਨਾਵਾਂ', navSettings: 'ਸੈਟਿੰਗਜ਼',

    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
    greetingSuffix: 'ਜੀ ⛅',
    greetingFarmer: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਕਿਸਾਨ ਜੀ ⛅',
    quickActions: 'ਤੁਰੰਤ ਕਾਰਵਾਈਆਂ',
    cropAdvisory: 'ਫ਼ਸਲ ਸਲਾਹ',
    pestId: 'ਕੀੜੇ ਦੀ ਪਛਾਣ',
    weather: 'ਮੌਸਮ',
    recentConv: 'ਹਾਲੀਆ ਗੱਲਬਾਤ',
    viewAll: 'ਸਭ ਦੇਖੋ',
    noConvYet: 'ਅਜੇ ਕੋਈ ਗੱਲਬਾਤ ਨਹੀਂ',
    noConvSub: 'AgriFather AI ਨਾਲ ਗੱਲ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਟੈਪ ਕਰੋ',
    locustAlert: '⚠️ ਤੁਹਾਡੇ ਖੇਤਰ ਵਿੱਚ ਟਿੱਡੀ ਦਲ ਦਾ ਖ਼ਤਰਾ',
    locustAlertEn: 'ਤੁਹਾਡੇ ਖੇਤਰ ਵਿੱਚ ਟਿੱਡੀ ਦਲ ਦੀ ਚੇਤਾਵਨੀ',

    chatTitle: 'ਅਗ੍ਰੀਫਾਦਰ AI',
    chatStatus: 'ਸਮਾਰਟ ਖੇਤੀ ਸਹਾਇਕ',
    howCanIHelp: 'ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
    chatDesc: 'ਫ਼ਸਲ, ਕੀੜੇ, ਮੌਸਮ, ਮਿੱਟੀ, ਮੰਡੀ ਭਾਅ ਜਾਂ ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ।',
    freeMessages: 'ਮੁਫ਼ਤ ਸੁਨੇਹੇ ਅੱਜ ਬਾਕੀ ਹਨ',
    msgPlaceholder: 'AgriFather AI ਨੂੰ ਸੁਨੇਹਾ ਭੇਜੋ…',
    limitReached: 'ਸੁਨੇਹਾ ਸੀਮਾ ਪੂਰੀ — Pro ਵਿੱਚ ਅੱਪਗ੍ਰੇਡ ਕਰੋ',
    listeningPlaceholder: '🎤 ਸੁਣ ਰਿਹਾ ਹਾਂ... ਹੁਣ ਬੋਲੋ',
    brief: 'ਸੰਖੇਪ', detailed: 'ਵਿਸਤ੍ਰਿਤ', expert: 'ਮਾਹਰ',
    clearChat: 'ਚੈਟ ਸਾਫ਼ ਕਰੋ',
    scanImage: 'ਫੋਟੋ ਸਕੈਨ ਕਰੋ',
    dailyLimit: 'ਰੋਜ਼ਾਨਾ ਸੁਨੇਹਾ ਸੀਮਾ ਪੂਰੀ',
    waitReset: 'ਰੀਸੈਟ ਦੀ ਉਡੀਕ ਕਰੋ',

    settings: 'ਸੈਟਿੰਗਜ਼',
    appearance: 'ਦਿੱਖ',
    theme: 'ਥੀਮ',
    lightMode: 'ਲਾਈਟ ਮੋਡ', darkMode: 'ਡਾਰਕ ਮੋਡ',
    preferences: 'ਤਰਜੀਹਾਂ',
    language: 'ਭਾਸ਼ਾ',
    appLang: 'ਐਪ ਦੀ ਭਾਸ਼ਾ',
    voiceMode: 'ਆਵਾਜ਼ ਮੋਡ',
    voiceEnabled: 'ਆਵਾਜ਼ ਜਵਾਬ ਚਾਲੂ', voiceDisabled: 'ਆਵਾਜ਼ ਜਵਾਬ ਬੰਦ',
    responseStyle: 'ਜਵਾਬ ਸ਼ੈਲੀ',
    aiLength: 'AI ਜਵਾਬ ਦੀ ਲੰਬਾਈ',
    notifications: 'ਸੂਚਨਾਵਾਂ',
    pushNotif: 'ਪੁਸ਼ ਸੂਚਨਾਵਾਂ',
    alertsUpdates: 'ਅਲਰਟ ਅਤੇ ਅਪਡੇਟ',
    support: 'ਸਹਾਇਤਾ',
    privacyPolicy: 'ਗੋਪਨੀਯਤਾ ਨੀਤੀ',
    readPrivacy: 'ਸਾਡੀ ਗੋਪਨੀਯਤਾ ਨੀਤੀ ਪੜ੍ਹੋ',
    helpSupport: 'ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ',
    faqContact: 'FAQ ਅਤੇ ਸੰਪਰਕ',
    logout: 'ਲੌਗਆਊਟ ਕਰੋ',

    scanTitle: 'ਫ਼ਸਲ ਸਕੈਨ ਕਰੋ',
    weatherTitle: 'ਮੌਸਮ',
  },
  gu: {
    navHome: 'હોમ', navChat: 'ચેટ', navScan: 'સ્કેન', navNotifications: 'સૂચનાઓ', navSettings: 'સેટિંગ્સ',

    greeting: 'નમસ્તે',
    greetingSuffix: 'જી ⛅',
    greetingFarmer: 'નમસ્તે, ખેડૂત જી ⛅',
    quickActions: 'ઝડપી ક્રિયાઓ',
    cropAdvisory: 'પાક સલાહ',
    pestId: 'જીવાત ઓળખ',
    weather: 'હવામાન',
    recentConv: 'તાજેતરની વાતચીત',
    viewAll: 'બધું જુઓ',
    noConvYet: 'હજુ કોઈ વાતચીત નથી',
    noConvSub: 'AgriFather AI સાથે ચેટ શરૂ કરવા ટેપ કરો',
    locustAlert: '⚠️ તમારા વિસ્તારમાં તીડનું જોખમ — હવે જાણો',
    locustAlertEn: 'તમારા વિસ્તારમાં તીડની ચેતવણી',

    chatTitle: 'અગ્રિફાધર AI',
    chatStatus: 'સ્માર્ટ ખેતી સહાયક',
    howCanIHelp: 'આજે હું તમારી કેવી રીતે મદદ કરી શકું?',
    chatDesc: 'પાક, જીવાત, હવામાન, માટી, બજાર ભાવ અથવા સરકારી યોજનાઓ વિશે કંઈપણ પૂછો.',
    freeMessages: 'મફત સંદેશ આજે બાકી',
    msgPlaceholder: 'AgriFather AI ને સંદેશ મોકલો…',
    limitReached: 'સંદેશ મર્યાદા પૂર્ણ — Pro માં અપગ્રેડ કરો',
    listeningPlaceholder: '🎤 સાંભળી રહ્યો છું... હવે બોલો',
    brief: 'ટૂંકો', detailed: 'વિસ્તૃત', expert: 'નિષ્ણાત',
    clearChat: 'ચેટ સાફ કરો',
    scanImage: 'ફોટો સ્કેન કરો',
    dailyLimit: 'દૈનિક સંદેશ મર્યાદા પૂર્ણ',
    waitReset: 'રીસેટની રાહ જુઓ',

    settings: 'સેટિંગ્સ',
    appearance: 'દેખાવ',
    theme: 'થીમ',
    lightMode: 'લાઇટ મોડ', darkMode: 'ડાર્ક મોડ',
    preferences: 'પસંદગીઓ',
    language: 'ભાષા',
    appLang: 'એપ પ્રદર્શન ભાષા',
    voiceMode: 'અવાજ મોડ',
    voiceEnabled: 'અવાજ પ્રતિસાદ ચાલુ', voiceDisabled: 'અવાજ પ્રતિસાદ બંધ',
    responseStyle: 'પ્રતિસાદ શૈલી',
    aiLength: 'AI જવાબની લંબાઈ',
    notifications: 'સૂચનાઓ',
    pushNotif: 'પુશ સૂચનાઓ',
    alertsUpdates: 'ચેતવણી અને અપડેટ',
    support: 'સહાય',
    privacyPolicy: 'ગોપનીયતા નીતિ',
    readPrivacy: 'અમારી ગોપનીયતા નીતિ વાંચો',
    helpSupport: 'મદદ અને સહાય',
    faqContact: 'FAQ અને સંપર્ક',
    logout: 'લૉગઆઉટ કરો',

    scanTitle: 'પાક સ્કેન કરો',
    weatherTitle: 'હવામાન',
  },
};

const LanguageContext = createContext();

// Map settings label → code
const LANG_MAP = { 'Hindi': 'hi', 'English': 'en', 'Marathi': 'mr', 'Punjabi': 'pa', 'Gujarati': 'gu' };
const LANG_LABEL_MAP = { 'hi': 'Hindi', 'en': 'English', 'mr': 'Marathi', 'pa': 'Punjabi', 'gu': 'Gujarati' };

// Full language names for the backend
const LANG_FULL_NAMES = {
  'hi': 'Hindi', 'en': 'English', 'mr': 'Marathi', 'pa': 'Punjabi', 'gu': 'Gujarati'
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem('af_language') || 'Hindi';
    return LANG_MAP[stored] || 'hi';
  });

  const setLang = (value) => {
    const code = LANG_MAP[value] || value;
    const label = LANG_LABEL_MAP[code] || value;
    setLangState(code);
    localStorage.setItem('af_language', label);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  const langLabel = LANG_LABEL_MAP[lang] || 'Hindi';
  const langFullName = LANG_FULL_NAMES[lang] || 'Hindi';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, langLabel, langFullName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
