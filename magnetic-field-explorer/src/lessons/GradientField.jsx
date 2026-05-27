import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import * as THREE from 'three';
import Scene from '../viz/Scene.jsx';
import FieldLines from '../viz/FieldLines.jsx';
import InjectionMarker from '../viz/InjectionMarker.jsx';
import ParticleTraces from '../viz/ParticleTraces.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import InjectionPanel from '../components/InjectionPanel.jsx';
import useStore from '../store/useStore.js';
import { toyMagneticField, sampleBzProfile } from '../physics/toyField.js';
import { traceFieldlines } from '../physics/fieldlines.js';
import { useParticleInjection } from '../hooks/useParticleInjection.js';

export default function GradientField() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { B0, alpha, beta, numLines, traceLength } = params.gradient;
  const [fieldLines, setFieldLines] = useState([]);
  const controlsRef = useRef();
  const cameraRef = useRef();

  const bFunc = useMemo(() => toyMagneticField({ B0, alpha, beta }), [B0, alpha, beta]);

  const injection = useParticleInjection(bFunc);

  // Bz profile for chart (recomputed immediately, no async needed)
  const bzData = useMemo(
    () => sampleBzProfile({ B0, alpha, beta }),
    [B0, alpha, beta]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      // Seeds: grid of (x, y) points at z=0.
      // Field lines are straight along z; x determines the field strength.
      const seeds = [];
      const nX = numLines;
      const nY = numLines > 0 ? Math.max(2, Math.round(numLines / 2)) : 0;
      const xVals = Array.from({ length: nX }, (_, i) =>
        -2 + i * (4 / Math.max(nX - 1, 1))
      );
      const yVals = Array.from({ length: nY }, (_, j) =>
        -1 + j * (2 / Math.max(nY - 1, 1))
      );
      for (const x of xVals) {
        for (const y of yVals) {
          seeds.push(new Float32Array([x, y, 0]));
        }
      }
      const lines = traceFieldlines(seeds, bFunc, {
        length: traceLength,
        nsteps: 600,
        bidirectional: true,
      });
      setFieldLines(lines);
    }, 10);
    return () => clearTimeout(id);
  }, [bFunc, numLines, traceLength]);

  const colormap = (value) => new THREE.Color().setHSL(0.65 - value * 0.5, 1, 0.5);

  const controls = [
    { key: 'B0',    label: t('controls.baseField'),  min: 0.1, max: 5,  step: 0.1,  value: B0 },
    { key: 'alpha', label: t('controls.quadratic'),  min: -3,  max: 3,  step: 0.05, value: alpha },
    { key: 'beta',  label: t('controls.quartic'),    min: -1,  max: 1,  step: 0.01, value: beta },
    {
      key: 'numLines',
      label: t('controls.numFieldLines'),
      min: 0, max: 8, step: 1, value: numLines,
    },
    {
      key: 'traceLength',
      label: t('controls.traceLength'),
      min: 5, max: 40, step: 1, value: traceLength,
    },
  ];

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene cameraPosition={[0, 3, 8]} controlsRef={controlsRef} cameraRef={cameraRef}
               injectionMode={injection.injectionMode}
               onInject={(cam) => injection.injectAt(cam)}>
          <FieldLines lines={fieldLines} colormap={colormap} />
          <ParticleTraces particles={injection.particles} />
        </Scene>
        <InjectionMarker active={injection.injectionMode} />
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('gradient', key, value)}
        />
        <div className="chart-box">
          <p className="chart-title">{t('charts.bzProfile')}</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={bzData}>
              <XAxis
                dataKey="x"
                label={{ value: 'x', position: 'insideBottom', offset: -4 }}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => v.toFixed(3)} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Line type="monotone" dataKey="Bz" stroke="#44aaff" dot={false} strokeWidth={2} />
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
          charge={injection.charge} onCharge={injection.setCharge}
          mass={injection.mass}     onMass={injection.setMass}
        />
        <p className="description">{t('descriptions.gradient')}</p>
      </div>
    </div>
  );
}
