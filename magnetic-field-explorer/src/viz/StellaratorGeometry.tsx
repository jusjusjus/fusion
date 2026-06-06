import { useGLTF } from "@react-three/drei";

export default function StellaratorGeometry() {
  const gltf = useGLTF("/fusion/magnetic-explorer/models/stellarators/proxima-scaled-w7x.glb");

  return (
    <primitive
      object={gltf.scene}
      scale={1}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

useGLTF.preload("/fusion/magnetic-explorer/models/stellarators/proxima-scaled-w7x.glb");
