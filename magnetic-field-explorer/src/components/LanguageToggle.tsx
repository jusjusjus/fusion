import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const toggle = (): Promise<unknown> => i18n.changeLanguage(lang.startsWith('de') ? 'en' : 'de');

  return (
    <button className="lang-toggle" onClick={toggle} title="Toggle language / Sprache wechseln">
      {lang.startsWith('de') ? '🇩🇪 DE' : '🇬🇧 EN'}
    </button>
  );
}
