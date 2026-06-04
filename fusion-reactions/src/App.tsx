import { useState } from 'react';
import LandingPage from './lessons/LandingPage';
import CrossSections from './lessons/CrossSections';
import Reactivity from './lessons/Reactivity';
import EnergyYield from './lessons/EnergyYield';

const LESSONS = [
  { id: 'cross-sections', icon: '🎯', title: 'Cross-Sections' },
  { id: 'reactivity',     icon: '🔥', title: 'Reactivity & Ignition' },
  { id: 'energy-yield',   icon: '⚡', title: 'Energy Yield' },
];

const COMPONENTS: Record<string, React.ComponentType> = {
  'cross-sections': CrossSections,
  'reactivity':     Reactivity,
  'energy-yield':   EnergyYield,
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
                Thermonuclear Reactions
              </button>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{activeLesson?.title}</span>
            </>
          )}
        </div>
        <div className="header-title">
          <span className="header-icon">⚛️</span>
          <div>
            <h1>Thermonuclear Reactions</h1>
            <p className="app-subtitle">Nuclear physics of thermonuclear reactions</p>
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
