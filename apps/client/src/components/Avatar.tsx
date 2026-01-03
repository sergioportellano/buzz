import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Avatar({ color = 'hotpink', position = [0, 0, 0] }: { color?: string, position?: [number, number, number] }) {
    const ref = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (ref.current) {
            // Idle animation: float slightly up and down
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={ref} position={position}>
            {/* Head */}
            <mesh position={[0, 1.8, 0]}>
                <sphereGeometry args={[0.4, 32, 32]} />
                <meshStandardMaterial color={color} roughness={0.3} />
            </mesh>

            {/* Body */}
            <mesh position={[0, 1, 0]}>
                <capsuleGeometry args={[0.3, 1, 4, 8]} />
                <meshStandardMaterial color="white" />
            </mesh>

            {/* Visor/Eyes */}
            <mesh position={[0, 1.8, 0.35]}>
                <boxGeometry args={[0.5, 0.15, 0.1]} />
                <meshStandardMaterial color="black" roughness={0.1} metalness={0.9} />
            </mesh>
        </group>
    );
}
