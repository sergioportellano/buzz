import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

export function GameScene() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
            <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Stars />
                <gridHelper args={[20, 20, 0xff0000, 0x444444]} />
                <OrbitControls />
                {/* Placeholder Cube to verify 3D is working */}
                <mesh position={[0, 1, 0]}>
                    <boxGeometry />
                    <meshStandardMaterial color="#8800ff" />
                </mesh>
            </Canvas>
        </div>
    );
}
