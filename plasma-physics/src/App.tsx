import { useState } from 'react';
import PlasmaOscillations from './lessons/PlasmaOscillations';
import TwoStream from './lessons/TwoStream';
import AlfvenWave from './lessons/AlfvenWave';

interface Lesson {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'oscillations',
    icon: '〜',
    title: 'Plasma Oscillations',
    subtitle: 'Electrons displaced from neutrality oscillate at ωp',
  },
  {
    id: 'twostream',
    icon: '⇅',
    title: 'Two-Stream Instability',
    subtitle: 'Counter-streaming beams drive exponential wave growth',
  },
  {
    id: 'alfven',
    icon: '🌊',
    title: 'Alfvén Waves',
    subtitle: 'Magnetic tension carries transverse waves at vA',
  },
];

const COMPONENTS: Record<string, React.ComponentType> = {
  oscillations: PlasmaOscillations,
  twostream: TwoStream,
  alfven: AlfvenWave,
};

export default function App() {
  const [active, setActive] = useState('oscillations');
  const LessonComponent = COMPONENTS[active];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <a href="/fusion/" className="back-link">← Fusion</a>
          <span className="header-icon">⚡</span>
          <div>
            <h1>Plasma Physics</h1>
            <p className="app-subtitle">Collective dynamics in magnetised plasmas</p>
          </div>
        </div>
      </header>

      <nav className="lesson-nav">
        {LESSONS.map(({ id, icon, title }) => (
          <button
            key={id}
            className={`nav-tab${active === id ? ' nav-tab--active' : ''}`}
            onClick={() => setActive(id)}
          >
            <span className="nav-tab-icon">{icon}</span>
            <span className="nav-tab-label">{title}</span>
          </button>
        ))}
      </nav>

      <main className="lesson-main">
        {LessonComponent && <LessonComponent />}
      </main>
    </div>
  );
}
