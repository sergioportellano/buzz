import { Text } from '@react-three/drei';
import { GameAsset } from './GameAsset';
import { Suspense } from 'react';

export function Stage({ podiums = 4 }) {
    return (
        <group position={[0, -2, 0]}>
            {/* Imported Stage Model */}
            <Suspense fallback={null}>
                <GameAsset
                    path="/models/escenario.glb"
                    scale={1}
                    position={[0, 0, 0]}
                />
            </Suspense>

            {/* Podiums (We keep them generated code-side for dynamic placement) */}
            {Array.from({ length: podiums }).map((_, i) => {
                // Or simple linear line for MVP
                const xLin = (i - (podiums - 1) / 2) * 3;

                return <Podium key={i} position={[xLin, 0, -2]} label={`P${i + 1}`} />
            })}
        </group>
    );
}


function Podium({ position, label }: { position: [number, number, number], label: string }) {
    return (
        <group position={position}>
            {/* Base */}
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1, 1, 2, 32]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Light Strip */}
            <mesh position={[0, 1, 1.01]}>
                <planeGeometry args={[0.5, 1.5]} />
                <meshBasicMaterial color="cyan" toneMapped={false} />
            </mesh>

            {/* Text Label */}
            <Text position={[0, 1, 1.1]} fontSize={0.5} color="black">
                {label}
            </Text>
        </group>
    );
}
