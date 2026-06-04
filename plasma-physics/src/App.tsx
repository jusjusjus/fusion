import { useState } from 'react';
import LandingPage from './lessons/LandingPage';
import PlasmaOscillations from './lessons/PlasmaOscillations';
import TwoStream from './lessons/TwoStream';
import AlfvenWave from './lessons/AlfvenWave';

const LESSONS = [
  { id: 'oscillations', icon: '〜', title: 'Plasma Oscillations' },
  { id: 'twostream',    icon: '⇅',  title: 'Two-Stream Instability' },
  { id: 'alfven',       icon: '🌊', title: 'Alfvén Waves' },
];

const COMPONENTS: Record<string, React.ComponentType> = {
  oscillations: PlasmaOscillations,
  twostream:    TwoStream,
  alfven:       AlfvenWave,
};

export default function App() {
  const [active, setActive] = useState<string | null>(null);
  const activeLesson = active ? LESSONS.find((l) => l.id === active) : null;
  const LessonComponent = active ? COMPONENTS[active] : null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-breadcrumb">
          <a href="/fusion/" className="back-link">← Fusion</a>
          {active && (
            <>
              <span className="breadcrumb-sep">/</span>
              <button className="back-link back-link--btn" onClick={() => setActive(null)}>
                Plasma Physics
              </button>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{activeLesson?.title}</span>
            </>
          )}
        </div>
        <div className="header-title">
          <span className="header-icon">⚡</span>
          <div>
            <h1>Plasma Physics</h1>
            <p className="app-subtitle">Collective dynamics in magnetised plasmas</p>
          </div>
        </div>
      </header>

      <main className="lesson-main">
        {!active && <LandingPage onSelect={setActive} />}
        {active && LessonComponent && <LessonComponent />}
      </main>

      <footer className="app-footer">
        <a href="/fusion/impressum.html" className="footer-link">Impressum</a>
        <span className="footer-sep">·</span>
        <a href="/fusion/datenschutz.html" className="footer-link">Datenschutz</a>
      </footer>
    </div>
  );
}
