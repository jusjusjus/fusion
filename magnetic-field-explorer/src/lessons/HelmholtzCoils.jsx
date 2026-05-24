import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import Scene from '../viz/Scene.jsx';
import CoilMesh from '../viz/CoilMesh.jsx';
import FieldLines from '../viz/FieldLines.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import useStore from '../store/useStore.js';
import { circularLoop, mergeCoils } from '../physics/coils.js';
import { fieldAtPoint } from '../physics/biotSavart.js';
import { traceFieldlines } from '../physics/fieldlines.js';

export default function HelmholtzCoils() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { radius, separation, current, n } = params.helmholtz;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState([]);

  const { coil1, coil2 } = useMemo(
    () => ({
      coil1: circularLoop({ radius, z: separation / 2, n, current }),
      coil2: circularLoop({ radius, z: -separation / 2, n, current }),
    }),
    [radius, separation, current, n]
  );

  const merged = useMemo(() => mergeCoils([coil1, coil2]), [coil1, coil2]);

  const bFunc = useMemo(
    () => (x) => fieldAtPoint(x, merged.midpoints, merged.weightedDl),
    [merged]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setComputing(true);

      const seeds = [];
      for (let i = 0; i < 10; i += 1) {
        const angle = (i / 10) * Math.PI * 2;
        seeds.push(
          new Float32Array([radius * 0.3 * Math.cos(angle), radius * 0.3 * Math.sin(angle), 0])
        );
      }
      [-0.1, 0, 0.1].forEach((dz) => {
        seeds.push(new Float32Array([0.01, 0, dz * radius]));
      });

      const lines = traceFieldlines(seeds, bFunc, { length: radius * 25, nsteps: 700 });
      setFieldLines(lines);
      setComputing(false);
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [bFunc, radius]);

  const colormap = (value) => new THREE.Color().setHSL(0.55 - value * 0.3, 1, 0.55);

  const controls = [
    { key: 'radius', label: t('controls.radius'), min: 0.5, max: 3, step: 0.1, value: radius },
    {
      key: 'separation',
      label: t('controls.separation'),
      min: 0.2,
      max: 4,
      step: 0.1,
      value: separation,
    },
    { key: 'current', label: t('controls.current'), min: 0.1, max: 5, step: 0.1, value: current },
  ];

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene>
          <CoilMesh midpoints={coil1.midpoints} color="#ffaa00" />
          <CoilMesh midpoints={coil2.midpoints} color="#ffaa00" />
          <FieldLines lines={fieldLines} colormap={colormap} />
        </Scene>
      </div>
      <div className="sidebar">
        <ControlPanel
          controls={controls}
          onChange={(key, value) => setParam('helmholtz', key, value)}
          computing={computing}
        />
        <p className="info-text">{computing ? t('info.computing') : t('info.done')}</p>
        <p className="description">{t('descriptions.helmholtz')}</p>
      </div>
    </div>
  );
}
