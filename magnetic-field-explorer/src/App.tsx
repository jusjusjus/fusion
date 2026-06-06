import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from './store/useStore';
import LessonNav from './components/LessonNav';
import LanguageToggle from './components/LanguageToggle';
import HomePage from './lessons/HomePage';
import SingleLoop from './lessons/SingleLoop';
import HelmholtzCoils from './lessons/HelmholtzCoils';
import ToroidalField from './lessons/ToroidalField';
import TokamakField from './lessons/TokamakField';
import GradientField from './lessons/GradientField';
import StellaratorField from './lessons/StellaratorField';

const LESSONS: Record<string, ComponentType> = {
  home: HomePage,
  singleLoop: SingleLoop,
  helmholtz: HelmholtzCoils,
  toroidal: ToroidalField,
  tokamak: TokamakField,
  gradient: GradientField,
  stellarator: StellaratorField,
};

export default function App() {
  const { t } = useTranslation();
  const { activeLesson, setActiveLesson, tfBackend } = useStore();
  const LessonComponent = LESSONS[activeLesson];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="header-breadcrumb">
            <a href="/fusion/" className="back-link">← Fusion</a>
            {activeLesson !== 'home' && (
              <>
                <span className="breadcrumb-sep">/</span>
                <button className="back-link back-link--btn" onClick={() => setActiveLesson('home')}>
                  {t('appTitle')}
                </button>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{t(`lessons.${activeLesson}`)}</span>
              </>
            )}
          </div>
          <div className="header-title">
            <span className="header-icon">🧲</span>
            <div>
              <h1>{t('appTitle')}</h1>
              <p className="app-subtitle">{t('appSubtitle')}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <span className="backend-badge" title={t('info.tfBackend')}>⚡ {tfBackend}</span>
          <LanguageToggle />
        </div>
      </header>
      <LessonNav />
      <main className="lesson-main">
        {LessonComponent && <LessonComponent />}
      </main>

      <footer className="app-footer">
        <a href="/fusion/impressum.html" className="footer-link">Impressum</a>
        <span className="footer-sep">·</span>
        <a href="/fusion/datenschutz.html" className="footer-link">Datenschutz</a>
      </footer>
    </div>
  );
}
