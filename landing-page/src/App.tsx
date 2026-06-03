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
          <h1 className="hero-title">Physics Simulations</h1>
          <p className="hero-subtitle">
            Interactive explorations of electromagnetic fields and plasma confinement physics,
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
      </footer>
    </div>
  );
}
