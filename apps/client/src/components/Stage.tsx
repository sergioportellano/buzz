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
                const xLin = (i - (podiums - 1) / 2) * 1.5;

                return <Podium key={i} position={[xLin, 0, 1]} label={`P${i + 1}`} />
            })}
        </group>
    );
}


function Podium({ position, label }: { position: [number, number, number], label: string }) {
    return (
        <group position={position}>
            {/* Imported Podium Model */}
            <Suspense fallback={null}>
                <GameAsset
                    path="/models/podio.glb"
                    scale={0.08}
                    position={[0, 0, 0]}
                />
            </Suspense>

            {/* Text Label */}
            <Text position={[0, 1.2, 0]} fontSize={0.4} color="black" anchorX="center">
                {label}
            </Text>
        </group>
    );
}
