import { Text } from '@react-three/drei';

export function Stage({ podiums = 4 }) {
    return (
        <group position={[0, -2, 0]}>
            {/* Main Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[10, 32]} />
                <meshStandardMaterial color="#111" roughness={0.5} metalness={0.8} />
            </mesh>

            {/* Grid Pattern on Floor */}
            <gridHelper args={[20, 20, 0x00ffff, 0x222222]} position={[0, 0.01, 0]} />

            {/* Podiums */}
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
