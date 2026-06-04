interface Project {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: string;
  tags: string[];
  available: boolean;
}

const PROJECTS: Project[] = [
  {
    title: 'Magnetic Field Explorer',
    subtitle: 'Interactive 3D simulation',
    description:
      'Visualise Biot–Savart magnetic fields from circular coils, Helmholtz pairs, and tokamak geometries. Inject charged particles and trace their Larmor orbits in real time.',
    href: '/fusion/magnetic-explorer/',
    icon: '🧲',
    tags: ['Biot–Savart', 'Tokamak', 'Boris integrator', 'Three.js'],
    available: true,
  },
  {
    title: 'Plasma Physics',
    subtitle: 'Collective plasma dynamics',
    description:
      'Interactive simulations of collective plasma phenomena: Langmuir oscillations at the plasma frequency, the two-stream instability via 1D PIC, and Alfvén wave propagation in ideal MHD.',
    href: '/fusion/plasma-physics/',
    icon: '⚡',
    tags: ['PIC', 'MHD', 'Plasma Oscillations', 'Alfvén Waves'],
    available: true,
  },
  {
    title: 'Thermonuclear Reactions',
    subtitle: 'Nuclear physics of thermonuclear reactions',
    description:
      'Explore fusion cross-sections σ(E) for D–T, D–D, and D–³He using Bosch-Hale parameterisation. Visualise thermal reactivity ⟨σv⟩(T), the Lawson ignition criterion, and Q values with binding-energy bar charts.',
    href: '/fusion/fusion-reactions/',
    icon: '⚛️',
    tags: ['Bosch-Hale', 'Cross-sections', 'Reactivity', 'Q value'],
    available: true,
  },
  {
    title: 'Fusion Fuel Cycle',
    subtitle: 'He²⁺ ash dynamics and tritium breeding',
    description:
      'Simulate alpha-particle ash accumulation and fuel dilution in a burning D–T plasma. Model the Tritium Breeding Ratio (TBR) for a lithium blanket as a function of Li-6 enrichment, thickness, and beryllium neutron multiplication.',
    href: '/fusion/fusion-fuel-cycle/',
    icon: '♻️',
    tags: ['Alpha ash', 'TBR', 'Li-6 enrichment', 'Be multiplier'],
    available: true,
  },
];

function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.available ? project.href : undefined}
      className={`project-card${project.available ? '' : ' project-card--soon'}`}
      aria-disabled={!project.available}
    >
      <div className="card-icon">{project.icon}</div>
      <div className="card-body">
        <div className="card-header">
          <h2 className="card-title">{project.title}</h2>
          {!project.available && <span className="badge-soon">Coming soon</span>}
        </div>
        <p className="card-subtitle">{project.subtitle}</p>
        <p className="card-desc">{project.description}</p>
        <div className="card-tags">
          {project.tags.map(t => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
      </div>
      {project.available && <span className="card-arrow">→</span>}
    </a>
  );
}

export default function App() {
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-inner">
          <p className="hero-eyebrow">jusjusjus / fusion</p>
          <h1 className="hero-title">Educational Simulations in Terrestrial Fusion Technology</h1>
          <p className="hero-subtitle">
            Interactive explorations of electromagnetic fields, plasma
            confinement physics, and particle dynamics in fusion devices, all
            running entirely in the browser.
          </p>
        </div>
      </header>

      <main className="main">
        <div className="projects-grid">
          {PROJECTS.map(p => (
            <ProjectCard key={p.href} project={p} />
          ))}
        </div>
      </main>

      <footer className="footer">
        <a
          href="https://github.com/jusjusjus/fusion"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          GitHub ↗
        </a>
        <span className="footer-sep">·</span>
        <a href="/fusion/impressum.html" className="footer-link">Impressum</a>
        <span className="footer-sep">·</span>
        <a href="/fusion/datenschutz.html" className="footer-link">Datenschutz</a>
      </footer>
    </div>
  );
}
