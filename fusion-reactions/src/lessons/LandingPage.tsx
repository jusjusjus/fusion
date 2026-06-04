interface LessonCard {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
}

const LESSON_CARDS: LessonCard[] = [
  {
    id: 'cross-sections',
    icon: '🎯',
    title: 'Cross-Sections',
    subtitle: 'σ(E) for D–T, D–D, D–³He',
    description:
      'The fusion cross-section quantifies the probability of a nuclear reaction as a function of collision energy. D–T peaks at ~65 keV with σ ≈ 5 barn — orders of magnitude larger than D–D and D–³He at the same energy.',
    tags: ['Bosch-Hale', 'Log-log', 'Gamow peak', 'S-factor'],
  },
  {
    id: 'reactivity',
    icon: '🔥',
    title: 'Reactivity & Ignition',
    subtitle: '⟨σv⟩(T) and the Lawson criterion',
    description:
      'The thermal reactivity ⟨σv⟩ is the cross-section averaged over a Maxwellian velocity distribution. D–T reaches its maximum near 70 keV. The ignition condition requires alpha-particle heating to exceed bremsstrahlung losses.',
    tags: ['Reactivity', 'Bremsstrahlung', 'Ignition', 'Lawson'],
  },
  {
    id: 'energy-yield',
    icon: '⚡',
    title: 'Energy Yield',
    subtitle: 'Q values and binding energies',
    description:
      'D+T→⁴He+n releases 17.6 MeV per reaction — the binding-energy jump to ⁴He drives it. Compare Q values across reactions and see how many tonnes of coal each kilogram of fuel replaces.',
    tags: ['Q value', 'Binding energy', 'MeV/nucleon', 'Energy density'],
  },
];

interface LandingPageProps {
  onSelect: (id: string) => void;
}

export default function LandingPage({ onSelect }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <p className="landing-eyebrow">Thermonuclear Reactions</p>
        <h2 className="landing-title">Choose a topic</h2>
        <p className="landing-subtitle">
          Interactive visualisations of the nuclear physics behind thermonuclear fusion.
        </p>
      </div>

      <div className="lesson-cards-grid">
        {LESSON_CARDS.map((lesson) => (
          <button
            key={lesson.id}
            className="lesson-card"
            onClick={() => onSelect(lesson.id)}
          >
            <span className="lesson-card__icon">{lesson.icon}</span>
            <div className="lesson-card__body">
              <h3 className="lesson-card__title">{lesson.title}</h3>
              <p className="lesson-card__subtitle">{lesson.subtitle}</p>
              <p className="lesson-card__desc">{lesson.description}</p>
              <div className="lesson-card__tags">
                {lesson.tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            </div>
            <span className="lesson-card__arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
