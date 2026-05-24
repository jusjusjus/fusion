import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import Scene from '../viz/Scene.jsx';
import CoilMesh from '../viz/CoilMesh.jsx';
import FieldLines from '../viz/FieldLines.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import useStore from '../store/useStore.js';
import { helicalCoil, mergeCoils } from '../physics/coils.js';
import { fieldAtPoint } from '../physics/biotSavart.js';
import { traceFieldlines } from '../physics/fieldlines.js';

export default function HelicalSheet() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { R0, a, nfp, nLines, nTurns, nsteps } = params.helicalSheet;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState([]);

  const coilPair = useMemo(() => {
    const coil1 = helicalCoil({ R0, a: a * 0.7, nfp, phase: 0, n: 400, current: 1 });
    const coil2 = helicalCoil({ R0, a: a * 0.7, nfp, phase: Math.PI / nfp, n: 400, current: 1 });
    return mergeCoils([coil1, coil2]);
  }, [R0, a, nfp]);

  const bFunc = useMemo(
    () => (x) => fieldAtPoint(x, coilPair.midpoints, coilPair.weightedDl),
    [coilPair]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setComputing(true);

      const seeds = [];
      for (let i = 0; i < nLines; i += 1) {
        const r = R0 - a * 0.8 + (i / (nLines - 1 || 1)) * a * 1.6;
        seeds.push(new Float32Array([r, 0, 0]));
      }
      const length = nTurns * 2 * Math.PI * R0;
      const lines = traceFieldlines(seeds, bFunc, { length, nsteps });
      setFieldLines(lines);
      setComputing(false);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [bFunc, nLines, nTurns, nsteps, R0, a]);

  const colormap = (value) => new THREE.Color().setHSL(value * 0.7, 0.9, 0.5);

  const controls = [
    { key: 'R0', label: t('controls.radius'), min: 1, max: 4, step: 0.1, value: R0 },
    { key: 'a', label: t('controls.minorRadius'), min: 0.2, max: 1.2, step: 0.05, value: a },
    { key: 'nfp', label: t('controls.nfp'), min: 1, max: 5, step: 1, value: nfp },
    { key: 'nLines', label: t('controls.numSeeds'), min: 10, max: 40, step: 1, value: nLines },
    { key: 'nTurns', label: t('controls.numTurns'), min: 1, max: 5, step: 1, value: nTurns },
    { key: 'nsteps', label: t('controls.traceLength'), min: 200, max: 1200, step: 100, value: nsteps },
  ];

  const coil1Mesh = useMemo(() => coilPair.midpoints.slice(0, 400 * 3), [coilPair]);
  const coil2Mesh = useMemo(() => coilPair.midpoints.slice(400 * 3), [coilPair]);

  const snapshotMarkers = useMemo(() => {
    const markers = [];
    const lineStep = Math.max(1, Math.floor(fieldLines.length / 5));

    fieldLines.forEach((line, lineIndex) => {
      if (lineIndex % lineStep !== 0) {
        return;
      }

      const points = line.length / 3;
      for (let i = 1; i <= 3; i += 1) {
        const pointIndex = Math.min(points - 1, Math.floor((points * i) / 4));
        markers.push({
          key: `${lineIndex}-${pointIndex}`,
          position: [
            line[pointIndex * 3],
            line[pointIndex * 3 + 1],
            line[pointIndex * 3 + 2],
          ],
          color: colormap(lineIndex / Math.max(fieldLines.length - 1, 1)).getStyle(),
        });
      }
    });

    return markers;
  }, [fieldLines]);

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene cameraPosition={[6, 3, 6]}>
          <CoilMesh midpoints={coil1Mesh} color="#ff6644" radius={0.04} />
          <CoilMesh midpoints={coil2Mesh} color="#44aaff" radius={0.04} />
          <FieldLines lines={fieldLines} colormap={colormap} lineWidth={1.2} opacity={0.75} />
          {snapshotMarkers.map((marker) => (
            <mesh key={marker.key} position={marker.position}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color={marker.color} emissive={marker.color} emissiveIntensity={0.3} />
            </mesh>
          ))}
        </Scene>
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('helicalSheet', key, value)}
          computing={computing}
        />
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <p className="description">{t('descriptions.helicalSheet')}</p>
      </div>
    </div>
  );
}
