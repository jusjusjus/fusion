import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';

const LESSONS = [
  { id: 'home',      icon: '🏠' },
  { id: 'singleLoop', icon: '⭕' },
  { id: 'helmholtz', icon: '🔵' },
  { id: 'toroidal',  icon: '🍩' },
  { id: 'tokamak',   icon: '⚛' },
  { id: 'gradient',  icon: '∇' },
];

export default function LessonNav() {
  const { t } = useTranslation();
  const { activeLesson, setActiveLesson } = useStore();

  return (
    <nav className="lesson-nav">
      {LESSONS.map(({ id, icon }) => (
        <button
          key={id}
          className={`nav-btn ${activeLesson === id ? 'active' : ''}`}
          onClick={() => setActiveLesson(id)}
          title={t(`lessons.${id}`)}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{t(`lessons.${id}`)}</span>
        </button>
      ))}
    </nav>
  );
}
