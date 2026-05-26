import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Scene from '../viz/Scene.jsx';
import CoilMesh from '../viz/CoilMesh.jsx';
import CurrentArrows from '../viz/CurrentArrows.jsx';
import ParticleTrack from '../viz/ParticleTrack.jsx';
import InjectionMarker from '../viz/InjectionMarker.jsx';
import ParticleTraces from '../viz/ParticleTraces.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import InjectionPanel from '../components/InjectionPanel.jsx';
import useStore from '../store/useStore.js';
import { circularLoop } from '../physics/coils.js';
import { fieldAtPoint } from '../physics/biotSavart.js';
import { traceParticle } from '../physics/particle.js';
import { useParticleInjection } from '../hooks/useParticleInjection.js';

export default function ParticleInjection() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { charge, mass, speed, theta, phi } = params.particle;
  const [computing, setComputing] = useState(false);
  const [trajectory, setTrajectory] = useState(null);
  const [progress, setProgress] = useState(1);
  const controlsRef = useRef();
  const cameraRef = useRef();

  const coil = useMemo(() => circularLoop({ radius: 1, z: 0, n: 200, current: 2 }), []);

  const bFunc = useMemo(
    () => (x) => fieldAtPoint(x, coil.midpoints, coil.weightedDl),
    [coil]
  );

  const injection = useParticleInjection(bFunc);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setComputing(true);

      const x0 = [0.3, 0, 0];
      const v0 = [
        speed * Math.sin(theta) * Math.cos(phi),
        speed * Math.cos(theta),
        speed * Math.sin(theta) * Math.sin(phi),
      ];
      const result = traceParticle(x0, v0, charge, mass, bFunc, { dt: 0.005, nsteps: 2000 });
      setTrajectory(result.positions);
      setProgress(1);
      setComputing(false);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [bFunc, charge, mass, speed, theta, phi]);

  const controls = [
    { key: 'charge', label: t('controls.charge'), min: 0.1, max: 5, step: 0.1, value: charge },
    { key: 'mass', label: t('controls.mass'), min: 0.1, max: 5, step: 0.1, value: mass },
    { key: 'speed', label: t('controls.speed'), min: 0.1, max: 5, step: 0.1, value: speed },
    { key: 'theta', label: t('controls.angleTheta'), min: 0, max: Math.PI, step: 0.05, value: theta },
    { key: 'phi', label: t('controls.anglePhi'), min: 0, max: 2 * Math.PI, step: 0.05, value: phi },
  ];

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene controlsRef={controlsRef} cameraRef={cameraRef}>
          <CoilMesh midpoints={coil.midpoints} color="#ffaa00" />
          <CurrentArrows midpoints={coil.midpoints} weightedDl={coil.weightedDl} color="#ffaa00" />
          {trajectory && <ParticleTrack positions={trajectory} progress={progress} color="#ff4466" />}
          <InjectionMarker active={injection.injectionMode} />
          <ParticleTraces particles={injection.particles} />
        </Scene>
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('particle', key, value)}
          computing={computing}
        >
          <div className="control-row">
            <label>
              {t('controls.traceLength')}
              <span className="control-value">{Math.round(progress * 100)}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={(event) => setProgress(parseFloat(event.target.value))}
            />
          </div>
        </ControlPanel>
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <InjectionPanel
          active={injection.injectionMode}
          onToggle={injection.toggleInjectionMode}
          onInject={() => injection.injectAt(cameraRef.current)}
          onClear={injection.clearParticles}
          particleCount={injection.particles.length}
          speed={injection.speed}   onSpeed={injection.setSpeed}
          theta={injection.theta}   onTheta={injection.setTheta}
          phi={injection.phi}       onPhi={injection.setPhi}
          charge={injection.charge} onCharge={injection.setCharge}
          mass={injection.mass}     onMass={injection.setMass}
        />
        <p className="description">{t('descriptions.particle')}</p>
      </div>
    </div>
  );
}
