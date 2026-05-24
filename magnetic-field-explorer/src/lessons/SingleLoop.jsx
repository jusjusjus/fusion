import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as THREE from 'three';
import Scene from '../viz/Scene.jsx';
import CoilMesh from '../viz/CoilMesh.jsx';
import FieldLines from '../viz/FieldLines.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import useStore from '../store/useStore.js';
import { circularLoop } from '../physics/coils.js';
import { fieldAtPoint } from '../physics/biotSavart.js';
import { traceFieldlines } from '../physics/fieldlines.js';

export default function SingleLoop() {
  const { t } = useTranslation();
  const { params, setParam } = useStore();
  const { radius, current, n } = params.singleLoop;
  const [computing, setComputing] = useState(false);
  const [fieldLines, setFieldLines] = useState([]);
  const [bzData, setBzData] = useState([]);

  const coil = useMemo(() => circularLoop({ radius, z: 0, n, current }), [radius, current, n]);

  const bFunc = useMemo(
    () => (x) => fieldAtPoint(x, coil.midpoints, coil.weightedDl),
    [coil]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setComputing(true);

      const seeds = [];
      for (let i = 0; i < 8; i += 1) {
        const angle = (i / 8) * Math.PI * 2;
        seeds.push(
          new Float32Array([
            radius * 0.5 * Math.cos(angle),
            radius * 0.5 * Math.sin(angle),
            0.05,
          ])
        );
      }

      const lines = traceFieldlines(seeds, bFunc, { length: radius * 20, nsteps: 600 });
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
        <Scene>
          <CoilMesh midpoints={coil.midpoints} color="#ffaa00" />
          <FieldLines lines={fieldLines} colormap={colormap} />
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
        <p className="description">{t('descriptions.singleLoop')}</p>
      </div>
    </div>
  );
}
