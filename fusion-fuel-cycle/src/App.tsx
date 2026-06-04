import { useState } from 'react';
import LandingPage from './lessons/LandingPage';
import AlphaAsh from './lessons/AlphaAsh';
import TritiumBreeding from './lessons/TritiumBreeding';

const LESSONS = [
  { id: 'alpha-ash',         icon: '♨️',  title: 'Alpha Ash' },
  { id: 'tritium-breeding',  icon: '⚗️', title: 'Tritium Breeding' },
];

const COMPONENTS: Record<string, React.ComponentType> = {
  'alpha-ash':        AlphaAsh,
  'tritium-breeding': TritiumBreeding,
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
                Fusion Fuel Cycle
              </button>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{activeLesson?.title}</span>
            </>
          )}
        </div>
        <div className="header-title">
          <span className="header-icon">♻️</span>
          <div>
            <h1>Fusion Fuel Cycle</h1>
            <p className="app-subtitle">He²⁺ ash dynamics and tritium breeding</p>
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
