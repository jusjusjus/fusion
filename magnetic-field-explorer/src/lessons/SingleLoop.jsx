import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as THREE from 'three';
import Scene from '../viz/Scene.jsx';
import CoilMesh from '../viz/CoilMesh.jsx';
import CurrentArrows from '../viz/CurrentArrows.jsx';
import FieldLines from '../viz/FieldLines.jsx';
import InjectionMarker from '../viz/InjectionMarker.jsx';
import ParticleTraces from '../viz/ParticleTraces.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import InjectionPanel from '../components/InjectionPanel.jsx';
import useStore from '../store/useStore.js';
import { circularLoop } from '../physics/coils.js';
import { fieldAtPoint } from '../physics/biotSavart.js';
import { traceFieldlines } from '../physics/fieldlines.js';
import { useParticleInjection } from '../hooks/useParticleInjection.js';

export default function SingleLoop() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { radius, current, n } = params.singleLoop;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState([]);
  const [bzData, setBzData] = useState([]);
  const controlsRef = useRef();
  const cameraRef = useRef();

  const coil = useMemo(() => circularLoop({ radius, z: 0, n, current }), [radius, current, n]);

  const bFunc = useMemo(
    () => (x) => fieldAtPoint(x, coil.midpoints, coil.weightedDl),
    [coil]
  );

  const injection = useParticleInjection(bFunc);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setComputing(true);

      const seeds = [];
      // 7 radii (inner + outer), 3 azimuthal angles — 21 field lines total.
      // z-offset avoids the coil plane's degenerate on-plane seeds.
      const radii = [0.12, 0.28, 0.48, 0.70, 0.92, 1.25, 1.65];
      const phis = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      for (const r of radii) {
        for (const phi of phis) {
          seeds.push(
            new Float32Array([
              radius * r * Math.cos(phi),
              radius * r * Math.sin(phi),
              0.02,
            ])
          );
        }
      }

      const lines = traceFieldlines(seeds, bFunc, { length: radius * 30, nsteps: 800, bidirectional: true });
      setFieldLines(lines);

      const data = [];
      for (let i = 0; i < 30; i += 1) {
        const z = -3 * radius + (6 * radius * i) / 29;
        const B = bFunc([0, 0, z]);
        data.push({ z: +(z / radius).toFixed(2), Bz: +B[2].toFixed(4) });
      }
      setBzData(data);
      setComputing(false);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [bFunc, radius]);

  const colormap = (value) => new THREE.Color().setHSL(0.6 - value * 0.4, 1, 0.5);

  const controls = [
    { key: 'radius', label: t('controls.radius'), min: 0.2, max: 3, step: 0.1, value: radius },
    { key: 'current', label: t('controls.current'), min: 0.1, max: 5, step: 0.1, value: current },
  ];

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene controlsRef={controlsRef} cameraRef={cameraRef}>
          <CoilMesh midpoints={coil.midpoints} color="#ffaa00" />
          <CurrentArrows midpoints={coil.midpoints} weightedDl={coil.weightedDl} color="#ffaa00" />
          <FieldLines lines={fieldLines} colormap={colormap} />
          <InjectionMarker active={injection.injectionMode} />
          <ParticleTraces particles={injection.particles} />
        </Scene>
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('singleLoop', key, value)}
          computing={computing}
        />
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <div className="chart-box">
          <p className="chart-title">{t('charts.bzOnAxis')}</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={bzData}>
              <XAxis
                dataKey="z"
                label={{ value: t('charts.axialPosition'), position: 'insideBottom', offset: -5 }}
              />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="Bz" stroke="#44aaff" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
        <p className="description">{t('descriptions.singleLoop')}</p>
      </div>
    </div>
  );
}
