import { Text } from '@react-three/drei';
import { GameAsset } from './GameAsset';
import { Suspense } from 'react';
import type { Player } from '@buzz/shared';

export function Stage({ podiums = 4, players = [] }: { podiums?: number, players?: Player[] }) {
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

            {/* Podiums */}
            {Array.from({ length: podiums }).map((_, i) => {
                const xLin = (i - (podiums - 1) / 2) * 1.5;
                const player = players[i];
                const score = player ? player.score : 0;
                // Use nickname if available, else empty or label? User asked for POINTS.
                // "un letrero con los puntos"

                return <Podium key={i} position={[xLin, 0.5, 1]} score={score} hasPlayer={!!player} />
            })}
        </group>
    );
}


function Podium({ position, score, hasPlayer }: { position: [number, number, number], score: number, hasPlayer: boolean }) {
    return (
        <group position={position}>
            {/* Base - Procedural Cylinder */}
            {/* Base - Procedural Cylinder */}
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.8, 32]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Light Strip */}
            {/* Light Strip */}
            <mesh position={[0, 0.4, 0.41]}>
                <planeGeometry args={[0.2, 0.6]} />
                <meshBasicMaterial color={hasPlayer ? "cyan" : "gray"} toneMapped={false} />
            </mesh>

            {/* Score Label (only if player exists? or always show 0?) */}
            {/* User asked for "letrero con los puntos" */}
            {/* Score Label (only if player exists? or always show 0?) */}
            {/* User asked for "letrero con los puntos" */}
            <Text position={[0, 0.4, 0.45]} fontSize={0.3} color="black">
                {hasPlayer ? score.toString() : "-"}
            </Text>
        </group>
    );
}
