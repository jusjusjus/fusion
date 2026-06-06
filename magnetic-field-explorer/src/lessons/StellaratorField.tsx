import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import Scene from '../viz/Scene';
import StellaratorGeometry from '../viz/StellaratorGeometry';

export default function StellaratorField() {
  const { t } = useTranslation();
  const controlsRef = useRef<{ reset?: () => void } | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  return (
    <div className="lesson-layout">
      <div className="scene-area">
        <Scene
          cameraPosition={[0.3, 0.3, 0.5]}
          controlsRef={controlsRef}
          cameraRef={cameraRef}
        >
          <StellaratorGeometry />
        </Scene>
      </div>
      <div className="sidebar">
        <p className="description">{t('descriptions.stellarator')}</p>
      </div>
    </div>
  );
}
