import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

interface GameAssetProps {
    path: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number] | number;
    animation?: string; // Name of animation to play
    castShadow?: boolean;
    receiveShadow?: boolean;
}

export function GameAsset({
    path,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    animation,
    castShadow = true,
    receiveShadow = true
}: GameAssetProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(path);
    const { actions } = useAnimations(animations, group);

    // Cloning scene to allow multiple instances (like avatars)
    const clone = useMemo(() => scene.clone(), [scene]);

    useEffect(() => {
        // Simple animation player
        if (animation && actions[animation]) {
            actions[animation]?.reset().fadeIn(0.5).play();
            return () => {
                actions[animation]?.fadeOut(0.5);
            };
        }
    }, [animation, actions]);

    return (
        <group ref={group} position={position} rotation={rotation} scale={scale} dispose={null}>
            <primitive
                object={clone}
                castShadow={castShadow}
                receiveShadow={receiveShadow}
                // Traverse to enable shadows on all child meshes
                ref={(node: THREE.Object3D) => {
                    if (node) {
                        node.traverse((child) => {
                            if ((child as THREE.Mesh).isMesh) {
                                child.castShadow = castShadow;
                                child.receiveShadow = receiveShadow;
                            }
                        });
                    }
                }}
            />
        </group>
    );
}
