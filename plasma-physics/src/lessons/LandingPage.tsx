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
    id: 'oscillations',
    icon: '〜',
    title: 'Plasma Oscillations',
    subtitle: 'Electrons oscillate at ωp',
    description:
      'In the cold-plasma model, displaced electrons experience a restoring electric field and oscillate at the plasma frequency ωp = √(n₀e²/ε₀mₑ), independent of wavelength. All spatial modes share the same frequency.',
    tags: ['Cold plasma', 'Sheet model', 'ωp', 'Leapfrog'],
  },
  {
    id: 'twostream',
    icon: '⇅',
    title: 'Two-Stream Instability',
    subtitle: 'Counter-streaming beams drive exponential growth',
    description:
      'Two electron beams at ±v₀ are collectively unstable. Electrostatic perturbations grow exponentially until particles are trapped in wave troughs, forming cat\'s-eye vortices in phase space and saturating the field energy.',
    tags: ['PIC', '1D', 'Phase space', 'Spectral Poisson'],
  },
  {
    id: 'alfven',
    icon: '🌊',
    title: 'Alfvén Waves',
    subtitle: 'Magnetic tension carries transverse waves at vA',
    description:
      'In a magnetised plasma a transverse perturbation propagates along B₀ at the Alfvén speed vA = B₀/√(μ₀ρ). Magnetic tension provides the restoring force; mass density provides the inertia. Watch a Gaussian pulse travel across the domain.',
    tags: ['Ideal MHD', 'Alfvén speed', 'Staggered leapfrog', 'Periodic BC'],
  },
];

interface LandingPageProps {
  onSelect: (id: string) => void;
}

export default function LandingPage({ onSelect }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <p className="landing-eyebrow">Plasma Physics Simulations</p>
        <h2 className="landing-title">Choose a simulation</h2>
        <p className="landing-subtitle">
          Interactive 1D simulations of collective plasma effects — all running in your browser.
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
