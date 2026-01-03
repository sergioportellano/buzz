import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Text } from '@react-three/drei';

import { GameAsset } from './GameAsset';
import { Suspense } from 'react';

export function Avatar({
    position = [0, 0, 0],
    label = "",
    chatMessage = "",
    messageTimestamp = 0
}: {
    position?: [number, number, number],
    label?: string,
    chatMessage?: string,
    messageTimestamp?: number
}) {
    // Inner ref for animation only
    const animRef = useRef<THREE.Group>(null);
    const [showBubble, setShowBubble] = useState(false);

    useEffect(() => {
        if (chatMessage) {
            setShowBubble(true);
            const timer = setTimeout(() => setShowBubble(false), 5000); // Hide after 5s
            return () => clearTimeout(timer);
        }
    }, [chatMessage, messageTimestamp]);

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
                        scale={0.7}
                        position={[0, 0, 0]}
                    />
                </Suspense>
            </group>

            {/* Name Label */}
            {/* Name Label - Half Size */}
            <Text position={[0, 2.4, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="bottom">
                {label}
            </Text>

            {/* Chat Bubble - Lower position, responsive font */}
            {showBubble && chatMessage && (
                <Html position={[0, 2.7, 0]} center>
                    <div style={{
                        background: 'white',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '1rem',
                        border: '2px solid black',
                        fontSize: 'clamp(12px, 2vw, 16px)', // Responsive font size
                        fontWeight: 'bold',
                        color: 'black',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
                        position: 'relative',
                        minWidth: '50px',
                        textAlign: 'center'
                    }}>
                        {chatMessage}
                        {/* Little triangle for speech bubble tail */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '8px solid black'
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '-5px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid white'
                        }} />
                    </div>
                </Html>
            )}
        </group>
    );
}
