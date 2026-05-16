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
    noConvSub: 'AgriFather AI से बात शुरू करने के लिए टैప్ करें',
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
    weather: 'ಹವಾಮಾನ',
    recentConv: 'अलीकडील संवाद',
    viewAll: 'सर्व पहा',
    noConvYet: 'अद्याप संवाद नाही',
    noConvSub: 'AgriFather AI शी बोलायला ಟॅप करा',
    locustAlert: '⚠️ तुमच्या भागात टोळधाड — आता जाणून घ्या',
    locustAlertEn: 'तुमच्या भागात टोळधाड सूचना',

    chatTitle: 'अग्रिफादर AI',
    chatStatus: 'स्मार्ट शेती सहाय्यक',
    howCanIHelp: 'आज मी तुमची कशी मदत करू शकतो?',
    chatDesc: 'पीक, कीड, हवामान, माती, बाजारभाव किंवा सरकारी योजनांबद्दल काहीही विचారా.',
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
    weatherTitle: 'हವಾમાન',
  },
  pa: {
    navHome: 'ਹੋਮ', navChat: 'ਚੈਟ', navScan: 'ਸਕੈਨ', navNotifications: 'ਸੂਚਨਾਵਾਂ', navSettings: 'ਸੈਟਿੰਗਜ਼',

    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
    greetingSuffix: 'ਜੀ ⛅',
    greetingFarmer: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਕਿਸਾਨ ਜੀ ⛅',
    quickActions: 'ਤੁਰੰਤ ਕਾਰਵਾਈਆਂ',
    cropAdvisory: 'ਫ਼ਸਲ సలాహ',
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
    greeting: 'નમસ્તે', greetingSuffix: 'જી ⛅', greetingFarmer: 'નમસ્તે, ખેડૂત જી ⛅',
    quickActions: 'ઝડપી ક્રિયાઓ', cropAdvisory: 'પાક સલાહ', pestId: 'જીવાત ઓળખ', weather: 'હવામાન',
    recentConv: 'તાજેતરની વાતચીત', viewAll: 'બધું જુઓ', noConvYet: 'હજુ કોઈ વાતચીત નથી', noConvSub: 'AgriFather AI સાથે ચેટ શરૂ કરવા ટેપ કરો',
    locustAlert: '⚠️ તમારા વિસ્તારમાં તીડનું જોખમ', locustAlertEn: 'તમારા વિસ્તારમાં તીડની ચેતવણી',
    chatTitle: 'અગ્રિફાધર AI', chatStatus: 'સ્માર્ટ ખેતી સહાયક', howCanIHelp: 'આજે હું તમારી કેવી રીતે મદદ કરી શકું?',
    chatDesc: 'પાક, જીવાત, હવામાન, માટી, બજાર ભાવ અથવા સરકારી યોજનાઓ વિશે કંઈપણ પૂછો.',
    freeMessages: 'મફત સંદેશ આજે બાકી', msgPlaceholder: 'AgriFather AI ને સંદેશ મોકલો…', limitReached: 'સંદેશ મર્યાદા પૂર્ણ — Pro માં અપગ્રેડ કરો',
    listeningPlaceholder: '🎤 સાંભળી રહ્યો છું... હવે બોલો', brief: 'ટૂંકો', detailed: 'વિસ્તૃત', expert: 'નિષ્ણાત',
    clearChat: 'ચેટ સાફ કરો', scanImage: 'ફોટો સ્કેન કરો', dailyLimit: 'દૈનિક સંદેશ મર્યાદા પૂર્ણ', waitReset: 'રીસેટની રાહ જુઓ',
    settings: 'સેટિંગ્સ', appearance: 'દેખાવ', theme: 'થીમ', lightMode: 'લાઇટ મોડ', darkMode: 'ડાર્ક મોડ',
    preferences: 'પસંદગીઓ', language: 'ભાષા', appLang: 'એપ પ્રદર્શન ભાષા', voiceMode: 'અવાજ મોડ',
    voiceEnabled: 'અવાજ પ્રતિસાદ ચાલુ', voiceDisabled: 'અવાજ પ્રતિસાદ બંધ', responseStyle: 'પ્રતિસાદ શૈલી', aiLength: 'AI જવાબની લંબાઈ',
    notifications: 'સૂચનાઓ', pushNotif: 'પુશ સૂચનાઓ', alertsUpdates: 'ચેતવણી અને અપડેટ', support: 'સહાય',
    privacyPolicy: 'ગોપનીયતા નીતિ', readPrivacy: 'અમારી ગોપનીયતા નીતિ વાંચો', helpSupport: 'મદદ અને સહાય',
    faqContact: 'FAQ અને સંપર્ક', logout: 'લૉગઆઉટ કરો', scanTitle: 'પાક સ્કેન કરો', weatherTitle: 'હવામાન',
  },
  te: {
    navHome: 'హోమ్', navChat: 'చాట్', navScan: 'స్కాన్', navNotifications: 'నోటిఫికేషన్లు', navSettings: 'సెట్టింగ్లు',
    greeting: 'నమస్కారం', greetingSuffix: 'గారు ⛅', greetingFarmer: 'నమస్కారం, రైతు గారు ⛅',
    quickActions: 'శీఘ్ర చర్యలు', cropAdvisory: 'పంట సలహా', pestId: 'తెగులు గుర్తింపు', weather: 'వాతావరణం',
    recentConv: 'ఇటీవలి సంభాషణలు', viewAll: 'అన్నీ చూడండి', noConvYet: 'ఇంకా సంభాషణలు లేవు', noConvSub: 'AgriFather AIతో చాటింగ్ ప్రారంభించడానికి ట్యాప్ చేయండి',
    locustAlert: '⚠️ మీ ప్రాంతంలో మిడతల దండు ముప్పు', locustAlertEn: 'మీ ప్రాంతంలో మిడతల హెచ్చరిక',
    chatTitle: 'AgriFather AI', chatStatus: 'స్మార్ట్ ఫార్మింగ్ అసిస్టెంట్', howCanIHelp: 'ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
    chatDesc: 'పంటలు, తెగుళ్లు, వాతావరణం, నేల, మండి ధరలు లేదా ప్రభుత్వ పథకాల గురించి ఏదైనా అడగండి.',
    freeMessages: 'ఈరోజు మిగిలి ఉన్న ఉచిత సందేశాలు', msgPlaceholder: 'AgriFather AIకి సందేశం పంపండి…', limitReached: 'సందేశ పరిమితి ముగిసింది — Proకి అప్‌గ్రేడ్ చేయండి',
    listeningPlaceholder: '🎤 వింటున్నాను... ఇప్పుడు మాట్లాడండి', brief: 'సంక్షిప్తం', detailed: 'వివరణాత్మక', expert: 'నిపుణుడు',
    clearChat: 'చాట్ క్లియర్ చేయండి', scanImage: 'చిత్రాన్ని స్కాన్ చేయండి', dailyLimit: 'రోజువారీ సందేశ పరిమితి ముగిసింది', waitReset: 'రీసెట్ కోసం వేచి ఉండండి',
    settings: 'సెట్టింగ్లు', appearance: 'రూపం', theme: 'థీమ్', lightMode: 'లైట్ మోడ్', darkMode: 'డార్క్ మోడ్',
    preferences: 'ప్రాధాన్యతలు', language: 'భాష', appLang: 'యాప్ ప్రదర్శన భాష', voiceMode: 'వాయిస్ మోడ్',
    voiceEnabled: 'వాయిస్ ప్రతిస్పందనలు ప్రారంభించబడ్డాయి', voiceDisabled: 'వాయిస్ ప్రతిస్పందనలు నిలిపివేయబడ్డాయి', responseStyle: 'ప్రతిస్పందన శైలి', aiLength: 'AI ప్రతిస్పందన నిడివి',
    notifications: 'నోటిఫికేషన్లు', pushNotif: 'పుష్ నోటిఫికేషన్లు', alertsUpdates: 'హెచ్చరికలు మరియు అప్‌డేట్‌లు', support: 'మద్దతు',
    privacyPolicy: 'గోప్యతా విధానం', readPrivacy: 'మా గోప్యతా విధానాన్ని చదవండి', helpSupport: 'సహాయం & మద్దతు',
    faqContact: 'తరచుగా అడిగే ప్రశ్నలు మరియు మమ్మల్ని సంప్రదించండి', logout: 'లాగ్ అవుట్', scanTitle: 'మొక్కను స్కాన్ చేయండి', weatherTitle: 'వాతావరణం',
  },
  ta: {
    navHome: 'முகப்பு', navChat: 'சாட்', navScan: 'ஸ்கேன்', navNotifications: 'அறிவிப்புகள்', navSettings: 'அமைப்புகள்',
    greeting: 'வணக்கம்', greetingSuffix: 'ஐயா ⛅', greetingFarmer: 'வணக்கம், விவசாயி ஐயா ⛅',
    quickActions: 'விரைவான చర్యகள்', cropAdvisory: 'பயிர் ஆலோசனை', pestId: 'பூச்சி அடையாளம்', weather: 'வானிலை',
    recentConv: 'சமீபத்திய உரையாடல்கள்', viewAll: 'அனைத்தையும் காண்க', noConvYet: 'இன்னும் உரையாடல்கள் இல்லை', noConvSub: 'AgriFather AI உடன் அரட்டையடிக்க தட்டவும்',
    locustAlert: '⚠️ உங்கள் பகுதியில் வெட்டுக்கிளி அச்சுறுத்தல்', locustAlertEn: 'உங்கள் பகுதியில் வெட்டுக்கிளி எச்சரிக்கை',
    chatTitle: 'AgriFather AI', chatStatus: 'ஸ்மார்ட் விவசாய உதவியாளர்', howCanIHelp: 'இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
    chatDesc: 'பயிர்கள், பூச்சிகள், வானிலை, மண், மண்டி விலைகள் அல்லது அரசு திட்டங்கள் பற்றி எதையும் கேளுங்கள்.',
    freeMessages: 'இன்று மீதமுள்ள இலவச செய்திகள்', msgPlaceholder: 'AgriFather AI-க்கு செய்தி அனுப்பவும்…', limitReached: 'செய்தி வரம்பு முடிந்தது — Pro-க்கு மாறவும்',
    listeningPlaceholder: '🎤 கேட்கிறது... இப்போது பேசுங்கள்', brief: 'சுருக்கமான', detailed: 'விரிவான', expert: 'நிபுணர்',
    clearChat: 'அரட்டையை அழி', scanImage: 'படத்தை ஸ்கேன் செய்', dailyLimit: 'தினசரி செய்தி வரம்பு முடிந்தது', waitReset: 'மீட்டமைக்க காத்திருக்கவும்',
    settings: 'அமைப்புகள்', appearance: 'தோற்றம்', theme: 'தீம்', lightMode: 'ஒளி பயன்முறை', darkMode: 'இருண்ட பயன்முறை',
    preferences: 'விருப்பங்கள்', language: 'மொழி', appLang: 'பயன்பாட்டு காட்சி மொழி', voiceMode: 'குரல் பயன்முறை',
    voiceEnabled: 'குரல் பதில்கள் இயக்கப்பட்டுள்ளன', voiceDisabled: 'குரல் பதில்கள் முடக்கப்பட்டுள்ளன', responseStyle: 'பதில் பாணி', aiLength: 'AI பதில் நீளம்',
    notifications: 'அறிவிப்புகள்', pushNotif: 'புッシュ அறிவிப்புகள்', alertsUpdates: 'எச்சரிக்கைகள் மற்றும் புதுப்பிப்புகள்', support: 'ஆதரவு',
    privacyPolicy: 'தனியுரிமைக் கொள்கை', readPrivacy: 'எங்கள் தனியுரிமைக் கொள்கையைப் படிக்கவும்', helpSupport: 'உதவி & ஆதரவு',
    faqContact: 'கேள்விகள் மற்றும் எங்களைத் தொடர்பு கொள்ளவும்', logout: 'வெளியேறு', scanTitle: 'தாவரத்தை ஸ்கேன் செய்', weatherTitle: 'வானிலை',
  },
  kn: {
    navHome: 'ಮುಖಪುಟ', navChat: 'ಚಾಟ್', navScan: 'ಸ್ಕ್ಯಾನ್', navNotifications: 'ಸೂಚನೆಗಳು', navSettings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    greeting: 'ನಮಸ್ಕಾರ', greetingSuffix: 'ಅವರೇ ⛅', greetingFarmer: 'ನಮಸ್ಕಾರ, ರೈತ ಅವರೇ ⛅',
    quickActions: 'ತ್ವರಿತ ಕ್ರಮಗಳು', cropAdvisory: 'ಬೆಳೆ ಸಲಹೆ', pestId: 'ಕೀಟ ಗುರುತಿಸುವಿಕೆ', weather: 'ಹವಾಮಾನ',
    recentConv: 'ಇತ್ತೀಚಿನ ಸಂಭಾಷಣೆಗಳು', viewAll: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ', noConvYet: 'ಇನ್ನೂ ಸಂಭಾಷಣೆಗಳಿಲ್ಲ', noConvSub: 'AgriFather AI ಜೊತೆಗೆ ಚಾಟ್ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    locustAlert: '⚠️ ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಮಿಡತೆ ಹಾವಳಿಯ ಭีತಿ', locustAlertEn: 'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಮಿಡತೆ ಎಚ್ಚರಿಕೆ',
    chatTitle: 'AgriFather AI', chatStatus: 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಸಹಾಯಕ', howCanIHelp: 'ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ?',
    chatDesc: 'ಬೆಳೆಗಳು, ಕೀಟಗಳು, ಹವಾಮಾನ, ಮಣ್ಣು, ಮಂಡಿ ದರಗಳು ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಏನು ಬೇಕಾದರೂ ಕೇಳಿ.',
    freeMessages: 'ಇಂದು ಬಾಕಿ ಇರುವ ಉಚಿತ ಸಂದೇಶಗಳು', msgPlaceholder: 'AgriFather AI ಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ…', limitReached: 'ಸಂದೇಶದ ಮಿತಿ ಮೀರಿದೆ — Pro ಗೆ ಅಪ್‌ಗ್ರೇಡ್ ಮಾಡಿ',
    listeningPlaceholder: '🎤 ಆಲಿಸುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ', brief: 'ಸಂಕ್ಷಿప్త', detailed: 'ವಿವರವಾದ', expert: 'ತಜ್ಞ',
    clearChat: 'ಚಾಟ್ ಅಳಿಸಿ', scanImage: 'ಚಿತ್ರವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ', dailyLimit: 'ದೈನಂದಿನ ಸಂದೇಶ ಮಿತಿ ಮೀರಿದೆ', waitReset: 'ರೀಸೆಟ್‌ಗಾಗಿ ಕಾಯಿರಿ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', appearance: 'ಗೋಚರತೆ', theme: 'ಥೀಮ್', lightMode: 'ಲೈಟ್ ಮೋಡ್', darkMode: 'ಡಾರ್ಕ್ ಮೋಡ್',
    preferences: 'ಆದ್ಯತೆಗಳು', language: 'ಭಾಷೆ', appLang: 'ಅಪ್ಲಿಕೇಶನ್ ಪ್ರದರ್ಶನ ಭಾಷೆ', voiceMode: 'ಧ್ವನಿ ಮೋಡ್',
    voiceEnabled: 'ಧ್ವನಿ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ', voiceDisabled: 'ಧ್ವನಿ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ', responseStyle: 'ಪ್ರತಿಕ್ರಿಯೆ ಶೈಲಿ', aiLength: 'AI ಪ್ರತಿಕ್ರಿಯೆಯ ಉದ್ದ',
    notifications: 'ಸೂಚನೆಗಳು', pushNotif: 'ಪುಶ್ ಸೂಚನೆಗಳು', alertsUpdates: 'ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಅಪ್‌ಡೇಟ್‌ಗಳು', support: 'ಬೆಂಬಲ',
    privacyPolicy: 'ಗೌಪ್ಯತಾ ನೀತಿ', readPrivacy: 'ನಮ್ಮ ಗೌಪ್ಯತಾ ನೀತಿಯನ್ನು ಓದಿ', helpSupport: 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
    faqContact: 'FAQ ಮತ್ತು ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ', logout: 'ಲಾಗ್ ಔಟ್', scanTitle: 'ಸಸ್ಯವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ', weatherTitle: 'ಹವಾಮಾನ',
  },
  bn: {
    navHome: 'হোম', navChat: 'চ্যাট', navScan: 'স্ক্যান', navNotifications: 'নোটিফিকেশন', navSettings: 'সেটিংস',
    greeting: 'নমস্কার', greetingSuffix: 'জি ⛅', greetingFarmer: 'নমস্কার, কৃষক ভাই ⛅',
    quickActions: 'দ্রুত কাজ', cropAdvisory: 'শস্য পরামর্শ', pestId: 'পোকা শনাক্তকরণ', weather: 'আবহাওয়া',
    recentConv: 'সাম্প্রতিক কথোপকথন', viewAll: 'সব দেখুন', noConvYet: 'এখনও কোনো কথোপকথন নেই', noConvSub: 'AgriFather AI-এর সাথে কথা বলতে ট্যাপ করুন',
    locustAlert: '⚠️ আপনার এলাকায় পঙ্গপালের ঝুঁকি', locustAlertEn: 'আপনার এলাকায় পঙ্গপালের সতর্কতা',
    chatTitle: 'AgriFather AI', chatStatus: 'স্মার্ট কৃষি সহকারী', howCanIHelp: 'আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
    chatDesc: 'শস্য, পোকা, আবহাওয়া, মাটি, মান্ডির দাম বা সরকারি প্রকল্প সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।',
    freeMessages: 'আজকের জন্য বিনামূল্যে মেসেজ বাকি আছে', msgPlaceholder: 'AgriFather AI-কে মেসেজ করুন…', limitReached: 'মেসেজের সীমা শেষ — Pro-তে আপগ্রেড করুন',
    listeningPlaceholder: '🎤 শুনছি... এখন বলুন', brief: 'সংক্ষিপ্ত', detailed: 'বিস্তারিত', expert: 'বিশেষজ্ঞ',
    clearChat: 'চ্যাট পরিষ্কার করুন', scanImage: 'ছবি স্ক্যান করুন', dailyLimit: 'দৈনিক মেসেজের সীমা শেষ', waitReset: 'রিসেট হওয়ার জন্য অপেক্ষা করুন',
    settings: 'সেটিংস', appearance: 'চেহারা', theme: 'থিম', lightMode: 'লাইট মোড', darkMode: 'ডার্ক মোড',
    preferences: 'পছন্দ', language: 'ভাষা', appLang: 'অ্যাপের ভাষা', voiceMode: 'ভয়েস মোড',
    voiceEnabled: 'ভয়েস উত্তর চালু', voiceDisabled: 'ভয়েস উত্তর বন্ধ', responseStyle: 'উত্তরের ধরন', aiLength: 'AI উত্তরের দৈর্ঘ্য',
    notifications: 'নোটিফিকেশন', pushNotif: 'পুশ নোটিফিকেশন', alertsUpdates: 'সতর্কতা এবং আপডেট', support: 'সহায়তা',
    privacyPolicy: 'গোপনীয়তা নীতি', readPrivacy: 'আমাদের গোপনীয়তা নীতি পড়ুন', helpSupport: 'সাহায্য ও সহায়তা',
    faqContact: 'প্রশ্নোত্তর এবং আমাদের সাথে যোগাযোগ করুন', logout: 'লগ আউট', scanTitle: 'গাছ স্ক্যান করুন', weatherTitle: 'আবহাওয়া',
  },
  ml: {
    navHome: 'ഹോം', navChat: 'ചാറ്റ്', navScan: 'സ്കാൻ', navNotifications: 'അറിയിപ്പുകൾ', navSettings: 'ക്രമീകരണങ്ങൾ',
    greeting: 'നമസ്കാരം', greetingSuffix: 'ജീ ⛅', greetingFarmer: 'നമസ്കാരം, കർഷക സുഹൃത്തേ ⛅',
    quickActions: 'ദ്രുത നടപടികൾ', cropAdvisory: 'വിള ഉപദേശം', pestId: 'കീട തിരിച്ചറിയൽ', weather: 'കാലാവസ്ഥ',
    recentConv: 'സമീപകാല സംഭാഷണങ്ങൾ', viewAll: 'എല്ലാം കാണുക', noConvYet: 'സംഭാഷണങ്ങളൊന്നുമില്ല', noConvSub: 'AgriFather AI-യുമായി ചാറ്റ് ചെയ്യാൻ ടാപ്പ് ചെയ്യുക',
    locustAlert: '⚠️ നിങ്ങളുടെ പ്രദേശത്ത് വെട്ടുക്കിളി ശല്യം', locustAlertEn: 'നിങ്ങളുടെ പ്രദേശത്ത് വെട്ടുക്കിളി ജാഗ്രത',
    chatTitle: 'AgriFather AI', chatStatus: 'സ്മാർട്ട് കൃഷി സഹായി', howCanIHelp: 'ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?',
    chatDesc: 'വിളകൾ, കീടങ്ങൾ, കാലാവസ്ഥ, മണ്ണ്, മണ്ടി നിരക്കുകൾ അല്ലെങ്കിൽ സർക്കാർ പദ്ധതികൾ എന്നിവയെക്കുറിച്ച് എന്തുവേണമെങ്കിലും ചോദിക്കുക.',
    freeMessages: 'ഇന്ന് ബാക്കിയുള്ള സൗജന്യ സന്ദേശങ്ങൾ', msgPlaceholder: 'AgriFather AI-ക്ക് സന്ദേശം അയയ്‌ക്കുക…', limitReached: 'സന്ദേശ പരിധി കഴിഞ്ഞു — Pro-ലേക്ക് മാറൂ',
    listeningPlaceholder: '🎤 കേൾക്കുന്നു... ഇപ്പോൾ സംസാരിക്കൂ', brief: 'ചുരുങ്ങിയ', detailed: 'വിശദമായ', expert: 'വിദഗ്ദ്ധൻ',
    clearChat: 'ചാറ്റ് ക്ലിയർ ചെയ്യുക', scanImage: 'ചിത്രം സ്കാൻ ചെയ്യുക', dailyLimit: 'ദിവസേനയുള്ള സന്ദേശ പരിധി കഴിഞ്ഞു', waitReset: 'റീസെറ്റിനായി കാത്തിരിക്കുക',
    settings: 'ക്രമീകരണങ്ങൾ', appearance: 'രൂപം', theme: 'തീം', lightMode: 'ലൈറ്റ് മോഡ്', darkMode: 'ഡార్క్ മോడ్',
    preferences: 'മുൻഗണനകൾ', language: 'ഭാഷ', appLang: 'ആപ്പ് പ്രദർശന ഭാഷ', voiceMode: 'വോയിസ് മോഡ്',
    voiceEnabled: 'വോയിസ് പ്രതികരണങ്ങൾ ഓൺ', voiceDisabled: 'വോയിസ് പ്രതികരണങ്ങൾ ഓഫ്', responseStyle: 'പ്രതികരണ ശൈലി', aiLength: 'AI പ്രതികരണ ദൈർഘ്യം',
    notifications: 'അറിയിപ്പുകൾ', pushNotif: 'പുഷ് അറിയിപ്പുകൾ', alertsUpdates: 'അലേർട്ടുകളും അപ്‌ഡേറ്റുകളും', support: 'പിന്തുണ',
    privacyPolicy: 'സ്വകാര്യതാ നയം', readPrivacy: 'ഞങ്ങളുടെ സ്വകാര്യതാ നയം വായിക്കുക', helpSupport: 'സഹായവും പിന്തുണയും',
    faqContact: 'ചോദ്യങ്ങളും ഞങ്ങളെ ബന്ധപ്പെടലും', logout: 'ലോഗൗട്ട്', scanTitle: 'ചെടി സ്കാൻ ചെയ്യുക', weatherTitle: 'കാലാവസ്ഥ',
  },
};

const LanguageContext = createContext();

// Map settings label → code
const LANG_MAP = { 
  'Hindi': 'hi', 'English': 'en', 'Marathi': 'mr', 'Punjabi': 'pa', 'Gujarati': 'gu',
  'Telugu': 'te', 'Tamil': 'ta', 'Kannada': 'kn', 'Bengali': 'bn', 'Malayalam': 'ml'
};
const LANG_LABEL_MAP = { 
  'hi': 'Hindi', 'en': 'English', 'mr': 'Marathi', 'pa': 'Punjabi', 'gu': 'Gujarati',
  'te': 'Telugu', 'ta': 'Tamil', 'kn': 'Kannada', 'bn': 'Bengali', 'ml': 'Malayalam'
};

// Full language names for the backend
const LANG_FULL_NAMES = {
  'hi': 'Hindi', 'en': 'English', 'mr': 'Marathi', 'pa': 'Punjabi', 'gu': 'Gujarati',
  'te': 'Telugu', 'ta': 'Tamil', 'kn': 'Kannada', 'bn': 'Bengali', 'ml': 'Malayalam'
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
