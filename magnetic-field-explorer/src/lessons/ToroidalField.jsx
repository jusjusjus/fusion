import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import Scene from '../viz/Scene.jsx';
import CoilMesh from '../viz/CoilMesh.jsx';
import FieldLines from '../viz/FieldLines.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import useStore from '../store/useStore.js';
import { toroidalSet } from '../physics/coils.js';
import { fieldAtPoint } from '../physics/biotSavart.js';
import { traceFieldlines } from '../physics/fieldlines.js';

export default function ToroidalField() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { N, R0, a, current, n, numLines, traceLength } = params.toroidal;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState([]);

  const coils = useMemo(() => toroidalSet({ N, R0, a, n, current }), [N, R0, a, n, current]);

  const bFunc = useMemo(
    () => (x) => fieldAtPoint(x, coils.midpoints, coils.weightedDl),
    [coils]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setComputing(true);

      const seeds = [];
      for (let i = 0; i < numLines; i += 1) {
        const r = R0 + (i / (numLines - 1 || 1) - 0.5) * a * 1.2;
        seeds.push(new Float32Array([r, 0, 0]));
      }
      const lines = traceFieldlines(seeds, bFunc, { length: traceLength, nsteps: 800 });
      setFieldLines(lines);
      setComputing(false);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [bFunc, numLines, traceLength, R0, a]);

  const colormap = (value) => new THREE.Color().setHSL(0.55 + value * 0.15, 0.9, 0.5);

  const controls = [
    { key: 'N', label: t('controls.numCoils'), min: 4, max: 16, step: 1, value: N },
    { key: 'R0', label: t('controls.radius'), min: 1, max: 4, step: 0.1, value: R0 },
    { key: 'a', label: t('controls.minorRadius'), min: 0.2, max: 1.5, step: 0.05, value: a },
    { key: 'current', label: t('controls.current'), min: 0.1, max: 5, step: 0.1, value: current },
    {
      key: 'numLines',
      label: t('controls.numFieldLines'),
      min: 3,
      max: 10,
      step: 1,
      value: numLines,
    },
    {
      key: 'traceLength',
      label: t('controls.traceLength'),
      min: 20,
      max: 150,
      step: 5,
      value: traceLength,
    },
  ];

  const coilMeshes = useMemo(() => {
    const midpoints = coils.midpoints;
    const perCoil = midpoints.length / 3 / N;
    const meshes = [];
    for (let i = 0; i < N; i += 1) {
      meshes.push(midpoints.slice(i * perCoil * 3, (i + 1) * perCoil * 3));
    }
    return meshes;
  }, [coils, N]);

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene cameraPosition={[6, 4, 6]}>
          {coilMeshes.map((midpoints, index) => (
            <CoilMesh
              key={index}
              midpoints={midpoints}
              color={`hsl(${180 + index * 15}, 80%, 60%)`}
              radius={0.04}
            />
          ))}
          <FieldLines lines={fieldLines} colormap={colormap} lineWidth={1.5} />
        </Scene>
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('toroidal', key, value)}
          computing={computing}
        />
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <p className="description">{t('descriptions.toroidal')}</p>
      </div>
    </div>
  );
}
