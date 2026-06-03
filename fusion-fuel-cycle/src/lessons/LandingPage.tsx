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
    id: 'alpha-ash',
    icon: '♨️',
    title: 'Alpha Ash',
    subtitle: 'He²⁺ accumulation in a burning plasma',
    description:
      'D–T fusion produces 3.5 MeV alpha particles that thermalise in the plasma. If not pumped out, the helium ash dilutes the deuterium–tritium fuel, quenching the burn. Watch how confinement time and temperature govern the equilibrium ash fraction.',
    tags: ['He²⁺ ash', 'Fuel dilution', 'ODE model', 'Pumping'],
  },
  {
    id: 'tritium-breeding',
    icon: '⚗️',
    title: 'Tritium Breeding',
    subtitle: 'Making T from lithium in the blanket',
    description:
      'Tritium does not occur naturally in useful quantities. A fusion reactor must breed its own from lithium in the surrounding blanket: ⁶Li+n→T+⁴He. Explore how enrichment, blanket thickness, and beryllium multiplication determine the Tritium Breeding Ratio.',
    tags: ['TBR', 'Li-6', 'Li-7', 'Be multiplier'],
  },
];

interface LandingPageProps {
  onSelect: (id: string) => void;
}

export default function LandingPage({ onSelect }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <p className="landing-eyebrow">Fusion Fuel Cycle</p>
        <h2 className="landing-title">Choose a topic</h2>
        <p className="landing-subtitle">
          What happens after fusion — managing alpha ash and breeding the tritium fuel.
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
