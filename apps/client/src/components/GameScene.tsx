import { useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { Stage } from './Stage';
import { Avatar } from './Avatar';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';

function CameraController({ inGame, onFinishIntro }: { inGame: boolean, onFinishIntro: (finished: boolean) => void }) {
    const { camera } = useThree();
    const gamePos = new THREE.Vector3(0, 5, 12);
    const lobbyPos = new THREE.Vector3(0, 10, 25); // Closer starting position

    // Determines target generic position based on state
    const targetVector = inGame ? gamePos : lobbyPos;

    useFrame((_state, delta) => {
        // Clamp delta
        const d = Math.min(delta, 0.1);

        // Smoothly interpolate current position to target
        camera.position.lerp(targetVector, d * 0.8); // Slower speed (0.8)
        camera.lookAt(0, 0, 0);

        // Check if we are "close enough" to the target to consider the transition done
        const dist = camera.position.distanceTo(targetVector);

        // If we are aiming for Game View and are close, enable controls
        if (inGame && dist < 0.5) {
            onFinishIntro(true);
        } else if (!inGame) {
            // If strictly back to lobby, ensure controls are off
            onFinishIntro(false);
        }
    });

    return null;
}

export function GameScene() {
    const { room } = useGameStore();
    const [controlsEnabled, setControlsEnabled] = useState(false);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}>
            <Canvas shadows>
                <PerspectiveCamera makeDefault fov={50} />

                <CameraController
                    inGame={!!room}
                    onFinishIntro={setControlsEnabled}
                />

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
                                position={[x, -0.7, 0.65]}
                                label={player.nickname}
                                chatMessage={chatMsg?.text}
                                messageTimestamp={chatMsg?.timestamp}
                                modelPath={player.avatarId}
                            />
                        </group>
                    );
                })}

                <OrbitControls
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2}
                    enabled={controlsEnabled}
                />
            </Canvas>
        </div>
    );
}
