import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { GameAsset } from './GameAsset';
import { Suspense } from 'react';

export function Avatar({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
    const ref = useRef<THREE.Group>(null);
    const posRef = useRef(position);
    posRef.current = position; // Keep ref sync with prop

    useFrame((state) => {
        if (ref.current) {
            // Use the ref to get the freshest position prop
            const [, y] = posRef.current;
            // Only animate Y, let R3F handle X and Z via props, OR force set all if R3F glitches
            ref.current.position.y = y + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={ref} position={position}>
            <Suspense fallback={null}>
                <GameAsset
                    path="/models/player.glb"
                    scale={1.4}
                    position={[0, 0, 0]}
                />
            </Suspense>

        </group >
    );
}
