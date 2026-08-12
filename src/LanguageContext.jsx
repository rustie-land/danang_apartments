import { createContext, useContext, useState, useCallback } from 'react';
import { STRINGS } from './i18n.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en'); // 'en' | 'ru'

  const toggle = useCallback(() => {
    setLang((l) => (l === 'en' ? 'ru' : 'en'));
  }, []);

  const t = useCallback(
    (key) => {
      const dict = STRINGS[lang] || STRINGS.en;
      return dict[key] ?? STRINGS.en[key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
