import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import * as THREE from 'three';
import Scene from '../viz/Scene';
import FieldLines from '../viz/FieldLines';
import InjectionMarker from '../viz/InjectionMarker';
import ParticleTraces from '../viz/ParticleTraces';
import ControlPanel from '../components/ControlPanel';
import InjectionPanel from '../components/InjectionPanel';
import useStore from '../store/useStore';
import { toyMagneticField, sampleBzProfile } from '../physics/toyField';
import { traceFieldlines, type BFunc } from '../physics/fieldlines';
import { useParticleInjection } from '../hooks/useParticleInjection';

export default function GradientField() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { B0, alpha, beta, numLines, traceLength } = params.gradient;
  const [fieldLines, setFieldLines] = useState<Float32Array[]>([]);
  const controlsRef = useRef<{ reset?: () => void } | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  const bFunc = useMemo<BFunc>(() => toyMagneticField({ B0, alpha, beta }), [B0, alpha, beta]);

  const injection = useParticleInjection(bFunc);

  const bzData = useMemo(
    () => sampleBzProfile({ B0, alpha, beta }).map((d) => ({ ...d, Bz: +(d.Bz * 1e3).toFixed(4) })),
    [B0, alpha, beta],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      const seeds: Float32Array[] = [];
      const nX = numLines;
      const nY = numLines > 0 ? Math.max(2, Math.round(numLines / 2)) : 0;
      const xVals = Array.from({ length: nX }, (_, i) => -0.2 + i * (0.4 / Math.max(nX - 1, 1)));
      const yVals = Array.from({ length: nY }, (_, j) => -0.05 + j * (0.1 / Math.max(nY - 1, 1)));
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
    return () => window.clearTimeout(id);
  }, [bFunc, numLines, traceLength]);

  const colormap = (value: number): THREE.Color => new THREE.Color().setHSL(0.65 - value * 0.5, 1, 0.5);

  const controls = [
    { key: 'B0',         label: t('controls.baseField'),     min: 0.0001, max: 0.01, step: 0.0001, decimals: 4, value: B0 },
    { key: 'alpha',      label: t('controls.quadratic'),     min: -0.1,   max: 0.1,  step: 0.005,  decimals: 3, value: alpha },
    { key: 'beta',       label: t('controls.quartic'),       min: -0.5,   max: 0.5,  step: 0.01,   decimals: 2, value: beta },
    { key: 'numLines',   label: t('controls.numFieldLines'), min: 0,      max: 8,    step: 1,      decimals: 0, value: numLines },
    { key: 'traceLength',label: t('controls.traceLength'),   step: 0.1,    value: traceLength, hint: 'arc-length along field line' },
  ];

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene
          cameraPosition={[0.3, 0.3, 0.5]}
          controlsRef={controlsRef}
          cameraRef={cameraRef}
          injectionMode={injection.injectionMode}
          onInject={(cam) => injection.injectAt(cam)}
        >
          <FieldLines lines={fieldLines} colormap={colormap} />
          <ParticleTraces particles={injection.particles} />
        </Scene>
        <InjectionMarker active={injection.injectionMode} />
      </div>
      <div className="sidebar">
        <ControlPanel controls={controls} onChange={(key, value) => setParam('gradient', key, value)} />
        <div className="chart-box">
          <p className="chart-title">{t('charts.bzProfile')}</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={bzData}>
              <XAxis
                dataKey="x"
                label={{ value: 'x (m)', position: 'insideBottom', offset: -4 }}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => (v == null ? '' : `${Number(v).toFixed(4)} mT`)} />
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
          speciesId={injection.speciesId}
          onSpeciesId={injection.setSpeciesId}
          energyEV={injection.energyEV}
          onEnergyEV={injection.setEnergyEV}
        />
        <p className="description">{t('descriptions.gradient')}</p>
      </div>
    </div>
  );
}
