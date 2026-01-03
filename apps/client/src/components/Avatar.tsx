import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { GameAsset } from './GameAsset';
import { Suspense } from 'react';

export function Avatar({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
    const ref = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (ref.current) {
            // Idle animation: float slightly up and down
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={ref} position={position}>
            <Suspense fallback={null}>
                <GameAsset
                    path="/models/player.glb"
                    scale={1.8}
                    position={[0, 0, 0]}

                // Simple material override if needed, though GameAsset clones scene
                />
            </Suspense>
        </group>
    );
}
