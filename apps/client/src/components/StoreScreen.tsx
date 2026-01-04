import { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { GameAsset } from './GameAsset';
import { Suspense } from 'react';

// Shared type locally if not available
interface StoreItem {
    id: string;
    type: 'SKIN' | 'BUNDLE';
    referenceId: string;
    name: string;
    price: number;
    isActive: boolean;
}

export function StoreScreen({ onClose }: { onClose: () => void }) {
    const { user, buyItem } = useUserStore();
    const [items, setItems] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
    const [buying, setBuying] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    useEffect(() => {
        fetch(`${API_URL}/api/store`)
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleBuy = async () => {
        if (!selectedItem || buying) return;
        setBuying(true);
        setMessage(null);

        const result = await buyItem(selectedItem.id);
        setBuying(false);

        if (result.success) {
            setMessage({ text: '¡Compraste con éxito!', type: 'success' });
            // Refresh owned status implicitly via user store update
        } else {
            setMessage({ text: result.error || 'Error al comprar', type: 'error' });
        }
    };

    const isOwned = (refId: string) => user?.ownedItems?.includes(refId) || refId === 'player.glb';
    const canAfford = (price: number) => (user?.gems || 0) >= price;

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'row',
            color: 'white',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Left: Item List */}
            <div style={{ width: '40%', padding: '2rem', borderRight: '1px solid #333', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Tienda</h2>
                    <div style={{ background: '#333', padding: '0.5rem 1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>💎</span>
                        <span style={{ fontWeight: 'bold' }}>{user?.gems || 0}</span>
                    </div>
                </div>

                <button onClick={onClose} style={{ marginBottom: '1rem', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                    ← Volver
                </button>

                {loading ? <p>Cargando...</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                        {items.map(item => {
                            const owned = isOwned(item.referenceId);
                            const selected = selectedItem?.id === item.id;

                            return (
                                <div key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    style={{
                                        background: selected ? '#444' : '#222',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        border: selected ? '2px solid #00ff88' : '2px solid transparent',
                                        opacity: owned ? 0.6 : 1,
                                        position: 'relative'
                                    }}>
                                    {owned && <div style={{ position: 'absolute', top: 5, right: 5 }}>✅</div>}
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{item.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#4fd1c5' }}>
                                        <span>💎</span>{item.price}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right: Preview */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <Canvas>
                        <PerspectiveCamera makeDefault position={[0, 1.5, 3]} />
                        <OrbitControls
                            enableZoom={false}
                            minPolarAngle={selectedItem?.referenceId === 'tralalero.glb' ? Math.PI / 2 : Math.PI / 4}
                            maxPolarAngle={Math.PI / 2}
                        />
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                        <Environment preset="city" />

                        <Suspense fallback={null}>
                            {selectedItem && (
                                <GameAsset
                                    path={`/models/${selectedItem.referenceId}`}
                                    scale={selectedItem.referenceId === 'capuchino.glb' ? 0.25 : 0.7}
                                    position={[0, selectedItem.referenceId === 'tralalero.glb' ? 0 : -1, 0]}
                                />
                            )}
                        </Suspense>
                    </Canvas>
                </div>

                <div style={{ padding: '2rem', background: '#111', borderTop: '1px solid #333', overflowY: 'auto', maxHeight: '40vh' }}>
                    {selectedItem ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>{selectedItem.name}</h2>
                                {isOwned(selectedItem.referenceId) ? (
                                    <span style={{ color: '#888' }}>Ya tienes este artículo</span>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4fd1c5', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                                        <span>💎</span> {selectedItem.price}
                                    </div>
                                )}
                            </div>

                            {!isOwned(selectedItem.referenceId) && (
                                <button
                                    onClick={handleBuy}
                                    disabled={!canAfford(selectedItem.price) || buying}
                                    style={{
                                        background: canAfford(selectedItem.price) ? '#00cc66' : '#555',
                                        color: 'white',
                                        border: 'none',
                                        padding: '1rem 2rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        cursor: canAfford(selectedItem.price) ? 'pointer' : 'not-allowed',
                                        opacity: buying ? 0.7 : 1
                                    }}>
                                    {buying ? 'Comprando...' : canAfford(selectedItem.price) ? 'Comprar Skin' : 'Gemas Insuficientes'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <p style={{ color: '#888', textAlign: 'center' }}>Selecciona un artículo para ver detalles</p>
                    )}

                    {message && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            background: message.type === 'success' ? 'rgba(0, 204, 102, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                            color: message.type === 'success' ? '#00cc66' : '#ff4444',
                            textAlign: 'center'
                        }}>
                            {/* Correction: Compraste */}
                            {message.text.replace('Compusiste', 'Compraste')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
