import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Stage } from './Stage';
import { Avatar } from './Avatar';
import { useGameStore } from '../store/gameStore';

export function GameScene() {
    const { room } = useGameStore();

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={50} />

                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                {/* Environment */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <Stage podiums={4} />

                {/* Players */}
                {/* Players */}
                {room && Object.keys(room.players).sort().map((playerId, index) => {
                    const player = room.players[playerId];
                    // Position players on podiums. Simple math for now matching the Stage logic
                    const x = (index - (4 - 1) / 2) * 1.5;
                    return (
                        <Avatar
                            key={playerId}
                            position={[x, -1.5, 0]}
                            label={`${player.nickname} (${index})`}
                        />
                    );
                })}

                <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
}
