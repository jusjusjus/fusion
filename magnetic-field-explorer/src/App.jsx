import { useTranslation } from 'react-i18next';
import useStore from './store/useStore';
import LessonNav from './components/LessonNav';
import LanguageToggle from './components/LanguageToggle';

// Lesson components loaded eagerly (bundle is self-contained)
import HomePage from './lessons/HomePage';
import SingleLoop from './lessons/SingleLoop';
import HelmholtzCoils from './lessons/HelmholtzCoils';
import ToroidalField from './lessons/ToroidalField';
import TokamakField from './lessons/TokamakField';
import GradientField from './lessons/GradientField';

const LESSONS = {
  home: HomePage,
  singleLoop: SingleLoop,
  helmholtz: HelmholtzCoils,
  toroidal: ToroidalField,
  tokamak: TokamakField,
  gradient: GradientField,
};

export default function App() {
  const { t } = useTranslation();
  const { activeLesson, tfBackend } = useStore();
  const LessonComponent = LESSONS[activeLesson];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <span className="header-icon">🧲</span>
          <div>
            <h1>{t('appTitle')}</h1>
            <p className="app-subtitle">{t('appSubtitle')}</p>
          </div>
        </div>
        <div className="header-right">
          <span className="backend-badge" title={t('info.tfBackend')}>
            ⚡ {tfBackend}
          </span>
          <LanguageToggle />
        </div>
      </header>

      <LessonNav />

      <main className="lesson-main">
        {LessonComponent && <LessonComponent />}
      </main>
    </div>
  );
}
