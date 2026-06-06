import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';

const LESSONS: Array<{ id: string; icon: string }> = [
  { id: 'singleLoop', icon: '⭕' },
  { id: 'helmholtz',  icon: '🔵' },
  { id: 'toroidal',   icon: '🍩' },
  { id: 'tokamak',    icon: '⚛' },
  { id: 'gradient',   icon: '∇' },
  { id: 'stellarator',   icon: '🌌' },
];

interface NavModeKey {
  glyphs: string[];
  label: string;
}

interface NavMode {
  key: string;
  icon: string;
  keys: NavModeKey[];
}

const NAV_MODES: NavMode[] = [
  {
    key: 'fieldReview',
    icon: '🖱️',
    keys: [
      { glyphs: ['drag'], label: 'home.nav.fieldReview.drag' },
      { glyphs: ['scroll'], label: 'home.nav.fieldReview.scroll' },
      { glyphs: ['R-drag'], label: 'home.nav.fieldReview.pan' },
    ],
  },
  {
    key: 'injection',
    icon: '💉',
    keys: [
      { glyphs: ['W', 'A', 'S', 'D'], label: 'home.nav.injection.wasd' },
      { glyphs: ['↑', '↓', '←', '→'], label: 'home.nav.injection.arrows' },
      { glyphs: ['Space'], label: 'home.nav.injection.space' },
    ],
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  const { setActiveLesson } = useStore();

  return (
    <div className="home-page">
      <div className="home-hero">
        <h2 className="home-title">{t('home.title')}</h2>
        <p className="home-subtitle">{t('home.subtitle')}</p>
      </div>

      <div className="home-cards">
        {LESSONS.map(({ id, icon }) => (
          <button key={id} className="home-card" onClick={() => setActiveLesson(id)}>
            <span className="home-card-icon">{icon}</span>
            <h3 className="home-card-name">{t(`lessons.${id}`)}</h3>
            <p className="home-card-desc">{t(`home.cards.${id}`)}</p>
            <span className="home-card-cta">Open →</span>
          </button>
        ))}
      </div>

      <section className="home-nav-section">
        <h3 className="home-nav-heading">{t('home.nav.title')}</h3>
        <div className="home-nav-modes">
          {NAV_MODES.map(({ key, icon, keys }) => (
            <div key={key} className="home-nav-mode">
              <div className="home-nav-mode-header">
                <span className="home-nav-mode-icon">{icon}</span>
                <div>
                  <h4 className="home-nav-mode-name">{t(`home.nav.${key}.title`)}</h4>
                  <p className="home-nav-mode-desc">{t(`home.nav.${key}.desc`)}</p>
                </div>
              </div>
              <ul className="home-nav-keys">
                {keys.map(({ glyphs, label }) => (
                  <li key={label} className="home-nav-key-row">
                    <span className="home-nav-glyphs">
                      {glyphs.map((glyph) => <kbd key={glyph}>{glyph}</kbd>)}
                    </span>
                    <span className="home-nav-key-label">{t(label)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
