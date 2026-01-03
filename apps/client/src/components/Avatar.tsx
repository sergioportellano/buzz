import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { GameAsset } from './GameAsset';
import { Suspense } from 'react';

export function Avatar({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
    // Inner ref for animation only
    const animRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (animRef.current) {
            // Animate ONLY the inner group's Y position relative to parent
            animRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        // Outer Group: Handles Placement (props)
        <group position={position}>
            {/* Inner Group: Handles Animation (floating) */}
            <group ref={animRef}>
                <Suspense fallback={null}>
                    <GameAsset
                        path="/models/player.glb"
                        scale={1.4}
                        position={[0, 0, 0]}
                    />
                </Suspense>
            </group>
        </group>
    );
}
