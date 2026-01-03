import { useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Stage } from './Stage';
import { Avatar } from './Avatar';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

function CameraIntro({ onFinish }: { onFinish: () => void }) {
    const { camera } = useThree();
    const targetPos = new THREE.Vector3(0, 5, 12);
    const startPos = new THREE.Vector3(0, 20, 50);

    useEffect(() => {
        // Force start position
        camera.position.copy(startPos);
        camera.lookAt(0, 0, 0);
    }, [camera]);

    useFrame((_state, delta) => {
        // Clamp delta to prevent jumps
        const d = Math.min(delta, 0.1);

        // Smooth lerp to target
        camera.position.lerp(targetPos, d * 2.0);
        camera.lookAt(0, 0, 0);

        if (camera.position.distanceTo(targetPos) < 0.5) {
            camera.position.copy(targetPos);
            camera.lookAt(0, 0, 0);
            onFinish();
        }
    });
    return null;
}

export function GameScene() {
    const { room } = useGameStore();
    const [introFinished, setIntroFinished] = useState(false);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
            <Canvas shadows>
                <PerspectiveCamera makeDefault fov={50} />

                {!introFinished && <CameraIntro onFinish={() => setIntroFinished(true)} />}

                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                {/* Environment */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <Stage
                    podiums={room?.maxPlayers || 4}
                    players={room ? Object.keys(room.players).sort().map(id => room.players[id]) : []}
                />

                {/* Players */}
                {room && Object.keys(room.players).sort().map((playerId, index) => {
                    const player = room.players[playerId];
                    const chatMsg = useGameStore.getState().chatMessages[playerId];
                    // Position players on podiums using assigned slot
                    const totalPodiums = room.maxPlayers || 4;
                    const slotIndex = player.slot !== undefined ? player.slot : index;
                    const x = (slotIndex - (totalPodiums - 1) / 2) * 1.5 + 1.5;
                    return (
                        <group key={playerId} rotation={[0, 5 * (Math.PI / 180), 0]}>
                            <Avatar
                                position={[x, -0.7, 0.5]}
                                label={player.nickname}
                                chatMessage={chatMsg?.text}
                                messageTimestamp={chatMsg?.timestamp}
                            />
                        </group>
                    );
                })}

                <OrbitControls
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2}
                    enabled={introFinished} // Disable controls during intro
                />
            </Canvas>
        </div>
    );
}
