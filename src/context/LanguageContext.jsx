/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const PAGE_LANGUAGE_STORAGE_KEY = 'medintel_page_language';
const CHAT_LANGUAGE_STORAGE_KEY = 'medintel_chat_language';

export const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' }
];

const translations = {
  en: {
    language: 'Language', dashboard: 'Dashboard', logout: 'Logout', doctorPortal: 'Doctor Portal', adminPortal: 'Admin Portal',
    patientIntelligence: 'Patient Intelligence', overview: 'Overview', healthTracker: 'Health Tracker', comparison: 'Comparison',
    analyzeAnotherReport: 'Analyze Another Report', specialists: 'Specialists', patientPortal: 'Patient Portal',
    previousReports: 'Previous Uploaded Reports', chatAssistant: 'MedIntel AI Assistant', online: 'Online',
    askAboutReport: 'Ask about your report...', sendMessage: 'Send message',
    chatWelcome: "Hello! I am MedIntel AI. I've analyzed your report. What would you like to know about your results?",
    close: 'Close', goToDashboard: 'Go to Dashboard'
  },
  hi: {
    language: 'भाषा', dashboard: 'डैशबोर्ड', logout: 'लॉग आउट', doctorPortal: 'डॉक्टर पोर्टल', adminPortal: 'एडमिन पोर्टल',
    patientIntelligence: 'रोगी स्वास्थ्य जानकारी', overview: 'सारांश', healthTracker: 'स्वास्थ्य ट्रैकर', comparison: 'तुलना',
    analyzeAnotherReport: 'एक और रिपोर्ट का विश्लेषण करें', specialists: 'विशेषज्ञ', patientPortal: 'रोगी पोर्टल',
    previousReports: 'पहले अपलोड की गई रिपोर्ट', chatAssistant: 'MedIntel AI सहायक', online: 'ऑनलाइन',
    askAboutReport: 'अपनी रिपोर्ट के बारे में पूछें...', sendMessage: 'संदेश भेजें',
    chatWelcome: 'नमस्ते! मैं MedIntel AI हूं। मैंने आपकी रिपोर्ट का विश्लेषण किया है। आप अपने परिणामों के बारे में क्या जानना चाहते हैं?',
    close: 'बंद करें', goToDashboard: 'डैशबोर्ड पर जाएं'
  },
  mr: {
    language: 'भाषा', dashboard: 'डॅशबोर्ड', logout: 'लॉग आउट', doctorPortal: 'डॉक्टर पोर्टल', adminPortal: 'अॅडमिन पोर्टल',
    patientIntelligence: 'रुग्ण आरोग्य माहिती', overview: 'आढावा', healthTracker: 'आरोग्य ट्रॅकर', comparison: 'तुलना',
    analyzeAnotherReport: 'दुसऱ्या अहवालाचे विश्लेषण करा', specialists: 'तज्ज्ञ', patientPortal: 'रुग्ण पोर्टल',
    previousReports: 'पूर्वी अपलोड केलेले अहवाल', chatAssistant: 'MedIntel AI सहाय्यक', online: 'ऑनलाइन',
    askAboutReport: 'तुमच्या अहवालाबद्दल विचारा...', sendMessage: 'संदेश पाठवा',
    chatWelcome: 'नमस्कार! मी MedIntel AI आहे. मी तुमच्या अहवालाचे विश्लेषण केले आहे. तुम्हाला तुमच्या निकालांबद्दल काय जाणून घ्यायचे आहे?',
    close: 'बंद करा', goToDashboard: 'डॅशबोर्डवर जा'
  },
  bn: { language: 'ভাষা', dashboard: 'ড্যাশবোর্ড', logout: 'লগ আউট', doctorPortal: 'ডাক্তার পোর্টাল', adminPortal: 'অ্যাডমিন পোর্টাল', overview: 'সারাংশ', healthTracker: 'স্বাস্থ্য ট্র্যাকার', comparison: 'তুলনা', specialists: 'বিশেষজ্ঞ', patientPortal: 'রোগী পোর্টাল', chatAssistant: 'MedIntel AI সহায়ক', online: 'অনলাইন', close: 'বন্ধ করুন', goToDashboard: 'ড্যাশবোর্ডে যান' },
  ta: { language: 'மொழி', dashboard: 'டாஷ்போர்டு', logout: 'வெளியேறு', doctorPortal: 'மருத்துவர் போர்டல்', adminPortal: 'நிர்வாக போர்டல்', overview: 'கண்ணோட்டம்', healthTracker: 'சுகாதார கண்காணிப்பு', comparison: 'ஒப்பீடு', specialists: 'நிபுணர்கள்', patientPortal: 'நோயாளர் போர்டல்', chatAssistant: 'MedIntel AI உதவியாளர்', online: 'ஆன்லைன்', close: 'மூடு', goToDashboard: 'டாஷ்போர்டுக்குச் செல்லவும்' },
  te: { language: 'భాష', dashboard: 'డాష్‌బోర్డ్', logout: 'లాగ్ అవుట్', doctorPortal: 'డాక్టర్ పోర్టల్', adminPortal: 'అడ్మిన్ పోర్టల్', overview: 'అవలోకనం', healthTracker: 'ఆరోగ్య ట్రాకర్', comparison: 'పోలిక', specialists: 'నిపుణులు', patientPortal: 'రోగి పోర్టల్', chatAssistant: 'MedIntel AI సహాయకుడు', online: 'ఆన్‌లైన్', close: 'మూసివేయి', goToDashboard: 'డాష్‌బోర్డ్‌కు వెళ్లండి' },
  gu: { language: 'ભાષા', dashboard: 'ડેશબોર્ડ', logout: 'લૉગ આઉટ', doctorPortal: 'ડૉક્ટર પોર્ટલ', adminPortal: 'એડમિન પોર્ટલ', overview: 'ઝાંખી', healthTracker: 'આરોગ્ય ટ્રેકર', comparison: 'સરખામણી', specialists: 'નિષ્ણાતો', patientPortal: 'દર્દી પોર્ટલ', chatAssistant: 'MedIntel AI સહાયક', online: 'ઓનલાઇન', close: 'બંધ કરો', goToDashboard: 'ડેશબોર્ડ પર જાઓ' },
  kn: { language: 'ಭಾಷೆ', dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', logout: 'ಲಾಗ್ ಔಟ್', doctorPortal: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್', adminPortal: 'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್', overview: 'ಅವಲೋಕನ', healthTracker: 'ಆರೋಗ್ಯ ಟ್ರ್ಯಾಕರ್', comparison: 'ಹೋಲಿಕೆ', specialists: 'ತಜ್ಞರು', patientPortal: 'ರೋಗಿ ಪೋರ್ಟಲ್', chatAssistant: 'MedIntel AI ಸಹಾಯಕ', online: 'ಆನ್‌ಲೈನ್', close: 'ಮುಚ್ಚಿ', goToDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ' },
  ml: { language: 'ഭാഷ', dashboard: 'ഡാഷ്ബോർഡ്', logout: 'പുറത്തുകടക്കുക', doctorPortal: 'ഡോക്ടർ പോർട്ടൽ', adminPortal: 'അഡ്മിൻ പോർട്ടൽ', overview: 'അവലോകനം', healthTracker: 'ആരോഗ്യ ട്രാക്കർ', comparison: 'താരതമ്യം', specialists: 'വിദഗ്ധർ', patientPortal: 'രോഗി പോർട്ടൽ', chatAssistant: 'MedIntel AI സഹായി', online: 'ഓൺലൈൻ', close: 'അടയ്ക്കുക', goToDashboard: 'ഡാഷ്ബോർഡിലേക്ക് പോകുക' },
  pa: { language: 'ਭਾਸ਼ਾ', dashboard: 'ਡੈਸ਼ਬੋਰਡ', logout: 'ਲੌਗ ਆਊਟ', doctorPortal: 'ਡਾਕਟਰ ਪੋਰਟਲ', adminPortal: 'ਐਡਮਿਨ ਪੋਰਟਲ', overview: 'ਸੰਖੇਪ', healthTracker: 'ਸਿਹਤ ਟ੍ਰੈਕਰ', comparison: 'ਤੁਲਨਾ', specialists: 'ਮਾਹਿਰ', patientPortal: 'ਮਰੀਜ਼ ਪੋਰਟਲ', chatAssistant: 'MedIntel AI ਸਹਾਇਕ', online: 'ਔਨਲਾਈਨ', close: 'ਬੰਦ ਕਰੋ', goToDashboard: 'ਡੈਸ਼ਬੋਰਡ ਤੇ ਜਾਓ' }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const getValidLanguage = (value, fallback = 'en') => {
    return supportedLanguages.some((item) => item.code === value) ? value : fallback;
  };

  const [pageLanguage, setPageLanguageState] = useState(() => {
    const savedLanguage = localStorage.getItem(PAGE_LANGUAGE_STORAGE_KEY) || localStorage.getItem('medintel_language');
    return getValidLanguage(savedLanguage);
  });
  const [chatLanguage, setChatLanguageState] = useState(() => {
    const savedChatLanguage = localStorage.getItem(CHAT_LANGUAGE_STORAGE_KEY);
    const savedPageLanguage = localStorage.getItem(PAGE_LANGUAGE_STORAGE_KEY) || localStorage.getItem('medintel_language');
    return getValidLanguage(savedChatLanguage, getValidLanguage(savedPageLanguage));
  });

  const setPageLanguage = (nextLanguage) => {
    const validLanguage = getValidLanguage(nextLanguage, pageLanguage);
    setPageLanguageState(validLanguage);
    localStorage.setItem(PAGE_LANGUAGE_STORAGE_KEY, validLanguage);
    localStorage.setItem('medintel_language', validLanguage);
    document.documentElement.lang = validLanguage;
  };

  const setChatLanguage = (nextLanguage) => {
    const validLanguage = getValidLanguage(nextLanguage, chatLanguage);
    setChatLanguageState(validLanguage);
    localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, validLanguage);
  };

  const t = (key) => translations[pageLanguage]?.[key] || translations.en[key] || key;
  const tChat = (key) => translations[chatLanguage]?.[key] || translations.en[key] || key;

  return <LanguageContext.Provider value={{
    language: pageLanguage,
    chatLanguage,
    setLanguage: setPageLanguage,
    setPageLanguage,
    setChatLanguage,
    supportedLanguages,
    t,
    tChat
  }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
};
