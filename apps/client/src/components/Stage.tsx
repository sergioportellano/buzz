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
                const xLin = (i - (podiums - 1) / 2) * 1.5 + 1.5;
                const player = players[i];
                const score = player ? player.score : 0;
                // Use nickname if available, else empty or label? User asked for POINTS.
                // "un letrero con los puntos"

                return (
                    <group key={i} rotation={[0, 5 * (Math.PI / 180), 0]}>
                        <Podium position={[xLin, 0.5, 1]} score={score} hasPlayer={!!player} scale={1.1} />
                    </group>
                );
            })}
        </group>
    );
}


function Podium({ position, score, hasPlayer, scale = 1 }: { position: [number, number, number], score: number, hasPlayer: boolean, scale?: number | [number, number, number] }) {
    return (
        <group position={position} scale={scale}>
            {/* Main Column (Wood) */}
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.8, 0.5]} />
                <meshStandardMaterial color="#5D4037" roughness={0.8} />
            </mesh>

            {/* Base Step */}
            <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.05, 0.6]} />
                <meshStandardMaterial color="#4E342E" roughness={0.8} />
            </mesh>

            {/* Top Cap */}
            <mesh position={[0, 0.825, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.6, 0.05, 0.6]} />
                <meshStandardMaterial color="#4E342E" roughness={0.8} />
            </mesh>

            {/* Buzzer Base (Silver Ring) */}
            <mesh position={[0, 0.86, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
                <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Buzzer Button (Red) */}
            <mesh position={[0, 0.9, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.18, 0.1, 32]} />
                <meshStandardMaterial color="red" roughness={0.4} />
            </mesh>

            {/* Score Text - Front of column */}
            <Text
                position={[0, 0.6, 0.26]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#3E2723"
            >
                {hasPlayer ? score.toString() : ""}
            </Text>
        </group>
    );
}
