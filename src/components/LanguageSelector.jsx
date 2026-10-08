import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = ({ scope = 'page' }) => {
  const { language, chatLanguage, setPageLanguage, setChatLanguage, supportedLanguages } = useLanguage();
  const isChatSelector = scope === 'chat';
  const selectedLanguage = isChatSelector ? chatLanguage : language;
  const setSelectedLanguage = isChatSelector ? setChatLanguage : setPageLanguage;
  const label = isChatSelector ? 'Chatbot language' : 'Webpage language';

  return (
    <label className={`language-selector ${isChatSelector ? 'language-selector-chat' : ''}`} title={label}>
      <Languages size={16} aria-hidden="true" />
      <span className="language-selector-label">{isChatSelector ? 'Chat' : 'Web'}</span>
      <span className="sr-only">{label}</span>
      <select value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value)} aria-label={label}>
        {supportedLanguages.map((item) => (
          <option key={item.code} value={item.code}>{item.label}</option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelector;
